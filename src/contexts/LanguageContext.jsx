import { createContext, useContext, useState } from 'react'
import { translations } from '../utils/i18n'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') || 'kr')

  const setLang = (l) => {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
