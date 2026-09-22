import fs from 'node:fs'
import assert from 'node:assert/strict'
import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DEFAULT_WEAPON, WEAPON_SKINS, getWeaponSkin } from '../../src/data/weaponSkins.js'
import { createCylinderMechanism, resetCylinder, triggerCylinder, updateCylinder } from '../../src/utils/revolverMechanics.js'

globalThis.ProgressEvent ??= class ProgressEvent {}
assert.equal(WEAPON_SKINS.length, 3)
assert.equal(WEAPON_SKINS[0], DEFAULT_WEAPON)
for (const skin of WEAPON_SKINS) {
  assert.ok(fs.existsSync(`public${skin.model.split('?')[0]}`))
  if (skin.preview) assert.ok(fs.existsSync(`public${skin.preview}`))
  assert.equal(getWeaponSkin(skin.id), skin)
}
assert.equal(getWeaponSkin('invalid'), DEFAULT_WEAPON)
assert.equal(new Set(WEAPON_SKINS.map(skin => skin.id)).size, WEAPON_SKINS.length)

const buffer = fs.readFileSync('public/models/revolver-rig.glb')
const length = buffer.readUInt32LE(12), start = 28 + length
const json = JSON.parse(buffer.subarray(20, 20 + length).toString())
assert.ok(json.skins?.length && json.skins.every(skin => skin.joints.length === 43))
assert.equal(json.images.length, 3, 'Preserve all three PBR texture maps')
assert.deepEqual(json.animations.map(a => a.name).sort(), ['Armature|Grip', 'Armature|Idle', 'Armature|Shoot'])
assert.ok(!json.cameras && !json.nodes.some(n => /CAM_|LGT_|Banana|Pistol/.test(n.name || '')), 'No review or unrelated objects in the export')
json.buffers = [{byteLength: buffer.length - start, uri: `data:application/octet-stream;base64,${buffer.subarray(start).toString('base64')}`}]
delete json.images; delete json.textures; delete json.materials
for (const mesh of json.meshes) for (const primitive of mesh.primitives) delete primitive.material
const {scene, animations} = await new GLTFLoader().parseAsync(JSON.stringify(json), '')
const skin = getWeaponSkin('revolver')
const group = new T.Group(); group.position.fromArray(skin.offset); group.rotation.set(-.04, .06, -.02, 'YXZ')
scene.scale.setScalar(.29); scene.rotation.set(.1, Math.PI*2.5, 0); group.add(scene)
const mixer = new T.AnimationMixer(scene), camera = new T.PerspectiveCamera(75, 16/9, .05, 60)
const gun = []
for (const name of ['HERO_Revolver', 'HERO_RevolverCylinder', 'HERO_RevolverHammer']) {
  const part = scene.getObjectByName(name)
  assert.ok(part, `${name} must be independently present`)
  part.traverse(o => { if (o.isMesh) { assert.ok(o.isSkinnedMesh); gun.push(o) } })
}
const clip = animations.find(a => a.name === 'Armature|Shoot')
assert.ok(Math.abs(clip.duration - .5) < .001)
const shoot = mixer.clipAction(clip); shoot.setLoop(T.LoopOnce, 1); shoot.clampWhenFinished = true; shoot.play()
const envelope = {top: Infinity, left: Infinity, right: -Infinity}
const root = scene.getObjectByName('Root')
const cylinderBone = scene.getObjectByName('Cylinder'), hammerBone = scene.getObjectByName('Hammer')
assert.ok(cylinderBone?.isBone && hammerBone?.isBone)
const cylinderStart = new T.Quaternion(), hammerStart = new T.Quaternion()
let cylinderPivot, hammerPivot, maxHammerTravel = 0, cylinderTravel = 0
const firstPose = new Map()
let first, last, maxMotion = 0
const point = new T.Vector3()
for (let frame = 0; frame <= 90; frame++) {
  mixer.setTime(clip.duration * frame / 90); group.updateMatrixWorld(true)
  const box = new T.Box3()
  for (const mesh of gun) {
   mesh.skeleton.update()
   for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
    mesh.getVertexPosition(i, point); point.applyMatrix4(mesh.matrixWorld); box.expandByPoint(point)
    assert.ok(point.z < -.05, 'Gun must not clip the near plane')
    point.project(camera)
    envelope.top = Math.min(envelope.top, (1-point.y)/2)
    envelope.left = Math.min(envelope.left, (1+point.x)/2)
    envelope.right = Math.max(envelope.right, (1+point.x)/2)
   }
  }
  const center = box.getCenter(new T.Vector3()); first ??= center.clone(); last = center
  maxMotion = Math.max(maxMotion, center.distanceTo(first))
  if (frame === 0) {
    scene.traverse(o => { if (o.isBone) firstPose.set(o.name, o.matrixWorld.clone()) })
    cylinderStart.copy(cylinderBone.quaternion); hammerStart.copy(hammerBone.quaternion)
    cylinderPivot = cylinderBone.position.clone(); hammerPivot = hammerBone.position.clone()
  }
  cylinderTravel = cylinderStart.angleTo(cylinderBone.quaternion)
  maxHammerTravel = Math.max(maxHammerTravel, hammerStart.angleTo(hammerBone.quaternion))
  assert.ok(cylinderPivot.distanceTo(cylinderBone.position) < 1e-6, 'Cylinder must rotate about a fixed pivot')
  assert.ok(hammerPivot.distanceTo(hammerBone.position) < 1e-6, 'Hammer must rotate about a fixed hinge')
}
scene.traverse(o => {
  if (o.isBone && o.name !== 'Cylinder') assert.ok(o.matrixWorld.elements.every((v, i) => Math.abs(v-firstPose.get(o.name).elements[i]) < .001), `${o.name} must return to rest`)
})
assert.ok(first.distanceTo(last) < .02, 'Body returns while cylinder keeps its indexed phase')
assert.ok(Math.abs(cylinderTravel-Math.PI/3) < .001, 'Exactly one 60-degree cylinder index')
assert.ok(maxHammerTravel > .40 && maxHammerTravel < .46, 'Readable 25-degree cock/strike')
assert.ok(maxMotion > .02 && maxMotion < .3, 'Visible, restrained recoil')
assert.ok(envelope.top > .5 && envelope.left > .5 && envelope.right < 1, 'Stay lower-right, away from crosshair')
mixer.stopAllAction()
const idleClip = animations.find(a => a.name === 'Armature|Idle'), idle = mixer.clipAction(idleClip)
idle.setLoop(T.LoopOnce, 1); idle.clampWhenFinished = true; idle.play()
mixer.setTime(0); group.updateMatrixWorld(true); const idleStart = root.matrixWorld.clone()
mixer.setTime(idleClip.duration); group.updateMatrixWorld(true)
assert.ok(idleStart.elements.every((v, i) => Math.abs(v-root.matrixWorld.elements[i]) < .001), 'Idle must loop seamlessly')

// Exercise the actual runtime override after the mixer, including interruption
// before the authored indexing motion has finished and crossfades back to idle.
const mechanism = createCylinderMechanism(scene, animations)
assert.ok(mechanism, 'GLB must expose the cylinder animation consumed by runtime')
assert.ok(Math.abs(mechanism.turn-Math.PI/3) < .001)
for (const interval of [3, 7, 30]) {
  resetCylinder(mechanism)
  let previous = 0
  for (let frame=0; frame<interval*6+60; frame++) {
    if (frame<interval*6 && frame%interval===0) {
      const angle=mechanism.angle
      triggerCylinder(mechanism)
      assert.equal(mechanism.angle,angle,'Restart must not snap the current phase')
    }
    mixer.update(1/60)
    updateCylinder(mechanism,1/60)
    assert.ok(mechanism.angle >= previous-1e-6, 'Cylinder must never reverse during rapid fire or recovery')
    assert.ok(Number.isFinite(mechanism.bone.quaternion.w))
    previous=mechanism.angle
  }
  assert.ok(Math.abs(mechanism.angle-6*mechanism.turn) < .0001, 'Six shots must retain six chamber indexes')
  assert.ok(mechanism.bone.quaternion.angleTo(mechanism.rest)<.001,'Six indexes make one full rotation')
}
resetCylinder(mechanism)
assert.ok(mechanism.bone.quaternion.angleTo(mechanism.rest)<.001)
console.log(JSON.stringify({status: 'PASS', samples: 91, clips: animations.map(a => ({name: a.name, duration: a.duration})), envelope, maxMotion, returnError: first.distanceTo(last), cylinderDegrees: T.MathUtils.radToDeg(cylinderTravel), hammerDegrees: T.MathUtils.radToDeg(maxHammerTravel), rapidFireIntervalsMs:[50,117,500]}, null, 2))
