import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import SkeetTrackingSim from '../components/SkeetTrackingSim'
import { useLanguage } from '../contexts/LanguageContext'

function Test1() {
  const navigate = useNavigate()
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

  // 감도 설정 읽기 (Home에서 저장한 값)
  const userSetup = JSON.parse(localStorage.getItem('userSetup') || '{"dpi":800,"valorantSens":0.5,"eDPI":400}')
  const sensitivityMultiplier = userSetup.valorantSens

  useEffect(() => {
    const handleThemeChange = (e) => {
      setThemeMode(e.detail)
    }
    window.addEventListener('theme-change', handleThemeChange)
    return () => {
      window.removeEventListener('theme-change', handleThemeChange)
    }
  }, [])

  const [score, setScore] = useState(0)
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

  const handleComplete = (data) => {
    localStorage.setItem('test1Data', JSON.stringify({ ...data, sensitivity: sensitivityMultiplier }))
    navigate('/test2')
  }

  const { t } = useLanguage()
  const sub = theme === 'light' ? 'text-slate-500' : 'text-slate-400'

  return (
    <Layout isTestPage={true}>
      <div
        className={`relative overflow-hidden ${
          theme === 'light' ? 'bg-[#F5F0EA]' : 'bg-[#0F1923]'
        } w-full flex-1 flex items-center justify-center`}
      >
        <SkeetTrackingSim onComplete={handleComplete} sensitivity={sensitivityMultiplier} theme={theme} onStatsChange={({ score: s }) => setScore(s)} />

        {/* 파괴한 타겟 — 헤더 바로 아래 가운데, 시뮬레이션 중에만 표시 */}
        <div className={`absolute top-14 left-1/2 -translate-x-1/2 z-[39] pointer-events-none transition-all duration-300 ${
          simActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}>
          <div className={`px-5 py-2.5 rounded-2xl border backdrop-blur-md shadow-lg flex items-center gap-3 ${
            theme === 'light' ? 'bg-white/95 border-[#DDD8D2]' : 'bg-[#1B2E3D]/90 border-[#2A3D4F]'
          }`}>
            <p className={`text-[10px] uppercase tracking-wider font-semibold ${sub}`}>파괴한 타겟</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{score}</span>
              <span className={`text-xs ${sub}`}>개</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Test1
