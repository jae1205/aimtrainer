/* @refresh reset */
import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_PATH = '/models/pistol-rig.glb?v=1'
const VIEW_OFFSET = new THREE.Vector3(0, -0.94, -0.9)
const BANANA_VIEW_OFFSET = new THREE.Vector3(0, -1.08, -1.0)
const MESH_SCALE = 0.29
const MESH_ROT = new THREE.Euler(0.1, Math.PI * 2.5, 0)
const LOCAL_TILT = new THREE.Euler(-0.04, 0.06, -0.02, 'YXZ')

const _offset = new THREE.Vector3()
const _localEuler = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQuat = new THREE.Quaternion()

export default function GunViewModel({ active = true, animationEnabled = false, shootTrigger = 0, onReady }) {
  const groupRef = useRef(null)
  const shotTimeRef = useRef(null)
  const settleRef = useRef(0)

  const [modelPath] = useState(() => localStorage.getItem('weaponSkin') === 'banana'
    ? '/models/banana-rig.glb?v=3' : MODEL_PATH)
  const { scene, animations } = useGLTF(modelPath)
  const viewOffset = modelPath.startsWith('/models/banana-rig.glb') ? BANANA_VIEW_OFFSET : VIEW_OFFSET
  const { actions } = useAnimations(animations, groupRef)

  // Apply scale/rotation directly to scene on first load
  useEffect(() => {
    if (!scene) return
    scene.scale.setScalar(MESH_SCALE)
    scene.rotation.copy(MESH_ROT)
    scene.traverse((obj) => {
      if (obj.isMesh) obj.frustumCulled = false
    })
    onReady?.()
  }, [scene, onReady])

  // Gridshot uses the animated rig. Other modes keep the weapon in its authored grip pose.
  useEffect(() => {
    if (!actions) return
    const grip = actions['Armature|Grip']
    const idle = actions['Armature|Idle']
    const shoot = actions['Armature|Shoot']

    Object.values(actions).forEach((action) => action?.stop())
    shotTimeRef.current = null
    settleRef.current = 0

    if (!animationEnabled) {
      if (grip) {
        grip.reset()
        grip.setLoop(THREE.LoopOnce, 1)
        grip.clampWhenFinished = true
        grip.play()
      }
      return
    }

    if (idle) {
      idle.reset()
      idle.enabled = true
      idle.setEffectiveWeight(1)
      idle.setEffectiveTimeScale(1)
      idle.setLoop(THREE.LoopRepeat, Infinity)
      idle.play()
    }

    return () => {
      idle?.stop()
      shoot?.stop()
    }
  }, [actions, animationEnabled])

  // Shoot animation on trigger — always restart immediately on each click
  useEffect(() => {
    if (!animationEnabled || shootTrigger === 0) return
    if (!actions) return
    const shoot = actions['Armature|Shoot']
    const idle = actions['Armature|Idle']
    if (!shoot) return

    // Keep idle running underneath recoil. Never expose the skeleton's bind pose.
    idle?.stopFading().setEffectiveWeight(0)
    shoot.stopFading()
    shoot.reset()
    shoot.enabled = true
    shoot.setEffectiveWeight(1)
    shoot.setEffectiveTimeScale(1)
    shoot.setLoop(THREE.LoopOnce, 1)
    shoot.clampWhenFinished = true
    shoot.timeScale = 1
    shoot.play()
    shotTimeRef.current = 0
  }, [animationEnabled, shootTrigger, actions])

  // Run before drei's mixer update so both poses have complementary weights
  // on every frame, including the exact frame the shot ends.
  useFrame((_, delta) => {
    if (shotTimeRef.current === null) {
      settleRef.current = THREE.MathUtils.damp(settleRef.current, 0, 22, delta)
      return
    }
    const shoot = actions['Armature|Shoot']
    const idle = actions['Armature|Idle']
    if (!shoot || !idle) return
    const duration = shoot.getClip().duration
    // Let the last authored pose settle into idle rather than cutting off
    // its recovery at the clip boundary.
    const blendStart = Math.max(0, duration - 0.2)
    const recoveryEnd = duration + 0.18
    shotTimeRef.current += delta
    const t = THREE.MathUtils.clamp(
      (shotTimeRef.current - blendStart) / (recoveryEnd - blendStart), 0, 1,
    )
    const idleWeight = t * t * t * (t * (t * 6 - 15) + 10)
    // A small downward follow-through, then a soft return to the ready pose.
    // Damping preserves continuity if another shot interrupts recovery.
    const settleTarget = Math.sin(Math.PI * t) ** 2
    settleRef.current = THREE.MathUtils.damp(settleRef.current, settleTarget, 26, delta)
    idle.enabled = true
    idle.setEffectiveWeight(idleWeight)
    shoot.setEffectiveWeight(1 - idleWeight)
    if (t === 1) shotTimeRef.current = null
  }, -1)

  useFrame(({ camera }) => {
    if (!groupRef.current) return

    _offset
      .copy(viewOffset)
    _offset.y -= settleRef.current * 0.024
    _offset.z += settleRef.current * 0.012
    _offset
      .applyQuaternion(camera.quaternion)
      .add(camera.position)
    groupRef.current.position.copy(_offset)

    _localEuler.copy(LOCAL_TILT)
    _localEuler.x -= settleRef.current * 0.012
    _localQuat.setFromEuler(_localEuler)
    groupRef.current.quaternion.multiplyQuaternions(camera.quaternion, _localQuat)
    groupRef.current.visible = active
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
