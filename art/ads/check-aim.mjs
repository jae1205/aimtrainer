import fs from 'node:fs'
import assert from 'node:assert/strict'
import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { applyAimPose, createAimPose, createAimState, stepAim, getAimFov, HIP_FOV, AIM_FOV, bindAimInput } from '../../src/utils/aim.js'
import { createCylinderMechanism, triggerCylinder, updateCylinder } from '../../src/utils/revolverMechanics.js'

globalThis.ProgressEvent ??= class ProgressEvent {}
async function load(path) {
  const buffer = fs.readFileSync(path), length = buffer.readUInt32LE(12)
  const json = JSON.parse(buffer.subarray(20, 20 + length))
  const bin = buffer.subarray(28 + length)
  const images = json.images?.length || 0
  json.buffers = [{ byteLength: bin.length, uri: `data:application/octet-stream;base64,${bin.toString('base64')}` }]
  delete json.images; delete json.textures; delete json.materials
  for (const mesh of json.meshes) for (const primitive of mesh.primitives) delete primitive.material
  return { ...await new GLTFLoader().parseAsync(JSON.stringify(json), ''), images, json }
}
function frameRig(scene, id) {
  const group = new T.Group()
  group.position.set(0, id === 'banana' ? -1.08 : -.94, id === 'banana' ? -1 : -.9)
  group.rotation.set(-.04, .06, -.02, 'YXZ')
  scene.scale.setScalar(.29); scene.rotation.set(.1, Math.PI * 2.5, 0)
  group.add(scene)
  return group
}
for (const id of ['pistol', 'revolver', 'banana']) {
  const old = await load(`public/models/${id}-rig.glb`), next = await load(`public/models/${id}-ads.glb`)
  assert.equal(next.json.scenes.length, 1, 'Only the requested weapon scene is exported')
  assert.equal(next.images, old.images, 'Preserve textures')
  assert.equal(next.json.meshes.length, old.json.meshes.length)
  assert.deepEqual(next.animations.map(c => c.name).sort(), ['Armature|Aim', 'Armature|Grip', 'Armature|Idle', 'Armature|Shoot'])
  const group = frameRig(next.scene, id), oldGroup = frameRig(old.scene, id)
  const mixer = new T.AnimationMixer(next.scene), oldMixer = new T.AnimationMixer(old.scene)
  const aim = createAimPose(next.scene, next.animations)
  assert.ok(aim && aim.curves.length >= 2, 'Authored animated parent is available')
  let maxPoseError = 0
  for (const name of ['Armature|Grip', 'Armature|Idle', 'Armature|Shoot']) {
    mixer.stopAllAction(); oldMixer.stopAllAction()
    const clip = next.animations.find(c => c.name === name), oldClip = old.animations.find(c => c.name === name)
    assert.ok(Math.abs(clip.duration - oldClip.duration) < .001, `${id} ${name} duration ${clip.duration} != ${oldClip.duration}`)
    mixer.clipAction(clip).setLoop(T.LoopOnce, 1).play()
    oldMixer.clipAction(oldClip).setLoop(T.LoopOnce, 1).play()
    for (let i = 0; i < 20; i++) {
      const t = clip.duration * i / 20
      mixer.setTime(t); oldMixer.setTime(t); applyAimPose(aim, 0)
      group.updateMatrixWorld(true); oldGroup.updateMatrixWorld(true)
      old.scene.traverse(o => {
        if (!o.isBone) return
        const bone = next.scene.getObjectByName(o.name)
        const error = o.getWorldPosition(new T.Vector3()).distanceTo(bone.getWorldPosition(new T.Vector3()))
        maxPoseError = Math.max(maxPoseError, error)
      })
    }
  }
  assert.ok(maxPoseError < .003, `${id} existing animation changed by ${maxPoseError}`)
  mixer.stopAllAction()
  mixer.clipAction(next.animations.find(c => c.name === 'Armature|Grip')).play(); mixer.update(0)
  const root = next.scene.getObjectByName('Root'), rootPath = []
  for (const t of [0, .25, .5, .75, 1, .75, .5, .25, 0]) {
    applyAimPose(aim, t); group.updateMatrixWorld(true)
    rootPath.push(root.getWorldPosition(new T.Vector3()).toArray())
  }
  const expectedAimX = id === 'pistol' ? .0215 : 0
  assert.ok(Math.abs(rootPath[4][0] - expectedAimX) < .002, `${id} sight alignment offset must match the authored view`)
  assert.ok(rootPath[4][1] > rootPath[0][1], 'Raise with both hands')
  assert.deepEqual(rootPath[0], rootPath.at(-1), 'Release returns exactly to hip')
  if (id === 'revolver') {
    const cylinder = createCylinderMechanism(next.scene, next.animations)
    for (let i = 0; i < 6; i++) {
      triggerCylinder(cylinder)
      for (let frame = 0; frame < 30; frame++) {
        updateCylinder(cylinder, 1/60); applyAimPose(aim, (frame % 10) / 9)
      }
    }
    assert.ok(Math.abs(cylinder.angle - 2*Math.PI) < .001, 'ADS does not reset cylinder indexing')
  }
  console.log(id, { maxPoseError, hip: rootPath[0], aimed: rootPath[4], aimDuration: aim.duration })
}

for (const fps of [30, 60, 144, 240]) {
  const state = createAimState(); state.active = true
  for (let i = 0; i < fps; i++) stepAim(state, 1/fps)
  assert.equal(state.progress, 1)
  state.active = false
  for (let i = 0; i < fps; i++) stepAim(state, 1/fps)
  assert.equal(state.progress, 0)
}
assert.equal(getAimFov(0), HIP_FOV)
assert.equal(getAimFov(1), AIM_FOV)
assert.ok(Math.abs(Math.tan(HIP_FOV*Math.PI/360) / Math.tan(AIM_FOV*Math.PI/360) - 1.5) < 1e-12)

const target = new EventTarget(), doc = new EventTarget(), state = createAimState()
const canvas = { contains: () => false }; doc.pointerLockElement = canvas; doc.hidden = false
let active = true
const cleanup = bindAimInput({ target, doc, canvas, state, isActive: () => active })
function event(source, type, props = {}) { const e = new Event(type, { cancelable: true }); Object.assign(e, props); source.dispatchEvent(e); return e }
event(target, 'mousedown', { button: 0 }); assert.equal(state.active, false)
event(target, 'mousedown', { button: 2 }); assert.equal(state.active, true)
event(target, 'mousedown', { button: 2 }); assert.equal(state.active, true, 'Holding does not toggle repeatedly')
event(target, 'mouseup', { button: 0 }); assert.equal(state.active, true)
event(target, 'mouseup', { button: 2 }); assert.equal(state.active, true, 'Release keeps aim enabled')
event(target, 'mousedown', { button: 2 }); assert.equal(state.active, false, 'Second click disables aim')
event(target, 'mouseup', { button: 2 }); assert.equal(state.active, false)
for (const reason of ['blur', 'visibilitychange', 'pointerlockchange']) {
  doc.hidden = false; doc.pointerLockElement = canvas
  event(target, 'mousedown', { button: 2 }); event(target, 'mouseup', { button: 2 }); assert.equal(state.active, true)
  if (reason === 'visibilitychange') doc.hidden = true
  if (reason === 'pointerlockchange') doc.pointerLockElement = null
  event(reason === 'blur' ? target : doc, reason); assert.equal(state.active, false)
}
doc.hidden = false; doc.pointerLockElement = canvas; active = false
event(target, 'mousedown', { button: 2 }); assert.equal(state.active, false)
active = true; event(target, 'mousedown', { button: 2 }); cleanup(); assert.equal(state.active, false)
event(target, 'mousedown', { button: 2 }); assert.equal(state.active, false)
console.log('PASS: original clips, authored aim/return, independent mechanics, toggle input, zoom, cancellation and cleanup')
