import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useLanguage } from '../contexts/LanguageContext'
import './Home.css'

const COPY = {
  kr: {
    titles: ['사격장', '스코어 매치', '랭크 아레나'],
    subtitles: ['60초 동안 최대한 많은 타겟을 처치하세요.', '각자의 타겟, 점수로 승부.', '같은 조건에서 증명하는 실력.'],
    modes: ['솔로 사격', '스코어 매치', '랭크 아레나'],
    play: '플레이', shop: '상점', soon: '준비 중', selected: '선택됨', modeLabel: '플레이 모드',
    round: '60초 · 입장 가능', ready: '입장 가능',
    setup: '감도 설정', setupDesc: '익숙한 마우스 설정으로 시작하세요.', dpi: '마우스 DPI', sens: '인게임 감도', close: '닫기', confirm: '준비 완료 · 입장',
  },
  en: {
    titles: ['FIRING RANGE', 'SCORE MATCH', 'RANKED ARENA'],
    subtitles: ['Eliminate as many targets as possible in 60 seconds.', 'Your own targets. A shared scoreboard.', 'Equal conditions. A rank earned by skill.'],
    modes: ['Solo range', 'Score match', 'Ranked arena'],
    play: 'PLAY', shop: 'STORE', soon: 'Coming soon', selected: 'Selected', modeLabel: 'Game mode',
    round: '60 sec · Ready', ready: 'Ready to play',
    setup: 'SENSITIVITY', setupDesc: 'Start with your familiar mouse settings.', dpi: 'MOUSE DPI', sens: 'IN-GAME SENSITIVITY', close: 'Close', confirm: 'Ready · Enter range',
  },
}

function readSetup() {
  try {
    const saved = JSON.parse(localStorage.getItem('userSetup'))
    return { dpi: Math.min(32000, Math.max(100, Number(saved?.dpi) || 800)), valorantSens: Math.min(10, Math.max(0.01, Number(saved?.valorantSens) || 0.5)) }
  } catch { return { dpi: 800, valorantSens: 0.5 } }
}

function SetupModal({ copy, onClose, onConfirm }) {
  const { t } = useLanguage()
  const dialogRef = useRef(null)
  const [setup, setSetup] = useState(readSetup)
  const valid = setup.dpi >= 100 && setup.dpi <= 32000 && setup.valorantSens >= 0.01 && setup.valorantSens <= 10
  const eDPI = valid ? Math.round(setup.dpi * setup.valorantSens) : '—'
  const sens = Number(setup.valorantSens)
  const sensLevel = sens <= 0.10 ? 0 : sens <= 0.25 ? 1 : sens <= 0.30 ? 2 : sens <= 0.35 ? 3 : sens <= 0.40 ? 4 : 5
  const stepSens = (delta) => setSetup({ ...setup, valorantSens: Math.min(10, Math.max(0.01, Number(((sens || 0.5) + delta).toFixed(2)))) })
  useEffect(() => { dialogRef.current.showModal() }, [])
  return <dialog ref={dialogRef} className="af-setup" aria-labelledby="setup-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
    <form onSubmit={e => { e.preventDefault(); if (valid) onConfirm({ dpi: Number(setup.dpi), valorantSens: Number(setup.valorantSens), eDPI }) }}>
      <div className="af-setup-heading">
        <div><span id="setup-title">{copy.setup}</span></div>
        <button type="button" aria-label={copy.close} onClick={onClose}>×</button>
      </div>
      <div className="af-setting-block">
        <div className="af-setting-label"><label htmlFor="player-dpi">{copy.dpi}</label></div>
        <div className="af-presets">{[400, 800, 1600, 3200].map(dpi => <button key={dpi} type="button" aria-pressed={Number(setup.dpi) === dpi} onClick={() => setSetup({ ...setup, dpi })}>{dpi}</button>)}</div>
        <div className="af-number-input"><input id="player-dpi" type="number" min="100" max="32000" required value={setup.dpi} onChange={e => setSetup({ ...setup, dpi: e.target.value })} /><span>DPI</span></div>
      </div>
      <div className="af-setting-block">
        <div className="af-setting-label"><label htmlFor="player-sens">{copy.sens}</label></div>
        <div className="af-sens-input"><button type="button" aria-label={`${copy.sens} −0.01`} onClick={() => stepSens(-0.01)}>−</button><input id="player-sens" type="number" min="0.01" max="10" step="0.01" required value={setup.valorantSens} onChange={e => setSetup({ ...setup, valorantSens: e.target.value })} /><button type="button" aria-label={`${copy.sens} +0.01`} onClick={() => stepSens(0.01)}>+</button></div>
      </div>
      <div className="af-sensitivity"><span>eDPI <strong>{eDPI}</strong></span><span>cm/360° <strong>{valid ? (360 / (setup.valorantSens * 0.07 * setup.dpi / 2.54)).toFixed(1) : '—'}</strong></span><span>{t.level}<strong className="af-sens-level">{valid ? t.sensLevels[sensLevel] : '—'}</strong></span></div>
      <button className="af-button" type="submit" disabled={!valid}><span>{copy.confirm}</span><span aria-hidden="true">→</span></button>
    </form>
  </dialog>
}

function ModeIcon({ type }) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    {type === 'solo' ? <><circle cx="24" cy="24" r="13"/><circle cx="24" cy="24" r="5"/><path d="M24 3v12m0 18v12M3 24h12m18 0h12"/></> : type === 'match' ? <><path d="m6 10 14 14L6 38M42 10 28 24l14 14M15 8l9 9 9-9M15 40l9-9 9 9"/></> : type === 'shop' ? <><path d="M8 17h32l-2 25H10Z"/><path d="M17 19v-5a7 7 0 0 1 14 0v5"/></> : <><path d="m24 4 16 7v13L24 44 8 24V11Z"/><path d="m16 27 8-14 8 14-8-4Z"/></>}
  </svg>
}

export default function Home() {
  const { lang } = useLanguage()
  const c = COPY[lang] || COPY.kr
  const navigate = useNavigate()
  const [showSetup, setShowSetup] = useState(false)
  const [activeMode, setActiveMode] = useState(0)
  const modeTypes = ['solo', 'match', 'rank']
  const handleModeEnter = (index) => {
    setActiveMode(index)
    localStorage.setItem('selectedGameMode', modeTypes[index])
    setShowSetup(true)
  }
  const handleConfirm = (setup) => {
    localStorage.setItem('userSetup', JSON.stringify(setup))
    localStorage.setItem('userSensitivity', (setup.eDPI / 400).toString())
    navigate('/test1')
  }
  return <Layout isLobby>
    <div className="af-lobby">
      {showSetup && <SetupModal copy={c} onClose={() => setShowSetup(false)} onConfirm={handleConfirm} />}
      <div className="af-world" aria-hidden="true"><div className="af-world-shade" /><div className="af-world-frame" /></div>
      <section className="af-game-stage" aria-labelledby="lobby-title">
        <div className="af-stage-heading" key={activeMode}>
          <h1 id="lobby-title">{c.titles[activeMode]}</h1>
          <p className="af-stage-subtitle">{c.subtitles[activeMode]}</p>
        </div>
        <div className="af-lobby-controls">
          <div className="af-mode-section">
            <div className="af-mode-picker" role="group" aria-label={c.modeLabel}>
              {modeTypes.map((type, index) => <button key={type} className="af-mode-option" disabled={index > 0} onMouseEnter={() => setActiveMode(index)} onFocus={() => setActiveMode(index)} onClick={() => handleModeEnter(index)}>
                <ModeIcon type={type} />
                <span className="af-mode-copy"><strong>{c.modes[index]}</strong><span>{index === 0 ? '60 SEC' : c.soon}</span></span>
                <span className={`af-mode-indicator ${index === 0 ? 'af-mode-enter' : ''}`} aria-hidden="true">{index === 0 ? '→' : <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><rect x="3.5" y="7" width="9" height="7" rx="1"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>}</span>
              </button>)}
              <button className="af-shop-button" type="button" disabled title={c.soon}>
                <ModeIcon type="shop" />
                <span className="af-mode-copy"><strong>{c.shop}</strong><span>{c.soon}</span></span>
                <span className="af-mode-indicator" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><rect x="3.5" y="7" width="9" height="7" rx="1"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg></span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </Layout>
}
