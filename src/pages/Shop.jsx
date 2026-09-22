import Layout from '../components/Layout'
import { useLanguage } from '../contexts/LanguageContext'
import './Shop.css'
import { useState } from 'react'
import WeaponPreview from '../components/WeaponPreview'
import { WEAPON_SKINS, getEquippedWeapon } from '../data/weaponSkins'

const COPY = {
  kr: {
    title: '무기 스킨 상점',
    subtitle: 'AIMFORGE의 모든 무기 스킨을 한곳에서 만나보세요.',
    count: `${WEAPON_SKINS.length}개 상품`,
  },
  en: {
    title: 'WEAPON SKIN STORE',
    subtitle: 'Discover every AIMFORGE weapon skin in one place.',
    count: `${WEAPON_SKINS.length} ITEMS`,
  },
}

export default function Shop() {
  const { lang } = useLanguage()
  const c = COPY[lang] || COPY.kr
  const [equipped, setEquipped] = useState(() => getEquippedWeapon().id)
  const equipSkin = (id) => {
    if (equipped === id) return
    localStorage.setItem('weaponSkin', id)
    setEquipped(id)
  }

  return <Layout isLobby>
    <main className="af-store">
      <div className="af-store-world" aria-hidden="true" />
      <div className="af-store-shade" aria-hidden="true" />
      <section className="af-store-shell" aria-labelledby="store-title">
        <header className="af-store-heading">
          <h1 id="store-title">{c.title}</h1>
          <p>{c.subtitle}</p>
        </header>

        <section className="af-store-catalog" aria-label={c.title}>
          <div className="af-store-catalog-head">
            <span className="af-store-count">{c.count}</span>
          </div>

          <div className="af-skin-grid">
          {WEAPON_SKINS.map(skin => <article className="af-skin-card" key={skin.id}>
            <div className="af-skin-preview" aria-label={`${skin.name[lang] || skin.name.kr} 3D ${lang === 'kr' ? '미리보기' : 'preview'}`}><WeaponPreview src={skin.preview} /></div>
            <div className="af-skin-details">
              <span>{skin.collection}</span>
              <h2>{skin.name[lang] || skin.name.kr}</h2>
              <p>{skin.id === 'default' ? (lang === 'kr' ? '기본 지급' : 'Included') : (lang === 'kr' ? '무기 스킨 · 무료' : 'Weapon skin · Free')}</p>
              <button onClick={() => equipSkin(skin.id)} disabled={equipped === skin.id} aria-pressed={equipped === skin.id} aria-label={`${skin.name[lang] || skin.name.kr} ${equipped === skin.id ? (lang === 'kr' ? '장착 중' : 'equipped') : (lang === 'kr' ? '장착' : 'equip')}`}>{equipped === skin.id ? (lang === 'kr' ? '장착 중' : 'Equipped') : (lang === 'kr' ? '장착하기' : 'Equip')}</button>
              <small aria-live="polite">{equipped === skin.id ? (lang === 'kr' ? '다음 플레이에 적용됩니다.' : 'Applied on your next game.') : ''}</small>
            </div>
          </article>)}
          </div>
        </section>
      </section>
    </main>
  </Layout>
}
