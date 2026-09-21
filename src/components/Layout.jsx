import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { setSoundVolume, getSoundVolume } from '../utils/sounds'
import { CROSSHAIR_OPTIONS } from './Crosshair'
import { useLanguage } from '../contexts/LanguageContext'

function Layout({ children, isTestPage = false, isLobby = false }) {
  const { lang, t, setLang } = useLanguage()

  /* ── Theme ───────────────────────────────────────────────────── */
  const [themeMode] = useState(() => {
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
  const accent = isLobby ? '#f3834c' : '#22D3EE'

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
  const settingsCloseRef = useRef(null)

  const uiHidden = isTestPage && testActive && pointerLocked
  const showHeader = !uiHidden || settingsOpen
  const showFooter = !uiHidden

  useEffect(() => {
    const dialog = settingsRef.current
    if (!dialog) return
    if (!settingsOpen) {
      if (dialog.open) dialog.close()
      return
    }

    if (document.pointerLockElement) document.exitPointerLock()
    if (!dialog.open) dialog.showModal()
    settingsCloseRef.current?.focus({ preventScroll: true })
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [settingsOpen])

  /* ── Color tokens ────────────────────────────────────────────── */
  const C = dark ? {
    bg:        '#080B10',
    card:      '#111820',
    border:    '#27313A',
    divider:   '#202A34',
    muted:     '#8A94A3',
    text:      '#F4F7FA',
    hover:     '#19212B',
    hoverText: '#F4F7FA',
    sliderBg:  '#27313A',
    navBg:     'rgba(8,11,16,0.92)',
    footerBg:  '#080B10',
    label:     '#6F7B88',
  } : {
    bg:        '#F4F7F9',
    card:      '#FFFFFF',
    border:    '#D7E0E8',
    divider:   '#E4EAF0',
    muted:     '#64717F',
    text:      '#151A21',
    hover:     '#E8F1F5',
    hoverText: '#151A21',
    sliderBg:  '#D7E0E8',
    navBg:     'rgba(244,247,249,0.92)',
    footerBg:  '#F4F7F9',
    label:     '#8A94A3',
  }

  if (isLobby) Object.assign(C, dark
    ? { card: '#1b1e1b', border: '#34382f', divider: '#34382f', muted: '#9b9e91', text: '#eeeee6', label: '#9b9e91' }
    : { card: '#f3f2eb', border: '#c7cabe', divider: '#c7cabe', muted: '#63695b', text: '#242a22', label: '#63695b' })

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
    <div className={isLobby ? 'af-layout' : undefined} data-theme={theme} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg, color: C.text }}>
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
        <div className="af-topbar">

          {/* Logo + Program buttons */}
          <div className="af-brand-position">
            <Link to="/" aria-label="AimForge home" className="af-logo">
              <svg className="af-logo-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m3 27 11-22h6l-5 10h8l-3 6h-8l-3 6H3Z" fill="currentColor"/><path d="m23 13 6 14h-7l-3-7z" fill="currentColor"/></svg><span>AIMFORGE</span>
            </Link>
          </div>

          {/* Settings button */}
          <div className="af-settings-position">
            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              aria-label={lang === 'kr' ? '설정' : 'Settings'}
              aria-expanded={settingsOpen}
              aria-haspopup="dialog"
              aria-controls="game-settings"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150"
              style={{
                color: settingsOpen ? accent : C.muted,
                background: settingsOpen
                  ? (isLobby ? 'rgba(243,131,76,0.12)' : (dark ? 'rgba(34,211,238,0.1)' : 'rgba(34,211,238,0.08)'))
                  : 'transparent',
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
            <dialog
              ref={settingsRef}
              id="game-settings"
              aria-labelledby="game-settings-title"
              className="af-settings-dialog rounded-2xl border shadow-2xl p-4"
              style={{ background: C.card, borderColor: C.border, color: C.text }}
              onClose={() => setSettingsOpen(false)}
              onClick={(event) => {
                if (event.target !== event.currentTarget) return
                const bounds = event.currentTarget.getBoundingClientRect()
                if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
                  setSettingsOpen(false)
                }
              }}
            >

              <div className="af-game-settings-title">
                <span id="game-settings-title">{lang === 'kr' ? '게임 설정' : 'Game settings'}</span>
                <div className="af-settings-title-actions">
                  <small>PLAYER / LOCAL</small>
                  <button
                    ref={settingsCloseRef}
                    type="button"
                    className="af-settings-close"
                    aria-label={lang === 'kr' ? '설정 닫기' : 'Close settings'}
                    onClick={() => setSettingsOpen(false)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                      <path d="m6 6 12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>
              </div>

              <Divider />

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
                      background: lang === l ? accent : 'transparent',
                      borderColor: lang === l ? accent : C.border,
                      color: lang === l ? '#071013' : C.muted,
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
                      background: crosshair === opt.key
                        ? (isLobby ? 'rgba(243,131,76,0.12)' : (dark ? 'rgba(34,211,238,0.15)' : 'rgba(34,211,238,0.1)'))
                        : 'transparent',
                      borderColor: crosshair === opt.key ? accent : C.border,
                      padding: '6px',
                    }}
                  >
                    <span className="w-5 h-5 flex items-center justify-center"
                      style={{ background: '#080B10', borderRadius: 6, width: 28, height: 28 }}>
                      {opt.preview}
                    </span>
                  </button>
                ))}
              </div>

              <Divider />

              {/* ③ 효과음 */}
              <SectionLabel>{t.soundLabel}</SectionLabel>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setVolumeState(volume === 0 ? 0.7 : 0)}
                  style={{ color: volume === 0 ? accent : C.muted, flexShrink: 0 }}
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
                  <div className="absolute h-1 rounded-full" style={{ width: `${volume * 100}%`, background: accent }} />
                  <input
                    type="range" min="0" max="1" step="0.01" value={volume}
                    aria-label={t.soundLabel}
                    onChange={(e) => setVolumeState(parseFloat(e.target.value))}
                    className="absolute w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="absolute w-3.5 h-3.5 rounded-full shadow-md border-2 border-white pointer-events-none"
                    style={{ left: `calc(${volume * 100}% - 7px)`, background: accent }}
                  />
                </div>

                <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color: volume === 0 ? C.muted : accent, flexShrink: 0 }}>
                  {volume === 0 ? 'OFF' : `${Math.round(volume * 100)}%`}
                </span>
              </div>

            </dialog>
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
      {!isLobby && <footer
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
          <span className="text-xs" style={{ color: C.muted }}>{isLobby ? '© 2026 AIMFORGE / EVERY SHOT COUNTS.' : '© 2026 AimForge'}</span>
        </div>
      </footer>}
    </div>
  )
}

export default Layout
