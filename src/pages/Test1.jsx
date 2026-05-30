import { useCallback, useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import SkeetTrackingSim from '../components/SkeetTrackingSim'
import { useLanguage } from '../contexts/LanguageContext'

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
  }, [])

  const handleComplete = useCallback((data) => {
    localStorage.setItem('test1Data', JSON.stringify({ ...data, sensitivity: sensitivityMultiplier }))
  }, [sensitivityMultiplier])

  const { t } = useLanguage()
  const sub = theme === 'light' ? 'text-slate-500' : 'text-slate-400'
  const boxCls = `px-5 py-2.5 rounded-2xl border backdrop-blur-md shadow-lg flex items-center gap-3 ${
    theme === 'light' ? 'bg-white/95 border-[#DDD8D2]' : 'bg-[#1B2E3D]/90 border-[#2A3D4F]'
  }`
  const valCls = `text-xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`

  return (
    <Layout isTestPage={true}>
      <div
        className={`relative overflow-hidden ${
          theme === 'light' ? 'bg-[#F5F0EA]' : 'bg-[#0F1923]'
        } w-full flex-1 flex items-center justify-center`}
      >
        <SkeetTrackingSim
          onComplete={handleComplete}
          sensitivity={sensitivityMultiplier}
          theme={theme}
          onStatsChange={({ score: s, timeLeft: t }) => { setScore(s); setTimeLeft(t) }}
        />

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
