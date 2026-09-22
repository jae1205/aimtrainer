export const HIP_FOV = 75
export const AIM_MAGNIFICATION = 1.5
export const AIM_FOV = 2 * Math.atan(Math.tan(HIP_FOV * Math.PI / 360) / AIM_MAGNIFICATION) * 180 / Math.PI

export function createAimState() {
  return { active: false, buttonDown: false, progress: 0, velocity: 0 }
}

export function stepAim(state, delta) {
  // Analytic critically damped spring: continuous on rapid release/re-press.
  const target = state.active ? 1 : 0
  const dt = Math.min(Math.max(delta, 0), .05)
  const omega = 28
  const displacement = state.progress - target
  const impulse = state.velocity + omega * displacement
  const decay = Math.exp(-omega * dt)
  state.progress = Math.max(0, Math.min(1, target + (displacement + impulse * dt) * decay))
  state.velocity = (state.velocity - omega * impulse * dt) * decay
  if (Math.abs(state.progress - target) < .0001 && Math.abs(state.velocity) < .001) {
    state.progress = target
    state.velocity = 0
  }
  return state.progress
}

export function getAimFov(progress) {
  if (progress <= 0) return HIP_FOV
  if (progress >= 1) return AIM_FOV
  const zoom = 1 + (AIM_MAGNIFICATION - 1) * progress
  return 2 * Math.atan(Math.tan(HIP_FOV * Math.PI / 360) / zoom) * 180 / Math.PI
}

export function bindAimInput({ target, doc, canvas, state, isActive }) {
  const ownsLock = () => doc.pointerLockElement === canvas || !!doc.pointerLockElement?.contains(canvas)
  const reset = () => {
    state.active = false
    state.buttonDown = false
  }
  const down = event => {
    if (event.button !== 2 || !isActive() || !ownsLock() || doc.hidden) return
    event.preventDefault()
    if (state.buttonDown) return
    state.buttonDown = true
    state.active = !state.active
  }
  const up = event => { if (event.button === 2) state.buttonDown = false }
  const lock = () => { if (!ownsLock()) reset() }
  const visibility = () => { if (doc.hidden) reset() }
  const menu = event => {
    if (ownsLock() || canvas === event.target || canvas.contains(event.target)) event.preventDefault()
  }
  const bindings = [[target, 'mousedown', down], [target, 'mouseup', up],
    [target, 'blur', reset],
    [doc, 'pointerlockchange', lock], [doc, 'visibilitychange', visibility],
    [target, 'contextmenu', menu]]
  for (const [source, name, handler] of bindings) source.addEventListener(name, handler)
  return () => {
    reset()
    for (const [source, name, handler] of bindings) source.removeEventListener(name, handler)
  }
}

export function createAimPose(scene, animations) {
  const bone = scene.getObjectByName('AimControl')
  const clip = animations.find(animation => animation.name === 'Armature|Aim')
  if (!bone || !clip) return null
  const curves = ['position', 'quaternion', 'scale'].map(property => ({
    property,
    curve: clip.tracks.find(track => track.name === `AimControl.${property}`)?.createInterpolant(),
  })).filter(entry => entry.curve)
  return { bone, curves, duration: clip.duration }
}

export function applyAimPose(pose, progress) {
  if (!pose) return
  for (const { property, curve } of pose.curves) {
    pose.bone[property].fromArray(curve.evaluate(Math.max(0, Math.min(1, progress)) * pose.duration))
  }
  pose.bone.quaternion.normalize()
}
