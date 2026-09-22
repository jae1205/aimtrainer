const SPEED_MIN = 0.9
const SPEED_START_RANGE = 0.45
const SPEED_TURN_RANGE = 0.65

export function createTrackingTarget(bounds, random = Math.random) {
  const angle = random() * Math.PI * 2
  const speed = SPEED_MIN + random() * SPEED_START_RANGE
  return {
    x: bounds.minX + (bounds.maxX - bounds.minX) * (0.2 + random() * 0.6),
    y: bounds.minY + (bounds.maxY - bounds.minY) * (0.2 + random() * 0.6),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    desiredVx: Math.cos(angle) * speed,
    desiredVy: Math.sin(angle) * speed,
    turnIn: 0.35 + random() * 0.55,
  }
}

export function stepTrackingTarget(target, delta, bounds, random = Math.random) {
  target.turnIn -= delta
  if (target.turnIn <= 0) {
    const angle = random() * Math.PI * 2
    const speed = SPEED_MIN + random() * SPEED_TURN_RANGE
    target.desiredVx = Math.cos(angle) * speed
    target.desiredVy = Math.sin(angle) * speed
    target.turnIn = 0.35 + random() * 0.75
  }

  const blend = 1 - Math.exp(-4.5 * delta)
  target.vx += (target.desiredVx - target.vx) * blend
  target.vy += (target.desiredVy - target.vy) * blend
  target.x += target.vx * delta
  target.y += target.vy * delta

  if (target.x <= bounds.minX || target.x >= bounds.maxX) {
    target.x = Math.max(bounds.minX, Math.min(bounds.maxX, target.x))
    target.vx *= -1
    target.desiredVx = Math.sign(target.vx || 1) * Math.abs(target.desiredVx)
  }
  if (target.y <= bounds.minY || target.y >= bounds.maxY) {
    target.y = Math.max(bounds.minY, Math.min(bounds.maxY, target.y))
    target.vy *= -1
    target.desiredVy = Math.sign(target.vy || 1) * Math.abs(target.desiredVy)
  }

  return target
}
