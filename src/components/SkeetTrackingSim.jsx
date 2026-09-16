import { lazy, memo, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Crosshair from './Crosshair'
import { useLanguage } from '../contexts/LanguageContext'
import { playComplete } from '../utils/sounds'

const SkeetTrackingCanvas = lazy(() => import('./SkeetTrackingCanvas'))

const DURATION = 60
const CANVAS_MOUNT_DELAY = 300
const PREPARE_FALLBACK_DELAY = 5000
const BALL_SPEED_FIXED = 1
const BALL_HP_FIXED = 0.343
const BALL_COLOR_FIXED = '#ff681f'
const BALL_SIZE_FIXED = 0.1
const BALL_COUNT_FIXED = 4
const ARC_HEIGHT_FIXED = { spread: 0.9, arc: 0.38, drop: 0.62 }
const SCORE_MAX = 1000
const SCORE_TARGETS = { kills: 30, damage: 30, ttkFast: 0.45, ttkSlow: 2.2 }

function clamp01(value) {
  return Math.max(0, Math.min(1, value))
}

function readSetup() {
  try {
    return JSON.parse(localStorage.getItem('userSetup') || '{"dpi":800,"valorantSens":0.5,"eDPI":400}')
  } catch {
    return { dpi: 800, valorantSens: 0.5, eDPI: 400 }
  }
}

function SkeetTrackingSim({ onComplete, sensitivity, theme = 'dark', onStatsChange }) {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [started, setStarted] = useState(true)
  const [countdown, setCountdown] = useState(0)
  const [isPointerLocked, setIsPointerLocked] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [isPreparing, setIsPreparing] = useState(true)
  const [canvasEnabled, setCanvasEnabled] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)
  const [viewModelReady, setViewModelReady] = useState(false)
  const [finalStats, setFinalStats] = useState(null)
  const containerRef = useRef(null)
  const roundStartedRef = useRef(false)
  const statsRef = useRef({ hitFrames: 0, activeFrames: 0, totalDamage: 0, ttks: [] })
  const handleDestroy = useCallback(() => setScore((current) => current + 1), [])
  const handleCanvasReady = useCallback(() => setCanvasReady(true), [])
  const handleViewModelReady = useCallback(() => setViewModelReady(true), [])

  const localSens = sensitivity
  const localDpi = readSetup().dpi || 800
  const bg = 'bg-[#0d1512]'

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
    e?.stopPropagation()
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
    roundStartedRef.current = false
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
      setCountdown(0)
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
    if (!started || isPreparing || completed || !isPointerLocked || roundStartedRef.current) return
    roundStartedRef.current = true
    setCountdown(3)
  }, [started, isPreparing, completed, isPointerLocked])

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
    const killRating = clamp01(kills / SCORE_TARGETS.kills)
    const accuracyRating = clamp01(accuracy / 100)
    const damageRating = clamp01(damage / SCORE_TARGETS.damage)
    const ttkRating = avgTtk > 0
      ? clamp01((SCORE_TARGETS.ttkSlow - avgTtk) / (SCORE_TARGETS.ttkSlow - SCORE_TARGETS.ttkFast))
      : 0
    const totalScore = Math.round(
      SCORE_MAX * (
        killRating * 0.38 +
        accuracyRating * 0.27 +
        damageRating * 0.22 +
        ttkRating * 0.13
      ),
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
        <div className="af-game-overlay af-result-overlay">
          <div className="af-result-card">
            <div className="af-result-header">
              <div><span>ROUND COMPLETE</span><h2>{lang === 'kr' ? '라운드 결과' : 'Round Result'}</h2></div>
              <small>SOLO / 60 SEC</small>
            </div>
            <div className="af-result-score">
              <span>{lang === 'kr' ? '총 점수' : 'Total Score'}</span>
              <div><strong>{finalStats.totalScore.toLocaleString()}</strong><small>/ {SCORE_MAX}</small></div>
            </div>
            <div className="af-result-grid">
              {[
                { labelKr: '처치 타겟', labelEn: 'Targets', value: String(finalStats.kills), unit: 'KILL' },
                { labelKr: '정확도', labelEn: 'Accuracy', value: finalStats.accuracy.toFixed(1), unit: '%' },
                { labelKr: '총 데미지', labelEn: 'Damage', value: finalStats.damage.toFixed(1), unit: 'HP' },
                { labelKr: '평균 처치 시간', labelEn: 'Avg TTK', value: finalStats.avgTtk > 0 ? finalStats.avgTtk.toFixed(2) : '—', unit: finalStats.avgTtk > 0 ? 'SEC' : '' },
              ].map(({ labelKr, labelEn, value, unit }) => (
                <div key={labelEn}>
                  <span>{lang === 'kr' ? labelKr : labelEn}</span>
                  <p><strong>{value}</strong>{unit && <small>{unit}</small>}</p>
                </div>
              ))}
            </div>
            <div className="af-result-actions">
              <button type="button" className="af-result-secondary" onClick={() => navigate('/')}>
                {lang === 'kr' ? '로비로' : 'Lobby'}
              </button>
              <button type="button" className="af-result-primary" onClick={startTraining}>
                {lang === 'kr' ? '다시 플레이' : 'Play Again'}<span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {started && isPreparing && !completed && (
        <div
          className="af-game-overlay af-preparing-overlay"
          role="status"
          aria-live="polite"
        >
          <div className="af-preparing-panel">
            <span className="af-preparing-spinner" />
            <div><strong>{lang === 'kr' ? '사격장 준비 중' : 'Preparing Range'}</strong><small>{lang === 'kr' ? '잠시만 기다려 주세요' : 'Please wait a moment'}</small></div>
          </div>
        </div>
      )}

      {started && !isPreparing && !isPointerLocked && !completed && (
        <div className="af-game-overlay af-pointer-overlay">
          <div className="af-pointer-prompt">
            <span aria-hidden="true">⌖</span>
            <div><strong>{lang === 'kr' ? '화면을 클릭하세요' : 'Click to Enter'}</strong><small>{lang === 'kr' ? '마우스를 잠그고 사격을 시작합니다' : 'Lock the mouse and begin'}</small></div>
          </div>
        </div>
      )}

      {started && !isPreparing && countdown > 0 && (
        <div className="af-countdown-overlay">
          <span>ROUND START</span><strong>{countdown}</strong>
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
            onDestroy={handleDestroy}
            ballSpeed={BALL_SPEED_FIXED}
            ballHP={BALL_HP_FIXED}
            ballSize={BALL_SIZE_FIXED}
            ballColor={BALL_COLOR_FIXED}
            numBalls={BALL_COUNT_FIXED}
            arcHeightCfg={ARC_HEIGHT_FIXED}
            statsRef={statsRef}
            onCanvasReady={handleCanvasReady}
            onViewModelReady={handleViewModelReady}
          />
        </Suspense>
      )}
    </div>
  )
}

export default memo(SkeetTrackingSim)
