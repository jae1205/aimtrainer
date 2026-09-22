import assert from 'node:assert/strict'
import { calculateTrainingScore, SCORE_MAX } from '../../src/utils/trainingScore.js'

const sameRun = { kills: 12, accuracy: 50, damage: 12, avgTtk: 1.8 }
const oldEquivalent = calculateTrainingScore({ trainingMode: 'gridshot', ...sameRun })
const skeetScore = calculateTrainingScore({ trainingMode: 'skeet', ...sameRun })

assert.ok(skeetScore > oldEquivalent + 150, 'Sustained skeet tracking must no longer be judged by gridshot targets')
assert.equal(calculateTrainingScore({ trainingMode: 'skeet' }), 0)
assert.equal(calculateTrainingScore({
  trainingMode: 'skeet', kills: 999, accuracy: 999, damage: 999, avgTtk: 0.5,
}), SCORE_MAX)
assert.ok(calculateTrainingScore({
  trainingMode: 'skeet', kills: 18, accuracy: 75, damage: 20, avgTtk: 1.5,
}) >= 850, 'A strong skeet round should produce a strong result')
assert.equal(calculateTrainingScore({ trainingMode: 'tracking', trackingPoints: 742 }), 742)
assert.equal(calculateTrainingScore({ trainingMode: 'tracking', trackingPoints: 1200 }), SCORE_MAX)

console.log({ status: 'PASS', oldEquivalent, skeetScore })
