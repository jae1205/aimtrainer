/* @refresh reset */
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_PATH = '/Fps%20Rig.glb'
const VIEW_OFFSET = new THREE.Vector3(0, -0.94, -0.9)
const MESH_SCALE = 0.29
const MESH_ROT = new THREE.Euler(0.1, Math.PI * 2.5, 0)
const LOCAL_TILT = new THREE.Euler(-0.04, 0.06, -0.02, 'YXZ')

const _offset = new THREE.Vector3()
const _localEuler = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQuat = new THREE.Quaternion()

export default function GunViewModel({ active = true, shootTrigger = 0 }) {
  const groupRef = useRef(null)
  const finishListenerRef = useRef(null)

  const { scene, animations } = useGLTF(MODEL_PATH)
  const { actions, mixer } = useAnimations(animations, groupRef)

  // Apply scale/rotation directly to scene on first load
  useEffect(() => {
    if (!scene) return
    scene.scale.setScalar(MESH_SCALE)
    scene.rotation.copy(MESH_ROT)
    scene.traverse((obj) => {
      if (obj.isMesh) obj.frustumCulled = false
    })
  }, [scene])

  // Play Idle animation on mount
  useEffect(() => {
    if (!actions) return
    const idle = actions['Armature|Idle']
    if (idle) {
      idle.reset()
      idle.setLoop(THREE.LoopRepeat, Infinity)
      idle.fadeIn(0.2)
      idle.play()
    }
  }, [actions])

  // Shoot animation on trigger — always restart immediately on each click
  useEffect(() => {
    if (shootTrigger === 0) return
    if (!actions || !mixer) return
    const shoot = actions['Armature|Shoot']
    const idle = actions['Armature|Idle']
    if (!shoot) return

    // Remove any previous finish listener to avoid duplicates
    if (finishListenerRef.current) {
      mixer.removeEventListener('finished', finishListenerRef.current)
      finishListenerRef.current = null
    }

    // Immediately restart shoot animation (handles rapid clicks)
    shoot.stop()
    shoot.reset()
    shoot.setLoop(THREE.LoopOnce, 1)
    shoot.clampWhenFinished = true
    shoot.timeScale = 1
    shoot.play()

    const onFinish = (e) => {
      if (e.action !== shoot) return
      mixer.removeEventListener('finished', finishListenerRef.current)
      finishListenerRef.current = null
      if (idle) {
        idle.reset()
        idle.setLoop(THREE.LoopRepeat, Infinity)
        idle.fadeIn(0.15)
        idle.play()
      }
    }
    finishListenerRef.current = onFinish
    mixer.addEventListener('finished', onFinish)
  }, [shootTrigger, actions, mixer])

  useFrame(({ camera }) => {
    if (!groupRef.current) return

    _offset
      .copy(VIEW_OFFSET)
      .applyQuaternion(camera.quaternion)
      .add(camera.position)
    groupRef.current.position.copy(_offset)

    _localEuler.copy(LOCAL_TILT)
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
