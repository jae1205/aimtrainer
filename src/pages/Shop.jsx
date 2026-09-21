import Layout from '../components/Layout'
import { useLanguage } from '../contexts/LanguageContext'
import './Shop.css'
import { useState } from 'react'
import BananaPreview from '../components/BananaPreview'

const COPY = {
  kr: {
    title: '무기 스킨 상점',
    subtitle: 'AIMFORGE의 모든 무기 스킨을 한곳에서 만나보세요.',
    count: '1개 상품',
    emptyTitle: '판매 중인 무기 스킨이 없습니다',
    emptyBody: '새로운 상품이 등록되면 이곳에서 바로 확인할 수 있습니다.',
  },
  en: {
    title: 'WEAPON SKIN STORE',
    subtitle: 'Discover every AIMFORGE weapon skin in one place.',
    count: '1 ITEM',
    emptyTitle: 'NO WEAPON SKINS FOR SALE',
    emptyBody: 'New products will appear here as soon as they are listed.',
  },
}

export default function Shop() {
  const { lang } = useLanguage()
  const c = COPY[lang] || COPY.kr
  const [equipped, setEquipped] = useState(() => localStorage.getItem('weaponSkin') === 'banana')
  const toggleSkin = () => {
    const next = !equipped
    localStorage.setItem('weaponSkin', next ? 'banana' : 'default')
    setEquipped(next)
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

          <article className="af-skin-card">
            <div className="af-skin-preview" aria-label={lang === 'kr' ? '바나나 3D 미리보기' : 'Banana 3D preview'}><BananaPreview /></div>
            <div className="af-skin-details">
              <span>GOLDEN CURVE</span>
              <h2>{lang === 'kr' ? '바나나' : 'BANANA'}</h2>
              <p>{lang === 'kr' ? '무기 스킨 · 무료' : 'Weapon skin · Free'}</p>
              <button onClick={toggleSkin} aria-pressed={equipped}>{equipped ? (lang === 'kr' ? '장착 중 · 기본 무기로 변경' : 'Equipped · Use default') : (lang === 'kr' ? '장착하기' : 'Equip')}</button>
              <small aria-live="polite">{equipped ? (lang === 'kr' ? '다음 플레이에 적용됩니다.' : 'Applied on your next game.') : ''}</small>
            </div>
          </article>
        </section>
      </section>
    </main>
  </Layout>
}
