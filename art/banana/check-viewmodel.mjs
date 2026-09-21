import fs from 'node:fs'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export async function loadGeometry(path) {
  const buffer = fs.readFileSync(path)
  const length = buffer.readUInt32LE(12)
  const json = JSON.parse(buffer.subarray(20, 20 + length).toString())
  const binStart = 28 + length
  json.buffers = [{ byteLength: buffer.length - binStart, uri: `data:application/octet-stream;base64,${buffer.subarray(binStart).toString('base64')}` }]
  delete json.images; delete json.textures; delete json.materials
  for (const m of json.meshes) for (const p of m.primitives) delete p.material
  return new GLTFLoader().parseAsync(JSON.stringify(json), '')
}

globalThis.ProgressEvent ??= class ProgressEvent {}
for (const path of ['public/models/banana-rig.glb']) {
  const { scene, animations } = await loadGeometry(path)
  const group = new THREE.Group()
  group.position.set(0, -1.08, -1)
  group.rotation.set(-.04, .06, -.02, 'YXZ')
  scene.scale.setScalar(.29); scene.rotation.set(.1, Math.PI * 2.5, 0)
  group.add(scene)
  const mixer = new THREE.AnimationMixer(scene)
  const initial = {}
  for (const name of ['Armature|Grip', 'Armature|Idle', 'Armature|Shoot']) {
    mixer.stopAllAction()
    mixer.clipAction(animations.find(a => a.name === name)).play()
    mixer.setTime(0); group.updateMatrixWorld(true)
    const meshes = []
    scene.traverse(o => {
      if (!o.isMesh) return
      o.skeleton?.update()
      const box = new THREE.Box3()
      for (let i = 0; i < o.geometry.attributes.position.count; i++) {
        const v = new THREE.Vector3(); o.getVertexPosition(i, v); box.expandByPoint(v.applyMatrix4(o.matrixWorld))
      }
      meshes.push({ name: o.name, min: box.min.toArray(), max: box.max.toArray() })
    })
    initial[name] = meshes
  }
  assert.deepEqual(animations.map(a => a.name).sort(), ['Armature|Grip','Armature|Idle','Armature|Shoot'])
  const idleBox = initial['Armature|Idle'].find(m => m.name === 'GoldenCurve')
  const shootBox = initial['Armature|Shoot'].find(m => m.name === 'GoldenCurve')
  assert.ok(idleBox.min.every((v,i) => Math.abs(v-shootBox.min[i]) < .002), 'Idle and shoot must share the same ready pose')
  mixer.stopAllAction()
  const clip = animations.find(a => a.name === 'Armature|Shoot')
  const action = mixer.clipAction(clip); action.setLoop(THREE.LoopOnce,1); action.clampWhenFinished=true; action.play()
  const banana=scene.getObjectByName('GoldenCurve')
  const camera=new THREE.PerspectiveCamera(75,16/9,.05,60)
  const envelope={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity}
  let first, last, maxDisplacement=0
  for(let frame=0;frame<=60;frame++) {
    mixer.setTime(clip.duration*frame/60); group.updateMatrixWorld(true); banana.skeleton.update()
    const center=new THREE.Vector3(); const box=new THREE.Box3()
    for(let i=0;i<banana.geometry.attributes.position.count;i++) {
      const v=new THREE.Vector3(); banana.getVertexPosition(i,v);v.applyMatrix4(banana.matrixWorld)
      assert.ok(v.z < -.05, 'Banana must remain in front of camera')
      box.expandByPoint(v)
      const ndc=v.clone().project(camera);const x=(ndc.x+1)/2,y=(1-ndc.y)/2
      envelope.left=Math.min(envelope.left,x);envelope.right=Math.max(envelope.right,x)
      envelope.top=Math.min(envelope.top,y);envelope.bottom=Math.max(envelope.bottom,y)
    }
    box.getCenter(center)
    first ??= center.clone();last=center;maxDisplacement=Math.max(maxDisplacement,center.distanceTo(first))
  }
  console.log({envelope,maxDisplacement,returnError:first.distanceTo(last)})
  assert.ok(first.distanceTo(last)<.003,'Shot must settle back to its initial pose')
  // The held stem may continue below the viewport with the forearm; the tip must never rise above the crosshair.
  assert.ok(envelope.top>.5 && envelope.right<1 && envelope.left>.5 && envelope.bottom<1.15,'Banana must stay in lower-right screen area throughout recoil')
  assert.ok(maxDisplacement>.02,'Shot must actually animate')
  console.log(JSON.stringify({status:'PASS',clipDuration:clip.duration,envelope,returnError:first.distanceTo(last),maxDisplacement},null,2))
}
