import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useLanguage } from '../contexts/LanguageContext'
import { preloadTest1 } from '../routes/preloaders'

const DRILLS = [
  {
    id: 1,
    path: '/test1',
    title: { kr: '스키트 트래킹', en: 'Skeet Tracking' },
    desc: {
      kr: '호를 그리며 날아가는 타겟을 60초간 추적해 트래킹 정확도를 측정합니다.',
      en: 'Track arcing targets for 60 seconds to measure tracking accuracy.',
    },
    tag: 'Tracking',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 19 Q8 8 19 5" /><circle cx="19" cy="5" r="2" /><circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
]

function DrillCard({ drill, dark, lang }) {
  const [hovered, setHovered] = useState(false)

  const C = {
    card: dark ? '#111827' : '#ffffff',
    border: dark ? '#1E293B' : '#BAE6FD',
    borderHover: '#22D3EE',
    text: dark ? '#F1F5F9' : '#0F172A',
    muted: dark ? '#64748B' : '#94A3B8',
    tag: dark ? 'rgba(34,211,238,0.12)' : 'rgba(34,211,238,0.1)',
  }

  return (
    <Link
      to={drill.path}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="block w-full text-left rounded-2xl border p-6 transition-all duration-200"
      style={{
        background: C.card,
        borderColor: hovered ? C.borderHover : C.border,
        boxShadow: hovered ? '0 0 0 1px #22D3EE, 0 8px 32px rgba(34,211,238,0.08)' : 'none',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: C.tag, color: '#22D3EE' }}
        >
          {drill.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold" style={{ color: C.text }}>{drill.title[lang]}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: C.tag, color: '#22D3EE' }}>
              {drill.tag}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{drill.desc[lang]}</p>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={hovered ? '#22D3EE' : C.muted}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0 mt-1 transition-colors duration-200"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Link>
  )
}

function DrillList() {
  const { lang } = useLanguage()
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'system')

  const resolveTheme = (mode) => {
    if (mode === 'system') return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    return mode
  }
  const dark = resolveTheme(themeMode) === 'dark'

  useEffect(() => {
    const handler = (e) => setThemeMode(e.detail)
    window.addEventListener('theme-change', handler)
    return () => window.removeEventListener('theme-change', handler)
  }, [])

  useEffect(() => {
    preloadTest1()
  }, [])

  const C = {
    bg: dark ? '#0A0F1E' : '#F0F9FF',
    text: dark ? '#F1F5F9' : '#0F172A',
    muted: dark ? '#64748B' : '#94A3B8',
  }

  return (
    <Layout>
      <div style={{ minHeight: 'calc(100vh - 56px)', background: C.bg }}>
        <div className="max-w-2xl mx-auto px-5 py-16">
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#22D3EE' }}>
              {lang === 'kr' ? '훈련 모듈' : 'Drill Modules'}
            </p>
            <h1 className="text-3xl font-black mb-3" style={{ color: C.text }}>
              {lang === 'kr' ? '훈련 목록' : 'Drill List'}
            </h1>
            <p className="text-sm" style={{ color: C.muted }}>
              {lang === 'kr' ? '원하는 훈련을 선택해 바로 시작하세요.' : 'Choose a drill and start training right away.'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {DRILLS.map((drill) => (
              <DrillCard
                key={drill.id}
                drill={drill}
                dark={dark}
                lang={lang}
              />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default DrillList
