import Layout from '../components/Layout'
import { useLanguage } from '../contexts/LanguageContext'
import './Shop.css'

const COPY = {
  kr: {
    title: '무기 스킨 상점',
    subtitle: 'AIMFORGE의 모든 무기 스킨을 한곳에서 만나보세요.',
    count: '0개 상품',
    emptyTitle: '판매 중인 무기 스킨이 없습니다',
    emptyBody: '새로운 상품이 등록되면 이곳에서 바로 확인할 수 있습니다.',
  },
  en: {
    title: 'WEAPON SKIN STORE',
    subtitle: 'Discover every AIMFORGE weapon skin in one place.',
    count: '0 ITEMS',
    emptyTitle: 'NO WEAPON SKINS FOR SALE',
    emptyBody: 'New products will appear here as soon as they are listed.',
  },
}

function EmptySkinIcon() {
  return <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="m32 7 20 12v26L32 57 12 45V19Z" />
    <path d="m12 19 20 12 20-12M32 31v26" />
    <path d="m23 15 18 11" opacity=".45" />
  </svg>
}

export default function Shop() {
  const { lang } = useLanguage()
  const c = COPY[lang] || COPY.kr

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

          <div className="af-store-empty" aria-live="polite">
            <div className="af-store-empty-icon"><EmptySkinIcon /></div>
            <div>
              <h3>{c.emptyTitle}</h3>
              <p>{c.emptyBody}</p>
            </div>
          </div>
        </section>
      </section>
    </main>
  </Layout>
}
