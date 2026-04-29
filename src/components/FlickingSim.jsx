import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { playHit, playMiss } from '../utils/sounds'
import { useLanguage } from '../contexts/LanguageContext'
import { Canvas, useThree } from '@react-three/fiber'
import Crosshair from './Crosshair'
import GunViewModel from './GunViewModel'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

const CAMERA_CONFIG = { position: [0, 0, 0], fov: 75, near: 0.01, far: 1000 }
const PITCH_LIMIT = Math.PI / 2.2

function Target({ position }) {
  return (
    <mesh position={position} userData={{ isTarget: true }}>
      <sphereGeometry args={[0.4, 64, 64]} />
      <meshStandardMaterial
        color="#ff4655"
        roughness={0.85}
        metalness={0.0}
      />
    </mesh>
  )
}

function PlayerController({ sensitivityMultiplier = 1 }) {
  const { camera } = useThree()
  const rotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))

  const handleMouseMove = useCallback(
    (e) => {
      if (!document.pointerLockElement) return
      const { movementX, movementY } = e
      const baseSensitivity = 0.07 * Math.PI / 180
      const finalSensitivity = baseSensitivity * sensitivityMultiplier
      rotation.current.y -= movementX * finalSensitivity
      rotation.current.x -= movementY * finalSensitivity
      rotation.current.x = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, rotation.current.x))
      camera.rotation.copy(rotation.current)
    },
    [camera, sensitivityMultiplier]
  )

  useEffect(() => {
    camera.rotation.order = 'YXZ'
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [camera, handleMouseMove])

  return null
}

function Scene({ onScore, onMiss, sensitivity, active, theme = 'dark' }) {
  const [targetPos, setTargetPos] = useState([0, 0, -5])
  const spawnTimeRef = useRef(null)
  const startRotRef = useRef(new THREE.Euler())
  const sideRef = useRef(1) // 1 = 오른쪽, -1 = 왼쪽 교대 스폰
  const { camera, raycaster, scene } = useThree()

  const spawnTarget = useCallback(() => {
    // 좌우 교대 (코너 피킹 시뮬레이션)
    const side = sideRef.current
    sideRef.current *= -1

    // X: 코너 각도 범위 (중앙에서 벗어난 위치)
    const minX = 0.7
    const maxX = 2.2
    const x = side * (minX + Math.random() * (maxX - minX))

    // Y: 머리 높이 고정 (수직 랜덤성 최소화)
    const headY = 0.15 + (Math.random() - 0.5) * 0.3

    const newPos = [x, headY, -5]
    setTargetPos(newPos)
    spawnTimeRef.current = performance.now()
    startRotRef.current.copy(camera.rotation)
  }, [camera])

  const handleShot = useCallback(() => {
    if (!active) return
    raycaster.setFromCamera({ x: 0, y: 0 }, camera)
    const intersects = raycaster.intersectObjects(scene.children, true)
    const targetHit = intersects.find(
      (hit) => hit.object.userData.isTarget
    )

    // Calculate Aim Analysis
    const targetV = new THREE.Vector3(...targetPos)
    // Calculate target Yaw/Pitch relative to default forward (0,0,-1)
    // Yaw: Rotation around Y axis. atan2(x, -z) because -z is forward.
    const targetYaw = Math.atan2(targetV.x, -targetV.z)
    // Pitch: Rotation around X axis. Positive is DOWN in Three.js usually? 
    // Wait, in PlayerController: rotation.x -= movementY. 
    // Usually Up is +Y. Looking up is positive rotation around X? No, Looking up is usually positive pitch?
    // Let's check PlayerController: rotation.x -= movementY. 
    // If I move mouse UP (negative movementY usually? or positive?), let's assume standard:
    // Moving mouse UP -> negative deltaY -> rotation.x increases? 
    // Actually, let's just use the values as is.
    // Target Pitch: atan2(y, z_dist). 
    const targetDistZ = Math.sqrt(targetV.x * targetV.x + targetV.z * targetV.z)
    const targetPitch = Math.atan2(targetV.y, -targetV.z) // Simplification for small angles? 
    // Correct Pitch: atan2(y, sqrt(x^2+z^2)). But wait, Z is negative.
    // Let's use simple Vector angle to planes.
    
    // Better: Project target to angles
    const vec = targetV.clone().normalize()
    const spherical = new THREE.Spherical().setFromVector3(vec)
    // Spherical: phi is from +Y (0 is up, PI is down). theta is from +Z.
    // Our camera: -Z is forward. 
    // Let's stick to simple atan2 for the "screen-like" coordinates
    const tYaw = Math.atan2(targetV.x, -targetV.z)
    const tPitch = Math.atan2(targetV.y, -targetV.z) // Approx for narrow FOV? No.
    // Real pitch: atan2(y, depth). 
    
    // Let's use the camera rotation values directly.
    const currentYaw = camera.rotation.y
    const currentPitch = camera.rotation.x
    
    const startYaw = startRotRef.current.y
    const startPitch = startRotRef.current.x
    
    // Analyze Yaw (Horizontal is most important for sens)
    const flickDirYaw = tYaw - startYaw
    const shotDirYaw = currentYaw - startYaw
    
    let outcome = 'hit'
    let errorType = 'none'
    let errorMag = 0
    
    // Only analyze if there was a significant flick intent (> 0.1 rad)
    if (Math.abs(flickDirYaw) > 0.05) {
        const ratio = shotDirYaw / flickDirYaw
        if (ratio > 1.05) {
            errorType = 'overshoot'
            errorMag = Math.abs(shotDirYaw - flickDirYaw)
        } else if (ratio < 0.95) {
            errorType = 'undershoot'
            errorMag = Math.abs(flickDirYaw - shotDirYaw)
        }
    }

    const now = performance.now()
    const dt = spawnTimeRef.current ? (now - spawnTimeRef.current) : 0
    
    const shotData = {
        isHit: !!targetHit,
        time: dt,
        errorType,
        errorMag,
        flickSize: Math.abs(flickDirYaw)
    }
    
    if (targetHit) {
      onScore(shotData)
      spawnTarget()
    } else {
      onMiss(shotData)
    }
  }, [active, camera, raycaster, scene, onScore, onMiss, spawnTarget, targetPos])

  useEffect(() => {
    window.addEventListener('mousedown', handleShot)
    return () => window.removeEventListener('mousedown', handleShot)
  }, [handleShot])

  useEffect(() => {
    if (!active) return
    spawnTarget()
  }, [active, spawnTarget])

  return (
    <>
      <PlayerController sensitivityMultiplier={sensitivity} />
      <color attach="background" args={[theme === 'dark' ? '#0F1923' : '#f5f0ea']} />
      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#e8f4ff', '#c8ccd0', 1.0]} />
      <directionalLight position={[5, 10, 5]} intensity={1.6} />
      <Target position={targetPos} />
    </>
  )
}

export default function FlickingSim({ onComplete, sensitivity, theme = 'dark', onStatsChange }) {
  const [score, setScore] = useState(0)
  const [misses, setMisses] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [started, setStarted] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isPointerLocked, setIsPointerLocked] = useState(false)
  const [shootTrigger, setShootTrigger] = useState(0)
  const [completed, setCompleted] = useState(false)
  const containerRef = useRef(null)
  const resultRef = useRef(null)

  const statsRef = useRef([])

  const { t } = useLanguage()
  const bg = theme === 'dark' ? 'bg-[#0F1923]' : 'bg-[#f5f0ea]'

  useEffect(() => {
    onStatsChange?.({ score, timeLeft })
  }, [score, timeLeft, onStatsChange])

  useEffect(() => {
    const handleLockChange = () => {
      setIsPointerLocked(!!document.pointerLockElement)
    }
    document.addEventListener('pointerlockchange', handleLockChange)
    return () => document.removeEventListener('pointerlockchange', handleLockChange)
  }, [])

  const requestLock = () => {
    if (containerRef.current && !isPointerLocked) {
      const element = containerRef.current
      const promise = element.requestPointerLock({
        unadjustedMovement: true,
      })
      if (promise && promise.catch) {
        promise.catch(() => element.requestPointerLock())
      }
    }
  }

  useEffect(() => {
    if (!started || countdown !== 0) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [started, countdown])

  useEffect(() => {
    if (!started || countdown !== 0) return
    if (timeLeft > 0) return
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
    
    // Analyze stats
    const totalShots = statsRef.current.length
    const overshoots = statsRef.current.filter(s => s.errorType === 'overshoot').length
    const undershoots = statsRef.current.filter(s => s.errorType === 'undershoot').length
    const hits = statsRef.current.filter(s => s.isHit).length
    
    let recommendation = 'good'
    let detail = 'good'

    if (totalShots > 5) {
        if (overshoots > undershoots * 1.5) {
            recommendation = 'lower'
            detail = 'lower'
        } else if (undershoots > overshoots * 1.5) {
            recommendation = 'higher'
            detail = 'higher'
        }
    }

    window.dispatchEvent(new CustomEvent('test-end'))
    const accuracy = Math.round((score / (score + misses)) * 100) || 0
    resultRef.current = {
      accuracy,
      score,
      misses,
      timeSpent: 30,
      recommendation,
      detail,
      stats: statsRef.current
    }
    setCompleted(true)
  }, [started, countdown, timeLeft, score, misses, onComplete])

  useEffect(() => {
    if (!started) return
    if (countdown <= 0) return
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [started, countdown])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative ${bg} ${isPointerLocked ? 'cursor-none' : 'cursor-default'}`}
      onClick={requestLock}
    >
      {/* 완료 오버레이 */}
      {completed && resultRef.current && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className={`text-center p-8 rounded-3xl border shadow-2xl max-w-sm w-full mx-4 ${
            theme === 'light'
              ? 'bg-white/95 border-[#DDD8D2] text-[#1A1F2E]'
              : 'bg-[#1B2E3D] border-[#2A3D4F] text-[#ECE8E1]'
          }`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#ff4655] mb-2">{t.t2CompleteBadge}</p>
            <h2 className="text-3xl font-black mb-6">
              {resultRef.current.score} <span className={`text-base font-normal ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>{t.t2Hits}</span>
            </h2>
            <div className={`flex justify-center gap-8 mb-8 text-sm ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              <div>
                <p className="text-xs uppercase tracking-wider mb-1">{t.t2Accuracy}</p>
                <p className="text-xl font-black text-[#ff4655]">{resultRef.current.accuracy}%</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider mb-1">{t.t2Miss}</p>
                <p className="text-xl font-black">{resultRef.current.misses}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onComplete(resultRef.current)}
              className="px-10 py-4 rounded-2xl bg-[#ff4655] text-white font-bold hover:bg-[#ff4655]/90 transition-all hover:scale-105 shadow-lg shadow-red-500/20"
            >
              {t.t2Next}
            </button>
          </div>
        </div>
      )}

      {!started && !completed && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className={`text-center p-8 rounded-3xl border shadow-2xl max-w-md ${
              theme === 'light'
                ? 'bg-white/95 border-[#DDD8D2] text-[#1A1F2E]'
                : 'bg-[#1B2E3D] border-[#2A3D4F] text-[#ECE8E1]'
            }`}
          >
            <h2 className="text-3xl font-black mb-4">
              {t.flickTitle}
            </h2>
            <p
              className={`mb-6 leading-relaxed ${
                theme === 'light' ? 'text-[#1A1F2E]/70' : 'text-[#ECE8E1]/70'
              }`}
            >
              {t.flickDesc}
            </p>
            <p
              className={`mb-6 text-xs ${
                theme === 'light' ? 'text-[#7A7E85]' : 'text-[#768079]'
              }`}
            >
              {t.flickInst}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setScore(0); setMisses(0); setTimeLeft(30)
                setStarted(true); setCountdown(3)
                statsRef.current = []
                window.dispatchEvent(new CustomEvent('test-start'))
                requestLock()
              }}
              className="px-10 py-4 rounded-2xl bg-[#ff4655] text-white font-bold hover:bg-[#ff4655]/90 transition-all hover:scale-105 shadow-lg shadow-red-500/20"
            >
              {t.testStart}
            </button>
          </div>
        </div>
      )}

      {started && !isPointerLocked && (
        <div className="absolute inset-0 z-[25] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="text-center animate-bounce">
            <p className="text-white text-xl font-bold bg-[#ff4655] px-6 py-3 rounded-2xl shadow-2xl">
              {t.clickToLock}
            </p>
          </div>
        </div>
      )}

      <Crosshair visible={started && countdown === 0 && isPointerLocked} />

      {started && countdown > 0 && (
        <div className="absolute inset-0 z-[26] flex items-center justify-center bg-black/60">
          <div className="text-white text-6xl md:text-7xl font-black drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            {countdown}
          </div>
        </div>
      )}

      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        camera={CAMERA_CONFIG}
      >
        <color attach="background" args={[theme === 'dark' ? '#0F1923' : '#f5f0ea']} />
        <Suspense fallback={null}>
          <GunViewModel active={started && isPointerLocked && countdown === 0} shootTrigger={shootTrigger} />
        </Suspense>
        {started && (
          <>
            <PerspectiveCamera makeDefault {...CAMERA_CONFIG} />
            <Scene
              onScore={(data) => {
                playHit()
                setScore((s) => s + 1)
                setShootTrigger((t) => t + 1)
                statsRef.current.push(data)
              }}
              onMiss={(data) => {
                playMiss()
                setMisses((m) => m + 1)
                setShootTrigger((t) => t + 1)
                statsRef.current.push(data)
              }}
              sensitivity={sensitivity}
              active={countdown === 0 && !completed}
              theme={theme}
            />
          </>
        )}
      </Canvas>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-white/50 text-sm text-center bg-black/40 px-6 py-2 rounded-xl backdrop-blur-md border border-white/10">
        {started
          ? countdown > 0
            ? t.flickCountdown
            : isPointerLocked
            ? t.lockedHint
            : t.unlockedHint
          : t.pressStartHint}
      </div>
    </div>
  )
}
