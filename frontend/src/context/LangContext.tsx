import { createContext, useContext, useState, ReactNode } from 'react'


type Lang = 'en' | 'fr'

interface LangContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (en: string, fr: string) => string
}


const LangContext = createContext<LangContextType | undefined>(undefined)

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


export function useLang(): LangContextType {
  const context = useContext(LangContext)
  if (!context) throw new Error('useLang must be used within a LangProvider')
  return context
}