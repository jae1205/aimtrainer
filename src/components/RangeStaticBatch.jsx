import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

function materialKey(mesh) {
  const m = mesh.material
  return JSON.stringify([
    m.type, m.color?.getHex(), m.emissive?.getHex(), m.emissiveIntensity,
    m.roughness, m.metalness, m.map?.uuid, m.bumpMap?.uuid, m.bumpScale, m.envMapIntensity, m.side, m.opacity, m.transparent,
    m.toneMapped, m.fog, m.depthTest, m.depthWrite,
    mesh.castShadow, mesh.receiveShadow, mesh.renderOrder,
  ])
}

// Static architecture is batched only with identical materials. Targets, HUD,
// animated weapons and already-instanced meshes keep their own render paths.
export default function RangeStaticBatch() {
  const { scene, gl } = useThree()
  const warmup = useRef(3)
  const cleanup = useRef(null)
  useEffect(() => {
    const rebuild = () => {
      cleanup.current?.()
      cleanup.current = null
      warmup.current = 3
      gl.shadowMap.autoUpdate = true
      gl.shadowMap.needsUpdate = true
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
  }, [scene, gl])
  useFrame(() => {
    if (cleanup.current) return
    if (warmup.current-- > 0) return
    scene.updateMatrixWorld(true)
    const buckets = new Map()
    for (const name of ['range-front', 'range-interior']) {
      scene.getObjectByName(name)?.traverse((mesh) => {
        if (!mesh.isMesh || mesh.isInstancedMesh || !mesh.visible ||
          Array.isArray(mesh.material) || !mesh.geometry.attributes.normal) return
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
        return geometry.applyMatrix4(mesh.matrixWorld)
      })
      const geometry = mergeGeometries(parts)
      parts.forEach((part) => part.dispose())
      if (!geometry) continue
      geometry.computeBoundingSphere()
      const first = meshes[0]
      const merged = new THREE.Mesh(geometry, first.material)
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
    cleanup.current = () => {
      originals.forEach((mesh) => { mesh.visible = true })
      scene.remove(mergedGroup)
      mergedGroup.children.forEach((mesh) => mesh.geometry.dispose())
    }
  })
  return null
}
