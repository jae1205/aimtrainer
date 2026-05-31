import { lazy, Suspense, useCallback, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { getSoundVolume } from '../utils/sounds'
import * as THREE from 'three'

const GunViewModel = lazy(() => import('./GunViewModel'))

const CAMERA_CONFIG = { position: [0, 0, 0], fov: 75, near: 0.01, far: 1000 }
const PITCH_LIMIT = Math.PI / 2.2
const NUM_BALLS_MAX = 6
const BALL_RADIUS = 0.2
const DRAIN_TIME = 1.5
const BORDER = 0.015

const WALL_X = 6
const FLOOR_Y = -2.0
const CEIL_Y = 4.5
const BACK_Z = -12
const BG_DARK = '#060D18'
const BG_LIGHT = '#f0f9ff'

function makeArc(dir, arcCfg) {
  const d = dir ?? (Math.random() > 0.5 ? 1 : -1)
  return {
    t: Math.random() * 0.8,
    speed: 0.2 + Math.random() * 0.15,
    p0: new THREE.Vector3(d * -(WALL_X + 1.2), -0.2 + (Math.random() - 0.5) * 1.2, -7),
    p2: new THREE.Vector3(d * (WALL_X + 1.2), -0.2 + (Math.random() - 0.5) * 1.2, -7),
    peakY: arcCfg.min + Math.random() * arcCfg.range,
  }
}

function bezierPos(arc, t) {
  const mt = 1 - t
  const p1x = (arc.p0.x + arc.p2.x) / 2
  const p1y = Math.max(arc.p0.y, arc.p2.y) + arc.peakY
  const p1z = (arc.p0.z + arc.p2.z) / 2

  return new THREE.Vector3(
    mt * mt * arc.p0.x + 2 * mt * t * p1x + t * t * arc.p2.x,
    mt * mt * arc.p0.y + 2 * mt * t * p1y + t * t * arc.p2.y,
    mt * mt * arc.p0.z + 2 * mt * t * p1z + t * t * arc.p2.z,
  )
}

let audioCtx = null

function playBeep(damagePct) {
  const vol = getSoundVolume()
  if (vol === 0) return

  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()

    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.type = 'sine'
    osc.frequency.value = 700 + damagePct * 900
    gain.gain.setValueAtTime(0.2 * vol, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06)
    osc.start(audioCtx.currentTime)
    osc.stop(audioCtx.currentTime + 0.06)
  } catch {}
}

function PlayerController({ sensitivityMultiplier = 1, dpi = 800 }) {
  const { camera } = useThree()
  const rotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))

  const handleMouseMove = useCallback((e) => {
    if (!document.pointerLockElement) return

    const s = 0.07 * Math.PI / 180 * sensitivityMultiplier * (dpi / 800)
    rotation.current.y -= e.movementX * s
    rotation.current.x -= e.movementY * s
    rotation.current.x = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, rotation.current.x))
    camera.rotation.copy(rotation.current)
  }, [camera, sensitivityMultiplier, dpi])

  useEffect(() => {
    camera.rotation.order = 'YXZ'
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [camera, handleMouseMove])

  return null
}

const GREEN = new THREE.Color('#22c55e')
const YELLOW = new THREE.Color('#facc15')
const RED_HP = new THREE.Color('#ef4444')
const tmpColor = new THREE.Color()

function hpColor(hp) {
  if (hp > 0.5) return tmpColor.lerpColors(YELLOW, GREEN, (hp - 0.5) * 2).clone()
  return tmpColor.lerpColors(RED_HP, YELLOW, hp * 2).clone()
}

function Scene({
  sensitivity,
  dpi = 800,
  active,
  onDestroy,
  theme,
  speedMult = 1,
  drainMult = 1,
  ballRadius = BALL_RADIUS,
  ballColor = '#ff4655',
  numBalls = 4,
  arcHeightCfg,
  statsRef,
}) {
  const barW = ballRadius * 2.25
  const barH = ballRadius * 0.45
  const barY = ballRadius + 0.2
  const groups = useRef([])
  const spheres = useRef([])
  const hpFills = useRef([])
  const barGroups = useRef([])
  const arcs = useRef(Array.from(
    { length: NUM_BALLS_MAX },
    (_, i) => makeArc(i % 2 === 0 ? 1 : -1, arcHeightCfg),
  ))
  const hp = useRef(Array(NUM_BALLS_MAX).fill(1.0))
  const beep = useRef(Array.from({ length: NUM_BALLS_MAX }, () => ({ last: -1 })))
  const firstContact = useRef(Array(NUM_BALLS_MAX).fill(-1))
  const elapsed = useRef(0)
  const { camera, raycaster } = useThree()

  const resetBall = useCallback((idx) => {
    arcs.current[idx] = { ...makeArc(null, arcHeightCfg), t: 0 }
    hp.current[idx] = 1.0
    beep.current[idx].last = -1
    firstContact.current[idx] = -1

    const fill = hpFills.current[idx]
    if (fill) {
      fill.scale.x = 1
      fill.position.x = 0
      fill.material.color.copy(GREEN)
    }
  }, [arcHeightCfg])

  useFrame((_, delta) => {
    if (!active) return

    elapsed.current += delta

    for (let i = 0; i < numBalls; i++) {
      const arc = arcs.current[i]
      const group = groups.current[i]
      const barGroup = barGroups.current[i]
      if (!group) continue

      arc.t += delta * arc.speed * speedMult
      const pos = bezierPos(arc, Math.min(arc.t, 1))
      if (arc.t >= 1 || (arc.t > 0.5 && Math.abs(pos.x) >= WALL_X)) {
        resetBall(i)
        continue
      }

      group.position.copy(pos)
      if (barGroup) barGroup.quaternion.copy(camera.quaternion)
    }

    if (!document.pointerLockElement) return

    raycaster.setFromCamera({ x: 0, y: 0 }, camera)
    const hits = new Set(
      raycaster.intersectObjects(spheres.current.filter(Boolean))
        .map((hit) => spheres.current.indexOf(hit.object)),
    )

    if (statsRef) {
      statsRef.current.activeFrames++
      if (hits.size > 0) statsRef.current.hitFrames++
    }

    for (let i = 0; i < numBalls; i++) {
      const fill = hpFills.current[i]
      if (!fill) continue

      if (!hits.has(i)) {
        beep.current[i].last = -1
        continue
      }

      if (firstContact.current[i] === -1) {
        firstContact.current[i] = elapsed.current
      }

      const prevHp = hp.current[i]
      const drainAmt = delta / (DRAIN_TIME * drainMult)
      hp.current[i] = Math.max(0, prevHp - drainAmt)
      const h = hp.current[i]
      const actualDrain = prevHp - h
      if (statsRef) statsRef.current.totalDamage += actualDrain

      const dmgPct = 1 - h
      fill.scale.x = Math.max(0.001, h)
      fill.position.x = barW * (h - 1) / 2
      fill.material.color.copy(hpColor(h))

      const interval = Math.max(0.12, 0.55 - dmgPct * 0.43)
      const b = beep.current[i]
      if (b.last < 0 || dmgPct - b.last >= interval) {
        playBeep(dmgPct)
        b.last = dmgPct
      }

      if (h <= 0) {
        if (statsRef && firstContact.current[i] >= 0) {
          const ttk = elapsed.current - firstContact.current[i]
          if (ttk > 0) statsRef.current.ttks.push(ttk)
        }

        onDestroy()
        resetBall(i)
      }
    }
  })

  return (
    <>
      <PlayerController sensitivityMultiplier={sensitivity} dpi={dpi} />
      <color attach="background" args={[theme === 'dark' ? BG_DARK : BG_LIGHT]} />
      <ambientLight intensity={theme === 'dark' ? 1.4 : 1.5} />
      <hemisphereLight args={theme === 'dark' ? ['#4a90d9', '#1a3a5c', 1.6] : ['#ffffff', '#bae6fd', 1.5]} />
      <directionalLight position={[0, 8, -6]} intensity={theme === 'dark' ? 2.0 : 1.5} color="#ffffff" />
      <pointLight position={[-4, 4, -6]} intensity={theme === 'dark' ? 2.0 : 1.5} color={theme === 'dark' ? '#60c8ff' : '#7dd3fc'} distance={16} />
      <pointLight position={[4, 4, -6]} intensity={theme === 'dark' ? 2.0 : 1.5} color={theme === 'dark' ? '#60c8ff' : '#7dd3fc'} distance={16} />
      <pointLight position={[0, 4, -10]} intensity={theme === 'dark' ? 1.5 : 1.0} color={theme === 'dark' ? '#4ab0e0' : '#93c5fd'} distance={14} />

      <mesh position={[0, 1.5, BACK_Z]}>
        <planeGeometry args={[WALL_X * 2, CEIL_Y - FLOOR_Y]} />
        <meshStandardMaterial color={theme === 'dark' ? '#1a3a5c' : '#bae6fd'} roughness={0.9} />
      </mesh>
      <mesh position={[-WALL_X, 1.5, BACK_Z / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[Math.abs(BACK_Z), CEIL_Y - FLOOR_Y]} />
        <meshStandardMaterial color={theme === 'dark' ? '#1e4060' : '#e0f2fe'} roughness={0.9} />
      </mesh>
      <mesh position={[WALL_X, 1.5, BACK_Z / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[Math.abs(BACK_Z), CEIL_Y - FLOOR_Y]} />
        <meshStandardMaterial color={theme === 'dark' ? '#1e4060' : '#e0f2fe'} roughness={0.9} />
      </mesh>
      <mesh position={[0, FLOOR_Y, BACK_Z / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WALL_X * 2, Math.abs(BACK_Z)]} />
        <meshStandardMaterial color={theme === 'dark' ? '#102030' : '#f8fafc'} roughness={1} />
      </mesh>
      <mesh position={[0, CEIL_Y, BACK_Z / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WALL_X * 2, Math.abs(BACK_Z)]} />
        <meshStandardMaterial color={theme === 'dark' ? '#1a3550' : '#e0f2fe'} roughness={0.9} />
      </mesh>

      {Array.from({ length: numBalls }, (_, i) => (
        <group key={i} ref={(el) => { groups.current[i] = el }}>
          <mesh ref={(el) => { spheres.current[i] = el }}>
            <sphereGeometry args={[ballRadius, 24, 24]} />
            <meshStandardMaterial color={ballColor} roughness={0.6} metalness={0.2} />
          </mesh>

          <group ref={(el) => { barGroups.current[i] = el }} position={[0, barY, 0]}>
            <mesh position={[0, 0, -0.01]}>
              <planeGeometry args={[barW + BORDER * 2, barH + BORDER * 2]} />
              <meshBasicMaterial color="#ffffff" depthTest={false} />
            </mesh>
            <mesh>
              <planeGeometry args={[barW, barH]} />
              <meshBasicMaterial color="#111111" depthTest={false} />
            </mesh>
            <mesh ref={(el) => { hpFills.current[i] = el }} position={[0, 0, 0.01]}>
              <planeGeometry args={[barW, barH]} />
              <meshBasicMaterial color="#22c55e" depthTest={false} />
            </mesh>
          </group>
        </group>
      ))}
    </>
  )
}

export default function SkeetTrackingCanvas({
  theme,
  sensitivity,
  dpi,
  active,
  viewModelActive,
  onDestroy,
  ballSpeed,
  ballHP,
  ballSize,
  ballColor,
  numBalls,
  arcHeightCfg,
  statsRef,
  onCanvasReady,
  onViewModelReady,
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      camera={CAMERA_CONFIG}
      onCreated={onCanvasReady}
    >
      <color attach="background" args={[theme === 'dark' ? BG_DARK : BG_LIGHT]} />
      <Suspense fallback={null}>
        <GunViewModel active={viewModelActive} shootTrigger={0} onReady={onViewModelReady} />
      </Suspense>
      <PerspectiveCamera makeDefault {...CAMERA_CONFIG} />
      <Scene
        sensitivity={sensitivity}
        dpi={dpi}
        active={active}
        onDestroy={onDestroy}
        theme={theme}
        speedMult={ballSpeed}
        drainMult={ballHP}
        ballRadius={ballSize}
        ballColor={ballColor}
        numBalls={numBalls}
        arcHeightCfg={arcHeightCfg}
        statsRef={statsRef}
      />
    </Canvas>
  )
}
