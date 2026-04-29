import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import RotationSim from '../components/RotationSim'
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

  const [movement, setMovement] = useState(0)

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
        <RotationSim onComplete={handleComplete} sensitivity={sensitivityMultiplier} theme={theme} onMovementChange={setMovement} />

        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-[1002] w-72 flex flex-col gap-3 pointer-events-none">

          {/* HUD */}
          <div className={`px-4 py-3 rounded-2xl border backdrop-blur-md shadow-lg ${
            theme === 'light' ? 'bg-white/95 border-[#DDD8D2]' : 'bg-[#1B2E3D]/90 border-[#2A3D4F]'
          }`}>
            <p className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${sub}`}>{t.currentMovement}</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{movement.toFixed(0)}</span>
              <span className={`text-xs ${sub}`}>px</span>
            </div>
          </div>

          {/* 설명 */}
          <div className={`px-4 py-4 rounded-3xl border backdrop-blur-md shadow-lg ${
            theme === 'light' ? 'bg-white/95 border-[#DDD8D2] text-[#1A1F2E]' : 'bg-[#1B2E3D]/90 border-[#2A3D4F] text-[#ECE8E1]'
          }`}>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#ff4655] mb-1">Test 1</p>
            <h2 className="text-lg font-black mb-2 leading-snug">{t.t1Heading}</h2>
            <p className={`text-sm mb-3 leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
              {t.t1Desc}
            </p>
            <ol className={`text-xs space-y-1 leading-relaxed ${sub}`}>
              <li>{t.t1Step1}</li>
              <li>{t.t1Step2}</li>
              <li>{t.t1Step3}</li>
            </ol>
            <p className="text-xs text-[#ff4655] mt-2 font-medium">{t.t1Tip}</p>
          </div>

          {/* 감도 */}
          <div className={`px-4 py-3 rounded-2xl border backdrop-blur-md shadow-lg ${
            theme === 'light' ? 'bg-white/95 border-[#DDD8D2]' : 'bg-[#1B2E3D]/90 border-[#2A3D4F]'
          }`}>
            <p className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${sub}`}>{t.currentSensSettings}</p>
            <div className="flex justify-between">
              <div>
                <p className={`text-[10px] ${sub}`}>DPI</p>
                <p className={`text-sm font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{userSetup.dpi}</p>
              </div>
              <div>
                <p className={`text-[10px] ${sub}`}>{t.sensLabel}</p>
                <p className={`text-sm font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{userSetup.valorantSens}</p>
              </div>
              <div>
                <p className={`text-[10px] ${sub}`}>eDPI</p>
                <p className="text-sm font-black text-[#ff4655]">{userSetup.eDPI}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  )
}

export default Test1
