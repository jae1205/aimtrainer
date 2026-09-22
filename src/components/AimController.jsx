import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { bindAimInput, getAimFov, HIP_FOV, stepAim } from '../utils/aim'

export default function AimController({ active, aimRef }) {
  const { camera, gl } = useThree()
  const activeRef = useRef(active)
  activeRef.current = active

  useEffect(() => bindAimInput({
    target: window, doc: document, canvas: gl.domElement,
    state: aimRef.current, isActive: () => activeRef.current,
  }), [gl, aimRef])

  useEffect(() => {
    if (!active) aimRef.current.active = false
  }, [active, aimRef])

  useEffect(() => () => {
    camera.fov = HIP_FOV
    camera.updateProjectionMatrix()
  }, [camera])

  useFrame((_, delta) => {
    if (!activeRef.current) aimRef.current.active = false
    const progress = stepAim(aimRef.current, delta)
    const fov = getAimFov(progress)
    if (Math.abs(camera.fov - fov) > .00001) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  }, -2)
  return null
}
