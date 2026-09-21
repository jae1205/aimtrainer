/* eslint-disable react/no-unknown-property -- React Three Fiber scene elements */
import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, OrbitControls, useGLTF } from '@react-three/drei'

function Model() {
  const { scene } = useGLTF('/models/banana-source.glb')
  return <primitive object={scene} />
}

export default function BananaPreview() {
  return <Canvas camera={{ position: [0, 0.3, 4], fov: 40 }} dpr={[1, 1.5]} frameloop="demand">
    <ambientLight intensity={1.5} />
    <directionalLight position={[3, 4, 5]} intensity={3} />
    <directionalLight position={[-3, 1, -2]} intensity={1} />
    <Suspense fallback={null}>
      <Bounds fit clip observe margin={1.3}><Model /></Bounds>
    </Suspense>
    <OrbitControls enablePan={false} minDistance={2} maxDistance={7} />
  </Canvas>
}
