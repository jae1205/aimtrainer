let audioCtx = null

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

/**
 * Valorant-style crisp hit tick — played on successful target hit
 */
export function playHit() {
  if (masterVolume === 0) return
  try {
    const ac = getCtx()
    const now = ac.currentTime

    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1400, now)
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.055)
    gain.gain.setValueAtTime(0.45 * masterVolume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055)
    osc.start(now)
    osc.stop(now + 0.055)

    const osc2 = ac.createOscillator()
    const gain2 = ac.createGain()
    osc2.connect(gain2)
    gain2.connect(ac.destination)
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(2800, now)
    osc2.frequency.exponentialRampToValueAtTime(1400, now + 0.04)
    gain2.gain.setValueAtTime(0.15 * masterVolume, now)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
    osc2.start(now)
    osc2.stop(now + 0.04)
  } catch (_) {}
}

/**
 * Miss / no-hit — low soft thud
 */
export function playMiss() {
  if (masterVolume === 0) return
  try {
    const ac = getCtx()
    const now = ac.currentTime

    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(260, now)
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.14)
    gain.gain.setValueAtTime(0.22 * masterVolume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
    osc.start(now)
    osc.stop(now + 0.14)
  } catch (_) {}
}

/**
 * Confirm / place marker — short upward chirp (Test 1 first click)
 */
export function playConfirm() {
  if (masterVolume === 0) return
  try {
    const ac = getCtx()
    const now = ac.currentTime

    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(480, now)
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.08)
    gain.gain.setValueAtTime(0.3 * masterVolume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
    osc.start(now)
    osc.stop(now + 0.1)
  } catch (_) {}
}

/**
 * Complete — double-tone success (Test 1 second click / test done)
 */
export function playComplete() {
  if (masterVolume === 0) return
  try {
    const ac = getCtx()
    const now = ac.currentTime

    const notes = [660, 880]
    notes.forEach((freq, i) => {
      const delay = i * 0.11
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + delay)
      gain.gain.setValueAtTime(0.35 * masterVolume, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1)
      osc.start(now + delay)
      osc.stop(now + delay + 0.12)
    })
  } catch (_) {}
}
