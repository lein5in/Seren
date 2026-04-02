import { useLang } from '../context/LangContext'

export default function Footer() {
  const { t } = useLang()

  const columns = [
    {
      en: 'Product', fr: 'Produit',
      links: [
        { href: '#features', en: 'Features', fr: 'Fonctionnalités' },
        { href: '#pricing', en: 'Pricing', fr: 'Tarifs' },
        { href: '#', en: 'Extension', fr: 'Extension' },
        { href: '#', en: 'Changelog', fr: 'Nouveautés' },
      ],
    },
    {
      en: 'Company', fr: 'Entreprise',
      links: [
        { href: '#about', en: 'About', fr: 'À propos' },
        { href: '#', en: 'Blog', fr: 'Blog' },
        { href: '#', en: 'Contact', fr: 'Contact' },
      ],
    },
    {
      en: 'Legal', fr: 'Légal',
      links: [
        { href: '#', en: 'Privacy', fr: 'Confidentialité' },
        { href: '#', en: 'Terms', fr: 'Conditions' },
      ],
    },
  ]

  return (
    <footer className="px-[5%] pt-16 pb-10 border-t border-[#E1F5EE]">

      {/* Top grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

        {/* Brand */}
        <div>
          <a href="#" className="flex items-center gap-2 no-underline mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 2 A14 14 0 1 1 26.1 22" stroke="#0F6E56" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="26.5" cy="23.5" r="2.5" fill="#1D9E75"/>
              <line x1="10" y1="13" x2="22" y2="13" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.8"/>
              <line x1="9" y1="18" x2="23" y2="18" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
              <line x1="10" y1="23" x2="22" y2="23" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.3"/>
            </svg>
            <span className="font-display text-[22px] text-[#0F6E56] tracking-wide">Seren</span>
          </a>
          <p className="text-sm text-[#88877F] leading-relaxed max-w-[260px]">
            {t(
              'The calm AI companion for anxious students. Built with care at the University of Ottawa.',
              'Le compagnon IA calme pour les étudiants anxieux. Construit avec soin à l\'Université d\'Ottawa.'
            )}
          </p>
        </div>

        {/* Link columns */}
        {columns.map(col => (
          <div key={col.en}>
            <h4 className="text-[13px] font-medium text-[#0F6E56] tracking-wide mb-4">
              {t(col.en, col.fr)}
            </h4>
            {col.links.map(link => (
              <a
                key={link.en}
                href={link.href}
                className="block text-sm text-[#88877F] no-underline mb-2.5 hover:text-[#1D9E75] transition-colors duration-200"
              >
                {t(link.en, link.fr)}
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-[#E1F5EE]">
        <p className="text-[13px] text-[#88877F]">
          {t(
            '© 2026 Seren. Made with 🌿 for anxious students everywhere.',
            '© 2026 Seren. Fait avec 🌿 pour les étudiants anxieux partout.'
          )}
        </p>
        <p className="text-[13px] text-[#88877F]">
          {t('Calm · Smart · Yours', 'Calme · Intelligent · Le vôtre')}
        </p>
      </div>
    </footer>
  )
}