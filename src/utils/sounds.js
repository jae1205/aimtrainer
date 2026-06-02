let audioCtx = null
const SILENCE_GAIN = 0.0001
const DEFAULT_ATTACK = 0.004

// Master volume: 0.0 ~ 1.0, persisted in localStorage
let masterVolume = (() => {
  const saved = localStorage.getItem('soundVolume')
  return saved !== null ? parseFloat(saved) : 0.7
})()

export function setSoundVolume(v) {
  masterVolume = Math.max(0, Math.min(1, v))
}

export function getSoundVolume() {
  return masterVolume
}

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playTone(ac, {
  type = 'sine',
  frequency,
  endFrequency,
  startTime,
  duration,
  peakGain,
  attack = DEFAULT_ATTACK,
}) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  const attackEnd = startTime + Math.min(attack, duration * 0.45)
  const endTime = startTime + duration

  osc.type = type
  osc.frequency.setValueAtTime(Math.max(1, frequency), startTime)
  if (endFrequency) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), endTime)
  }

  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(peakGain * masterVolume, attackEnd)
  gain.gain.exponentialRampToValueAtTime(SILENCE_GAIN, endTime)

  osc.connect(gain)
  gain.connect(ac.destination)
  osc.onended = () => gain.disconnect()
  osc.start(startTime)
  osc.stop(endTime + 0.02)
}

/**
 * Valorant-style crisp hit tick — played on successful target hit
 */
export function playHit() {
  if (masterVolume === 0) return
  try {
    const ac = getCtx()
    const now = ac.currentTime + 0.002

    playTone(ac, {
      frequency: 1380,
      endFrequency: 780,
      startTime: now,
      duration: 0.06,
      peakGain: 0.26,
    })
    playTone(ac, {
      type: 'triangle',
      frequency: 2600,
      endFrequency: 1500,
      startTime: now,
      duration: 0.04,
      peakGain: 0.055,
      attack: 0.002,
    })
  } catch {}
}

export function playSkeetHit(damagePct) {
  if (masterVolume === 0) return
  try {
    const ac = getCtx()
    const now = ac.currentTime + 0.002
    const pct = Math.max(0, Math.min(1, damagePct))

    playTone(ac, {
      frequency: 860 + pct * 260,
      endFrequency: 1160 + pct * 420,
      startTime: now,
      duration: 0.07,
      peakGain: 0.115,
      attack: 0.006,
    })
    playTone(ac, {
      type: 'triangle',
      frequency: 1850 + pct * 420,
      endFrequency: 2350 + pct * 520,
      startTime: now + 0.004,
      duration: 0.045,
      peakGain: 0.025,
      attack: 0.004,
    })
  } catch {}
}

/**
 * Miss / no-hit — low soft thud
 */
export function playMiss() {
  if (masterVolume === 0) return
  try {
    const ac = getCtx()
    const now = ac.currentTime + 0.002

    playTone(ac, {
      frequency: 260,
      endFrequency: 95,
      startTime: now,
      duration: 0.14,
      peakGain: 0.14,
      attack: 0.006,
    })
  } catch {}
}

/**
 * Confirm / place marker — short upward chirp (Test 1 first click)
 */
export function playConfirm() {
  if (masterVolume === 0) return
  try {
    const ac = getCtx()
    const now = ac.currentTime + 0.002

    playTone(ac, {
      frequency: 520,
      endFrequency: 820,
      startTime: now,
      duration: 0.1,
      peakGain: 0.2,
      attack: 0.006,
    })
  } catch {}
}

/**
 * Complete — double-tone success (Test 1 second click / test done)
 */
export function playComplete() {
  if (masterVolume === 0) return
  try {
    const ac = getCtx()
    const now = ac.currentTime + 0.002

    const notes = [660, 880]
    notes.forEach((freq, i) => {
      const delay = i * 0.11
      playTone(ac, {
        frequency: freq,
        endFrequency: freq * 1.16,
        startTime: now + delay,
        duration: 0.12,
        peakGain: 0.24,
        attack: 0.006,
      })
    })
  } catch {}
}
