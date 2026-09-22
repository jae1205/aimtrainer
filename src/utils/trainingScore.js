export const SCORE_MAX = 1000

const SCORE_TARGETS = {
  gridshot: { kills: 30, damage: 30, ttkFast: 0.45, ttkSlow: 2.2 },
  // Skeet targets need sustained tracking before they break. Its benchmarks
  // therefore use realistic 60-second tracking output instead of gridshot's
  // instant-hit target count.
  skeet: { kills: 20, damage: 22, ttkFast: 1.0, ttkSlow: 4.0 },
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value))
}

export function calculateTrainingScore({
  trainingMode = 'skeet',
  kills = 0,
  accuracy = 0,
  damage = 0,
  avgTtk = 0,
}) {
  const targets = SCORE_TARGETS[trainingMode] || SCORE_TARGETS.skeet
  const killRating = clamp01(kills / targets.kills)
  const accuracyRating = clamp01(accuracy / 100)
  const damageRating = clamp01(damage / targets.damage)
  const ttkRating = avgTtk > 0
    ? clamp01((targets.ttkSlow - avgTtk) / (targets.ttkSlow - targets.ttkFast))
    : 0

  return Math.round(
    SCORE_MAX * (
      killRating * 0.38 +
      accuracyRating * 0.27 +
      damageRating * 0.22 +
      ttkRating * 0.13
    ),
  )
}
