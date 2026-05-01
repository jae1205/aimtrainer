import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { playComplete } from '../utils/sounds'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import Crosshair from './Crosshair'
import GunViewModel from './GunViewModel'
import { PerspectiveCamera } from '@react-three/drei'
import { useLanguage } from '../contexts/LanguageContext'
import * as THREE from 'three'

const CAMERA_CONFIG = { position: [0, 0, 0], fov: 75, near: 0.01, far: 1000 }
const PITCH_LIMIT = Math.PI / 2.2
const DURATION = 60
const NUM_BALLS = 4
const BALL_RADIUS = 0.2
const DRAIN_TIME = 1.5
const BAR_W = BALL_RADIUS * 2.25
const BAR_H = BALL_RADIUS * 0.45
const BAR_Y = BALL_RADIUS + 0.2
const BORDER = 0.015

const WALL_X   = 6
const FLOOR_Y  = -2.0
const CEIL_Y   = 4.5
const BACK_Z   = -12
const BG_DARK  = '#060D18'
const BG_LIGHT = '#f0f9ff'
const BALL_COLORS = [
  { key: 'red', labelKr: '빨강', labelEn: 'Red', value: '#ff4655' },
  { key: 'green', labelKr: '초록', labelEn: 'Green', value: '#22c55e' },
  { key: 'blue', labelKr: '파랑', labelEn: 'Blue', value: '#3b82f6' },
]
const BALL_SIZE_OPTIONS = [
  { key: 'small', labelKr: '작게', labelEn: 'Small', value: 0.14 },
  { key: 'medium', labelKr: '중간', labelEn: 'Medium', value: 0.2 },
  { key: 'large', labelKr: '크게', labelEn: 'Large', value: 0.32 },
]
const BALL_SPEED_OPTIONS = [
  { key: 'slow', labelKr: '느리게', labelEn: 'Slow', value: 0.7 },
  { key: 'medium', labelKr: '중간', labelEn: 'Medium', value: 1.0 },
  { key: 'fast', labelKr: '빠르게', labelEn: 'Fast', value: 1.5 },
]
const BALL_HP_OPTIONS = [
  { key: 'low', labelKr: '적게', labelEn: 'Low', value: 0.7 },
  { key: 'medium', labelKr: '중간', labelEn: 'Medium', value: 1.0 },
  { key: 'high', labelKr: '많게', labelEn: 'High', value: 2.0 },
]

function makeArc(dir) {
  const d = dir ?? (Math.random() > 0.5 ? 1 : -1)
  return {
    t: Math.random() * 0.8,
    speed: 0.2 + Math.random() * 0.15,
    p0: new THREE.Vector3(d * -(WALL_X + 1.2), -0.2 + (Math.random() - 0.5) * 1.2, -7),
    p2: new THREE.Vector3(d *  (WALL_X + 1.2), -0.2 + (Math.random() - 0.5) * 1.2, -7),
    peakY: 1.5 + Math.random() * 1.8,
  }
}

function bezierPos(arc, t) {
  const mt = 1 - t
  const p1x = (arc.p0.x + arc.p2.x) / 2
  const p1y = Math.max(arc.p0.y, arc.p2.y) + arc.peakY
  const p1z = (arc.p0.z + arc.p2.z) / 2
  return new THREE.Vector3(
    mt*mt*arc.p0.x + 2*mt*t*p1x + t*t*arc.p2.x,
    mt*mt*arc.p0.y + 2*mt*t*p1y + t*t*arc.p2.y,
    mt*mt*arc.p0.z + 2*mt*t*p1z + t*t*arc.p2.z,
  )
}

let _audioCtx = null
function playBeep(damagePct) {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const ctx = _audioCtx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 700 + damagePct * 900
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.06)
  } catch (_) {}
}

function PlayerController({ sensitivityMultiplier = 1 }) {
  const { camera } = useThree()
  const rotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const handleMouseMove = useCallback((e) => {
    if (!document.pointerLockElement) return
    const s = 0.07 * Math.PI / 180 * sensitivityMultiplier
    rotation.current.y -= e.movementX * s
    rotation.current.x -= e.movementY * s
    rotation.current.x = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, rotation.current.x))
    camera.rotation.copy(rotation.current)
  }, [camera, sensitivityMultiplier])
  useEffect(() => {
    camera.rotation.order = 'YXZ'
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [camera, handleMouseMove])
  return null
}

const GREEN  = new THREE.Color('#22c55e')
const YELLOW = new THREE.Color('#facc15')
const RED_HP = new THREE.Color('#ef4444')
const tmpColor = new THREE.Color()

function hpColor(hp) {
  if (hp > 0.5) return tmpColor.lerpColors(YELLOW, GREEN, (hp - 0.5) * 2).clone()
  return tmpColor.lerpColors(RED_HP, YELLOW, hp * 2).clone()
}

function Scene({ sensitivity, active, onDestroy, theme, speedMult = 1, drainMult = 1, ballRadius = BALL_RADIUS, ballColor = '#ff4655' }) {
  const barW = ballRadius * 2.25
  const barH = ballRadius * 0.45
  const barY = ballRadius + 0.2
  const groups  = useRef([])   // group per ball
  const spheres = useRef([])   // sphere meshes (for raycasting)
  const hpBgs   = useRef([])   // background bar planes
  const hpFills = useRef([])   // fill bar planes
  const barGroups = useRef([]) // bar groups (for billboard)

  const arcs    = useRef(Array.from({ length: NUM_BALLS }, (_, i) => makeArc(i % 2 === 0 ? 1 : -1)))
  const hp      = useRef(Array(NUM_BALLS).fill(1.0))
  const beep    = useRef(Array.from({ length: NUM_BALLS }, () => ({ last: -1 })))

  const { camera, raycaster } = useThree()

  const resetBall = useCallback((idx) => {
    arcs.current[idx] = { ...makeArc(), t: 0 }
    hp.current[idx] = 1.0
    beep.current[idx].last = -1
    const fill = hpFills.current[idx]
    if (fill) {
      fill.scale.x = 1
      fill.position.x = 0
      fill.material.color.copy(GREEN)
    }
  }, [])

  useFrame((_, delta) => {
    if (!active) return

    // ── Move balls + billboard bars ──────────────────────────────
    for (let i = 0; i < NUM_BALLS; i++) {
      const arc   = arcs.current[i]
      const group = groups.current[i]
      const bg    = barGroups.current[i]
      if (!group) continue

      arc.t += delta * arc.speed * speedMult
      const pos = bezierPos(arc, Math.min(arc.t, 1))
      if (arc.t >= 1 || (arc.t > 0.5 && Math.abs(pos.x) >= WALL_X)) {
        resetBall(i)
        continue
      }
      group.position.copy(pos)

      // Billboard: copy camera quaternion so bar always faces player
      if (bg) bg.quaternion.copy(camera.quaternion)
    }

    if (!document.pointerLockElement) return

    // ── Raycast ──────────────────────────────────────────────────
    raycaster.setFromCamera({ x: 0, y: 0 }, camera)
    const hits = new Set(
      raycaster.intersectObjects(spheres.current.filter(Boolean))
        .map(h => spheres.current.indexOf(h.object))
    )

    // ── Update HP ────────────────────────────────────────────────
    for (let i = 0; i < NUM_BALLS; i++) {
      const fill = hpFills.current[i]
      if (!fill) continue

      if (!hits.has(i)) {
        beep.current[i].last = -1   // reset beep so it fires again on next contact
        continue
      }

      // Drain HP
      hp.current[i] = Math.max(0, hp.current[i] - delta / (DRAIN_TIME * drainMult))
      const h = hp.current[i]
      const dmgPct = 1 - h

      // Update fill bar (left-aligned)
      fill.scale.x  = Math.max(0.001, h)
      fill.position.x = barW * (h - 1) / 2
      fill.material.color.copy(hpColor(h))

      // Beep (faster as HP drops)
      const interval = Math.max(0.12, 0.55 - dmgPct * 0.43)
      const b = beep.current[i]
      if (b.last < 0 || dmgPct - b.last >= interval) {
        playBeep(dmgPct)
        b.last = dmgPct
      }

      // Dead
      if (h <= 0) {
        onDestroy()
        resetBall(i)
      }
    }
  })

  return (
    <>
      <PlayerController sensitivityMultiplier={sensitivity} />
      <color attach="background" args={[theme === 'dark' ? BG_DARK : BG_LIGHT]} />
      <ambientLight intensity={theme === 'dark' ? 1.4 : 2.5} />
      <hemisphereLight args={theme === 'dark' ? ['#4a90d9', '#1a3a5c', 1.6] : ['#ffffff', '#bae6fd', 2.0]} />
      <directionalLight position={[0, 8, -6]} intensity={theme === 'dark' ? 2.0 : 2.5} color={theme === 'dark' ? '#ffffff' : '#ffffff'} />
      <pointLight position={[-4, 4, -6]} intensity={theme === 'dark' ? 2.0 : 1.5} color={theme === 'dark' ? '#60c8ff' : '#7dd3fc'} distance={16} />
      <pointLight position={[ 4, 4, -6]} intensity={theme === 'dark' ? 2.0 : 1.5} color={theme === 'dark' ? '#60c8ff' : '#7dd3fc'} distance={16} />
      <pointLight position={[ 0, 4, -10]} intensity={theme === 'dark' ? 1.5 : 1.2} color={theme === 'dark' ? '#4ab0e0' : '#93c5fd'} distance={14} />

      {/* ── Room ──────────────────────────────────────────────── */}
      {/* 뒷벽 */}
      <mesh position={[0, 1.5, BACK_Z]}>
        <planeGeometry args={[WALL_X * 2, CEIL_Y - FLOOR_Y]} />
        <meshStandardMaterial color={theme === 'dark' ? '#1a3a5c' : '#bae6fd'} roughness={0.9} />
      </mesh>
      {/* 왼쪽 벽 */}
      <mesh position={[-WALL_X, 1.5, BACK_Z / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[Math.abs(BACK_Z), CEIL_Y - FLOOR_Y]} />
        <meshStandardMaterial color={theme === 'dark' ? '#1e4060' : '#e0f2fe'} roughness={0.9} />
      </mesh>
      {/* 오른쪽 벽 */}
      <mesh position={[WALL_X, 1.5, BACK_Z / 2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[Math.abs(BACK_Z), CEIL_Y - FLOOR_Y]} />
        <meshStandardMaterial color={theme === 'dark' ? '#1e4060' : '#e0f2fe'} roughness={0.9} />
      </mesh>
      {/* 바닥 */}
      <mesh position={[0, FLOOR_Y, BACK_Z / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WALL_X * 2, Math.abs(BACK_Z)]} />
        <meshStandardMaterial color={theme === 'dark' ? '#102030' : '#f8fafc'} roughness={1} />
      </mesh>
      {/* 천장 */}
      <mesh position={[0, CEIL_Y, BACK_Z / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WALL_X * 2, Math.abs(BACK_Z)]} />
        <meshStandardMaterial color={theme === 'dark' ? '#1a3550' : '#e0f2fe'} roughness={0.9} />
      </mesh>

      {Array.from({ length: NUM_BALLS }, (_, i) => (
        <group key={i} ref={el => { groups.current[i] = el }}>
          {/* Ball sphere */}
          <mesh ref={el => { spheres.current[i] = el }}>
            <sphereGeometry args={[ballRadius, 24, 24]} />
            <meshStandardMaterial color={ballColor} roughness={0.6} metalness={0.2} />
          </mesh>

          {/* HP bar group — billboards via quaternion copy in useFrame */}
          <group ref={el => { barGroups.current[i] = el }} position={[0, barY, 0]}>
            {/* White border */}
            <mesh position={[0, 0, -0.01]}>
              <planeGeometry args={[barW + BORDER * 2, barH + BORDER * 2]} />
              <meshBasicMaterial color="#ffffff" depthTest={false} />
            </mesh>
            {/* Dark background */}
            <mesh ref={el => { hpBgs.current[i] = el }}>
              <planeGeometry args={[barW, barH]} />
              <meshBasicMaterial color="#111111" depthTest={false} />
            </mesh>
            {/* Fill */}
            <mesh ref={el => { hpFills.current[i] = el }} position={[0, 0, 0.01]}>
              <planeGeometry args={[barW, barH]} />
              <meshBasicMaterial color="#22c55e" depthTest={false} />
            </mesh>
          </group>
        </group>
      ))}
    </>
  )
}

export default function SkeetTrackingSim({ onComplete, sensitivity, theme = 'dark', onStatsChange }) {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const [score,    setScore]    = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [started,  setStarted]  = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isPointerLocked, setIsPointerLocked] = useState(false)
  const [completed, setCompleted] = useState(false)
  const containerRef  = useRef(null)
  const finalScoreRef = useRef(0)

  const [localSens, setLocalSens] = useState(sensitivity)
  const [sensEditing, setSensEditing] = useState(false)
  const [sensInput, setSensInput] = useState('')
  const [ballSize,  setBallSize]  = useState(0.20)
  const [ballSpeed, setBallSpeed] = useState(1.0)
  const [ballHP,    setBallHP]    = useState(1.0)
  const [ballColor, setBallColor] = useState(BALL_COLORS[0].value)
  const [localDpi, setLocalDpi] = useState(() => {
    const setup = JSON.parse(localStorage.getItem('userSetup') || '{"dpi":800,"valorantSens":0.5,"eDPI":400}')
    return setup.dpi || 800
  })

  const eDPI = Math.round(localDpi * localSens * 100) / 100
  const cm360 = eDPI > 0 ? 13063 / eDPI : 0
  const getSensLevel = (cm) => {
    if (cm > 65) return { label: lang === 'kr' ? '초저감도' : 'Very Low', color: '#94A3B8' }
    if (cm > 45) return { label: lang === 'kr' ? '저감도' : 'Low', color: '#38BDF8' }
    if (cm > 30) return { label: lang === 'kr' ? '중간' : 'Medium', color: '#4ADE80' }
    if (cm > 20) return { label: lang === 'kr' ? '중고감도' : 'Medium High', color: '#FBBF24' }
    if (cm > 15) return { label: lang === 'kr' ? '고감도' : 'High', color: '#F97316' }
    return { label: lang === 'kr' ? '초고감도' : 'Very High', color: '#F43F5E' }
  }
  const sensLevelInfo = getSensLevel(cm360)

  const handleSensChange = (val) => {
    setLocalSens(val)
    const setup = JSON.parse(localStorage.getItem('userSetup') || '{"dpi":800,"valorantSens":0.5,"eDPI":400}')
    setup.valorantSens = val
    setup.eDPI = Math.round(setup.dpi * val * 100) / 100
    localStorage.setItem('userSetup', JSON.stringify(setup))
  }

  const handleDpiChange = (dpi) => {
    setLocalDpi(dpi)
    const setup = JSON.parse(localStorage.getItem('userSetup') || '{"dpi":800,"valorantSens":0.5,"eDPI":400}')
    setup.dpi = dpi
    setup.eDPI = Math.round(dpi * setup.valorantSens * 100) / 100
    localStorage.setItem('userSetup', JSON.stringify(setup))
  }

  const bg       = theme === 'dark' ? 'bg-[#060D18]' : 'bg-[#f0f9ff]'
  const panelCls = theme === 'light'
    ? 'bg-white/95 border-[#DDD8D2] text-[#1A1F2E]'
    : 'bg-[#1B2E3D] border-[#2A3D4F] text-[#ECE8E1]'
  const sub = theme === 'light' ? 'text-[#1A1F2E]/60' : 'text-[#ECE8E1]/60'

  useEffect(() => { onStatsChange?.({ score, timeLeft }) }, [score, timeLeft, onStatsChange])

  useEffect(() => {
    const h = () => setIsPointerLocked(!!document.pointerLockElement)
    document.addEventListener('pointerlockchange', h)
    return () => document.removeEventListener('pointerlockchange', h)
  }, [])

  const requestLock = () => {
    if (!containerRef.current || isPointerLocked) return
    const el = containerRef.current
    const p  = el.requestPointerLock({ unadjustedMovement: true })
    if (p?.catch) p.catch(() => el.requestPointerLock())
  }

  useEffect(() => {
    if (!started || countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [started, countdown])

  useEffect(() => {
    if (!started || countdown !== 0 || !isPointerLocked) return
    const iv = setInterval(() => {
      setTimeLeft(p => { if (p <= 1) { clearInterval(iv); return 0 } return p - 1 })
    }, 1000)
    return () => clearInterval(iv)
  }, [started, countdown, isPointerLocked])

  useEffect(() => {
    if (!started || countdown !== 0 || timeLeft > 0) return
    if (document.pointerLockElement) document.exitPointerLock()
    window.dispatchEvent(new CustomEvent('test-end'))
    finalScoreRef.current = score
    playComplete()
    setCompleted(true)
  }, [started, countdown, timeLeft, score])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative ${bg} ${isPointerLocked ? 'cursor-none' : 'cursor-default'}`}
      onClick={requestLock}
    >
      {/* 완료 */}
      {completed && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className={`text-center p-8 rounded-3xl border shadow-2xl max-w-sm w-full mx-4 ${panelCls}`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#22D3EE] mb-2">{lang === 'kr' ? '결과' : 'Result'}</p>
            <h2 className="text-5xl font-black mb-2 text-[#22D3EE]">{finalScoreRef.current}</h2>
            <p className="text-sm text-slate-400 mb-6">{lang === 'kr' ? '파괴한 타겟 수' : 'Destroyed targets'}</p>
            <button
              type="button"
              onClick={() => navigate('/drills')}
              className="px-10 py-4 rounded-2xl bg-[#22D3EE] text-[#0A0F1E] font-bold hover:bg-[#22D3EE]/80 transition-all hover:scale-105 shadow-lg shadow-cyan-500/20"
            >
              {lang === 'kr' ? '목록으로' : 'Back to List'}
            </button>
          </div>
        </div>
      )}

      {/* 시작 모달 */}
      {!started && !completed && (
        <div className="absolute inset-0 z-30 flex items-center justify-center gap-4 bg-black/60 backdrop-blur-sm px-6">
          <div className={`p-6 rounded-3xl border shadow-2xl w-56 h-[384px] shrink-0 flex flex-col ${panelCls}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#22D3EE] mb-4">{lang === 'kr' ? '감도 설정' : 'Sensitivity'}</p>

            <div className="mb-5">
              <label className={`block text-[10px] font-semibold mb-2 uppercase tracking-wide ${sub}`}>DPI</label>
              <div className="grid grid-cols-2 gap-2">
                {[400, 800, 1600, 3200].map(dpi => (
                  <button
                    key={dpi}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDpiChange(dpi) }}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                      localDpi === dpi
                        ? 'bg-[#22D3EE] border-[#22D3EE] text-[#0A0F1E]'
                        : theme === 'light'
                          ? 'border-[#BAE6FD] text-[#1A1F2E] hover:border-[#22D3EE]'
                          : 'border-[#334155] text-[#ECE8E1] hover:border-[#22D3EE]'
                    }`}
                  >
                    {dpi}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <label className={`text-[10px] font-semibold uppercase tracking-wide ${sub}`}>
                  {lang === 'kr' ? '감도' : 'Sens'}
                </label>
                {sensEditing ? (
                  <input
                    autoFocus
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="10"
                    value={sensInput}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setSensInput(e.target.value)}
                    onBlur={() => {
                      const next = Math.min(10, Math.max(0.01, Number(sensInput) || localSens))
                      handleSensChange(Math.round(next * 1000) / 1000)
                      setSensEditing(false)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur()
                      if (e.key === 'Escape') setSensEditing(false)
                    }}
                    className="w-16 px-2 py-1 rounded bg-black/20 border border-[#22D3EE] text-[#22D3EE] text-sm font-bold text-right outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSensInput(String(localSens)); setSensEditing(true) }}
                    className="text-[#22D3EE] font-bold text-sm hover:underline"
                  >
                    {localSens.toFixed(2)}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleSensChange(Math.max(0.01, Math.round((localSens - 0.05) * 1000) / 1000)) }}
                  className="w-7 h-7 rounded-lg bg-[#22D3EE]/10 text-[#22D3EE] font-bold hover:bg-[#22D3EE]/20"
                >-</button>
                <input
                  type="range"
                  min="0.01"
                  max="2"
                  step="0.01"
                  value={localSens}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleSensChange(Number(e.target.value))}
                  className="flex-1 accent-[#22D3EE]"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleSensChange(Math.min(10, Math.round((localSens + 0.05) * 1000) / 1000)) }}
                  className="w-7 h-7 rounded-lg bg-[#22D3EE]/10 text-[#22D3EE] font-bold hover:bg-[#22D3EE]/20"
                >+</button>
              </div>
            </div>

            <div className="mt-auto space-y-2 text-xs">
              <div className="flex justify-between"><span className={sub}>eDPI</span><span className="font-bold">{eDPI}</span></div>
              <div className="flex justify-between"><span className={sub}>cm/360</span><span className="font-bold">{cm360.toFixed(1)}</span></div>
              <div className="flex justify-between"><span className={sub}>{lang === 'kr' ? '분류' : 'Level'}</span><span className="font-bold" style={{ color: sensLevelInfo.color }}>{sensLevelInfo.label}</span></div>
            </div>
          </div>

          <div className={`text-center p-8 rounded-3xl border shadow-2xl shrink-0 h-[384px] flex flex-col justify-center ${panelCls}`} style={{ width: 380 }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#22D3EE] mb-2">SKEET TRACKING</p>
            <h2 className="text-4xl font-black mb-3 text-[#22D3EE]">{lang === 'kr' ? '스키트 트래킹' : 'Skeet Tracking'}</h2>
            <p className={`text-sm mb-8 leading-relaxed ${sub}`}>
              {lang === 'kr' ? '호를 그리며 날아가는 타겟에 크로스헤어를 올리면 체력이 깎입니다.' : 'Track the moving balls with your crosshair to drain their health.'}<br />
              {lang === 'kr' ? '60초 동안 최대한 많이 파괴하세요.' : 'Destroy as many targets as possible in 60 seconds.'}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setStarted(true)
                setCountdown(3)
                setScore(0)
                setTimeLeft(DURATION)
                window.dispatchEvent(new CustomEvent('test-start'))
                requestLock()
              }}
              className="px-10 py-4 rounded-2xl bg-[#22D3EE] text-[#0A0F1E] font-bold hover:bg-[#22D3EE]/80 transition-all hover:scale-105 shadow-lg shadow-cyan-500/20"
            >
              {lang === 'kr' ? '시작' : 'Start'}
            </button>
          </div>

          <div className={`p-6 rounded-3xl border shadow-2xl w-56 h-[384px] shrink-0 flex flex-col ${panelCls}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#22D3EE] mb-4">{lang === 'kr' ? '커스텀 설정' : 'Custom Settings'}</p>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-center items-center mb-1.5">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${sub}`}>
                    {lang === 'kr' ? '공 색상' : 'Ball Color'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {BALL_COLORS.map((color) => (
                    <button
                      key={color.key}
                      type="button"
                      title={lang === 'kr' ? color.labelKr : color.labelEn}
                      aria-label={lang === 'kr' ? color.labelKr : color.labelEn}
                      onClick={(e) => { e.stopPropagation(); setBallColor(color.value) }}
                      className="py-1.5 rounded-lg text-[10px] font-bold border transition-all text-center"
                      style={{
                        background: ballColor === color.value ? color.value : 'transparent',
                        borderColor: ballColor === color.value ? color.value : (theme === 'light' ? '#BAE6FD' : '#334155'),
                        color: ballColor === color.value ? '#ffffff' : (theme === 'light' ? '#1A1F2E' : '#ECE8E1'),
                      }}
                    >
                      {lang === 'kr' ? color.labelKr : color.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-center items-center mb-1.5">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${sub}`}>
                    {lang === 'kr' ? '공 크기' : 'Ball Size'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {BALL_SIZE_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setBallSize(option.value) }}
                      className="py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                      style={{
                        background: ballSize === option.value ? '#22D3EE' : 'transparent',
                        borderColor: ballSize === option.value ? '#22D3EE' : (theme === 'light' ? '#BAE6FD' : '#334155'),
                        color: ballSize === option.value ? '#0A0F1E' : (theme === 'light' ? '#1A1F2E' : '#ECE8E1'),
                      }}
                    >
                      {lang === 'kr' ? option.labelKr : option.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-center items-center mb-1.5">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${sub}`}>
                    {lang === 'kr' ? '공 속도' : 'Ball Speed'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {BALL_SPEED_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setBallSpeed(option.value) }}
                      className="py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                      style={{
                        background: ballSpeed === option.value ? '#22D3EE' : 'transparent',
                        borderColor: ballSpeed === option.value ? '#22D3EE' : (theme === 'light' ? '#BAE6FD' : '#334155'),
                        color: ballSpeed === option.value ? '#0A0F1E' : (theme === 'light' ? '#1A1F2E' : '#ECE8E1'),
                      }}
                    >
                      {lang === 'kr' ? option.labelKr : option.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-center items-center mb-1.5">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${sub}`}>
                    {lang === 'kr' ? '공 체력' : 'Ball HP'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {BALL_HP_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setBallHP(option.value) }}
                      className="py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                      style={{
                        background: ballHP === option.value ? '#22D3EE' : 'transparent',
                        borderColor: ballHP === option.value ? '#22D3EE' : (theme === 'light' ? '#BAE6FD' : '#334155'),
                        color: ballHP === option.value ? '#0A0F1E' : (theme === 'light' ? '#1A1F2E' : '#ECE8E1'),
                      }}
                    >
                      {lang === 'kr' ? option.labelKr : option.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {started && !isPointerLocked && !completed && (
        <div className="absolute inset-0 z-[25] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="animate-bounce">
            <p className="text-[#0A0F1E] text-xl font-bold bg-[#22D3EE] px-6 py-3 rounded-2xl shadow-2xl">
              {lang === 'kr' ? '클릭해서 계속하기' : 'Click to continue'}
            </p>
          </div>
        </div>
      )}

      {started && countdown > 0 && (
        <div className="absolute inset-0 z-[26] flex items-center justify-center bg-black/60">
          <div className="text-white text-7xl font-black drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            {countdown}
          </div>
        </div>
      )}


      <Crosshair visible={started && countdown === 0 && isPointerLocked && !completed} />

      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        camera={CAMERA_CONFIG}
      >
        <color attach="background" args={[theme === 'dark' ? BG_DARK : BG_LIGHT]} />
        <Suspense fallback={null}>
          <GunViewModel active={started && isPointerLocked && countdown === 0 && !completed} shootTrigger={0} />
        </Suspense>
        {started && (
          <>
            <PerspectiveCamera makeDefault {...CAMERA_CONFIG} />
            <Scene
              sensitivity={localSens}
              active={countdown === 0 && !completed && isPointerLocked}
              onDestroy={() => setScore(s => s + 1)}
              theme={theme}
              speedMult={ballSpeed}
              drainMult={ballHP}
              ballRadius={ballSize}
              ballColor={ballColor}
            />
          </>
        )}
      </Canvas>
    </div>
  )
}
