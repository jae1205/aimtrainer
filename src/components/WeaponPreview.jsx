/* eslint-disable react/no-unknown-property -- React Three Fiber scene elements */
import { Suspense, useLayoutEffect, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { createPreviewModel, getPreviewZoom } from '../utils/weaponPreview'

function Model({ src }) {
  const { scene } = useGLTF(src)
  const model = useMemo(() => createPreviewModel(scene), [scene])
  return <primitive object={model} />
}

function PreviewCamera() {
  const { camera, size, invalidate } = useThree()
  const zoom = getPreviewZoom(size.width, size.height)

  useLayoutEffect(() => {
    camera.zoom = zoom
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, zoom, invalidate])

  return <OrbitControls enablePan={false} minZoom={zoom * 0.8} maxZoom={zoom * 2} />
}

export default function WeaponPreview({ src }) {
  return <Canvas orthographic camera={{ position: [0, 0, 6], near: 0.1, far: 100 }} dpr={[1, 1.5]} frameloop="demand">
    <ambientLight intensity={1.5} />
    <directionalLight position={[3, 4, 5]} intensity={3} />
    <directionalLight position={[-3, 1, -2]} intensity={1} />
    <Suspense fallback={null}>
      <Model src={src} />
    </Suspense>
    <PreviewCamera />
  </Canvas>
}
