import { createContext, useContext, useState, ReactNode } from 'react'

// ── Types ──
type Lang = 'en' | 'fr'

interface LangContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (en: string, fr: string) => string
}

// ── Context ──
const LangContext = createContext<LangContextType | undefined>(undefined)

// ── Provider ──
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')

  const t = (en: string, fr: string): string => {
    return lang === 'en' ? en : fr
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

// ── Hook ──
export function useLang(): LangContextType {
  const context = useContext(LangContext)
  if (!context) throw new Error('useLang must be used within a LangProvider')
  return context
}