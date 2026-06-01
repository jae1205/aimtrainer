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
const TARGET_WINDOW = {
  width: 5.2,
  height: 3.1,
  centerY: 1.25,
  frame: 0.12,
  targetZ: BACK_Z + 0.08,
  insetZ: BACK_Z - 0.08,
}

const ROOM_THEME = {
  dark: {
    background: '#070A0F',
    fog: '#070A0F',
    backWall: '#151C24',
    sideWall: '#111820',
    floor: '#0D1218',
    ceiling: '#171F28',
    opening: '#05080D',
    frame: '#2A3541',
    fogNear: 10,
    fogFar: 22,
    ambient: 0.52,
    hemiSky: '#7DD3FC',
    hemiGround: '#0B1118',
    hemiIntensity: 0.72,
    keyLight: '#EAF6FF',
    keyIntensity: 0.86,
    fillLight: '#22D3EE',
    fillIntensity: 0.88,
    rimLight: '#F59E0B',
    rimIntensity: 0.55,
  },
  light: {
    background: '#EAF3F7',
    fog: '#EAF3F7',
    backWall: '#D9E5EC',
    sideWall: '#E4EEF3',
    floor: '#D1DDE5',
    ceiling: '#F2F7FA',
    opening: '#C5D5DF',
    frame: '#A8BAC7',
    fogNear: 18,
    fogFar: 38,
    ambient: 0.82,
    hemiSky: '#FFFFFF',
    hemiGround: '#C5D4DE',
    hemiIntensity: 0.8,
    keyLight: '#FFFFFF',
    keyIntensity: 0.9,
    fillLight: '#8ED8E8',
    fillIntensity: 0.58,
    rimLight: '#F59E0B',
    rimIntensity: 0.24,
  },
}

function getWindowBounds(ballRadius) {
  const padding = ballRadius * 1.35
  const halfW = TARGET_WINDOW.width / 2
  const halfH = TARGET_WINDOW.height / 2

  return {
    minX: -halfW + padding,
    maxX: halfW - padding,
    minY: TARGET_WINDOW.centerY - halfH + padding,
    maxY: TARGET_WINDOW.centerY + halfH - padding,
  }
}

function makeWindowTarget(idx, total, ballRadius, heightCfg) {
  const bounds = getWindowBounds(ballRadius)
  const dir = Math.random() > 0.5 ? 1 : -1
  const laneT = total <= 1 ? 0.5 : (idx + 0.5) / total
  const fullSpread = bounds.maxY - bounds.minY
  const spread = fullSpread * (heightCfg?.spread ?? 0.78)
  const jitter = Math.min(0.12, spread / Math.max(3, total * 2)) * (Math.random() - 0.5)
  const y = TARGET_WINDOW.centerY + (laneT - 0.5) * spread + jitter

  return {
    x: dir > 0 ? bounds.minX : bounds.maxX,
    y: Math.max(bounds.minY, Math.min(bounds.maxY, y)),
    dir,
    speed: 1.15 + Math.random() * 0.5,
  }
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
  const room = ROOM_THEME[theme === 'dark' ? 'dark' : 'light']
  const windowHalfW = TARGET_WINDOW.width / 2
  const windowHalfH = TARGET_WINDOW.height / 2
  const windowBottom = TARGET_WINDOW.centerY - windowHalfH
  const windowTop = TARGET_WINDOW.centerY + windowHalfH
  const sideWallWidth = WALL_X - windowHalfW
  const topWallHeight = CEIL_Y - windowTop
  const bottomWallHeight = windowBottom - FLOOR_Y
  const wallPieces = [
    { key: 'top', position: [0, windowTop + topWallHeight / 2, BACK_Z], size: [WALL_X * 2, topWallHeight] },
    { key: 'bottom', position: [0, FLOOR_Y + bottomWallHeight / 2, BACK_Z], size: [WALL_X * 2, bottomWallHeight] },
    { key: 'left', position: [-(windowHalfW + sideWallWidth / 2), TARGET_WINDOW.centerY, BACK_Z], size: [sideWallWidth, TARGET_WINDOW.height] },
    { key: 'right', position: [windowHalfW + sideWallWidth / 2, TARGET_WINDOW.centerY, BACK_Z], size: [sideWallWidth, TARGET_WINDOW.height] },
  ].filter((piece) => piece.size[0] > 0 && piece.size[1] > 0)
  const frame = TARGET_WINDOW.frame
  const framePieces = [
    { key: 'frame-top', position: [0, windowTop + frame / 2, BACK_Z + 0.018], size: [TARGET_WINDOW.width + frame * 2, frame] },
    { key: 'frame-bottom', position: [0, windowBottom - frame / 2, BACK_Z + 0.018], size: [TARGET_WINDOW.width + frame * 2, frame] },
    { key: 'frame-left', position: [-(windowHalfW + frame / 2), TARGET_WINDOW.centerY, BACK_Z + 0.018], size: [frame, TARGET_WINDOW.height] },
    { key: 'frame-right', position: [windowHalfW + frame / 2, TARGET_WINDOW.centerY, BACK_Z + 0.018], size: [frame, TARGET_WINDOW.height] },
  ]
  const barW = ballRadius * 2.25
  const barH = ballRadius * 0.45
  const barY = ballRadius + 0.2
  const groups = useRef([])
  const spheres = useRef([])
  const hpFills = useRef([])
  const barGroups = useRef([])
  const targets = useRef(Array.from(
    { length: NUM_BALLS_MAX },
    (_, i) => makeWindowTarget(i, numBalls, ballRadius, arcHeightCfg),
  ))
  const hp = useRef(Array(NUM_BALLS_MAX).fill(1.0))
  const beep = useRef(Array.from({ length: NUM_BALLS_MAX }, () => ({ last: -1 })))
  const firstContact = useRef(Array(NUM_BALLS_MAX).fill(-1))
  const elapsed = useRef(0)
  const { camera, raycaster } = useThree()

  const resetBall = useCallback((idx) => {
    targets.current[idx] = makeWindowTarget(idx, numBalls, ballRadius, arcHeightCfg)
    hp.current[idx] = 1.0
    beep.current[idx].last = -1
    firstContact.current[idx] = -1

    const fill = hpFills.current[idx]
    if (fill) {
      fill.scale.x = 1
      fill.position.x = 0
      fill.material.color.copy(GREEN)
    }
  }, [arcHeightCfg, ballRadius, numBalls])

  useFrame((_, delta) => {
    if (!active) return

    elapsed.current += delta

    for (let i = 0; i < numBalls; i++) {
      const target = targets.current[i]
      const group = groups.current[i]
      const barGroup = barGroups.current[i]
      if (!group) continue

      const bounds = getWindowBounds(ballRadius)
      target.x += delta * target.speed * speedMult * target.dir

      if (target.x >= bounds.maxX) {
        target.x = bounds.maxX
        target.dir = -1
      } else if (target.x <= bounds.minX) {
        target.x = bounds.minX
        target.dir = 1
      }

      group.position.set(target.x, target.y, TARGET_WINDOW.targetZ)
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
      <color attach="background" args={[room.background]} />
      <fog attach="fog" args={[room.fog, room.fogNear, room.fogFar]} />
      <ambientLight intensity={room.ambient} />
      <hemisphereLight args={[room.hemiSky, room.hemiGround, room.hemiIntensity]} />
      <directionalLight position={[-3.5, 5.4, -4.5]} intensity={room.keyIntensity} color={room.keyLight} />
      <spotLight position={[0, 4.2, -3.2]} angle={0.58} penumbra={0.8} intensity={room.fillIntensity} color={room.fillLight} distance={15} />
      <pointLight position={[-4.8, 2.7, -9]} intensity={room.rimIntensity} color={room.rimLight} distance={10} />
      <pointLight position={[4.8, 2.7, -9]} intensity={room.fillIntensity * 0.45} color={room.fillLight} distance={10} />

      {wallPieces.map((piece) => (
        <mesh key={piece.key} position={piece.position}>
          <planeGeometry args={piece.size} />
          <meshStandardMaterial color={room.backWall} roughness={0.88} metalness={0.04} />
        </mesh>
      ))}
      <mesh position={[0, TARGET_WINDOW.centerY, TARGET_WINDOW.insetZ]}>
        <planeGeometry args={[TARGET_WINDOW.width, TARGET_WINDOW.height]} />
        <meshStandardMaterial color={room.opening} roughness={0.95} metalness={0.02} />
      </mesh>
      {framePieces.map((piece) => (
        <mesh key={piece.key} position={piece.position}>
          <planeGeometry args={piece.size} />
          <meshStandardMaterial color={room.frame} roughness={0.82} metalness={0.08} />
        </mesh>
      ))}
      <mesh position={[-WALL_X, 1.5, BACK_Z / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[Math.abs(BACK_Z), CEIL_Y - FLOOR_Y]} />
        <meshStandardMaterial color={room.sideWall} roughness={0.9} metalness={0.03} />
      </mesh>
      <mesh position={[WALL_X, 1.5, BACK_Z / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[Math.abs(BACK_Z), CEIL_Y - FLOOR_Y]} />
        <meshStandardMaterial color={room.sideWall} roughness={0.9} metalness={0.03} />
      </mesh>
      <mesh position={[0, FLOOR_Y, BACK_Z / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WALL_X * 2, Math.abs(BACK_Z)]} />
        <meshStandardMaterial color={room.floor} roughness={0.96} metalness={0.02} />
      </mesh>
      <mesh position={[0, CEIL_Y, BACK_Z / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WALL_X * 2, Math.abs(BACK_Z)]} />
        <meshStandardMaterial color={room.ceiling} roughness={0.92} metalness={0.02} />
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
  const room = ROOM_THEME[theme === 'dark' ? 'dark' : 'light']

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      camera={CAMERA_CONFIG}
      onCreated={onCanvasReady}
    >
      <color attach="background" args={[room.background]} />
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
