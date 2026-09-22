import assert from 'node:assert/strict'
import { createTrackingTarget, stepTrackingTarget } from '../../src/utils/trackingTarget.js'

const bounds = { minX: -2.2, maxX: 2.2, minY: 0, maxY: 2.5 }
let seed = 123456789
const random = () => {
  seed = (1664525 * seed + 1013904223) >>> 0
  return seed / 2 ** 32
}
const target = createTrackingTarget(bounds, random)
const positions = []

for (let frame = 0; frame < 60 * 120; frame++) {
  stepTrackingTarget(target, 1 / 60, bounds, random)
  assert.ok(target.x >= bounds.minX && target.x <= bounds.maxX)
  assert.ok(target.y >= bounds.minY && target.y <= bounds.maxY)
  if (frame % 60 === 0) positions.push([target.x, target.y])
}

const spanX = Math.max(...positions.map(([x]) => x)) - Math.min(...positions.map(([x]) => x))
const spanY = Math.max(...positions.map(([, y]) => y)) - Math.min(...positions.map(([, y]) => y))
assert.ok(spanX > 2.5 && spanY > 1.5, 'Target should explore the range instead of hovering in one area')
assert.ok(Number.isFinite(target.vx) && Number.isFinite(target.vy))

console.log({ status: 'PASS', samples: positions.length, spanX, spanY })
