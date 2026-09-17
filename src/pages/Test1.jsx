import { lazy, Suspense, useCallback, useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { useLanguage } from '../contexts/LanguageContext'
import { preloadSkeetTracking } from '../routes/preloaders'
import './Test1.css'

const SkeetTrackingSim = lazy(preloadSkeetTracking)

function TrainingLoading() {
  return (
    <div className="af-training-loading">
      <div className="af-training-loading-card">
        <span className="af-training-spinner" />
        <p>사격장 불러오는 중</p>
      </div>
    </div>
  )
}

function Test1() {
  const userSetup = JSON.parse(localStorage.getItem('userSetup') || '{"dpi":800,"valorantSens":0.5,"eDPI":400}')
  const sensitivityMultiplier = userSetup.valorantSens
  const trainingMode = localStorage.getItem('selectedTraining') || 'skeet'

  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [simActive, setSimActive] = useState(false)

  useEffect(() => {
    const onStart = () => setSimActive(true)
    const onEnd   = () => setSimActive(false)
    window.addEventListener('test-start', onStart)
    window.addEventListener('test-end',   onEnd)
    return () => {
      window.removeEventListener('test-start', onStart)
      window.removeEventListener('test-end',   onEnd)
    }
  }, [])

  // FPS 측정
  const [fps, setFps] = useState(0)
  const rafRef = useRef(null)
  useEffect(() => {
    if (!simActive) {
      setFps(0)
      return undefined
    }

    let frameCount = 0
    let lastTime = performance.now()
    const loop = () => {
      frameCount++
      const now = performance.now()
      if (now - lastTime >= 500) {
        setFps(Math.round(frameCount * 1000 / (now - lastTime)))
        frameCount = 0
        lastTime = now
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [simActive])

  const handleComplete = useCallback((data) => {
    localStorage.setItem('test1Data', JSON.stringify({ ...data, sensitivity: sensitivityMultiplier, trainingMode }))
  }, [sensitivityMultiplier, trainingMode])
  const handleStatsChange = useCallback(({ score: nextScore, timeLeft: nextTime }) => {
    setScore(nextScore)
    setTimeLeft(nextTime)
  }, [])

  const { t } = useLanguage()

  return (
    <Layout isTestPage={true} isLobby={true}>
      <div className="af-game-page">
        <Suspense fallback={<TrainingLoading />}>
          <SkeetTrackingSim
            onComplete={handleComplete}
            sensitivity={sensitivityMultiplier}
            theme="dark"
            onStatsChange={handleStatsChange}
            trainingMode={trainingMode}
          />
        </Suspense>

        <div className={`af-game-hud ${simActive ? 'is-visible' : ''}`}>
          <div className="af-hud-item af-hud-fps"><span>FPS</span><strong>{fps}</strong></div>
          <div className="af-hud-item"><span>{t.hudTargets}</span><strong>{score}</strong>{t.hudTargetUnit && <small>{t.hudTargetUnit}</small>}</div>
          <div className="af-hud-item af-hud-time"><span>{t.hudTimeLeft}</span><strong>{timeLeft}</strong><small>{t.hudTimeUnit}</small></div>
        </div>
      </div>
    </Layout>
  )
}

export default Test1
