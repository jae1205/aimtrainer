import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { playConfirm, playComplete } from '../utils/sounds'
import { useLanguage } from '../contexts/LanguageContext'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import Crosshair from './Crosshair'
import GunViewModel from './GunViewModel'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

const CAMERA_CONFIG = { position: [0, 0, 0], fov: 75, near: 0.01, far: 1000 }
const PITCH_LIMIT = Math.PI / 2.2
const DEV_CAMERA_DEFAULT = { x: -2.07, y: 2.32, z: 2.15, fov: 70 }

function CuteMarker({ pos }) {
  return (
    <mesh position={pos} userData={{ isMarker: true }}>
      <sphereGeometry args={[0.3, 64, 64]} />
      <meshStandardMaterial
        color="#4ade80"
        roughness={0.85}
        metalness={0.0}
      />
    </mesh>
  )
}

function RotationGuide() {
  const ringRef = useRef()

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.material.opacity = 0.15 + (Math.sin(state.clock.elapsedTime * 3) + 1) / 2 * 0.55
    }
  })

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[5, 0.03, 8, 100]} />
      <meshBasicMaterial color="#ff4655" transparent opacity={0.3} depthWrite={false} />
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

function Scene({ sensitivity, markers = [], onCameraReady, onSphereClick, showGuide = false, theme = 'dark' }) {
  const { camera, raycaster, scene } = useThree()

  useEffect(() => {
    if (onCameraReady) onCameraReady(camera)
  }, [camera, onCameraReady])

  const handleMouseDown = useCallback(() => {
      if (markers.length === 0) return 
      
      raycaster.setFromCamera({ x: 0, y: 0 }, camera)
      const intersects = raycaster.intersectObjects(scene.children, true)
      
      const sphereHit = intersects.find(
        (hit) => hit.object.userData.isMarker
      )
      
      if (sphereHit) {
          onSphereClick()
      }
  }, [camera, raycaster, scene, markers, onSphereClick])

  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown)
    return () => window.removeEventListener('mousedown', handleMouseDown)
  }, [handleMouseDown])

  return (
    <>
      <PlayerController sensitivityMultiplier={sensitivity} />
      <color attach="background" args={[theme === 'dark' ? '#0F1923' : '#f5f0ea']} />
      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#e8f4ff', '#c8dcc8', 1.0]} />
      <directionalLight position={[5, 10, 5]} intensity={1.6} />
      {showGuide && <RotationGuide />}
      {markers.map((pos, index) => (
        <CuteMarker key={index} pos={pos} index={index} />
      ))}
    </>
  )
}

export default function RotationSim({
  onComplete,
  sensitivity,
  theme = 'dark',
  onMovementChange,
  devInstantPreview = false,
}) {
  const [movement, setMovement] = useState(0)
  const [started, setStarted] = useState(devInstantPreview)
  const [isPointerLocked, setIsPointerLocked] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [markers, setMarkers] = useState([])
  const [hasFirstClick, setHasFirstClick] = useState(false)
  const [cameraDebug, setCameraDebug] = useState(DEV_CAMERA_DEFAULT)
  const [shootTrigger, setShootTrigger] = useState(0)
  const containerRef = useRef(null)
  const cameraRef = useRef(null)
  const startYawRef = useRef(0)

  const { t } = useLanguage()
  const bg = theme === 'dark' ? 'bg-[#0F1923]' : 'bg-[#f5f0ea]'
  const modelActive = devInstantPreview ? true : started && isPointerLocked

  useEffect(() => {
    onMovementChange?.(movement)
  }, [movement, onMovementChange])

  useEffect(() => {
    const camera = cameraRef.current
    if (!camera || !devInstantPreview) return
    camera.position.set(cameraDebug.x, cameraDebug.y, cameraDebug.z)
    camera.fov = cameraDebug.fov
    camera.updateProjectionMatrix()
  }, [cameraDebug, devInstantPreview])

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
  
  // Removed pathLength logic as we use raw pixel movement now

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!document.pointerLockElement) return
      if (!started || clickCount !== 1) return // Only record movement after first click
      
      const { movementX } = e
      // Accumulate raw horizontal movement (pixels)
      setMovement((prev) => prev + Math.abs(movementX))
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [started, clickCount])

  const handleContainerClick = () => {
    if (!started) return
    if (!isPointerLocked) {
      requestLock()
      return
    }

    setShootTrigger((t) => t + 1)

    // Logic:
    // Click 1: Spawn green sphere at center of view. Start recording.
    // Click 2 (on sphere): Handled by Scene component. Stop recording. Complete test.

    if (clickCount === 0) {
        const camera = cameraRef.current
        if (camera) {
            startYawRef.current = camera.rotation.y
            const dir = new THREE.Vector3()
            camera.getWorldDirection(dir)
            const distance = 5
            const worldPos = camera.position.clone().add(dir.multiplyScalar(distance))
            setMarkers([worldPos.toArray()])
            setClickCount(1)
            setMovement(0)
            playConfirm()
        }
    }
  }

  const handleSphereClick = () => {
      if (clickCount === 1) {
        playComplete()
        if (document.pointerLockElement) {
            document.exitPointerLock()
        }
        window.dispatchEvent(new CustomEvent('test-end'))
        setStarted(false)
        const camera = cameraRef.current
        let deviationDeg = 0
        if (camera) {
            const totalRotation = camera.rotation.y - startYawRef.current
            const deviationRad = Math.abs(Math.abs(totalRotation) - 2 * Math.PI)
            deviationDeg = parseFloat((deviationRad * 180 / Math.PI).toFixed(1))
        }
        onComplete({ avgMovement: movement, deviationDeg })
      }
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative ${bg} ${isPointerLocked ? 'cursor-none' : 'cursor-default'}`}
      onClick={handleContainerClick}
    >
      {!started && !devInstantPreview && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className={`text-center p-8 rounded-3xl border shadow-2xl max-w-md ${
              theme === 'light'
                ? 'bg-white/95 border-[#DDD8D2] text-[#1A1F2E]'
                : 'bg-[#1B2E3D] border-[#2A3D4F] text-[#ECE8E1]'
            }`}
          >
            <h2 className="text-3xl font-black mb-4">
              {t.rotTitle}
            </h2>
            <p
              className={`mb-6 leading-relaxed ${
                theme === 'light' ? 'text-[#1A1F2E]/70' : 'text-[#ECE8E1]/70'
              }`}
            >
              {t.rotDesc}
            </p>
            <p
              className={`mb-6 text-xs ${
                theme === 'light' ? 'text-[#7A7E85]' : 'text-[#768079]'
              }`}
            >
              {t.rotInst}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setMovement(0)
                setClickCount(0)
                setMarkers([])
                setHasFirstClick(false)
                setStarted(true)
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

      {started && !isPointerLocked && !devInstantPreview && (
        <div className="absolute inset-0 z-[25] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="text-center animate-bounce">
            <p className="text-white text-xl font-bold bg-[#ff4655] px-6 py-3 rounded-2xl shadow-2xl">
              {t.clickToLock}
            </p>
          </div>
        </div>
      )}

      <Crosshair visible={devInstantPreview ? true : started && isPointerLocked} />

      {started && clickCount === 0 && !devInstantPreview && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-black/50 text-white/90 text-sm rounded-xl backdrop-blur border border-white/20">
              {t.rotHint1}
          </div>
      )}
      {started && clickCount === 1 && !devInstantPreview && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-[#ff4655]/80 text-white font-bold text-sm rounded-xl backdrop-blur shadow-lg animate-pulse text-center">
          {t.rotHint2}
          <span className="block text-xs font-normal opacity-80 mt-0.5">{t.rotEsc}</span>
        </div>
      )}

      {devInstantPreview && (
        <div className="absolute right-4 top-4 z-[45] w-72 rounded-2xl border border-white/20 bg-black/60 p-3 text-white/90 backdrop-blur">
          <p className="mb-2 text-sm font-bold text-[#ff4655]">Camera Debug</p>
          {[
            { key: 'x', min: -5, max: 5, step: 0.01 },
            { key: 'y', min: -5, max: 5, step: 0.01 },
            { key: 'z', min: -5, max: 5, step: 0.01 },
            { key: 'fov', min: 30, max: 120, step: 1 },
          ].map((cfg) => (
            <label key={cfg.key} className="mb-2 block text-xs">
              {cfg.key.toUpperCase()} : {cameraDebug[cfg.key].toFixed(cfg.key === 'fov' ? 0 : 2)}
              <input
                type="range"
                min={cfg.min}
                max={cfg.max}
                step={cfg.step}
                value={cameraDebug[cfg.key]}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  setCameraDebug((prev) => ({ ...prev, [cfg.key]: n }))
                }}
                className="mt-1 w-full"
              />
            </label>
          ))}
        </div>
      )}

      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        camera={CAMERA_CONFIG}
      >
        <color attach="background" args={[theme === 'dark' ? '#0F1923' : '#f5f0ea']} />
        <Suspense fallback={null}>
          <GunViewModel active={modelActive} shootTrigger={shootTrigger} />
        </Suspense>
        {started && (
          <>
            <PerspectiveCamera makeDefault {...CAMERA_CONFIG} />
            <Scene
              sensitivity={sensitivity}
              markers={markers}
              showGuide={clickCount === 1}
              onCameraReady={(camera) => {
                cameraRef.current = camera
                if (devInstantPreview) {
                  camera.position.set(cameraDebug.x, cameraDebug.y, cameraDebug.z)
                  camera.fov = cameraDebug.fov
                  camera.updateProjectionMatrix()
                }
              }}
              onSphereClick={handleSphereClick}
              theme={theme}
            />
          </>
        )}
      </Canvas>
    </div>
  )
}
