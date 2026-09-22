// Bake only the existing pistol into a static shop asset; leave the game rig untouched.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'

globalThis.ProgressEvent ??= class ProgressEvent {}
globalThis.FileReader ??= class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.() })
  }
}

const buffer = fs.readFileSync('public/models/pistol-rig.glb')
const length = buffer.readUInt32LE(12), start = 28 + length
const json = JSON.parse(buffer.subarray(20, 20 + length).toString())
assert.ok(!json.images?.length, 'This preview exporter expects the existing untextured pistol materials')
json.buffers = [{byteLength: buffer.length-start, uri: `data:application/octet-stream;base64,${buffer.subarray(start).toString('base64')}`}]
const {scene, animations} = await new GLTFLoader().parseAsync(JSON.stringify(json), '')
const mixer = new THREE.AnimationMixer(scene)
mixer.clipAction(animations.find(clip => clip.name === 'Armature|Grip')).play()
mixer.update(0); scene.updateMatrixWorld(true)
const pistol = scene.getObjectByName('HERO_Pistol')
assert.ok(pistol)
const preview = new THREE.Group(); preview.name = 'StandardPistol'
const point = new THREE.Vector3()
pistol.traverse(source => {
  if (!source.isMesh) return
  source.skeleton?.update()
  const geometry = source.geometry.clone()
  const positions = geometry.attributes.position
  for (let i=0; i<positions.count; i++) {
    source.getVertexPosition(i, point); point.applyMatrix4(source.matrixWorld)
    positions.setXYZ(i, point.x, point.y, point.z)
  }
  geometry.deleteAttribute('skinIndex'); geometry.deleteAttribute('skinWeight')
  geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere()
  const mesh = new THREE.Mesh(geometry, source.material)
  mesh.name = source.name; preview.add(mesh)
})
// Use a left-facing profile to match the revolver's shop presentation.
preview.rotation.y = Math.PI; preview.updateMatrixWorld(true)
const center = new THREE.Box3().setFromObject(preview).getCenter(new THREE.Vector3())
preview.position.sub(center); preview.updateMatrixWorld(true)
const exported = await new GLTFExporter().parseAsync(preview, {binary: true})
const data = Buffer.from(exported)
const check = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString())
assert.ok(!check.skins && !check.animations && !check.nodes.some(n => /Hand|Arm|Rig/.test(n.name || '')))
fs.writeFileSync('public/models/pistol-preview.glb', data)
console.log(`Pistol-only shop preview: ${data.byteLength} bytes`)
