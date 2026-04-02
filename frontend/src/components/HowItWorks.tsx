import { useEffect, useRef } from 'react'
import { useLang } from '../context/LangContext'

interface Step {
  num: string
  en: { title: string; desc: string }
  fr: { title: string; desc: string }
}

const steps: Step[] = [
  {
    num: '1',
    en: { title: 'Create your account', desc: 'Sign up in 30 seconds. No credit card required for the free plan.' },
    fr: { title: 'Créez votre compte', desc: 'Inscrivez-vous en 30 secondes. Aucune carte requise pour le plan gratuit.' },
  },
  {
    num: '2',
    en: { title: 'Seren gets to know you', desc: 'Answer a few calm questions about your schedule, priorities and how you work best.' },
    fr: { title: 'Seren apprend à vous connaître', desc: 'Répondez à quelques questions calmes sur votre emploi du temps et priorités.' },
  },
  {
    num: '3',
    en: { title: 'Import your schedule', desc: 'Export your .ics from uOzone and drop it in. Seren handles the rest automatically.' },
    fr: { title: 'Importez votre horaire', desc: 'Exportez votre .ics depuis uOzone et déposez-le. Seren s\'occupe du reste.' },
  },
  {
    num: '4',
    en: { title: 'Stay calm & focused', desc: 'Seren reminds, adjusts, and cheers you on — every single day, at your pace.' },
    fr: { title: 'Restez calme et concentré', desc: 'Seren vous rappelle, s\'ajuste et vous encourage — chaque jour, à votre rythme.' },
  },
]

export default function HowItWorks() {
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
    <section id="how" className="py-24 px-[5%] bg-[#085041]" ref={sectionRef}>

      {/* Header */}
      <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
        <p className="text-xs tracking-[3px] text-[#5DCAA5] font-medium mb-4 uppercase">
          {t('HOW IT WORKS', 'COMMENT ÇA MARCHE')}
        </p>
      </div>
      <div className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-100">
        <h2 className="font-display text-[clamp(32px,4vw,52px)] leading-[1.15] text-white mb-5">
          {t('Simple by design,', 'Simple par conception,')}<br />
          <em className="italic text-[#5DCAA5]">{t('smart by nature.', 'intelligent par nature.')}</em>
        </h2>
      </div>
      <div className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-200">
        <p className="text-[17px] text-white/60 leading-relaxed font-light max-w-[600px] mb-16">
          {t(
            'Getting started with Seren takes less than 5 minutes. No complicated setup, no overwhelming options.',
            'Démarrer avec Seren prend moins de 5 minutes. Pas de configuration compliquée, pas d\'options écrasantes.'
          )}
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 relative">

        {/* Connector line (desktop only) */}
        <div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[#1D9E75] to-transparent" />

        {steps.map((step, i) => (
          <div
            key={step.num}
            className="reveal opacity-0 translate-y-8 transition-all duration-700 text-center group"
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <div className="w-16 h-16 rounded-full bg-[#0F6E56] border-2 border-[#1D9E75] flex items-center justify-center mx-auto mb-6 relative z-10 group-hover:bg-[#1D9E75] group-hover:scale-110 transition-all duration-300">
              <span className="font-display text-[22px] text-[#9FE1CB]">{step.num}</span>
            </div>
            <h3 className="text-[15px] font-medium text-white mb-2.5">
              {t(step.en.title, step.fr.title)}
            </h3>
            <p className="text-[13px] text-white/50 leading-relaxed">
              {t(step.en.desc, step.fr.desc)}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}