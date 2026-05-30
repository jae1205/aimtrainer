import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useLanguage } from '../contexts/LanguageContext'

function AimButton({ onClick, children, type = 'button', className = '' }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{
        width: '240px',
        height: '54px',
        padding: '8px',
        fontSize: '0.8rem',
        fontWeight: 900,
        color: hovered ? '#0A0F1E' : '#22D3EE',
        textTransform: 'uppercase',
        textDecoration: 'none',
        boxShadow: 'none',
        borderRadius: '14px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        letterSpacing: '0.05em',
        transition: 'color 0.3s ease-out',
      }}
    >
      <span style={{ position:'relative', width:'100%', height:'100%', display:'block', overflow:'hidden', borderRadius:'14px' }}>
        <span style={{
          boxSizing:'border-box', position:'absolute', zIndex:2,
          width:'100%', height:'100%', left:0, top:0,
          border: '1px solid #22D3EE', borderRadius: '14px',
        }}>
          <span style={{ content:'""', width:2, height:2, left:-1, top:-1, background:'#0A0F1E', position:'absolute', transition:'0.3s ease-out all' }} />
        </span>
        <span style={{
          position:'absolute', left:'-5%', top:0,
          background:'#22D3EE',
          width: hovered ? '110%' : '0%',
          height:'100%', zIndex:3,
          transition:'0.3s ease-out all',
          transform:'skewX(-10deg)',
        }} />
        <span style={{
          zIndex:4, width:'100%', height:'100%',
          position:'absolute', left:0, top:0,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          {children}
          <span style={{
            position:'absolute', right:0, bottom:0,
            width:4, height:4,
            background: hovered ? '#0A0F1E' : 'transparent',
            transition:'0.3s ease-out all', zIndex:5,
          }} />
        </span>
      </span>
    </button>
  )
}

const DPI_PRESETS = [400, 800, 1600, 3200]

function SetupModal({ theme, onClose, onConfirm }) {
  const { t } = useLanguage()
  const [dpi, setDpi] = useState(() => {
    const saved = localStorage.getItem('userSetup')
    return saved ? JSON.parse(saved).dpi : 800
  })
  const [inGameSens, setInGameSens] = useState(() => {
    const saved = localStorage.getItem('userSetup')
    return saved ? JSON.parse(saved).valorantSens : 0.5
  })
  const [sensInput, setSensInput] = useState(() => {
    const saved = localStorage.getItem('userSetup')
    return saved ? String(JSON.parse(saved).valorantSens) : '0.5'
  })

  const parsedSens = parseFloat(sensInput)
  const validSens = isNaN(parsedSens) ? inGameSens : Math.max(0.01, Math.min(10, parsedSens))

  const eDPI = Math.round(dpi * validSens)
  const cmPer360 = (360 / (validSens * 0.07 * dpi / 2.54)).toFixed(1)

  const handleSensChange = (val) => {
    setSensInput(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n >= 0.01) setInGameSens(Math.min(10, n))
  }

  const handleSensBlur = () => {
    const clamped = Math.max(0.01, Math.min(10, isNaN(parsedSens) ? inGameSens : parsedSens))
    setInGameSens(clamped)
    setSensInput(String(clamped))
  }

  const stepSens = (delta) => {
    const next = Math.max(0.01, Math.min(10, parseFloat((validSens + delta).toFixed(2))))
    setInGameSens(next)
    setSensInput(String(next))
  }

  const handleDpiInput = (val) => {
    const n = parseInt(val)
    if (!isNaN(n) && n > 0) setDpi(n)
  }

  const dark = theme === 'dark'

  const sensLevel =
    eDPI < 100  ? { label: t.sensLevels[0], color: 'text-slate-400' } :
    eDPI < 184  ? { label: t.sensLevels[1], color: 'text-blue-400' } :
    eDPI < 268  ? { label: t.sensLevels[2], color: 'text-cyan-400' } :
    eDPI < 352  ? { label: t.sensLevels[3], color: 'text-green-400' } :
    eDPI < 436  ? { label: t.sensLevels[4], color: 'text-yellow-400' } :
    eDPI < 520  ? { label: t.sensLevels[5], color: 'text-orange-400' } :
                  { label: t.sensLevels[6], color: 'text-cyan-400' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-7 ${
        dark ? 'bg-[#111827] border-[#1E293B] text-[#F1F5F9]' : 'bg-white border-[#DDD8D2] text-[#1A1F2E]'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">{t.setupTitle}</h2>
            <p className={`text-sm mt-0.5 ${dark ? 'text-[#64748B]' : 'text-[#7A7E85]'}`}>
              {t.setupDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-colors ${
              dark ? 'text-[#64748B] hover:bg-[#1E293B] hover:text-[#F1F5F9]' : 'text-[#7A7E85] hover:bg-[#F5F0EA] hover:text-[#1A1F2E]'
            }`}
          >
            ×
          </button>
        </div>

        {/* DPI */}
        <div className="mb-5">
          <label className={`block text-xs font-semibold uppercase tracking-widest mb-2.5 ${dark ? 'text-[#64748B]' : 'text-[#7A7E85]'}`}>
            {t.mouseDPI}
          </label>
          <div className="flex gap-2 mb-2.5">
            {DPI_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDpi(preset)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                  dpi === preset
                    ? 'bg-[#22D3EE] border-[#22D3EE] text-[#0A0F1E]'
                    : dark
                    ? 'border-[#1E293B] text-[#64748B] hover:border-[#22D3EE] hover:text-[#22D3EE]'
                    : 'border-[#DDD8D2] text-[#7A7E85] hover:border-[#22D3EE] hover:text-[#22D3EE]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={dpi}
            onChange={(e) => handleDpiInput(e.target.value)}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm font-bold outline-none focus:border-[#22D3EE] transition-colors ${
              dark
                ? 'bg-[#0A0F1E] border-[#1E293B] text-[#F1F5F9] placeholder-[#64748B]'
                : 'bg-[#F5F0EA] border-[#DDD8D2] text-[#1A1F2E] placeholder-[#7A7E85]'
            }`}
            placeholder={t.customInput}
            min="100"
            max="32000"
          />
        </div>

        {/* Sensitivity */}
        <div className="mb-6">
          <label className={`block text-xs font-semibold uppercase tracking-widest mb-2.5 ${dark ? 'text-[#64748B]' : 'text-[#7A7E85]'}`}>
            {t.inGameSens}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => stepSens(-0.01)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold border transition-all ${
                dark
                  ? 'border-[#1E293B] text-[#64748B] hover:border-[#22D3EE] hover:text-[#22D3EE]'
                  : 'border-[#DDD8D2] text-[#7A7E85] hover:border-[#22D3EE] hover:text-[#22D3EE]'
              }`}
            >
              −
            </button>
            <input
              type="number"
              value={sensInput}
              onChange={(e) => handleSensChange(e.target.value)}
              onBlur={handleSensBlur}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-center text-xl font-black outline-none focus:border-[#22D3EE] transition-colors ${
                dark
                  ? 'bg-[#0A0F1E] border-[#1E293B] text-[#F1F5F9]'
                  : 'bg-[#F5F0EA] border-[#DDD8D2] text-[#1A1F2E]'
              }`}
              step="0.01"
              min="0.01"
              max="10"
            />
            <button
              type="button"
              onClick={() => stepSens(0.01)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold border transition-all ${
                dark
                  ? 'border-[#1E293B] text-[#64748B] hover:border-[#22D3EE] hover:text-[#22D3EE]'
                  : 'border-[#DDD8D2] text-[#7A7E85] hover:border-[#22D3EE] hover:text-[#22D3EE]'
              }`}
            >
              +
            </button>
          </div>
        </div>

        {/* Stats Preview */}
        <div className={`rounded-2xl p-4 mb-6 flex justify-around ${
          dark ? 'bg-[#0A0F1E]' : 'bg-[#F5F0EA]'
        }`}>
          <div className="text-center">
            <p className={`text-xs mb-1 ${dark ? 'text-[#64748B]' : 'text-[#7A7E85]'}`}>eDPI</p>
            <p className="text-2xl font-black text-[#22D3EE]">{eDPI}</p>
          </div>
          <div className={`w-px ${dark ? 'bg-[#1E293B]' : 'bg-[#DDD8D2]'}`} />
          <div className="text-center">
            <p className={`text-xs mb-1 ${dark ? 'text-[#64748B]' : 'text-[#7A7E85]'}`}>cm/360°</p>
            <p className={`text-2xl font-black ${dark ? 'text-[#F1F5F9]' : 'text-[#1A1F2E]'}`}>{cmPer360}</p>
          </div>
          <div className={`w-px ${dark ? 'bg-[#1E293B]' : 'bg-[#DDD8D2]'}`} />
          <div className="text-center">
            <p className={`text-xs mb-1 ${dark ? 'text-[#64748B]' : 'text-[#7A7E85]'}`}>{t.level}</p>
            <p className={`text-base font-bold ${sensLevel.color}`}>{sensLevel.label}</p>
          </div>
        </div>

        <div className="flex justify-center mt-2">
          <AimButton onClick={() => onConfirm({ dpi, valorantSens: validSens, eDPI })}>
            {t.startTestBtn}
          </AimButton>
        </div>
      </div>
    </div>
  )
}

const FEATURE_ICONS = [
  <svg key="analytics" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>,
  <svg key="feedback" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>,
  <svg key="free" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
]

function Home() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [showSetup, setShowSetup] = useState(false)
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'system'
  })

  const resolveTheme = (mode) => {
    if (mode === 'system') {
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return mode
  }

  const theme = resolveTheme(themeMode)
  const dark = theme === 'dark'

  useEffect(() => {
    const handleThemeChange = (e) => setThemeMode(e.detail)
    window.addEventListener('theme-change', handleThemeChange)
    return () => window.removeEventListener('theme-change', handleThemeChange)
  }, [])

  const handleConfirm = ({ dpi, valorantSens, eDPI }) => {
    localStorage.setItem('userSetup', JSON.stringify({ dpi, valorantSens, eDPI }))
    localStorage.setItem('userSensitivity', (eDPI / 400).toString())
    navigate('/test1')
  }

  return (
    <Layout>
      {showSetup && (
        <SetupModal
          theme={theme}
          onClose={() => setShowSetup(false)}
          onConfirm={handleConfirm}
        />
      )}

      {/* Hero */}
      <section className={`relative overflow-hidden ${dark ? 'bg-[#0A0F1E]' : 'bg-[#F0F9FF]'}`}>
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: dark
              ? 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,211,238,0.08) 0%, transparent 70%)'
              : 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,211,238,0.12) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-6xl mx-auto px-5 pt-24 pb-20 text-center relative">
          <div className="max-w-2xl mx-auto animate-fade-up">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-7 border text-xs font-semibold tracking-wide"
              style={dark
                ? { background: 'rgba(34,211,238,0.08)', borderColor: 'rgba(34,211,238,0.25)', color: '#22D3EE' }
                : { background: 'rgba(34,211,238,0.1)', borderColor: 'rgba(34,211,238,0.3)', color: '#0891B2' }
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
              {t.badge}
            </div>

            {/* Title */}
            <h1 className={`text-5xl md:text-6xl font-black leading-[1.1] mb-6 tracking-tight ${dark ? 'text-[#F1F5F9]' : 'text-[#0F172A]'}`}>
              {t.heroLine1}<br />
              <span className="text-[#22D3EE]">{t.heroLine2}</span><br />
              {t.heroLine3}
            </h1>

            <p className={`text-base md:text-lg leading-relaxed mb-10 max-w-lg mx-auto ${dark ? 'text-[#64748B]' : 'text-[#475569]'}`}>
              {t.heroSubtitle}
            </p>

            {/* CTA */}
            <div className="flex flex-col items-center gap-3">
              <AimButton onClick={() => navigate('/drills')}>
                {t.startTestBtn}
              </AimButton>
            </div>
          </div>

          {/* Stats bar */}
          <div className={`mt-16 max-w-lg mx-auto rounded-2xl border px-8 py-5 flex justify-around ${
            dark ? 'bg-[#111827]/80 border-[#1E293B]' : 'bg-white/80 border-[#BAE6FD]'
          }`}>
            {[
              { value: '1', label: dark ? '훈련 모듈' : 'Drill Modules' },
              { value: '100%', label: dark ? '무료' : 'Free' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-black text-[#22D3EE]">{stat.value}</p>
                <p className={`text-xs mt-0.5 ${dark ? 'text-[#64748B]' : 'text-[#64748B]'}`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-5">
        <div className={`h-px ${dark ? 'bg-[#1E293B]' : 'bg-[#BAE6FD]'}`} />
      </div>

      {/* Features */}
      <section className={`py-20 ${dark ? 'bg-[#060A14]' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="mb-12 text-center">
            <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${dark ? 'text-[#22D3EE]' : 'text-[#0891B2]'}`}>
              {t.featuresLabel}
            </p>
            <h2 className={`text-3xl font-bold ${dark ? 'text-[#F1F5F9]' : 'text-[#0F172A]'}`}>
              {t.featuresHeading}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { title: t.feat1Title, desc: t.feat1Desc },
              { title: t.feat2Title, desc: t.feat2Desc },
              { title: t.feat3Title, desc: t.feat3Desc },
            ].map((feat, i) => (
              <div
                key={i}
                className={`rounded-3xl border p-7 ${
                  dark ? 'bg-[#111827] border-[#1E293B]' : 'bg-[#F0F9FF] border-[#BAE6FD]'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${
                  dark ? 'bg-[#22D3EE]/10 text-[#22D3EE]' : 'bg-[#22D3EE]/10 text-[#0891B2]'
                }`}>
                  {FEATURE_ICONS[i]}
                </div>
                <h3 className={`text-base font-bold mb-2 ${dark ? 'text-[#F1F5F9]' : 'text-[#0F172A]'}`}>{feat.title}</h3>
                <p className={`text-sm leading-relaxed ${dark ? 'text-[#64748B]' : 'text-[#475569]'}`}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={`py-20 ${dark ? 'bg-[#0A0F1E]' : 'bg-[#F0F9FF]'}`}>
        <div className="max-w-6xl mx-auto px-5">
          <div className={`rounded-3xl p-12 text-center relative overflow-hidden ${
            dark ? 'bg-[#111827] border border-[#1E293B]' : 'bg-white border border-[#BAE6FD]'
          }`}>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: dark
                  ? 'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(34,211,238,0.06) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(34,211,238,0.08) 0%, transparent 70%)',
              }}
            />
            <div className="relative">
              <h2 className={`text-2xl font-bold mb-3 ${dark ? 'text-[#F1F5F9]' : 'text-[#0F172A]'}`}>
                {t.ctaHeading}
              </h2>
              <p className={`text-sm mb-8 ${dark ? 'text-[#64748B]' : 'text-[#475569]'}`}>
                {t.ctaDesc}
              </p>
              <div className="flex justify-center">
                <AimButton onClick={() => navigate('/drills')}>
                  {t.ctaBtn}
                </AimButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export default Home
