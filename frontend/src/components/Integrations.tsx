import { useEffect, useRef } from 'react'
import { useLang } from '../context/LangContext'

interface Integration {
  icon: string
  name: string
  en: string
  fr: string
}

const integrations: Integration[] = [
  { icon: '📆', name: 'uOzone',          en: '.ics schedule import',       fr: 'Import d\'horaire .ics' },
  { icon: '📚', name: 'Brightspace',     en: 'Auto-read via extension',    fr: 'Lecture auto via extension' },
  { icon: '📅', name: 'Google Calendar', en: 'Two-way sync',               fr: 'Synchronisation bidirectionnelle' },
  { icon: '📝', name: 'Notion',          en: 'Export your schedule',       fr: 'Exportez votre planning' },
]

export default function Integrations() {
  const { t } = useLang()
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('opacity-100', 'translate-y-0')
          e.target.classList.remove('opacity-0', 'translate-y-8')
        }
      }),
      { threshold: 0.1 }
    )
    sectionRef.current?.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="integrations" className="py-24 px-[5%] bg-[#F8F8F6]" ref={sectionRef}>

      {/* Header */}
      <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
        <p className="text-xs tracking-[3px] text-[#1D9E75] font-medium mb-4 uppercase">
          {t('INTEGRATIONS', 'INTÉGRATIONS')}
        </p>
      </div>
      <div className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-100">
        <h2 className="font-display text-[clamp(32px,4vw,52px)] leading-[1.15] text-[#085041] mb-16">
          {t('Works with the tools', 'Fonctionne avec les outils')}<br />
          {t('you ', 'que vous ')}<em className="italic text-[#1D9E75]">{t('already use.', 'utilisez déjà.')}</em>
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {integrations.map((item, i) => (
          <div
            key={item.name}
            className="reveal opacity-0 translate-y-8 transition-all duration-700 bg-white border border-[#E8E8E4] rounded-2xl p-6 text-center hover:border-[#9FE1CB] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(15,110,86,0.08)] cursor-default"
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <div className="text-4xl mb-3">{item.icon}</div>
            <p className="text-sm font-medium text-[#2C2C2A] mb-1">{item.name}</p>
            <p className="text-xs text-[#88877F]">{t(item.en, item.fr)}</p>
          </div>
        ))}
      </div>

      {/* Coming soon note */}
      <div className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-300 mt-10 text-center">
        <p className="text-sm text-[#88877F]">
          {t('More integrations coming soon · ', 'Plus d\'intégrations bientôt · ')}
          <a href="#" className="text-[#1D9E75] hover:underline">
            {t('Request one', 'En demander une')}
          </a>
        </p>
      </div>
    </section>
  )
}