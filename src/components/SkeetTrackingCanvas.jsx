import { memo, Suspense, useCallback, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { getSoundVolume } from '../utils/sounds'
import GunViewModel from './GunViewModel'
import RangeFront from './RangeFront'
import RangeInterior from './RangeInterior'
import RangeStaticBatch from './RangeStaticBatch'
import { RangeSurfaces } from './RangeDetails'
import AimController from './AimController'
import { createAimState, HIP_FOV } from '../utils/aim'
import { createTrackingTarget, stepTrackingTarget } from '../utils/trackingTarget'
import { rayHitsSphere } from '../utils/targetHit'
import * as THREE from 'three'

const PLAYER_EYE_Y = 1.25
const PLAYER_START_Z = -3
const PLAYER_START_POSITION = [0, PLAYER_EYE_Y, PLAYER_START_Z]
const CAMERA_CONFIG = { position: PLAYER_START_POSITION, fov: HIP_FOV, near: 0.05, far: 60 }
const PITCH_LIMIT = Math.PI / 2.2
const NUM_BALLS_MAX = 6
const BALL_RADIUS = 0.2
const DRAIN_TIME = 1.5
const RENDER_DPR = [1, 1.5]
const RENDER_OPTIONS = { antialias: true, precision: 'highp', powerPreference: 'high-performance', alpha: false }
const AIM_POINT = { x: 0, y: 0 }


const WALL_X = 6
const FLOOR_Y = -2.0
const CEIL_Y = 4.5
const BACK_Z = -12
const SEAM_OVERLAP = 0.36
const SEAM_COVE_HEIGHT = 0.42
const TARGET_TRAVEL_MARGIN = 0.95
const TARGET_STAGGER = 0.16
const TRACKING_SCORE_PER_SECOND = 1000 / 60
const TARGET_WINDOW = {
  width: 5.2,
  height: 3.1,
  centerY: 1.25,
  frame: 0.12,
  targetZ: BACK_Z - 0.34,
}

const ROOM_THEME = {
  dark: {
    background: '#111c17',
    fog: '#111c17',
    backWall: '#34443a',
    sideWall: '#77766c',
    floor: '#626257',
    ceiling: '#383d39',
    frame: '#77867a',
    hpTrack: '#101814',
    fogNear: 14,
    fogFar: 31,
    ambient: 0.65,
    hemiSky: '#e8e9e5',
    hemiGround: '#42473e',
    hemiIntensity: 0.65,
    keyLight: '#FFF2DC',
    keyIntensity: 1.65,
    fillLight: '#F3834C',
    fillIntensity: 0.88,
    rimLight: '#F6B77E',
    rimIntensity: 0.68,
  },
  light: {
    background: '#DDE6EB',
    fog: '#DDE6EB',
    backWall: '#C4D0D8',
    sideWall: '#B8C4CC',
    floor: '#B2BEC7',
    ceiling: '#D6E0E7',
    frame: '#879AA8',
    hpTrack: '#C4D0D8',
    fogNear: 16,
    fogFar: 32,
    ambient: 0.74,
    hemiSky: '#FFFFFF',
    hemiGround: '#B5C2CC',
    hemiIntensity: 0.72,
    keyLight: '#FFFFFF',
    keyIntensity: 0.78,
    fillLight: '#8ED8E8',
    fillIntensity: 0.48,
    rimLight: '#F59E0B',
    rimIntensity: 0.2,
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
  const dropScale = isTopBand ? 0.34 : 0.24
  const arcHeight = fullHeight * (heightCfg?.arc ?? 0.2) * arcScale * (0.92 + Math.random() * 0.16)
  const drop = fullHeight * (heightCfg?.drop ?? 0.45) * dropScale * (0.9 + Math.random() * 0.18)
  const rowMin = bounds.minY + fullHeight * (isTopBand ? 0.46 : 0.12)
  const rowMax = bounds.minY + fullHeight * (isTopBand ? 0.62 : 0.34)
  const startMin = bounds.minY + drop * 0.45 + ballRadius * 0.25
  const startMax = bounds.maxY - arcHeight - ballRadius * 0.25
  const jitter = (rowMax - rowMin) * 0.14 * (Math.random() - 0.5)
  const laneY = rowMin + (rowMax - rowMin) * laneT + jitter
  const startY = Math.max(startMin, Math.min(startMax, laneY))
  const endY = Math.max(bounds.minY, startY - drop)
  const peakY = Math.min(bounds.maxY, startY + arcHeight)
  const delay = laneIdx * TARGET_STAGGER + (isTopBand ? 0 : TARGET_STAGGER * 0.5) + Math.random() * 0.08

  return {
    t: -delay,
    startX: dir > 0 ? -travelEdge : travelEdge,
    endX: dir > 0 ? travelEdge : -travelEdge,
    startY,
    peakY,
    endY,
    speed: 0.36 + laneIdx * 0.02 + Math.random() * 0.06,
  }
}

function getWindowTargetPosition(target, ballRadius, out = [], bounds = getWindowBounds(ballRadius)) {
  const t = Math.max(0, Math.min(target.t, 1))
  const x = target.startX + (target.endX - target.startX) * t
  const invT = 1 - t
  const y = invT * invT * target.startY + 2 * invT * t * target.peakY + t * t * target.endY

  out[0] = x
  out[1] = Math.max(bounds.minY, Math.min(bounds.maxY, y))
  out[2] = TARGET_WINDOW.targetZ
  return out
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

function PlayerController({ sensitivityMultiplier = 1, dpi = 800 }) {
  const { camera } = useThree()
  const rotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))

  const handleMouseMove = useCallback((e) => {
    if (!document.pointerLockElement) return

    const zoomSensitivity = Math.tan(camera.fov * Math.PI / 360) / Math.tan(HIP_FOV * Math.PI / 360)
    const s = 0.07 * Math.PI / 180 * sensitivityMultiplier * (dpi / 800) * zoomSensitivity
    rotation.current.y -= e.movementX * s
    rotation.current.x -= e.movementY * s
    rotation.current.x = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, rotation.current.x))
    camera.rotation.copy(rotation.current)
  }, [camera, sensitivityMultiplier, dpi])

  useEffect(() => {
    camera.rotation.order = 'YXZ'
    camera.position.set(...PLAYER_START_POSITION)
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [camera, handleMouseMove])

  return null
}

const GRIDSHOT_CELLS = [-1.9, -0.95, 0, 0.95, 1.9].flatMap((x) =>
  [0.18, 1.22, 2.26].map((y) => [x, y, TARGET_WINDOW.targetZ]),
)

function getGridshotPosition(idx, groups = []) {
  const occupied = groups
    .filter(Boolean)
    .map((group) => group.position)
  const available = GRIDSHOT_CELLS.filter((cell) => !occupied.some((position) =>
    Math.hypot(cell[0] - position.x, cell[1] - position.y) < 0.7,
  ))
  const pool = available.length ? available : GRIDSHOT_CELLS
  const initialCell = GRIDSHOT_CELLS[(idx * 7 + 1) % GRIDSHOT_CELLS.length]
  const cell = occupied.length ? pool[Math.floor(Math.random() * pool.length)] : initialCell
  return [...cell]
}

const GREEN = new THREE.Color('#a6f47b')
const YELLOW = new THREE.Color('#facc15')
const RED_HP = new THREE.Color('#ef4444')
const tmpColor = new THREE.Color()

function hpColor(hp) {
  if (hp > 0.5) return tmpColor.lerpColors(YELLOW, GREEN, (hp - 0.5) * 2)
  return tmpColor.lerpColors(RED_HP, YELLOW, hp * 2)
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
  trainingMode = 'skeet',
  onShoot,
  onTrackingScore,
}) {
  const room = ROOM_THEME[theme === 'dark' ? 'dark' : 'light']
  const sideWallHeight = CEIL_Y - FLOOR_Y + SEAM_OVERLAP
  const sideWallCenterY = FLOOR_Y + (CEIL_Y - FLOOR_Y) / 2 - SEAM_OVERLAP / 2
  const barW = Math.max(0.28, ballRadius * 2.6)
  const barH = 0.045
  const barY = ballRadius + 0.14
  const groups = useRef([])
  const spheres = useRef([])
  const hpFills = useRef([])
  const barGroups = useRef([])
  const targets = useRef(null)
  const initialPositions = useRef(null)
  if (!targets.current) {
    if (trainingMode === 'gridshot') {
      initialPositions.current = Array.from({ length: NUM_BALLS_MAX }, (_, i) => getGridshotPosition(i))
      targets.current = initialPositions.current.map((position) => ({ position }))
    } else if (trainingMode === 'tracking') {
      const target = createTrackingTarget(getWindowBounds(ballRadius))
      targets.current = [target]
      initialPositions.current = [[target.x, target.y, TARGET_WINDOW.targetZ]]
    } else {
      targets.current = Array.from({ length: NUM_BALLS_MAX },
        (_, i) => makeWindowTarget(i, numBalls, ballRadius, arcHeightCfg))
      initialPositions.current = targets.current.map((target) => getWindowTargetPosition(target, ballRadius))
    }
  }
  const targetBounds = useMemo(() => getWindowBounds(ballRadius), [ballRadius])
  const nextPosition = useRef([0, 0, 0])
  const hitMask = useRef(new Uint8Array(NUM_BALLS_MAX))
  const hp = useRef(Array(NUM_BALLS_MAX).fill(1.0))
  const firstContact = useRef(Array(NUM_BALLS_MAX).fill(-1))
  const elapsed = useRef(0)
  const pendingShots = useRef(0)
  const lastTrackingScore = useRef(-1)
  const { camera, raycaster } = useThree()

  useEffect(() => {
    if (trainingMode !== 'gridshot') return undefined
    const handleShot = (event) => {
      if (event.button !== 0 || !active || !document.pointerLockElement) return
      pendingShots.current++
      onShoot?.()
    }
    window.addEventListener('mousedown', handleShot)
    return () => window.removeEventListener('mousedown', handleShot)
  }, [active, onShoot, trainingMode])

  const resetBall = useCallback((idx) => {
    const nextTarget = trainingMode === 'gridshot'
      // Include the hit target's old position so it cannot respawn in place.
      ? { position: getGridshotPosition(idx, groups.current.slice(0, numBalls)) }
      : makeWindowTarget(idx, numBalls, ballRadius, arcHeightCfg)
    const nextPosition = trainingMode === 'gridshot'
      ? nextTarget.position
      : getWindowTargetPosition(nextTarget, ballRadius)
    const visibleInOpening = isTargetInOpening(nextPosition, ballRadius)
    targets.current[idx] = nextTarget
    hp.current[idx] = 1.0
    firstContact.current[idx] = -1

    const group = groups.current[idx]
    if (group) {
      group.position.set(...nextPosition)
    }

    const barGroup = barGroups.current[idx]
    if (barGroup) {
      barGroup.visible = trainingMode === 'skeet' && visibleInOpening
      barGroup.quaternion.copy(camera.quaternion)
    }

    const fill = hpFills.current[idx]
    if (fill) {
      fill.scale.x = 1
      fill.position.x = 0
      fill.material.color.copy(GREEN)
    }
  }, [arcHeightCfg, ballRadius, camera, numBalls, trainingMode])

  useFrame((_, delta) => {
    if (!active) return

    const frameDelta = Math.min(delta, 0.05)
    elapsed.current += frameDelta

    if (trainingMode === 'gridshot') {
      if (!document.pointerLockElement || pendingShots.current <= 0) return
      pendingShots.current--
      camera.updateMatrixWorld()
      raycaster.setFromCamera(AIM_POINT, camera)
      let hitIndex = -1
      for (let i = 0; i < numBalls; i++) {
        if (spheres.current[i] && groups.current[i] &&
          rayHitsSphere(raycaster.ray, groups.current[i].position, ballRadius)) {
          hitIndex = i
          break
        }
      }
      if (statsRef) statsRef.current.activeFrames++
      if (hitIndex >= 0) {
        if (statsRef) {
          statsRef.current.hitFrames++
          statsRef.current.totalDamage++
        }
        playBeep(1)
        onDestroy()
        resetBall(hitIndex)
      }
      return
    }

    if (trainingMode === 'tracking') {
      const target = targets.current[0]
      const group = groups.current[0]
      if (!target || !group) return

      stepTrackingTarget(target, frameDelta, targetBounds)
      group.position.set(target.x, target.y, TARGET_WINDOW.targetZ)
      if (!document.pointerLockElement) return

      camera.updateMatrixWorld()
      raycaster.setFromCamera(AIM_POINT, camera)
      const sphere = spheres.current[0]
      if (!sphere) return
      const isHit = rayHitsSphere(raycaster.ray, group.position, ballRadius)
      sphere.material.emissiveIntensity = isHit ? 1.25 : 0.6

      if (statsRef) {
        const stats = statsRef.current
        stats.activeFrames++
        if (isHit) {
          stats.hitFrames++
          stats.trackingSeconds += frameDelta
          stats.currentTrackSeconds += frameDelta
          stats.longestTrackSeconds = Math.max(stats.longestTrackSeconds, stats.currentTrackSeconds)
          const nextScore = Math.min(1000, Math.floor(stats.trackingSeconds * TRACKING_SCORE_PER_SECOND))
          if (nextScore !== lastTrackingScore.current) {
            lastTrackingScore.current = nextScore
            onTrackingScore?.(nextScore)
          }
        } else {
          stats.currentTrackSeconds = 0
        }
      }
      return
    }

    for (let i = 0; i < numBalls; i++) {
      const target = targets.current[i]
      const group = groups.current[i]
      const barGroup = barGroups.current[i]
      if (!group) continue

      target.t += frameDelta * target.speed * speedMult
      if (target.t >= 1) {
        resetBall(i)
        continue
      }

      group.position.set(...getWindowTargetPosition(target, ballRadius, nextPosition.current, targetBounds))
      const visibleInOpening = isTargetInOpening(group.position, ballRadius)
      if (barGroup) {
        barGroup.visible = trainingMode === 'skeet' && visibleInOpening
        barGroup.quaternion.copy(camera.quaternion)
      }
    }

    if (!document.pointerLockElement) return

    camera.updateMatrixWorld()
    raycaster.setFromCamera(AIM_POINT, camera)
    const hits = hitMask.current
    hits.fill(0)
    let visibleCount = 0
    let hitCount = 0
    for (let i = 0; i < numBalls; i++) {
      const sphere = spheres.current[i]
      const group = groups.current[i]
      if (!sphere || !group || !isTargetInOpening(group.position, ballRadius)) continue
      visibleCount++
      if (rayHitsSphere(raycaster.ray, group.position, ballRadius)) {
        hits[i] = 1
        hitCount++
      }
    }

    if (statsRef && visibleCount > 0) {
      statsRef.current.activeFrames++
      if (hitCount > 0) statsRef.current.hitFrames++
    }

    for (let i = 0; i < numBalls; i++) {
      const fill = hpFills.current[i]
      if (!fill) continue

      if (!hits[i]) continue

      if (firstContact.current[i] === -1) {
        firstContact.current[i] = elapsed.current
      }

      const prevHp = hp.current[i]
      const drainAmt = frameDelta / (DRAIN_TIME * drainMult)
      hp.current[i] = Math.max(0, prevHp - drainAmt)
      const h = hp.current[i]
      const actualDrain = prevHp - h
      if (statsRef) statsRef.current.totalDamage += actualDrain

      if (h <= 0) {
        playBeep(1)

        if (statsRef && firstContact.current[i] >= 0) {
          const ttk = elapsed.current - firstContact.current[i]
          if (ttk > 0) statsRef.current.ttks.push(ttk)
        }

        onDestroy()
        resetBall(i)
        continue
      }

      fill.scale.x = Math.max(0.001, h)
      fill.position.x = barW * (h - 1) / 2
      fill.material.color.copy(hpColor(h))
    }
  })

  return (
    <>
      <PlayerController sensitivityMultiplier={sensitivity} dpi={dpi} />
      <RangeStaticBatch />
      <color attach="background" args={[room.background]} />
      <fog attach="fog" args={[room.fog, room.fogNear, room.fogFar]} />
      <ambientLight intensity={room.ambient} />
      <hemisphereLight args={[room.hemiSky, room.hemiGround, room.hemiIntensity]} />
      <directionalLight
        castShadow
        position={[-2.5, 5.4, 1]}
        intensity={room.keyIntensity}
        color={room.keyLight}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={0.5}
        shadow-camera-far={28}
        shadow-bias={-0.0001}
        shadow-normalBias={0.025}
      />
      <spotLight position={[0, 4.2, -3.2]} angle={0.58} penumbra={0.8} intensity={room.fillIntensity} color={room.fillLight} distance={15} />
      <pointLight position={[-4.8, 2.7, -9]} intensity={room.rimIntensity} color={room.rimLight} distance={10} />
      <pointLight position={[4.8, 2.7, -9]} intensity={room.fillIntensity * 0.45} color={room.fillLight} distance={10} />

      <RangeSurfaces>
        <RangeInterior />
        <RangeFront opening={TARGET_WINDOW} backZ={BACK_Z} floorY={FLOOR_Y} ceilingY={CEIL_Y} wallX={WALL_X} />
      </RangeSurfaces>
      <mesh receiveShadow position={[-WALL_X, sideWallCenterY, BACK_Z / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[Math.abs(BACK_Z), sideWallHeight]} />
        {theme === 'light'
          ? <meshBasicMaterial color={room.sideWall} />
          : <meshStandardMaterial color={room.sideWall} roughness={0.9} metalness={0.03} />}
      </mesh>
      <mesh receiveShadow position={[WALL_X, sideWallCenterY, BACK_Z / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[Math.abs(BACK_Z), sideWallHeight]} />
        {theme === 'light'
          ? <meshBasicMaterial color={room.sideWall} />
          : <meshStandardMaterial color={room.sideWall} roughness={0.9} metalness={0.03} />}
      </mesh>
      <mesh position={[0, FLOOR_Y, BACK_Z / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WALL_X * 2 + SEAM_OVERLAP * 2, Math.abs(BACK_Z)]} />
        {theme === 'light'
          ? <meshBasicMaterial color={room.floor} />
          : <meshStandardMaterial color={room.floor} roughness={0.88} metalness={0.02} />}
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={`floor-seam-cover-${side}`}
          position={[side * (WALL_X - SEAM_OVERLAP / 2), FLOOR_Y + 0.015, BACK_Z / 2]}
        >
          <boxGeometry args={[SEAM_OVERLAP + 0.22, 0.03, Math.abs(BACK_Z)]} />
          <meshStandardMaterial color={room.floor} roughness={0.94} metalness={0.04} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh
          key={`wall-cove-cover-${side}`}
          position={[side * (WALL_X - 0.018), FLOOR_Y + SEAM_COVE_HEIGHT / 2, BACK_Z / 2]}
        >
          <boxGeometry args={[0.036, SEAM_COVE_HEIGHT, Math.abs(BACK_Z)]} />
          <meshStandardMaterial color={room.floor} roughness={0.94} metalness={0.04} />
        </mesh>
      ))}
      <mesh position={[0, CEIL_Y, BACK_Z / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WALL_X * 2, Math.abs(BACK_Z)]} />
        <meshStandardMaterial color={room.ceiling} roughness={0.92} metalness={0.02} />
      </mesh>

      {Array.from({ length: numBalls }, (_, i) => {
        const initialPosition = initialPositions.current[i]

        return (
          <group key={i} ref={(el) => { groups.current[i] = el }} position={initialPosition}>
            <mesh name="tracking-target" ref={(el) => { spheres.current[i] = el }}>
              <sphereGeometry args={[ballRadius, 24, 24]} />
              <meshStandardMaterial color={ballColor} emissive={ballColor} emissiveIntensity={0.6} roughness={0.42} metalness={0.24} />
            </mesh>

            <group
              ref={(el) => { barGroups.current[i] = el }}
              position={[0, barY, ballRadius + 0.035]}
              visible={trainingMode === 'skeet' && isTargetInOpening(initialPosition, ballRadius)}
            >
              <mesh position={[0, 0, 0.006]} renderOrder={21}>
                <planeGeometry args={[barW, barH]} />
                <meshBasicMaterial color="#111914" toneMapped={false} fog={false} depthWrite={false} />
              </mesh>
              <mesh ref={(el) => { hpFills.current[i] = el }} position={[0, 0, 0.012]} renderOrder={22}>
                <planeGeometry args={[barW, barH]} />
                <meshBasicMaterial color="#a6f47b" toneMapped={false} fog={false} depthWrite={false} />
              </mesh>
            </group>
          </group>
        )
      })}
    </>
  )
}

const MemoScene = memo(Scene)

function SkeetTrackingCanvas({
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
  trainingMode = 'skeet',
  onTrackingScore,
}) {
  const room = ROOM_THEME[theme === 'dark' ? 'dark' : 'light']
  const shootSignalRef = useRef(0)
  const handleShoot = useCallback(() => { shootSignalRef.current++ }, [])
  const gridshotActive = trainingMode === 'gridshot'
  const aimRef = useRef(createAimState())

  return (
    <Canvas
      shadows="soft"
      frameloop={active || viewModelActive ? 'always' : 'demand'}
      dpr={RENDER_DPR}
      gl={RENDER_OPTIONS}
      camera={CAMERA_CONFIG}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08
        onCanvasReady?.()
      }}
    >
      <color attach="background" args={[room.background]} />
      <PerspectiveCamera makeDefault {...CAMERA_CONFIG} />
      <AimController active={active && viewModelActive} aimRef={aimRef} />
      <MemoScene
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
        trainingMode={trainingMode}
        onShoot={handleShoot}
        onTrackingScore={onTrackingScore}
      />
      <Suspense fallback={null}>
        <GunViewModel
          active={viewModelActive}
          animationEnabled={gridshotActive}
          shootSignalRef={shootSignalRef}
          aimRef={aimRef}
          onReady={onViewModelReady}
        />
      </Suspense>
    </Canvas>
  )
}

export default memo(SkeetTrackingCanvas)
