import assert from 'node:assert/strict'
import * as THREE from 'three'
import { rayHitsSphere } from '../../src/utils/targetHit.js'

const radius = 0.18
const geometry = new THREE.SphereGeometry(radius, 24, 24)
const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial())
mesh.position.set(0, 0, -10)
mesh.updateMatrixWorld(true)
const ray = new THREE.Ray(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1))
const raycaster = new THREE.Raycaster()
raycaster.ray = ray

assert.equal(rayHitsSphere(ray, mesh.position, radius), true)
ray.direction.set(1, 0, 0)
assert.equal(rayHitsSphere(ray, mesh.position, radius), false)
ray.direction.set(0, 0, 1)
assert.equal(rayHitsSphere(ray, mesh.position, radius), false)

let differences = 0
let samples = 0
for (let x = -0.28; x <= 0.28; x += 0.008) {
  for (let y = -0.28; y <= 0.28; y += 0.008) {
    ray.direction.set(x, y, -10).normalize()
    const surfaceHit = raycaster.intersectObject(mesh, false).length > 0
    const sphereHit = rayHitsSphere(ray, mesh.position, radius)
    if (surfaceHit !== sphereHit) differences++
    samples++
  }
}
// The rendered 24-sided surface sits just inside its mathematically exact sphere.
// Only its narrow faceted edge may differ from the new analytic hit test.
assert.ok(differences / samples < 0.01, `${differences}/${samples} aim rays changed near the edge`)
console.log(`Target ray check passed: ${samples} rays, ${differences} edge differences.`)

geometry.dispose()
mesh.material.dispose()
