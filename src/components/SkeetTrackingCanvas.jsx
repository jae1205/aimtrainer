import { useCallback, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { getSoundVolume } from '../utils/sounds'
import * as THREE from 'three'

const PLAYER_EYE_Y = 1.25
const CAMERA_CONFIG = { position: [0, PLAYER_EYE_Y, 0], fov: 75, near: 0.01, far: 1000 }
const PITCH_LIMIT = Math.PI / 2.2
const NUM_BALLS_MAX = 6
const BALL_RADIUS = 0.2
const DRAIN_TIME = 1.5
const HP_BAR_SCALE = 0.8

const WALL_X = 6
const FLOOR_Y = -2.0
const CEIL_Y = 4.5
const BACK_Z = -12
const SEAM_OVERLAP = 0.36
const SEAM_COVE_HEIGHT = 0.42
const TARGET_TRAVEL_MARGIN = 0.95
const TARGET_STAGGER = 0.16
const PLAYER_BOUNDS = {
  minX: -4.6,
  maxX: 4.6,
  minZ: BACK_Z + 2.2,
  maxZ: -0.15,
}
const TARGET_WINDOW = {
  width: 5.2,
  height: 3.1,
  centerY: 1.25,
  frame: 0.12,
  targetZ: BACK_Z - 0.34,
}

const ROOM_THEME = {
  dark: {
    background: '#070A0F',
    fog: '#070A0F',
    backWall: '#151C24',
    sideWall: '#111820',
    floor: '#0D1218',
    ceiling: '#171F28',
    frame: '#2A3541',
    hpTrack: '#0B1118',
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
    sideWall: '#CBD6DE',
    floor: '#CBD6DE',
    ceiling: '#E8F0F5',
    frame: '#A8BAC7',
    hpTrack: '#D9E5EC',
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
  const lanesPerBand = Math.max(1, Math.ceil(total / 2))
  const isTopBand = idx < lanesPerBand
  const laneIdx = idx % lanesPerBand
  const laneT = lanesPerBand <= 1 ? 0.5 : laneIdx / (lanesPerBand - 1)
  const dir = Math.random() > 0.5 ? 1 : -1
  const travelEdge = TARGET_WINDOW.width / 2 + TARGET_TRAVEL_MARGIN + ballRadius * 1.4
  const fullHeight = bounds.maxY - bounds.minY
  const arcScale = isTopBand ? 1 : 0.78
  const dropScale = isTopBand ? 0.55 : 0.3
  const arcHeight = fullHeight * (heightCfg?.arc ?? 0.2) * arcScale * (0.92 + Math.random() * 0.16)
  const drop = fullHeight * (heightCfg?.drop ?? 0.45) * dropScale * (0.9 + Math.random() * 0.18)
  const rowMin = bounds.minY + fullHeight * (isTopBand ? 0.48 : 0.14)
  const rowMax = bounds.minY + fullHeight * (isTopBand ? 0.68 : 0.34)
  const startMin = bounds.minY + drop + ballRadius * 0.25
  const startMax = bounds.maxY - arcHeight - ballRadius * 0.25
  const jitter = (rowMax - rowMin) * 0.14 * (Math.random() - 0.5)
  const laneY = rowMin + (rowMax - rowMin) * laneT + jitter
  const startY = Math.max(startMin, Math.min(startMax, laneY))
  const endY = Math.max(bounds.minY, startY - drop)
  const delay = laneIdx * TARGET_STAGGER + (isTopBand ? 0 : TARGET_STAGGER * 0.5) + Math.random() * 0.08

  return {
    t: -delay,
    startX: dir > 0 ? -travelEdge : travelEdge,
    endX: dir > 0 ? travelEdge : -travelEdge,
    startY,
    endY,
    arcHeight,
    gravity: heightCfg?.gravity ?? 1,
    speed: 0.36 + laneIdx * 0.02 + Math.random() * 0.06,
  }
}

function getWindowTargetPosition(target, ballRadius) {
  const bounds = getWindowBounds(ballRadius)
  const t = Math.max(0, Math.min(target.t, 1))
  const x = target.startX + (target.endX - target.startX) * t
  const fallT = 1 - Math.pow(1 - t, target.gravity ?? 1)
  const linearY = target.startY + (target.endY - target.startY) * fallT
  const y = linearY + target.arcHeight * 4 * t * (1 - t)

  return [
    x,
    Math.max(bounds.minY, Math.min(bounds.maxY, y)),
    TARGET_WINDOW.targetZ,
  ]
}

function isTargetInOpening(position, ballRadius) {
  const x = Array.isArray(position) ? position[0] : position.x
  const y = Array.isArray(position) ? position[1] : position.y
  const halfW = TARGET_WINDOW.width / 2
  const halfH = TARGET_WINDOW.height / 2
  const minY = TARGET_WINDOW.centerY - halfH
  const maxY = TARGET_WINDOW.centerY + halfH

  return (
    x + ballRadius > -halfW &&
    x - ballRadius < halfW &&
    y + ballRadius > minY &&
    y - ballRadius < maxY
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

function PlayerController({ sensitivityMultiplier = 1, dpi = 800, movementEnabled = false }) {
  const { camera } = useThree()
  const rotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  })
  const moveForward = useRef(new THREE.Vector3())
  const moveRight = useRef(new THREE.Vector3())
  const moveVector = useRef(new THREE.Vector3())

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

  useEffect(() => {
    const clearKeys = () => {
      keys.current.forward = false
      keys.current.backward = false
      keys.current.left = false
      keys.current.right = false
      keys.current.sprint = false
    }

    const setKey = (event, pressed) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = pressed
          break
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = pressed
          break
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = pressed
          break
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = pressed
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.current.sprint = pressed
          break
        default:
          return
      }

      if (document.pointerLockElement) event.preventDefault()
    }

    const handleKeyDown = (event) => setKey(event, true)
    const handleKeyUp = (event) => setKey(event, false)
    const handlePointerLockChange = () => {
      if (!document.pointerLockElement) clearKeys()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', clearKeys)
    document.addEventListener('pointerlockchange', handlePointerLockChange)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', clearKeys)
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
    }
  }, [])

  useFrame((_, delta) => {
    if (!movementEnabled || !document.pointerLockElement) return

    moveForward.current.set(0, 0, -1).applyQuaternion(camera.quaternion)
    moveForward.current.y = 0
    moveForward.current.normalize()

    moveRight.current.set(1, 0, 0).applyQuaternion(camera.quaternion)
    moveRight.current.y = 0
    moveRight.current.normalize()

    moveVector.current.set(0, 0, 0)
    if (keys.current.forward) moveVector.current.add(moveForward.current)
    if (keys.current.backward) moveVector.current.sub(moveForward.current)
    if (keys.current.right) moveVector.current.add(moveRight.current)
    if (keys.current.left) moveVector.current.sub(moveRight.current)

    if (moveVector.current.lengthSq() === 0) return

    const speed = keys.current.sprint ? 3.3 : 2.15
    moveVector.current.normalize().multiplyScalar(speed * delta)
    camera.position.add(moveVector.current)
    camera.position.x = Math.max(PLAYER_BOUNDS.minX, Math.min(PLAYER_BOUNDS.maxX, camera.position.x))
    camera.position.y = PLAYER_EYE_Y
    camera.position.z = Math.max(PLAYER_BOUNDS.minZ, Math.min(PLAYER_BOUNDS.maxZ, camera.position.z))
  })

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
  const sideWallHeight = CEIL_Y - FLOOR_Y + SEAM_OVERLAP
  const sideWallCenterY = FLOOR_Y + (CEIL_Y - FLOOR_Y) / 2 - SEAM_OVERLAP / 2
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
  const barW = ballRadius * 2.25 * HP_BAR_SCALE
  const barH = ballRadius * 0.45 * HP_BAR_SCALE
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

      target.t += delta * target.speed * speedMult
      if (target.t >= 1) {
        resetBall(i)
        continue
      }

      group.position.set(...getWindowTargetPosition(target, ballRadius))
      const visibleInOpening = isTargetInOpening(group.position, ballRadius)
      if (barGroup) {
        barGroup.visible = visibleInOpening
        barGroup.quaternion.copy(camera.quaternion)
      }
    }

    if (!document.pointerLockElement) return

    raycaster.setFromCamera({ x: 0, y: 0 }, camera)
    const visibleSpheres = []
    const sphereIndexes = new Map()
    for (let i = 0; i < numBalls; i++) {
      const sphere = spheres.current[i]
      const group = groups.current[i]
      if (!sphere || !group || !isTargetInOpening(group.position, ballRadius)) continue

      visibleSpheres.push(sphere)
      sphereIndexes.set(sphere, i)
    }
    const hits = new Set(
      raycaster.intersectObjects(visibleSpheres)
        .map((hit) => sphereIndexes.get(hit.object))
        .filter((idx) => idx !== undefined),
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
      <PlayerController sensitivityMultiplier={sensitivity} dpi={dpi} movementEnabled={active} />
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
      {framePieces.map((piece) => (
        <mesh key={piece.key} position={piece.position}>
          <planeGeometry args={piece.size} />
          <meshStandardMaterial color={room.frame} roughness={0.82} metalness={0.08} />
        </mesh>
      ))}
      <mesh position={[-WALL_X, sideWallCenterY, BACK_Z / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[Math.abs(BACK_Z), sideWallHeight]} />
        {theme === 'light'
          ? <meshBasicMaterial color={room.sideWall} />
          : <meshStandardMaterial color={room.sideWall} roughness={0.9} metalness={0.03} />}
      </mesh>
      <mesh position={[WALL_X, sideWallCenterY, BACK_Z / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[Math.abs(BACK_Z), sideWallHeight]} />
        {theme === 'light'
          ? <meshBasicMaterial color={room.sideWall} />
          : <meshStandardMaterial color={room.sideWall} roughness={0.9} metalness={0.03} />}
      </mesh>
      <mesh position={[0, FLOOR_Y, BACK_Z / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WALL_X * 2 + SEAM_OVERLAP * 2, Math.abs(BACK_Z)]} />
        {theme === 'light'
          ? <meshBasicMaterial color={room.floor} />
          : <meshStandardMaterial color={room.floor} roughness={0.96} metalness={0.02} />}
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={`floor-seam-cover-${side}`}
          position={[side * (WALL_X - SEAM_OVERLAP / 2), FLOOR_Y + 0.006, BACK_Z / 2]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[SEAM_OVERLAP + 0.22, Math.abs(BACK_Z)]} />
          <meshBasicMaterial color={room.floor} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh
          key={`wall-cove-cover-${side}`}
          position={[side * (WALL_X - 0.006), FLOOR_Y + SEAM_COVE_HEIGHT / 2, BACK_Z / 2]}
          rotation={[0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
        >
          <planeGeometry args={[Math.abs(BACK_Z), SEAM_COVE_HEIGHT]} />
          <meshBasicMaterial color={room.floor} />
        </mesh>
      ))}
      <mesh position={[0, CEIL_Y, BACK_Z / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WALL_X * 2, Math.abs(BACK_Z)]} />
        <meshStandardMaterial color={room.ceiling} roughness={0.92} metalness={0.02} />
      </mesh>

      {Array.from({ length: numBalls }, (_, i) => {
        const initialPosition = getWindowTargetPosition(targets.current[i], ballRadius)

        return (
          <group key={i} ref={(el) => { groups.current[i] = el }} position={initialPosition}>
            <mesh ref={(el) => { spheres.current[i] = el }}>
              <sphereGeometry args={[ballRadius, 24, 24]} />
              <meshStandardMaterial color={ballColor} roughness={0.6} metalness={0.2} />
            </mesh>

            <group
              ref={(el) => { barGroups.current[i] = el }}
              position={[0, barY, 0]}
              visible={isTargetInOpening(initialPosition, ballRadius)}
            >
              <mesh>
                <planeGeometry args={[barW, barH]} />
                <meshBasicMaterial color={room.hpTrack} depthWrite={false} />
              </mesh>
              <mesh ref={(el) => { hpFills.current[i] = el }} position={[0, 0, 0.01]}>
                <planeGeometry args={[barW, barH]} />
                <meshBasicMaterial color="#22c55e" depthWrite={false} />
              </mesh>
            </group>
          </group>
        )
      })}
    </>
  )
}

export default function SkeetTrackingCanvas({
  theme,
  sensitivity,
  dpi,
  active,
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

  useEffect(() => {
    onViewModelReady?.()
  }, [onViewModelReady])

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      camera={CAMERA_CONFIG}
      onCreated={onCanvasReady}
    >
      <color attach="background" args={[room.background]} />
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
