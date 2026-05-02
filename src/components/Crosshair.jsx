import { useState, useEffect } from 'react'

const C = '#4ade80'
const glow = '0 0 8px rgba(74,222,128,0.75)'
const segStyle = { backgroundColor: C, boxShadow: glow }

/* ── 5 crosshair variants ─────────────────────────────────────── */

function Classic() {
  return (
    <div className="relative w-6 h-6">
      <div className="absolute top-1/2 left-0 w-full h-[2px] -translate-y-1/2" style={segStyle} />
      <div className="absolute left-1/2 top-0 w-[2px] h-full -translate-x-1/2" style={segStyle} />
      <div className="absolute top-1/2 left-1/2 w-[3px] h-[3px] rounded-full bg-white -translate-x-1/2 -translate-y-1/2" />
    </div>
  )
}

function Dot() {
  return (
    <div
      className="w-[7px] h-[7px] rounded-full"
      style={{ backgroundColor: C, boxShadow: '0 0 10px rgba(74,222,128,0.9)' }}
    />
  )
}

function Circle() {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      <div
        className="absolute inset-0 rounded-full border-[2px]"
        style={{ borderColor: C, boxShadow: glow }}
      />
      <div className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: C }} />
    </div>
  )
}

function Gap() {
  return (
    <div className="relative w-8 h-8">
      <div className="absolute top-1/2 left-0 w-[9px] h-[2px] -translate-y-1/2" style={segStyle} />
      <div className="absolute top-1/2 right-0 w-[9px] h-[2px] -translate-y-1/2" style={segStyle} />
      <div className="absolute left-1/2 top-0 w-[2px] h-[9px] -translate-x-1/2" style={segStyle} />
      <div className="absolute left-1/2 bottom-0 w-[2px] h-[9px] -translate-x-1/2" style={segStyle} />
    </div>
  )
}

const MAP = {
  classic: Classic,
  dot: Dot,
  circle: Circle,
  gap: Gap,
}

/* ── Main export ─────────────────────────────────────────────── */
export default function Crosshair({ visible = true }) {
  const [type, setType] = useState(
    () => localStorage.getItem('crosshairType') || 'classic'
  )

  useEffect(() => {
    const handler = (e) => setType(e.detail || 'classic')
    window.addEventListener('crosshair-change', handler)
    return () => window.removeEventListener('crosshair-change', handler)
  }, [])

  const Component = MAP[type] || Classic

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-20 flex items-center justify-center transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div style={{ transform: 'scale(0.5)' }}>
        <Component />
      </div>
    </div>
  )
}

/* ── SVG mini-previews (for Layout dropdown) ─────────────────── */
export const CROSSHAIR_OPTIONS = [
  {
    key: 'classic',
    label: '클래식',
    preview: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <line x1="0" y1="9" x2="18" y2="9" stroke="#4ade80" strokeWidth="1.5" />
        <line x1="9" y1="0" x2="9" y2="18" stroke="#4ade80" strokeWidth="1.5" />
        <circle cx="9" cy="9" r="1.2" fill="white" />
      </svg>
    ),
  },
  {
    key: 'dot',
    label: '도트',
    preview: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <circle cx="9" cy="9" r="3" fill="#4ade80" />
      </svg>
    ),
  },
  {
    key: 'circle',
    label: '원형',
    preview: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <circle cx="9" cy="9" r="6" fill="none" stroke="#4ade80" strokeWidth="1.5" />
        <circle cx="9" cy="9" r="1.2" fill="#4ade80" />
      </svg>
    ),
  },
  {
    key: 'gap',
    label: '갭 크로스',
    preview: (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <line x1="0" y1="9" x2="6" y2="9" stroke="#4ade80" strokeWidth="1.5" />
        <line x1="12" y1="9" x2="18" y2="9" stroke="#4ade80" strokeWidth="1.5" />
        <line x1="9" y1="0" x2="9" y2="6" stroke="#4ade80" strokeWidth="1.5" />
        <line x1="9" y1="12" x2="9" y2="18" stroke="#4ade80" strokeWidth="1.5" />
      </svg>
    ),
  },
]
