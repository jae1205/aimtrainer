import { createContext, useContext, useEffect, useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const SurfaceContext = createContext(null)

export function RangeSurfaces({ children }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 256
    const ctx = canvas.getContext('2d')
    const data = ctx.createImageData(256, 256)
    let seed = 2517
    for (let i = 0; i < data.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      const x = (i / 4) % 256
      const y = Math.floor(i / 4 / 256)
      // Broad mineral variation survives minification; sparse pores add scale
      // without extra normal-map sampling or high-frequency repeating lines.
      const grain = (seed >>> 27) * 0.45
      const mineral = 5 * Math.sin(x * Math.PI / 64) * Math.cos(y * Math.PI / 128)
      const value = 224 + grain + mineral - (seed % 83 === 0 ? 19 : 0)
      data.data[i] = data.data[i + 1] = data.data[i + 2] = value
      data.data[i + 3] = 255
    }
    ctx.putImageData(data, 0, 0)
    const map = new THREE.CanvasTexture(canvas)
    map.colorSpace = THREE.SRGBColorSpace
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.set(1, 1)
    map.anisotropy = 8
    return map
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return <SurfaceContext.Provider value={texture}>{children}</SurfaceContext.Provider>
}

export function Block({ position, size, color = '#69715e', rotation, metalness = 0.08, roughness = 0.82, receiveShadow = true }) {
  const texture = useContext(SurfaceContext)
  const [width, height, depth] = size
  const geometry = useMemo(() => new RoundedBoxGeometry(width, height, depth, 1,
    Math.min(0.012, width * 0.1, height * 0.1, depth * 0.1)), [width, height, depth])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh geometry={geometry} position={position} rotation={rotation} castShadow receiveShadow={receiveShadow}>
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness}
        map={texture} />
    </mesh>
  )
}

export function Strip({ position, size, color = '#ead5b2' }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  )
}

export function RepeatedBlocks({ items, color, metalness = 0.08, receiveShadow = true }) {
  const texture = useContext(SurfaceContext)
  return (
    <Instances limit={items.length} range={items.length} frames={1} castShadow receiveShadow={receiveShadow}>
      <boxGeometry />
      <meshStandardMaterial color={color} roughness={0.78} metalness={metalness}
        map={texture} />
      {items.map(({ position, size, rotation }, i) => (
        <Instance key={i} position={position} scale={size} rotation={rotation} />
      ))}
    </Instances>
  )
}

export function Plaque({ position, width, height, title, subtitle = '', background = '#29352e', large = false }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = Math.round(1024 * height / width)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const pad = large ? 90 : 45
    const size = large ? canvas.height * 0.47 : canvas.height * 0.39
    ctx.fillStyle = '#e5e3d2'
    ctx.font = '600 ' + size + 'px Arial, sans-serif'
    ctx.fillText(title, pad, large ? canvas.height * 0.59 : canvas.height * 0.52)
    ctx.fillStyle = '#9daa97'
    ctx.font = '500 ' + canvas.height * (large ? 0.073 : 0.14) + 'px Arial, sans-serif'
    ctx.fillText(subtitle, pad + (large ? 8 : 0), canvas.height * 0.82)
    const map = new THREE.CanvasTexture(canvas)
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 4
    return map
  }, [width, height, title, subtitle, background, large])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh position={position}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}
