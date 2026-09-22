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
    play: '플레이', shop: '상점', shopSubtitle: '장비와 스타일을 준비하세요.', preview: '스킨', soon: '준비 중', selected: '선택됨', modeLabel: '플레이 모드',
    round: '60초 · 입장 가능', ready: '입장 가능',
    setup: '감도 설정', setupDesc: '익숙한 마우스 설정으로 시작하세요.', dpi: '마우스 DPI', sens: '인게임 감도', close: '닫기', confirm: '준비 완료 · 입장',
    trainingSelect: '훈련 선택', skeet: '스키트', gridshot: '그리드샷', tracking: '트래킹',
    skeetDescription: '움직이는 타겟을 끝까지 추적하세요.', gridshotDescription: '나타나는 3개의 타겟을 빠르게 처치하세요.', trackingDescription: '랜덤하게 움직이는 공을 최대한 오래 따라가세요.',
  },
  en: {
    titles: ['FIRING RANGE', 'SCORE MATCH', 'RANKED ARENA'],
    subtitles: ['Eliminate as many targets as possible in 60 seconds.', 'Your own targets. A shared scoreboard.', 'Equal conditions. A rank earned by skill.'],
    modes: ['Solo range', 'Score match', 'Ranked arena'],
    play: 'PLAY', shop: 'STORE', shopSubtitle: 'Prepare your gear and style.', preview: 'SKINS', soon: 'Coming soon', selected: 'Selected', modeLabel: 'Game mode',
    round: '60 sec · Ready', ready: 'Ready to play',
    setup: 'SENSITIVITY', setupDesc: 'Start with your familiar mouse settings.', dpi: 'MOUSE DPI', sens: 'IN-GAME SENSITIVITY', close: 'Close', confirm: 'Ready · Enter range',
    trainingSelect: 'SELECT TRAINING', skeet: 'SKEET', gridshot: 'GRIDSHOT', tracking: 'TRACKING',
    skeetDescription: 'Track moving targets through their full path.', gridshotDescription: 'Eliminate three targets as quickly as possible.', trackingDescription: 'Stay on the randomly moving target for as long as possible.',
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

function TrainingSelectModal({ copy, onClose, onSelect }) {
  const dialogRef = useRef(null)
  useEffect(() => { dialogRef.current.showModal() }, [])
  const trainings = [
    {
      id: 'skeet',
      code: '01',
      title: copy.skeet,
      time: '60 SEC',
      description: copy.skeetDescription,
      icon: <><path d="M7 34c9-18 23-24 34-17"/><circle cx="35" cy="16" r="6"/><path d="m31 12 8 8"/></>,
    },
    {
      id: 'gridshot',
      code: '02',
      title: copy.gridshot,
      time: '60 SEC',
      description: copy.gridshotDescription,
      icon: <><circle cx="15" cy="15" r="6"/><circle cx="33" cy="15" r="6"/><circle cx="24" cy="33" r="6"/><path d="M15 12v6m-3-3h6M33 12v6m-3-3h6M24 30v6m-3-3h6"/></>,
    },
    {
      id: 'tracking',
      code: '03',
      title: copy.tracking,
      time: '60 SEC',
      description: copy.trackingDescription,
      icon: <>
        <path d="M5 37c5-11 10-14 16-10 4 3 7 2 11-5" strokeDasharray="3 3" />
        <circle cx="34" cy="18" r="7" />
        <circle cx="34" cy="18" r="2" fill="currentColor" stroke="none" />
        <path d="M34 6v5m0 14v5M22 18h5m14 0h5" />
      </>,
    },
  ]

  return <dialog ref={dialogRef} className="af-training-select" aria-labelledby="training-select-title"
    onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
    <div className="af-training-select-panel">
      <div className="af-training-select-heading">
        <div><span>RANGE TRAINING</span><h2 id="training-select-title">{copy.trainingSelect}</h2></div>
        <button type="button" aria-label={copy.close} onClick={onClose}>×</button>
      </div>
      <div className="af-training-grid">
        {trainings.map((training) => <button key={training.id} type="button" onClick={() => onSelect(training.id)}>
          <span className="af-training-code">{training.code}</span>
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{training.icon}</svg>
          <span className="af-training-card-copy"><strong>{training.title}</strong><small>{training.description}</small></span>
          <span className="af-training-time">{training.time}</span>
          <span className="af-training-enter" aria-hidden="true">→</span>
        </button>)}
      </div>
    </div>
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
  const [showTrainingSelect, setShowTrainingSelect] = useState(false)
  const [activeMode, setActiveMode] = useState(0)
  const [shopPreview, setShopPreview] = useState(false)
  const modeTypes = ['solo', 'match', 'rank']
  const handleModePreview = (index) => {
    if (index > 0) return
    setActiveMode(index)
    setShopPreview(false)
  }
  const handleModeEnter = (index) => {
    handleModePreview(index)
    localStorage.setItem('selectedGameMode', modeTypes[index])
    setShowTrainingSelect(true)
  }
  const handleTrainingSelect = (training) => {
    localStorage.setItem('selectedTraining', training)
    setShowTrainingSelect(false)
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
      {showTrainingSelect && <TrainingSelectModal copy={c} onClose={() => setShowTrainingSelect(false)} onSelect={handleTrainingSelect} />}
      <div className="af-world" aria-hidden="true">
        <div className="af-world-image af-world-range" />
        <div className={`af-world-image af-world-shop ${shopPreview ? 'is-visible' : ''}`} />
        <div className="af-world-shade" /><div className="af-world-frame" />
      </div>
      <section className="af-game-stage" aria-labelledby="lobby-title">
        <div className="af-stage-heading" key={shopPreview ? 'shop' : activeMode}>
          <h1 id="lobby-title">{shopPreview ? c.shop : c.titles[activeMode]}</h1>
          <p className="af-stage-subtitle">{shopPreview ? c.shopSubtitle : c.subtitles[activeMode]}</p>
        </div>
        <div className="af-lobby-controls">
          <div className="af-mode-section">
            <div className="af-mode-picker" role="group" aria-label={c.modeLabel}>
              {modeTypes.map((type, index) => <button key={type} className="af-mode-option" disabled={index > 0} onMouseEnter={() => handleModePreview(index)} onFocus={() => handleModePreview(index)} onClick={() => handleModeEnter(index)}>
                <ModeIcon type={type} />
                <span className="af-mode-copy"><strong>{c.modes[index]}</strong><span>{index === 0 ? '60 SEC' : c.soon}</span></span>
                <span className={`af-mode-indicator ${index === 0 ? 'af-mode-enter' : ''}`} aria-hidden="true">{index === 0 ? '→' : <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><rect x="3.5" y="7" width="9" height="7" rx="1"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>}</span>
              </button>)}
              <button className="af-shop-button" type="button"
                onMouseEnter={() => setShopPreview(true)}
                onFocus={() => setShopPreview(true)}
                onClick={() => navigate('/shop')}>
                <ModeIcon type="shop" />
                <span className="af-mode-copy"><strong>{c.shop}</strong><span>{c.preview}</span></span>
                <span className="af-mode-indicator af-mode-enter" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </Layout>
}
