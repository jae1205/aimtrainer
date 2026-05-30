import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { setSoundVolume, getSoundVolume } from '../utils/sounds'
import { CROSSHAIR_OPTIONS } from './Crosshair'
import { useLanguage } from '../contexts/LanguageContext'

function Layout({ children, isTestPage = false }) {
  const navigate = useNavigate()
  const { lang, t, setLang } = useLanguage()

  /* ── Theme ───────────────────────────────────────────────────── */
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('themeMode')
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
    return 'system'
  })

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode)
    window.dispatchEvent(new CustomEvent('theme-change', { detail: themeMode }))
  }, [themeMode])

  const resolveTheme = (mode) => {
    if (mode === 'system') {
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return mode
  }
  const theme = resolveTheme(themeMode)
  const dark = theme === 'dark'

  /* ── Test fullscreen ─────────────────────────────────────────── */
  const [testActive, setTestActive] = useState(false)
  const [pointerLocked, setPointerLocked] = useState(false)

  useEffect(() => {
    const onStart = () => setTestActive(true)
    const onEnd = () => { setTestActive(false); setPointerLocked(false) }
    window.addEventListener('test-start', onStart)
    window.addEventListener('test-end', onEnd)
    return () => {
      window.removeEventListener('test-start', onStart)
      window.removeEventListener('test-end', onEnd)
    }
  }, [])

  useEffect(() => {
    if (!isTestPage) return
    const handler = () => setPointerLocked(!!document.pointerLockElement)
    document.addEventListener('pointerlockchange', handler)
    return () => document.removeEventListener('pointerlockchange', handler)
  }, [isTestPage])

  /* ── Volume ──────────────────────────────────────────────────── */
  const [volume, setVolumeState] = useState(() => getSoundVolume())

  useEffect(() => {
    setSoundVolume(volume)
    localStorage.setItem('soundVolume', volume.toString())
  }, [volume])

  /* ── Crosshair ───────────────────────────────────────────────── */
  const [crosshair, setCrosshair] = useState(
    () => localStorage.getItem('crosshairType') || 'classic'
  )

  useEffect(() => {
    localStorage.setItem('crosshairType', crosshair)
    window.dispatchEvent(new CustomEvent('crosshair-change', { detail: crosshair }))
  }, [crosshair])

  /* ── Settings panel ──────────────────────────────────────────── */
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef(null)

  const uiHidden = isTestPage && testActive && pointerLocked
  const showHeader = !uiHidden || settingsOpen
  const showFooter = !uiHidden

  useEffect(() => {
    if (!settingsOpen) return
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [settingsOpen])

  /* ── Color tokens ────────────────────────────────────────────── */
  const C = dark ? {
    bg:        '#0A0F1E',
    card:      '#111827',
    border:    '#1E293B',
    divider:   '#1E293B',
    muted:     '#64748B',
    text:      '#F1F5F9',
    hover:     '#1E293B',
    hoverText: '#F1F5F9',
    sliderBg:  '#1E293B',
    navBg:     'rgba(10,15,30,0.92)',
    footerBg:  '#0A0F1E',
    label:     '#475569',
  } : {
    bg:        '#F0F9FF',
    card:      '#FFFFFF',
    border:    '#BAE6FD',
    divider:   '#E0F2FE',
    muted:     '#64748B',
    text:      '#0F172A',
    hover:     '#E0F2FE',
    hoverText: '#0F172A',
    sliderBg:  '#BAE6FD',
    navBg:     'rgba(240,249,255,0.92)',
    footerBg:  '#F0F9FF',
    label:     '#94A3B8',
  }

  const themeOptions = [
    {
      key: 'light', label: lang === 'kr' ? '라이트' : 'Light',
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-14.07 1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2m-4.34-7.07-1.41 1.41M6.34 17.66 4.93 19.07"/></svg>,
    },
    {
      key: 'dark', label: lang === 'kr' ? '다크' : 'Dark',
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
    },
    {
      key: 'system', label: lang === 'kr' ? '시스템' : 'System',
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
    },
  ]

  /* ── Shared row style ────────────────────────────────────────── */
  const SectionLabel = ({ children }) => (
    <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: C.label }}>
      {children}
    </p>
  )

  const Divider = () => (
    <div className="my-4" style={{ height: 1, background: C.divider }} />
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg, color: C.text }}>
      {/* Navbar */}
      <header
        className={`z-40 border-b backdrop-blur-md transition-[transform,opacity] duration-300 ease-in-out ${
          isTestPage ? 'fixed top-0 left-0 right-0' : 'sticky top-0'
        }`}
        style={{
          background: C.navBg,
          borderColor: C.border,
          ...(uiHidden ? {
            transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
            opacity: showHeader ? 1 : 0,
          } : {}),
        }}
      >
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">

          {/* Logo + Program buttons */}
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate('/')} className="flex items-center gap-1">
              <span className="text-lg font-black tracking-tight">
                <span className="text-[#22D3EE]">Aim</span>
                <span style={{ color: C.text }}>Forge</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/drills')}
              className="px-3 h-7 rounded-md text-xs font-medium transition-all duration-150"
              style={{ color: C.muted }}
              onMouseEnter={e => { e.currentTarget.style.color = '#22D3EE'; e.currentTarget.style.background = dark ? 'rgba(34,211,238,0.08)' : 'rgba(34,211,238,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'transparent' }}
            >
              {lang === 'kr' ? '훈련목록' : 'Drills'}
            </button>
          </div>

          {/* Settings button */}
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150"
              style={{
                color: settingsOpen ? '#22D3EE' : C.muted,
                background: settingsOpen ? (dark ? 'rgba(34,211,238,0.1)' : 'rgba(34,211,238,0.08)') : 'transparent',
              }}
              onMouseEnter={e => { if (!settingsOpen) { e.currentTarget.style.color = C.hoverText; e.currentTarget.style.background = C.hover } }}
              onMouseLeave={e => { if (!settingsOpen) { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'transparent' } }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>

            {/* Unified settings panel */}
            <div
              className={`absolute right-0 top-11 z-30 w-64 rounded-2xl border shadow-2xl p-4
                transition-all duration-200 ease-out origin-top-right
                ${settingsOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'}`}
              style={{ background: C.card, borderColor: C.border }}
            >

              {/* ① 언어 */}
              <SectionLabel>{lang === 'kr' ? '언어' : 'Language'}</SectionLabel>
              <div className="flex gap-2">
                {['kr', 'en'].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    className="flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all"
                    style={{
                      background: lang === l ? '#22D3EE' : 'transparent',
                      borderColor: lang === l ? '#22D3EE' : C.border,
                      color: lang === l ? '#0A0F1E' : C.muted,
                    }}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>

              <Divider />

              {/* ② 조준선 */}
              <SectionLabel>{t.crosshairLabel}</SectionLabel>
              <div className="flex gap-2">
                {CROSSHAIR_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setCrosshair(opt.key)}
                    title={opt.label}
                    className="flex-1 aspect-square rounded-xl flex items-center justify-center border transition-all"
                    style={{
                      background: crosshair === opt.key ? (dark ? 'rgba(34,211,238,0.15)' : 'rgba(34,211,238,0.1)') : 'transparent',
                      borderColor: crosshair === opt.key ? '#22D3EE' : C.border,
                      padding: '6px',
                    }}
                  >
                    <span className="w-5 h-5 flex items-center justify-center"
                      style={{ background: '#0A0F1E', borderRadius: 6, width: 28, height: 28 }}>
                      {opt.preview}
                    </span>
                  </button>
                ))}
              </div>

              <Divider />

              {/* ③ 테마 */}
              <SectionLabel>{lang === 'kr' ? '테마' : 'Theme'}</SectionLabel>
              <div className="flex gap-2">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setThemeMode(opt.key)}
                    className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-[10px] font-semibold transition-all"
                    style={{
                      background: themeMode === opt.key ? '#22D3EE' : 'transparent',
                      borderColor: themeMode === opt.key ? '#22D3EE' : C.border,
                      color: themeMode === opt.key ? '#0A0F1E' : C.muted,
                    }}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>

              <Divider />

              {/* ④ 효과음 */}
              <SectionLabel>{t.soundLabel}</SectionLabel>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setVolumeState(volume === 0 ? 0.7 : 0)}
                  style={{ color: volume === 0 ? '#22D3EE' : C.muted, flexShrink: 0 }}
                >
                  {volume === 0 ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                  )}
                </button>

                <div className="relative flex-1 h-5 flex items-center">
                  <div className="absolute w-full h-1 rounded-full" style={{ background: C.sliderBg }} />
                  <div className="absolute h-1 rounded-full" style={{ width: `${volume * 100}%`, background: '#22D3EE' }} />
                  <input
                    type="range" min="0" max="1" step="0.01" value={volume}
                    onChange={(e) => setVolumeState(parseFloat(e.target.value))}
                    className="absolute w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="absolute w-3.5 h-3.5 rounded-full shadow-md border-2 border-white pointer-events-none"
                    style={{ left: `calc(${volume * 100}% - 7px)`, background: '#22D3EE' }}
                  />
                </div>

                <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color: volume === 0 ? C.muted : '#22D3EE', flexShrink: 0 }}>
                  {volume === 0 ? 'OFF' : `${Math.round(volume * 100)}%`}
                </span>
              </div>

            </div>
          </div>

        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full flex flex-col">
        {isTestPage ? (
          <div className="flex-1 flex items-stretch overflow-hidden">{children}</div>
        ) : (
          <div className="w-full">{children}</div>
        )}
      </main>

      {/* Footer */}
      <footer
        className={`border-t transition-[transform,opacity] duration-300 ease-in-out ${
          isTestPage ? 'fixed bottom-0 left-0 right-0 z-40' : ''
        }`}
        style={{
          background: C.footerBg,
          borderColor: C.border,
          ...(uiHidden ? {
            transform: showFooter ? 'translateY(0)' : 'translateY(100%)',
            opacity: showFooter ? 1 : 0,
          } : {}),
        }}
      >
        <div className="max-w-6xl mx-auto px-5 h-12 flex items-center justify-center">
          <span className="text-xs" style={{ color: C.muted }}>© 2026 AimForge</span>
        </div>
      </footer>
    </div>
  )
}

export default Layout
