import fs from 'node:fs'
import assert from 'node:assert/strict'
import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

globalThis.ProgressEvent ??= class ProgressEvent {}
const b=fs.readFileSync('public/models/pistol-rig.glb')
const length=b.readUInt32LE(12), start=28+length
const j=JSON.parse(b.subarray(20,20+length).toString())
j.buffers=[{byteLength:b.length-start,uri:`data:application/octet-stream;base64,${b.subarray(start).toString('base64')}`}]
delete j.images;delete j.textures;delete j.materials
for(const m of j.meshes)for(const p of m.primitives)delete p.material
const {scene,animations}=await new GLTFLoader().parseAsync(JSON.stringify(j),'')
const group=new T.Group();group.position.set(0,-.94,-.9);group.rotation.set(-.04,.06,-.02,'YXZ')
scene.scale.setScalar(.29);scene.rotation.set(.1,Math.PI*2.5,0);group.add(scene)
const mixer=new T.AnimationMixer(scene),cam=new T.PerspectiveCamera(75,16/9,.05,60)
const gun=[];scene.getObjectByName('HERO_Pistol').traverse(o=>{if(o.isMesh)gun.push(o)})
const clip=animations.find(a=>a.name==='Armature|Shoot')
assert.ok(clip && Math.abs(clip.duration-.4)<.001)
const action=mixer.clipAction(clip);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play()
const envelope={top:Infinity,left:Infinity,right:-Infinity}
let first,last,maxMotion=0,maxSlide=0,slideFirst
const wrist=scene.getObjectByName('Root'),slide=scene.getObjectByName('Slide')
for(let frame=0;frame<=80;frame++){
 mixer.setTime(clip.duration*frame/80);group.updateMatrixWorld(true)
 const box=new T.Box3()
 for(const mesh of gun){
  mesh.skeleton.update()
  for(let i=0;i<mesh.geometry.attributes.position.count;i++){
   const v=new T.Vector3();mesh.getVertexPosition(i,v);v.applyMatrix4(mesh.matrixWorld);box.expandByPoint(v)
   assert.ok(v.z<-.05,'Gun must remain in front of camera')
   v.project(cam);envelope.top=Math.min(envelope.top,(1-v.y)/2);envelope.left=Math.min(envelope.left,(v.x+1)/2);envelope.right=Math.max(envelope.right,(v.x+1)/2)
  }
 }
 const center=box.getCenter(new T.Vector3());first??=center.clone();last=center;maxMotion=Math.max(maxMotion,center.distanceTo(first))
 const localSlide=wrist.worldToLocal(slide.getWorldPosition(new T.Vector3()));slideFirst??=localSlide.clone();maxSlide=Math.max(maxSlide,localSlide.distanceTo(slideFirst))
}
assert.ok(first.distanceTo(last)<.003,'Shoot must return to exact ready pose')
assert.ok(maxMotion>.02 && maxMotion<.3,'Recoil must be visible but restrained')
assert.ok(maxSlide>.0001,'Slide must have independent travel')
assert.ok(envelope.top>.5 && envelope.left>.5 && envelope.right<1,'Gun must stay below/right of crosshair')
mixer.stopAllAction()
const idle=animations.find(a=>a.name==='Armature|Idle'),idleAction=mixer.clipAction(idle)
idleAction.setLoop(T.LoopOnce,1);idleAction.clampWhenFinished=true;idleAction.play()
mixer.setTime(0);group.updateMatrixWorld(true);const idleStart=wrist.matrixWorld.clone()
mixer.setTime(idle.duration);group.updateMatrixWorld(true)
assert.ok(idleStart.elements.every((v,i)=>Math.abs(v-wrist.matrixWorld.elements[i])<.001),'Idle loop must close')
console.log(JSON.stringify({status:'PASS',duration:clip.duration,samples:81,envelope,maxMotion,maxSlide,returnError:first.distanceTo(last)},null,2))
