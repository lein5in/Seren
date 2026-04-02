import { useEffect, useState } from 'react'
import { useLang } from '../context/LangContext'

export default function Navbar() {
  const { lang, setLang, t } = useLang()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5%] h-[68px] bg-white/90 backdrop-blur-md border-b border-[#E1F5EE] transition-shadow duration-300 ${scrolled ? 'shadow-[0_2px_20px_rgba(15,110,86,0.08)]' : ''}`}>

      {/* Logo */}
      <a href="#" className="flex items-center gap-2 no-underline">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 2 A14 14 0 1 1 26.1 22" stroke="#0F6E56" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="26.5" cy="23.5" r="2.5" fill="#1D9E75"/>
          <line x1="10" y1="13" x2="22" y2="13" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.8"/>
          <line x1="9" y1="18" x2="23" y2="18" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
          <line x1="10" y1="23" x2="22" y2="23" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.3"/>
        </svg>
        <span className="font-display text-[22px] text-[#0F6E56] tracking-wide">Seren</span>
      </a>

      {/* Links */}
      <div className="hidden md:flex items-center gap-8">
        {[
          { href: '#features', en: 'Features', fr: 'Fonctionnalités' },
          { href: '#how', en: 'How it works', fr: 'Comment ça marche' },
          { href: '#pricing', en: 'Pricing', fr: 'Tarifs' },
          { href: '#about', en: 'About', fr: 'À propos' },
        ].map(link => (
          <a key={link.href} href={link.href} className="text-sm text-[#88877F] hover:text-[#0F6E56] transition-colors duration-200 no-underline">
            {t(link.en, link.fr)}
          </a>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Lang toggle */}
        <div className="flex bg-[#E1F5EE] rounded-full p-[3px] gap-[2px]">
          {(['en', 'fr'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`text-xs px-3 py-1 rounded-full border-none cursor-pointer font-body transition-all duration-200 ${
                lang === l
                  ? 'bg-white text-[#0F6E56] font-medium shadow-sm'
                  : 'bg-transparent text-[#88877F]'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* CTA */}
        <button className="bg-[#0F6E56] text-white text-sm px-5 py-2 rounded-full border-none cursor-pointer font-body hover:bg-[#085041] hover:-translate-y-px transition-all duration-200">
          {t('Get started', 'Commencer')}
        </button>
      </div>
    </nav>
  )
}