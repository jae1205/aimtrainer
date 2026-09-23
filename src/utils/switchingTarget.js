export const SWITCHING_HITS_TO_KILL = 2
export const SWITCHING_RESPAWN_DELAY = 0.12
export const SWITCHING_BOUNDS = {
  minX: -6.9, maxX: 6.9,
  minY: 0, maxY: 2.2,
  minZ: -17.2, maxZ: -8.4,
}

function angularX(position) {
  return position.x / (Math.abs(position.z + 3) || 1)
}

export function createSwitchingTarget(index, occupied = [], previous = null, random = Math.random) {
  let x = 0
  let y = 1
  let z = -12
  for (let attempt = 0; attempt < 24; attempt++) {
    x = SWITCHING_BOUNDS.minX + (SWITCHING_BOUNDS.maxX - SWITCHING_BOUNDS.minX) *
      (attempt === 0 && !previous ? (index + 0.3 + random() * 0.4) / 4 : 0.08 + random() * 0.84)
    z = SWITCHING_BOUNDS.minZ + (SWITCHING_BOUNDS.maxZ - SWITCHING_BOUNDS.minZ) *
      (0.1 + random() * 0.8)
    y = SWITCHING_BOUNDS.minY + (SWITCHING_BOUNDS.maxY - SWITCHING_BOUNDS.minY) *
      (0.08 + random() * 0.84)
    const candidate = { x, y, z }
    if (occupied.every((other) => Math.abs(angularX(candidate) - angularX(other)) > 0.18) &&
      (!previous || Math.abs(angularX(candidate) - angularX(previous)) > 0.24)) break
  }
  const direction = random() < 0.5 ? -1 : 1
  return {
    x, y, z,
    vx: direction * (0.95 + random() * 0.55),
    turnIn: 0.55 + random() * 0.7,
  }
}

export function stepSwitchingTarget(target, delta, random = Math.random) {
  target.turnIn -= delta
  if (target.turnIn <= 0) {
    target.vx = (random() < 0.5 ? -1 : 1) * (0.95 + random() * 0.7)
    target.turnIn = 0.45 + random() * 0.85
  }
  target.x += target.vx * delta
  if (target.x < SWITCHING_BOUNDS.minX || target.x > SWITCHING_BOUNDS.maxX) {
    target.x = Math.max(SWITCHING_BOUNDS.minX, Math.min(SWITCHING_BOUNDS.maxX, target.x))
    target.vx *= -1
  }
  return target
}

export function registerSwitchingHit(previousHits, headshot = false) {
  const hits = Math.min(SWITCHING_HITS_TO_KILL, previousHits + (headshot ? 2 : 1))
  return {
    hits,
    health: 1 - hits / SWITCHING_HITS_TO_KILL,
    destroyed: hits === SWITCHING_HITS_TO_KILL,
  }
}
