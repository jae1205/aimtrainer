import fs from 'node:fs'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { getWeaponSkin } from '../../src/data/weaponSkins.js'

globalThis.ProgressEvent ??= class ProgressEvent {}

async function load(path) {
  const buffer = fs.readFileSync(path)
  const jsonLength = buffer.readUInt32LE(12)
  const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString())
  const binary = buffer.subarray(28 + jsonLength)
  const imageCount = json.images?.length ?? 0
  json.buffers = [{ byteLength: binary.length, uri: `data:application/octet-stream;base64,${binary.toString('base64')}` }]
  delete json.images
  delete json.textures
  delete json.materials
  for (const mesh of json.meshes) {
    for (const primitive of mesh.primitives) delete primitive.material
  }
  return { ...await new GLTFLoader().parseAsync(JSON.stringify(json), ''), imageCount }
}

function meshOf(scene, name) {
  let mesh
  scene.getObjectByName(name)?.traverse(object => {
    if (object.isSkinnedMesh) mesh = object
  })
  assert.ok(mesh, `${name} must remain a skinned mesh`)
  return mesh
}

const old = await load('public/models/revolver-ads.glb')
const next = await load('public/models/revolver-ads-150.glb')
assert.equal(getWeaponSkin('revolver').model, '/models/revolver-ads-150.glb')
assert.equal(next.imageCount, old.imageCount, 'PBR textures stay intact')
assert.deepEqual(next.animations.map(clip => clip.name).sort(), old.animations.map(clip => clip.name).sort())
for (const clip of old.animations) {
  const updated = next.animations.find(candidate => candidate.name === clip.name)
  assert.ok(Math.abs(updated.duration - clip.duration) < 1e-3, `${clip.name} duration changed`)
}

const handsOld = meshOf(old.scene, 'HERO_RevolverHands').geometry.attributes.position
const handsNew = meshOf(next.scene, 'HERO_RevolverHands').geometry.attributes.position
assert.equal(handsNew.count, handsOld.count)
let handError = 0
for (let i = 0; i < handsOld.count; i++) {
  for (let axis = 0; axis < 3; axis++) {
    handError = Math.max(handError, Math.abs(handsNew.array[i * 3 + axis] - handsOld.array[i * 3 + axis]))
  }
}
assert.ok(handError < 1e-5, `Hand geometry changed by ${handError}`)

for (const name of ['HERO_Revolver', 'HERO_RevolverCylinder', 'HERO_RevolverHammer']) {
  const before = meshOf(old.scene, name).geometry
  const after = meshOf(next.scene, name).geometry
  assert.equal(after.attributes.position.count, before.attributes.position.count)
  before.computeBoundingBox()
  after.computeBoundingBox()
  const originalSize = before.boundingBox.getSize(new THREE.Vector3())
  const enlargedSize = after.boundingBox.getSize(new THREE.Vector3())
  for (let axis = 0; axis < 3; axis++) {
    const ratio = enlargedSize.getComponent(axis) / originalSize.getComponent(axis)
    assert.ok(Math.abs(ratio - 1.5) < .003, `${name} axis ${axis}: expected 1.5×, got ${ratio}`)
  }
}

for (const name of ['Cylinder', 'Hammer']) {
  const before = old.scene.getObjectByName(name)
  const after = next.scene.getObjectByName(name)
  assert.ok(before?.isBone && after?.isBone)
  assert.ok(after.position.distanceTo(before.position.clone().multiplyScalar(1.5)) < .002,
    `${name} pivot must move with enlarged gun`)
}

console.log('Revolver body, cylinder, hammer: 1.5×; hands unchanged; four animation clips preserved.')
