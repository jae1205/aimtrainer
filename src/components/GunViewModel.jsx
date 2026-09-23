/* @refresh reset */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { DEFAULT_WEAPON, getEquippedWeapon, getWeaponSkin } from '../data/weaponSkins'
import { createCylinderMechanism, resetCylinder, triggerCylinder, updateCylinder } from '../utils/revolverMechanics'
import { applyAimPose, createAimPose } from '../utils/aim'

const MODEL_PATH = DEFAULT_WEAPON.model
const MESH_SCALE = 0.29
const MESH_ROT = new THREE.Euler(0.1, Math.PI * 2.5, 0)
const LOCAL_TILT = new THREE.Euler(-0.04, 0.06, -0.02, 'YXZ')

const _offset = new THREE.Vector3()
const _localEuler = new THREE.Euler(0, 0, 0, 'YXZ')
const _localQuat = new THREE.Quaternion()

export default function GunViewModel({ active = true, animationEnabled = false, shootSignalRef, onReady, aimRef, weaponId }) {
  const groupRef = useRef(null)
  const shotTimeRef = useRef(null)
  const settleRef = useRef(0)
  const lastShootSignalRef = useRef(shootSignalRef?.current ?? 0)

  const [equippedWeapon] = useState(getEquippedWeapon)
  const weapon = weaponId ? getWeaponSkin(weaponId) : equippedWeapon
  const { scene, animations } = useGLTF(weapon.model)
  const { actions } = useAnimations(animations, groupRef)
  const aimPose = useMemo(() => createAimPose(scene, animations), [scene, animations])
  const cylinder = useMemo(() => weapon.id === 'revolver'
    ? createCylinderMechanism(scene, animations) : null, [weapon.id, scene, animations])

  // Apply scale/rotation directly to scene on first load
  useEffect(() => {
    if (!scene) return
    scene.scale.setScalar(MESH_SCALE * (weapon.viewScale ?? 1))
    scene.rotation.copy(MESH_ROT)
    scene.traverse((obj) => {
      if (obj.isMesh) obj.frustumCulled = false
    })
    onReady?.()
  }, [scene, weapon.viewScale, onReady])

  // Gridshot uses the animated rig. Other modes keep the weapon in its authored grip pose.
  useEffect(() => {
    if (!actions) return
    const grip = actions['Armature|Grip']
    const idle = actions['Armature|Idle']
    const shoot = actions['Armature|Shoot']

    Object.values(actions).forEach((action) => action?.stop())
    shotTimeRef.current = null
    settleRef.current = 0
    lastShootSignalRef.current = shootSignalRef?.current ?? 0
    resetCylinder(cylinder)

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
  }, [actions, animationEnabled, cylinder, shootSignalRef])

  // Run before drei's mixer update so both poses have complementary weights
  // on every frame, including the exact frame the shot ends.
  useFrame((_, delta) => {
    const nextShootSignal = shootSignalRef?.current ?? 0
    if (animationEnabled && nextShootSignal !== lastShootSignalRef.current) {
      lastShootSignalRef.current = nextShootSignal
      const shoot = actions?.['Armature|Shoot']
      const idle = actions?.['Armature|Idle']
      if (shoot) {
        // A frame-local signal avoids reconciling the whole Canvas per click.
        // Idle remains underneath the recoil so no bind pose flashes through.
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
        triggerCylinder(cylinder)
      }
    }
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

  useFrame(({ camera }, delta) => {
    if (!groupRef.current) return

    // Registered after useAnimations' mixer callback, so the retained
    // mechanical phase wins over idle blending without taking over rendering.
    if (animationEnabled) updateCylinder(cylinder, delta)
    // Independent Blender-authored parent bone: firing/idle cannot overwrite ADS.
    applyAimPose(aimPose, aimRef?.current.progress ?? 0)

    _offset
      .fromArray(weapon.offset)
    _offset.y -= settleRef.current * 0.024
    _offset.y -= (weapon.aimDrop ?? 0) * (aimRef?.current.progress ?? 0)
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
