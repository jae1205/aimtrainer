import { lazy, memo, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import Crosshair from './Crosshair'
import { useLanguage } from '../contexts/LanguageContext'
import { playComplete } from '../utils/sounds'
import { calculateTrainingScore, SCORE_MAX } from '../utils/trainingScore'

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
const createStats = () => ({
  hitFrames: 0, activeFrames: 0, totalDamage: 0, ttks: [],
  headshots: 0,
  trackingSeconds: 0, currentTrackSeconds: 0, longestTrackSeconds: 0,
})
function createScoreStore() {
  let value = 0
  const listeners = new Set()
  return {
    getSnapshot: () => value,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    set: (nextValue) => {
      if (nextValue === value) return
      value = nextValue
      listeners.forEach((listener) => listener())
    },
  }
}

const ScoreValue = memo(function ScoreValue({ store }) {
  const score = useSyncExternalStore(store.subscribe, store.getSnapshot)
  return <strong>{score}</strong>
})

function readSetup() {
  try {
    return JSON.parse(localStorage.getItem('userSetup') || '{"dpi":800,"valorantSens":0.5,"eDPI":400}')
  } catch {
    return { dpi: 800, valorantSens: 0.5, eDPI: 400 }
  }
}

const FpsCounter = memo(function FpsCounter({ active }) {
  const [fps, setFps] = useState(0)
  useEffect(() => {
    if (!active) {
      setFps(0)
      return undefined
    }

    let frameCount = 0
    let lastTime = performance.now()
    let frameId
    const loop = () => {
      frameCount++
      const now = performance.now()
      if (now - lastTime >= 500) {
        setFps(Math.round(frameCount * 1000 / (now - lastTime)))
        frameCount = 0
        lastTime = now
      }
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [active])
  return <strong>{active ? fps : '—'}</strong>
})

function SkeetTrackingSim({ onComplete, sensitivity, theme = 'dark', trainingMode = 'skeet' }) {
  const navigate = useNavigate()
  const { lang, t } = useLanguage()
  const [scoreStore] = useState(createScoreStore)
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
  const statsRef = useRef(createStats())
  const handleDestroy = useCallback(() => scoreStore.set(scoreStore.getSnapshot() + 1), [scoreStore])
  const handleTrackingScore = useCallback((nextScore) => scoreStore.set(nextScore), [scoreStore])
  const handleCanvasReady = useCallback(() => setCanvasReady(true), [])
  const handleViewModelReady = useCallback(() => setViewModelReady(true), [])

  const localSens = sensitivity
  const localDpi = readSetup().dpi || 800
  const bg = 'bg-[#0d1512]'
  const isGridshot = trainingMode === 'gridshot'
  const isTracking = trainingMode === 'tracking'
  const isSwitching = trainingMode === 'switching'
  const trainingName = lang === 'kr'
    ? (isGridshot ? '그리드' : isTracking ? '랜덤 트래킹' : isSwitching ? '동적 스위칭' : '스키트')
    : (isGridshot ? 'Grid' : isTracking ? 'Random Tracking' : isSwitching ? 'Dynamic Switching' : 'Skeet')

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
    statsRef.current = createStats()
    setFinalStats(null)
    setCompleted(false)
    setStarted(true)
    setCountdown(0)
    scoreStore.set(0)
    setTimeLeft(DURATION)
    setIsPreparing(true)
    setCanvasEnabled(false)
    setCanvasReady(false)
    setViewModelReady(false)
    roundStartedRef.current = false
    requestLock()
  }, [requestLock, scoreStore])

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
    const kills = isTracking ? 0 : scoreStore.getSnapshot()
    const shots = st.activeFrames
    const kps = kills / DURATION
    const accuracy = st.activeFrames > 0 ? (st.hitFrames / st.activeFrames) * 100 : 0
    const damage = st.totalDamage
    const spm = kills
    const avgTtk = st.ttks.length > 0 ? st.ttks.reduce((a, b) => a + b, 0) / st.ttks.length : 0
    const trackingPoints = isTracking
      ? Math.min(SCORE_MAX, Math.round(st.trackingSeconds * SCORE_MAX / DURATION))
      : 0
    const totalScore = calculateTrainingScore({ trainingMode, kills, accuracy, damage, avgTtk, trackingPoints })
    const stats = {
      kills, shots, kps, accuracy, damage, spm, avgTtk, totalScore, trainingMode,
      headshots: st.headshots,
      trackingPoints, trackingSeconds: st.trackingSeconds, longestTrackSeconds: st.longestTrackSeconds,
    }
    setFinalStats(stats)
    onComplete?.(stats)
    setCompleted(true)
  }, [started, isPreparing, countdown, timeLeft, scoreStore, onComplete, trainingMode, isTracking])

  return (
    <div
      ref={containerRef}
      data-training-mode={trainingMode}
      className={`w-full h-full relative ${bg} ${isPointerLocked ? 'cursor-none' : 'cursor-default'}`}
      onClick={requestLock}
    >
      <div className={`af-game-hud ${started && !isPreparing && !completed ? 'is-visible' : ''}`}>
        <div className="af-hud-item af-hud-fps"><span>FPS</span><FpsCounter active={started && !isPreparing && !completed && isPointerLocked && countdown === 0} /></div>
        <div className="af-hud-item"><span>{isTracking ? (lang === 'kr' ? '추적 점수' : 'TRACK SCORE') : t.hudTargets}</span><ScoreValue store={scoreStore} />{!isTracking && t.hudTargetUnit && <small>{t.hudTargetUnit}</small>}</div>
        <div className="af-hud-item af-hud-time"><span>{t.hudTimeLeft}</span><strong>{timeLeft}</strong><small>{t.hudTimeUnit}</small></div>
      </div>
      {completed && finalStats && (
        <div className="af-game-overlay af-result-overlay">
          <div className="af-result-card">
            <div className="af-result-header">
              <div><span>ROUND COMPLETE</span><h2>{trainingName} {lang === 'kr' ? '결과' : 'Result'}</h2></div>
              <small>{trainingMode.toUpperCase()} / 60 SEC</small>
            </div>
            <div className="af-result-score">
              <span>{lang === 'kr' ? '총 점수' : 'Total Score'}</span>
              <div><strong>{finalStats.totalScore.toLocaleString()}</strong><small>/ {SCORE_MAX}</small></div>
            </div>
            <div className="af-result-grid">
              {(isGridshot ? [
                { labelKr: '처치 타겟', labelEn: 'Targets', value: String(finalStats.kills), unit: 'HIT' },
                { labelKr: '명중률', labelEn: 'Accuracy', value: finalStats.accuracy.toFixed(1), unit: '%' },
                { labelKr: '발사 횟수', labelEn: 'Shots', value: String(finalStats.shots), unit: 'SHOT' },
                { labelKr: '초당 명중', labelEn: 'Hits / Sec', value: finalStats.kps.toFixed(2), unit: 'H/S' },
              ] : isSwitching ? [
                { labelKr: '처치 타겟', labelEn: 'Targets', value: String(finalStats.kills), unit: 'KILL' },
                { labelKr: '명중률', labelEn: 'Accuracy', value: finalStats.accuracy.toFixed(1), unit: '%' },
                { labelKr: '헤드샷', labelEn: 'Headshots', value: String(finalStats.headshots), unit: 'HIT' },
                { labelKr: '평균 처치 시간', labelEn: 'Avg TTK', value: finalStats.avgTtk > 0 ? finalStats.avgTtk.toFixed(2) : '—', unit: finalStats.avgTtk > 0 ? 'SEC' : '' },
              ] : isTracking ? [
                { labelKr: '추적 점수', labelEn: 'Track Score', value: String(finalStats.trackingPoints), unit: 'PTS' },
                { labelKr: '추적 정확도', labelEn: 'Tracking Accuracy', value: finalStats.accuracy.toFixed(1), unit: '%' },
                { labelKr: '총 추적 시간', labelEn: 'Time on Target', value: finalStats.trackingSeconds.toFixed(1), unit: 'SEC' },
                { labelKr: '최장 연속 추적', labelEn: 'Longest Streak', value: finalStats.longestTrackSeconds.toFixed(2), unit: 'SEC' },
              ] : [
                { labelKr: '처치 타겟', labelEn: 'Targets', value: String(finalStats.kills), unit: 'KILL' },
                { labelKr: '정확도', labelEn: 'Accuracy', value: finalStats.accuracy.toFixed(1), unit: '%' },
                { labelKr: '총 데미지', labelEn: 'Damage', value: finalStats.damage.toFixed(1), unit: 'HP' },
                { labelKr: '평균 처치 시간', labelEn: 'Avg TTK', value: finalStats.avgTtk > 0 ? finalStats.avgTtk.toFixed(2) : '—', unit: finalStats.avgTtk > 0 ? 'SEC' : '' },
              ]).map(({ labelKr, labelEn, value, unit }) => (
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
            <div><strong>{trainingName} {lang === 'kr' ? '준비 중' : 'Loading'}</strong><small>{lang === 'kr' ? '잠시만 기다려 주세요' : 'Please wait a moment'}</small></div>
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
            onTrackingScore={handleTrackingScore}
            ballSpeed={BALL_SPEED_FIXED}
            ballHP={BALL_HP_FIXED}
            ballSize={isGridshot ? 0.18 : isTracking ? 0.16 : isSwitching ? 0.13 : BALL_SIZE_FIXED}
            ballColor={BALL_COLOR_FIXED}
            numBalls={isSwitching ? 4 : isGridshot ? 3 : isTracking ? 1 : BALL_COUNT_FIXED}
            arcHeightCfg={ARC_HEIGHT_FIXED}
            statsRef={statsRef}
            onCanvasReady={handleCanvasReady}
            onViewModelReady={handleViewModelReady}
            trainingMode={trainingMode}
          />
        </Suspense>
      )}
    </div>
  )
}

export default memo(SkeetTrackingSim)
