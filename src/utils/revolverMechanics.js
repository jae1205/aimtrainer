import * as THREE from 'three'

// The GLB owns the indexing curve. Retain its completed angle outside the
// recoil/idle crossfade, which would otherwise wind the cylinder backwards.
export function createCylinderMechanism(scene, animations) {
  const bone = scene.getObjectByName('Cylinder')
  const clip = animations.find(animation => animation.name === 'Armature|Shoot')
  const track = clip?.tracks.find(candidate => candidate.name === 'Cylinder.quaternion')
  if (!bone || !track) return null

  const rest = new THREE.Quaternion().fromArray(track.values)
  const end = new THREE.Quaternion().fromArray(track.values, track.values.length - 4)
  const turn = rest.angleTo(end)
  if (turn < 1e-5) return null
  const relative = rest.clone().invert().multiply(end).normalize()
  if (relative.w < 0) relative.set(-relative.x, -relative.y, -relative.z, -relative.w)

  return {
    bone, rest, turn,
    axis: new THREE.Vector3(relative.x, relative.y, relative.z).normalize(),
    curve: track.createInterpolant(new Float32Array(4)),
    sampled: new THREE.Quaternion(),
    rotation: new THREE.Quaternion(),
    duration: clip.duration,
    angle: 0, from: 0, target: 0, elapsed: clip.duration,
  }
}

export function resetCylinder(mechanism) {
  if (!mechanism) return
  mechanism.angle = mechanism.from = mechanism.target = 0
  mechanism.elapsed = mechanism.duration
  mechanism.bone.quaternion.copy(mechanism.rest)
}

export function triggerCylinder(mechanism) {
  if (!mechanism) return
  mechanism.from = mechanism.angle
  mechanism.target += mechanism.turn
  mechanism.elapsed = 0
}

export function updateCylinder(mechanism, delta) {
  if (!mechanism) return
  mechanism.elapsed = Math.min(mechanism.duration, mechanism.elapsed + Math.max(0, delta))
  mechanism.sampled.fromArray(mechanism.curve.evaluate(mechanism.elapsed)).normalize()
  const progress = THREE.MathUtils.clamp(mechanism.rest.angleTo(mechanism.sampled) / mechanism.turn, 0, 1)
  mechanism.angle = mechanism.from + (mechanism.target - mechanism.from) * progress
  mechanism.rotation.setFromAxisAngle(mechanism.axis, mechanism.angle)
  mechanism.bone.quaternion.copy(mechanism.rest).multiply(mechanism.rotation)
}
