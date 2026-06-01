import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Crosshair from './Crosshair'
import { useLanguage } from '../contexts/LanguageContext'
import { playComplete } from '../utils/sounds'

const SkeetTrackingCanvas = lazy(() => import('./SkeetTrackingCanvas'))

const DURATION = 60
const CANVAS_MOUNT_DELAY = 300
const PREPARE_FALLBACK_DELAY = 5000
const BALL_SPEED_FIXED = 0.8
const BALL_HP_FIXED = 0.7

const BALL_COLORS = [
  { key: 'red', labelKr: '빨강', labelEn: 'Red', value: '#ff4655' },
  { key: 'green', labelKr: '초록', labelEn: 'Green', value: '#22c55e' },
  { key: 'blue', labelKr: '파랑', labelEn: 'Blue', value: '#3b82f6' },
]

const BALL_SIZE_OPTIONS = [
  { key: 'small', labelKr: '작게', labelEn: 'Small', value: 0.1 },
  { key: 'medium', labelKr: '중간', labelEn: 'Medium', value: 0.15 },
  { key: 'large', labelKr: '크게', labelEn: 'Large', value: 0.2 },
]

const BALL_COUNT_OPTIONS = [
  { key: '2', labelKr: '2개', labelEn: '2', value: 2 },
  { key: '4', labelKr: '4개', labelEn: '4', value: 4 },
  { key: '6', labelKr: '6개', labelEn: '6', value: 6 },
]

const ARC_HEIGHT_CFG = {
  low: { spread: 0.55 },
  medium: { spread: 0.78 },
  high: { spread: 1.0 },
}

const ARC_HEIGHT_OPTIONS = [
  { key: 'low', labelKr: '낮음', labelEn: 'Low', value: 'low' },
  { key: 'medium', labelKr: '중간', labelEn: 'Medium', value: 'medium' },
  { key: 'high', labelKr: '높음', labelEn: 'High', value: 'high' },
]

function readSetup() {
  try {
    return JSON.parse(localStorage.getItem('userSetup') || '{"dpi":800,"valorantSens":0.5,"eDPI":400}')
  } catch {
    return { dpi: 800, valorantSens: 0.5, eDPI: 400 }
  }
}

function getSensLevel(cm, lang) {
  if (cm > 65) return { label: lang === 'kr' ? '초저감도' : 'Very Low', color: '#94A3B8' }
  if (cm > 45) return { label: lang === 'kr' ? '저감도' : 'Low', color: '#38BDF8' }
  if (cm > 30) return { label: lang === 'kr' ? '중간' : 'Medium', color: '#4ADE80' }
  if (cm > 20) return { label: lang === 'kr' ? '중고감도' : 'Medium High', color: '#FBBF24' }
  if (cm > 15) return { label: lang === 'kr' ? '고감도' : 'High', color: '#F97316' }
  return { label: lang === 'kr' ? '초고감도' : 'Very High', color: '#F43F5E' }
}

function OptionGrid({ label, options, current, setValue, colorMode, theme, lang, sub }) {
  return (
    <div>
      <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${sub}`}>{label}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {options.map((opt) => {
          const active = current === opt.value
          const bg = active ? (colorMode ? opt.value : '#22D3EE') : 'transparent'
          const border = active ? (colorMode ? opt.value : '#22D3EE') : (theme === 'light' ? '#CBD5E1' : '#334155')
          const color = active ? '#fff' : (theme === 'light' ? '#151A21' : '#F4F7FA')

          return (
            <button
              key={opt.key}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setValue(opt.value)
              }}
              className="py-1.5 rounded-lg text-[10px] font-bold border transition-all"
              style={{ background: bg, borderColor: border, color }}
            >
              {lang === 'kr' ? opt.labelKr : opt.labelEn}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function SkeetTrackingSim({ onComplete, sensitivity, theme = 'dark', onStatsChange }) {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [started, setStarted] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isPointerLocked, setIsPointerLocked] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [canvasEnabled, setCanvasEnabled] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)
  const [viewModelReady, setViewModelReady] = useState(false)
  const [finalStats, setFinalStats] = useState(null)
  const containerRef = useRef(null)
  const statsRef = useRef({ hitFrames: 0, activeFrames: 0, totalDamage: 0, ttks: [] })

  const [localSens, setLocalSens] = useState(sensitivity)
  const [sensEditing, setSensEditing] = useState(false)
  const [sensInput, setSensInput] = useState('')
  const [ballSize, setBallSize] = useState(0.15)
  const [numBalls, setNumBalls] = useState(4)
  const [arcHeight, setArcHeight] = useState('medium')
  const [ballColor, setBallColor] = useState(BALL_COLORS[0].value)
  const [localDpi, setLocalDpi] = useState(() => readSetup().dpi || 800)

  const arcHeightCfg = ARC_HEIGHT_CFG[arcHeight]
  const eDPI = Math.round(localDpi * localSens * 100) / 100
  const cm360 = eDPI > 0 ? 13063 / eDPI : 0
  const sensLevelInfo = getSensLevel(cm360, lang)

  const bg = theme === 'dark' ? 'bg-[#080B10]' : 'bg-[#F4F7F9]'
  const panelCls = theme === 'light'
    ? 'bg-white/95 border-[#D7E0E8] text-[#151A21]'
    : 'bg-[#111820] border-[#27313A] text-[#F4F7FA]'
  const sub = theme === 'light' ? 'text-[#151A21]/60' : 'text-[#AAB4C0]/70'

  const handleSensChange = useCallback((val) => {
    const next = Math.min(10, Math.max(0.01, val))
    setLocalSens(next)

    const setup = readSetup()
    setup.valorantSens = next
    setup.eDPI = Math.round(setup.dpi * next * 100) / 100
    localStorage.setItem('userSetup', JSON.stringify(setup))
  }, [])

  const handleDpiChange = useCallback((dpi) => {
    setLocalDpi(dpi)

    const setup = readSetup()
    setup.dpi = dpi
    setup.eDPI = Math.round(dpi * setup.valorantSens * 100) / 100
    localStorage.setItem('userSetup', JSON.stringify(setup))
  }, [])

  const requestLock = useCallback(() => {
    if (!containerRef.current || isPointerLocked) return

    const el = containerRef.current
    try {
      const p = el.requestPointerLock({ unadjustedMovement: true })
      if (p?.catch) {
        p.catch(() => {
          try {
            el.requestPointerLock()
          } catch {}
        })
      }
    } catch {
      try {
        el.requestPointerLock()
      } catch {}
    }
  }, [isPointerLocked])

  const startTraining = useCallback((e) => {
    e.stopPropagation()
    statsRef.current = { hitFrames: 0, activeFrames: 0, totalDamage: 0, ttks: [] }
    setFinalStats(null)
    setCompleted(false)
    setStarted(true)
    setCountdown(0)
    setScore(0)
    setTimeLeft(DURATION)
    setIsPreparing(true)
    setCanvasEnabled(false)
    setCanvasReady(false)
    setViewModelReady(false)
    requestLock()
  }, [requestLock])

  useEffect(() => {
    onStatsChange?.({ score, timeLeft })
  }, [score, timeLeft, onStatsChange])

  useEffect(() => {
    const handler = () => setIsPointerLocked(!!document.pointerLockElement)
    document.addEventListener('pointerlockchange', handler)
    return () => document.removeEventListener('pointerlockchange', handler)
  }, [])

  useEffect(() => {
    if (!isPreparing || canvasEnabled) return undefined

    const timeoutId = window.setTimeout(() => setCanvasEnabled(true), CANVAS_MOUNT_DELAY)
    return () => window.clearTimeout(timeoutId)
  }, [isPreparing, canvasEnabled])

  useEffect(() => {
    if (!isPreparing || !canvasReady || !viewModelReady) return undefined

    const timeoutId = window.setTimeout(() => {
      setIsPreparing(false)
      setCountdown(3)
      window.dispatchEvent(new CustomEvent('test-start'))
    }, 150)

    return () => window.clearTimeout(timeoutId)
  }, [isPreparing, canvasReady, viewModelReady])

  useEffect(() => {
    if (!isPreparing || !canvasEnabled || (canvasReady && viewModelReady)) return undefined

    const timeoutId = window.setTimeout(() => {
      setCanvasReady(true)
      setViewModelReady(true)
    }, PREPARE_FALLBACK_DELAY)

    return () => window.clearTimeout(timeoutId)
  }, [isPreparing, canvasEnabled, canvasReady, viewModelReady])

  useEffect(() => {
    if (!started || isPreparing || countdown <= 0) return undefined

    const timeoutId = window.setTimeout(() => setCountdown((current) => current - 1), 1000)
    return () => window.clearTimeout(timeoutId)
  }, [started, isPreparing, countdown])

  useEffect(() => {
    if (!started || isPreparing || countdown !== 0 || !isPointerLocked) return undefined

    const intervalId = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [started, isPreparing, countdown, isPointerLocked])

  useEffect(() => {
    if (!started || isPreparing || countdown !== 0 || timeLeft > 0) return

    if (document.pointerLockElement) document.exitPointerLock()
    window.dispatchEvent(new CustomEvent('test-end'))
    playComplete()

    const st = statsRef.current
    const kills = score
    const kps = kills / DURATION
    const accuracy = st.activeFrames > 0 ? (st.hitFrames / st.activeFrames) * 100 : 0
    const damage = st.totalDamage
    const spm = kills
    const avgTtk = st.ttks.length > 0 ? st.ttks.reduce((a, b) => a + b, 0) / st.ttks.length : 0
    const totalScore = Math.round(
      kills * 500 +
      accuracy * 20 +
      (avgTtk > 0 ? (3 / avgTtk) * 100 : 0) +
      damage * 80,
    )
    const stats = { kills, kps, accuracy, damage, spm, avgTtk, totalScore }
    setFinalStats(stats)
    onComplete?.(stats)
    setCompleted(true)
  }, [started, isPreparing, countdown, timeLeft, score, onComplete])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative ${bg} ${isPointerLocked ? 'cursor-none' : 'cursor-default'}`}
      onClick={requestLock}
    >
      {completed && finalStats && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className={`w-full max-w-2xl overflow-hidden rounded-3xl border shadow-2xl ${panelCls}`}>
            <div className="px-8 pt-7 pb-5 text-center border-b" style={{ borderColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}>
              <p className="text-base font-bold uppercase tracking-widest text-[#22D3EE] mb-3">
                {lang === 'kr' ? '스키트 트래킹 결과' : 'Skeet Tracking Result'}
              </p>
              <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${sub}`}>
                {lang === 'kr' ? '총 점수' : 'Total Score'}
              </p>
              <p className="text-7xl font-black text-[#22D3EE] tabular-nums leading-none">
                {finalStats.totalScore.toLocaleString()}
              </p>
              <p className={`text-sm mt-2 font-semibold ${sub}`}>{lang === 'kr' ? '점' : 'pts'}</p>
            </div>

            <div className="grid grid-cols-2 border-b" style={{ borderColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}>
              {[
                { labelKr: '킬 수', labelEn: 'Kill Count', value: String(finalStats.kills), unit: 'kill' },
                { labelKr: '정확도', labelEn: 'Accuracy', value: finalStats.accuracy.toFixed(1), unit: '%' },
                { labelKr: '데미지', labelEn: 'Damage', value: finalStats.damage.toFixed(1), unit: 'HP' },
                {
                  labelKr: '평균 처치 시간',
                  labelEn: 'Avg TTK',
                  value: finalStats.avgTtk > 0 ? finalStats.avgTtk.toFixed(2) : '-',
                  unit: finalStats.avgTtk > 0 ? 's' : '',
                },
              ].map(({ labelKr, labelEn, value, unit }) => (
                <div
                  key={labelEn}
                  className="flex flex-col items-center justify-center py-5 gap-1 border-t odd:border-r first:border-t-0"
                  style={{ borderColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }}
                >
                  <p className={`text-[10px] font-semibold uppercase tracking-widest ${sub}`}>
                    {lang === 'kr' ? labelKr : labelEn}
                  </p>
                  <p className="text-3xl font-black text-[#22D3EE] tabular-nums leading-none">{value}</p>
                  <p className={`text-[11px] font-medium ${sub}`}>{unit}</p>
                </div>
              ))}
            </div>

            <div className="px-8 py-4 flex justify-center">
              <button
                type="button"
                onClick={() => navigate('/drills')}
                className="px-8 py-2 rounded-xl bg-[#22D3EE] text-[#071013] text-sm font-bold hover:bg-[#22D3EE]/80 transition-all hover:scale-[1.02] shadow-lg shadow-cyan-500/20"
              >
                {lang === 'kr' ? '목록으로' : 'Back to List'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!started && !completed && (
        <div className={`absolute inset-0 z-30 flex items-center justify-center backdrop-blur-sm px-6 ${
          theme === 'light' ? 'bg-[#EAF3F7]/68' : 'bg-black/60'
        }`}>
          <div className="flex flex-col lg:flex-row items-stretch gap-4">
            <div className={`p-4 rounded-3xl border shadow-2xl w-full lg:w-56 shrink-0 flex flex-col gap-3 ${panelCls}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#22D3EE]">
                {lang === 'kr' ? '감도 설정' : 'Sensitivity'}
              </p>

              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-wide mb-2 ${sub}`}>DPI</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[400, 800, 1600, 3200].map((dpi) => (
                    <button
                      key={dpi}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDpiChange(dpi)
                      }}
                      className="py-1.5 rounded-lg text-xs font-bold border transition-all"
                      style={{
                        background: localDpi === dpi ? '#22D3EE' : 'transparent',
                        borderColor: localDpi === dpi ? '#22D3EE' : (theme === 'light' ? '#CBD5E1' : '#334155'),
                        color: localDpi === dpi ? '#071013' : (theme === 'light' ? '#151A21' : '#F4F7FA'),
                      }}
                    >
                      {dpi}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-[10px] font-semibold uppercase tracking-wide ${sub}`}>
                    {lang === 'kr' ? '감도' : 'Sensitivity'}
                  </p>
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
                      className="w-14 px-1.5 py-0.5 rounded border border-[#22D3EE] text-[#22D3EE] text-sm font-bold text-right outline-none"
                      style={{ background: theme === 'light' ? '#fff' : '#080B10' }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSensInput(String(localSens))
                        setSensEditing(true)
                      }}
                      className="text-[#22D3EE] font-bold text-sm tabular-nums hover:opacity-75 transition-opacity"
                    >
                      {localSens.toFixed(2)}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSensChange(Math.round((localSens - 0.01) * 1000) / 1000)
                    }}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold shrink-0 transition-opacity hover:opacity-75"
                    style={{ background: theme === 'light' ? '#E0F2FE' : '#1E293B', color: '#22D3EE' }}
                  >
                    -
                  </button>
                  <div className="relative flex-1 h-5 flex items-center">
                    <div className="absolute w-full h-1 rounded-full" style={{ background: theme === 'light' ? '#CBD5E1' : '#1E293B' }} />
                    <div className="absolute h-1 rounded-full bg-[#22D3EE]" style={{ width: `${Math.min(100, (localSens / 2) * 100)}%` }} />
                    <input
                      type="range"
                      min="0.01"
                      max="2"
                      step="0.01"
                      value={localSens}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleSensChange(Number(e.target.value))}
                      className="absolute w-full h-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="absolute w-3 h-3 rounded-full border-2 border-white bg-[#22D3EE] pointer-events-none shadow"
                      style={{ left: `calc(${Math.min(100, (localSens / 2) * 100)}% - 6px)` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSensChange(Math.round((localSens + 0.01) * 1000) / 1000)
                    }}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold shrink-0 transition-opacity hover:opacity-75"
                    style={{ background: theme === 'light' ? '#E0F2FE' : '#1E293B', color: '#22D3EE' }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-auto pt-2.5 border-t" style={{ borderColor: theme === 'light' ? '#E2E8F0' : '#1E293B' }}>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className={sub}>eDPI</span>
                    <span className="font-bold tabular-nums">{eDPI}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={sub}>cm / 360°</span>
                    <span className="font-bold tabular-nums">{cm360.toFixed(1)} cm</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={sub}>{lang === 'kr' ? '수준' : 'Level'}</span>
                    <span className="font-bold" style={{ color: sensLevelInfo.color }}>{sensLevelInfo.label}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`text-center p-6 rounded-3xl border shadow-2xl shrink-0 flex flex-col justify-center ${panelCls}`} style={{ width: 360 }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#22D3EE] mb-2">SKEET TRACKING</p>
              <h2 className="text-3xl font-black mb-2.5 text-[#22D3EE]">
                {lang === 'kr' ? '스키트 트래킹' : 'Skeet Tracking'}
              </h2>
              <p className={`text-sm mb-5 leading-relaxed ${sub}`}>
                {lang === 'kr'
                  ? '호를 그리며 날아가는 타겟에 크로스헤어를 올리면 체력이 깎입니다.'
                  : 'Track the moving balls with your crosshair to drain their health.'}
                <br />
                {lang === 'kr' ? '60초 동안 최대한 많이 파괴하세요.' : 'Destroy as many targets as possible in 60 seconds.'}
              </p>
              <button
                type="button"
                onClick={startTraining}
                className="px-5 py-2 rounded-xl bg-[#22D3EE] text-[#071013] text-sm font-bold hover:bg-[#22D3EE]/80 transition-all hover:scale-[1.02] shadow-lg shadow-cyan-500/20"
              >
                {lang === 'kr' ? '시작' : 'Start'}
              </button>
            </div>

            <div className={`p-4 rounded-3xl border shadow-2xl w-full lg:w-56 shrink-0 flex flex-col gap-3 ${panelCls}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#22D3EE]">
                {lang === 'kr' ? '커스텀 설정' : 'Custom'}
              </p>
              <OptionGrid label={lang === 'kr' ? '공 색상' : 'Ball Color'} options={BALL_COLORS} current={ballColor} setValue={setBallColor} colorMode theme={theme} lang={lang} sub={sub} />
              <OptionGrid label={lang === 'kr' ? '공 크기' : 'Ball Size'} options={BALL_SIZE_OPTIONS} current={ballSize} setValue={setBallSize} theme={theme} lang={lang} sub={sub} />
              <OptionGrid label={lang === 'kr' ? '공 수' : 'Ball Count'} options={BALL_COUNT_OPTIONS} current={numBalls} setValue={setNumBalls} theme={theme} lang={lang} sub={sub} />
              <OptionGrid label={lang === 'kr' ? '이동 높이' : 'Target Height'} options={ARC_HEIGHT_OPTIONS} current={arcHeight} setValue={setArcHeight} theme={theme} lang={lang} sub={sub} />
            </div>
          </div>
        </div>
      )}

      {started && isPreparing && !completed && (
        <div
          className={`absolute inset-0 z-[32] flex items-center justify-center backdrop-blur-md px-6 ${
            theme === 'light' ? 'bg-[#EAF3F7]/88' : 'bg-[#06111F]/92'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className={`w-full max-w-sm rounded-3xl border px-7 py-6 text-center shadow-2xl ${panelCls}`}>
            <div className="mx-auto mb-5 h-12 w-12 rounded-full border-4 border-[#22D3EE]/20 border-t-[#22D3EE] animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#22D3EE] mb-2">
              {lang === 'kr' ? '훈련 화면 준비 중' : 'Preparing Training'}
            </p>
            <div className="mt-5 flex justify-center gap-1.5">
              <span className="h-1.5 w-8 rounded-full bg-[#22D3EE] animate-pulse" />
              <span className="h-1.5 w-8 rounded-full bg-[#22D3EE]/60 animate-pulse [animation-delay:120ms]" />
              <span className="h-1.5 w-8 rounded-full bg-[#22D3EE]/30 animate-pulse [animation-delay:240ms]" />
            </div>
          </div>
        </div>
      )}

      {started && !isPreparing && !isPointerLocked && !completed && (
        <div className={`absolute inset-0 z-[25] pointer-events-none flex items-center justify-center backdrop-blur-[2px] ${
          theme === 'light' ? 'bg-white/20' : 'bg-black/25'
        }`}>
          <div className="animate-bounce">
            <p className="text-[#071013] text-xl font-bold bg-[#22D3EE] px-6 py-3 rounded-2xl shadow-2xl">
              {lang === 'kr' ? '클릭해서 계속하기' : 'Click to continue'}
            </p>
          </div>
        </div>
      )}

      {started && !isPreparing && countdown > 0 && (
        <div className={`absolute inset-0 z-[26] flex items-center justify-center ${
          theme === 'light' ? 'bg-white/35' : 'bg-black/60'
        }`}>
          <div className={`${theme === 'light' ? 'text-[#071013]' : 'text-white'} text-7xl font-black drop-shadow-[0_0_20px_rgba(0,0,0,0.45)]`}>
            {countdown}
          </div>
        </div>
      )}

      <Crosshair visible={started && !isPreparing && countdown === 0 && isPointerLocked && !completed} />

      {started && !completed && canvasEnabled && (
        <Suspense fallback={null}>
          <SkeetTrackingCanvas
            theme={theme}
            sensitivity={localSens}
            dpi={localDpi}
            active={!isPreparing && countdown === 0 && !completed && isPointerLocked}
            viewModelActive={!isPreparing && isPointerLocked && countdown === 0}
            onDestroy={() => setScore((current) => current + 1)}
            ballSpeed={BALL_SPEED_FIXED}
            ballHP={BALL_HP_FIXED}
            ballSize={ballSize}
            ballColor={ballColor}
            numBalls={numBalls}
            arcHeightCfg={arcHeightCfg}
            statsRef={statsRef}
            onCanvasReady={() => setCanvasReady(true)}
            onViewModelReady={() => setViewModelReady(true)}
          />
        </Suspense>
      )}
    </div>
  )
}
