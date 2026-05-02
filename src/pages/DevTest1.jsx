import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import RotationSim from '../components/RotationSim'

function DevTest1() {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'system'
  })
  const [movement, setMovement] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

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
    const handleThemeChange = (e) => {
      setThemeMode(e.detail)
    }
    window.addEventListener('theme-change', handleThemeChange)
    return () => {
      window.removeEventListener('theme-change', handleThemeChange)
    }
  }, [])

  const handleComplete = (data) => {
    localStorage.setItem('devTest1Data', JSON.stringify({ ...data, sensitivity: sensitivityMultiplier }))
    setIsCompleted(true)
  }

  const sub = theme === 'light' ? 'text-slate-500' : 'text-slate-400'

  return (
    <Layout isTestPage={true}>
      <div
        className={`relative overflow-hidden ${
          theme === 'light' ? 'bg-[#F5F0EA]' : 'bg-[#0F1923]'
        } w-full flex-1 flex items-center justify-center`}
      >
        <RotationSim
          onComplete={handleComplete}
          sensitivity={sensitivityMultiplier}
          theme={theme}
          onMovementChange={setMovement}
          devInstantPreview={true}
        />

        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-[1002] w-72 flex flex-col gap-3 pointer-events-none">
          {isCompleted && (
            <div className={`px-4 py-3 rounded-2xl border backdrop-blur-md shadow-lg ${
              theme === 'light' ? 'bg-white/95 border-[#DDD8D2] text-[#1A1F2E]' : 'bg-[#1B2E3D]/90 border-[#2A3D4F] text-[#ECE8E1]'
            }`}>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#ff4655] mb-1">Dev Mode</p>
              <p className="text-sm font-bold">테스트 1 개발 페이지입니다.</p>
              <p className={`text-xs mt-1 ${sub}`}>다음 테스트로는 진행되지 않습니다.</p>
            </div>
          )}

          <div className={`px-4 py-3 rounded-2xl border backdrop-blur-md shadow-lg ${
            theme === 'light' ? 'bg-white/95 border-[#DDD8D2]' : 'bg-[#1B2E3D]/90 border-[#2A3D4F]'
          }`}>
            <p className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${sub}`}>현재 이동량</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{movement.toFixed(0)}</span>
              <span className={`text-xs ${sub}`}>px</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default DevTest1
