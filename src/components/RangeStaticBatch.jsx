import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

function materialKey(mesh) {
  const m = mesh.material
  return JSON.stringify([
    m.type, m.emissive?.getHex(), m.emissiveIntensity,
    m.roughness, m.metalness, m.map?.uuid, m.bumpMap?.uuid, m.bumpScale, m.envMapIntensity, m.side, m.opacity, m.transparent,
    m.toneMapped, m.fog, m.depthTest, m.depthWrite, m.vertexColors,
    mesh.castShadow, mesh.receiveShadow, mesh.renderOrder,
  ])
}

// Static architecture is batched only with identical materials. Targets, HUD,
// animated weapons and already-instanced meshes keep their own render paths.
export default function RangeStaticBatch() {
  const { scene, gl, invalidate } = useThree()
  const warmup = useRef(3)
  const cleanup = useRef(null)
  useEffect(() => {
    const rebuild = () => {
      cleanup.current?.()
      cleanup.current = null
      warmup.current = 3
      gl.shadowMap.autoUpdate = true
      gl.shadowMap.needsUpdate = true
      invalidate()
    }
    rebuild()
    // Development hot updates must not leave old merged geometry over new panels.
    import.meta.hot?.on('vite:afterUpdate', rebuild)
    return () => {
      import.meta.hot?.off('vite:afterUpdate', rebuild)
      cleanup.current?.()
      cleanup.current = null
      gl.shadowMap.autoUpdate = true
    }
  }, [scene, gl, invalidate])
  useFrame(() => {
    if (cleanup.current) return
    if (warmup.current-- > 0) {
      invalidate()
      return
    }
    scene.updateMatrixWorld(true)
    const buckets = new Map()
    for (const name of ['range-front', 'range-interior']) {
      scene.getObjectByName(name)?.traverse((mesh) => {
        if (!mesh.isMesh || mesh.isInstancedMesh || !mesh.visible ||
          Array.isArray(mesh.material) || !mesh.material.color || mesh.material.vertexColors ||
          mesh.geometry.attributes.color || !mesh.geometry.attributes.normal) return
        const key = materialKey(mesh)
        if (!buckets.has(key)) buckets.set(key, [])
        buckets.get(key).push(mesh)
      })
    }
    const mergedGroup = new THREE.Group()
    mergedGroup.name = 'range-static-batches'
    const originals = []
    for (const meshes of buckets.values()) {
      if (meshes.length < 2) continue
      const parts = meshes.map((mesh) => {
        const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()
        geometry.applyMatrix4(mesh.matrixWorld)
        // Bake only the material tint into constant vertex colors; lighting and
        // texture sampling stay on the same shader path as the source meshes.
        const vertexCount = geometry.getAttribute('position').count
        const colors = new Float32Array(vertexCount * 3)
        const color = mesh.material.color
        for (let i = 0; i < colors.length; i += 3) {
          colors[i] = color.r
          colors[i + 1] = color.g
          colors[i + 2] = color.b
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        return geometry
      })
      const geometry = mergeGeometries(parts)
      parts.forEach((part) => part.dispose())
      if (!geometry) continue
      geometry.computeBoundingSphere()
      const first = meshes[0]
      const material = first.material.clone()
      material.color.setRGB(1, 1, 1)
      material.vertexColors = true
      const merged = new THREE.Mesh(geometry, material)
      merged.castShadow = first.castShadow
      merged.receiveShadow = first.receiveShadow
      merged.renderOrder = first.renderOrder
      merged.matrixAutoUpdate = false
      mergedGroup.add(merged)
      for (const mesh of meshes) {
        mesh.visible = false
        originals.push(mesh)
      }
    }
    mergedGroup.userData.sourceMeshCount = originals.length
    scene.add(mergedGroup)
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    invalidate()
    cleanup.current = () => {
      originals.forEach((mesh) => { mesh.visible = true })
      scene.remove(mergedGroup)
      mergedGroup.children.forEach((mesh) => {
        mesh.geometry.dispose()
        mesh.material.dispose()
      })
    }
  })
  return null
}
