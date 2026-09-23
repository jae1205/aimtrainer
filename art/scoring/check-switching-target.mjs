import assert from 'node:assert/strict'
import {
  createSwitchingTarget,
  stepSwitchingTarget,
  registerSwitchingHit,
  SWITCHING_BOUNDS,
  SWITCHING_HITS_TO_KILL,
  SWITCHING_RESPAWN_DELAY,
} from '../../src/utils/switchingTarget.js'

let seed = 17
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 0x100000000
}

const targets = []
for (let i = 0; i < 4; i++) targets.push(createSwitchingTarget(i, targets, null, random))
for (const target of targets) {
  assert.ok(target.x >= SWITCHING_BOUNDS.minX && target.x <= SWITCHING_BOUNDS.maxX)
  assert.ok(target.y >= SWITCHING_BOUNDS.minY && target.y <= SWITCHING_BOUNDS.maxY)
  assert.ok(target.z >= SWITCHING_BOUNDS.minZ && target.z <= SWITCHING_BOUNDS.maxZ)
}
assert.ok(new Set(targets.map((target) => target.y.toFixed(2))).size > 1,
  'targets must spawn at varied heights')
for (let i = 0; i < targets.length; i++) {
  for (let j = i + 1; j < targets.length; j++) {
    const bearingA = targets[i].x / Math.abs(targets[i].z + 3)
    const bearingB = targets[j].x / Math.abs(targets[j].z + 3)
    assert.ok(Math.abs(bearingA - bearingB) > 0.18, 'visible targets must not overlap')
  }
}

const oldPosition = { ...targets[0] }
const respawn = createSwitchingTarget(0, targets.slice(1), oldPosition, random)
assert.ok(Math.abs(respawn.x / Math.abs(respawn.z + 3) - oldPosition.x / Math.abs(oldPosition.z + 3)) > 0.24)
const spawnY = respawn.y
const spawnZ = respawn.z
for (let i = 0; i < 2000; i++) stepSwitchingTarget(respawn, 1 / 60, random)
assert.ok(respawn.x >= SWITCHING_BOUNDS.minX && respawn.x <= SWITCHING_BOUNDS.maxX)
assert.equal(respawn.y, spawnY, 'movement must stay horizontal')
assert.equal(respawn.z, spawnZ, 'movement must stay horizontal')

let hits = 0
for (let shot = 1; shot <= SWITCHING_HITS_TO_KILL; shot++) {
  const result = registerSwitchingHit(hits)
  hits = result.hits
  assert.equal(result.destroyed, shot === SWITCHING_HITS_TO_KILL)
  assert.equal(result.health, 1 - shot / SWITCHING_HITS_TO_KILL)
}
assert.equal(registerSwitchingHit(hits).hits, SWITCHING_HITS_TO_KILL)
assert.equal(registerSwitchingHit(0, false).destroyed, false)
assert.equal(registerSwitchingHit(1, false).destroyed, true)
assert.equal(registerSwitchingHit(0, true).destroyed, true)
assert.equal(registerSwitchingHit(0, true).health, 0)
assert.ok(SWITCHING_RESPAWN_DELAY > 0)
console.log({ status: 'PASS', targets: targets.length, hitsToKill: SWITCHING_HITS_TO_KILL })
