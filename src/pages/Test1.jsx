import { lazy, Suspense, useCallback, useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { useLanguage } from '../contexts/LanguageContext'
import { preloadSkeetTracking } from '../routes/preloaders'

const SkeetTrackingSim = lazy(preloadSkeetTracking)

function TrainingLoading({ theme }) {
  return (
    <div className={`absolute inset-0 flex items-center justify-center ${
      theme === 'light' ? 'bg-[#F4F7F9]' : 'bg-[#080B10]'
    }`}>
      <div className={`rounded-3xl border px-8 py-6 text-center shadow-2xl ${
        theme === 'light'
          ? 'bg-white/95 border-[#D7E0E8] text-[#151A21]'
          : 'bg-[#111820] border-[#27313A] text-[#F4F7FA]'
      }`}>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#22D3EE]">
          Skeet Tracking
        </p>
        <p className="mt-2 text-sm font-bold">훈련 화면 준비 중...</p>
      </div>
    </div>
  )
}

function Test1() {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'system'
  })

  const resolveTheme = (mode) => {
    if (mode === 'system') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
      return 'light'
    }
    return mode
  }

  const theme = resolveTheme(themeMode)

  const userSetup = JSON.parse(localStorage.getItem('userSetup') || '{"dpi":800,"valorantSens":0.5,"eDPI":400}')
  const sensitivityMultiplier = userSetup.valorantSens

  useEffect(() => {
    const handleThemeChange = (e) => { setThemeMode(e.detail) }
    window.addEventListener('theme-change', handleThemeChange)
    return () => window.removeEventListener('theme-change', handleThemeChange)
  }, [])

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
    localStorage.setItem('test1Data', JSON.stringify({ ...data, sensitivity: sensitivityMultiplier }))
  }, [sensitivityMultiplier])

  const { t } = useLanguage()
  const sub = theme === 'light' ? 'text-[#64717F]' : 'text-[#AAB4C0]'
  const boxCls = `px-5 py-2.5 rounded-2xl border backdrop-blur-md shadow-lg flex items-center gap-3 ${
    theme === 'light' ? 'bg-white/88 border-[#D7E0E8]' : 'bg-[#111820]/90 border-[#27313A]'
  }`
  const valCls = `text-xl font-black ${theme === 'light' ? 'text-[#151A21]' : 'text-[#F4F7FA]'}`

  return (
    <Layout isTestPage={true}>
      <div
        className={`relative overflow-hidden ${
          theme === 'light' ? 'bg-[#F4F7F9]' : 'bg-[#080B10]'
        } w-full flex-1 flex items-center justify-center`}
      >
        <Suspense fallback={<TrainingLoading theme={theme} />}>
          <SkeetTrackingSim
            onComplete={handleComplete}
            sensitivity={sensitivityMultiplier}
            theme={theme}
            onStatsChange={({ score: s, timeLeft: t }) => { setScore(s); setTimeLeft(t) }}
          />
        </Suspense>

        {/* HUD — 헤더 바로 아래 가운데 */}
        <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-[39] pointer-events-none transition-all duration-300 flex gap-3 ${
          simActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}>

          {/* FPS */}
          <div className={boxCls}>
            <p className={`text-[10px] uppercase tracking-wider font-semibold ${sub}`}>FPS</p>
            <div className="flex items-baseline gap-1">
              <span className={valCls}>{fps}</span>
            </div>
          </div>

          {/* 파괴한 타겟 */}
          <div className={boxCls}>
            <p className={`text-[10px] uppercase tracking-wider font-semibold ${sub}`}>{t.hudTargets}</p>
            <div className="flex items-baseline gap-1">
              <span className={valCls}>{score}</span>
              {t.hudTargetUnit && <span className={`text-xs ${sub}`}>{t.hudTargetUnit}</span>}
            </div>
          </div>

          {/* 남은 시간 */}
          <div className={boxCls}>
            <p className={`text-[10px] uppercase tracking-wider font-semibold ${sub}`}>{t.hudTimeLeft}</p>
            <div className="flex items-baseline gap-1">
              <span className={valCls}>{timeLeft}</span>
              <span className={`text-xs ${sub}`}>{t.hudTimeUnit}</span>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  )
}

export default Test1
