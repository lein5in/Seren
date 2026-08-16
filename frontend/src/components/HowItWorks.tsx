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
    en: { title: 'Install the extension', desc: 'Add Seren to Chrome in one click. The icon appears instantly in your browser bar — no setup, no configuration.' },
    fr: { title: 'Installez l\'extension', desc: 'Ajoutez Seren à Chrome en un clic. L\'icône apparaît instantanément dans votre barre — aucune configuration.' },
  },
  {
    num: '2',
    en: { title: 'Tell Seren your courses', desc: 'Import your .ics from uOzone, upload your notes and PDFs, or just type your schedule manually. Any university works.' },
    fr: { title: 'Partagez vos cours avec Seren', desc: 'Importez votre .ics depuis uOzone, ajoutez vos notes et PDFs, ou saisissez votre horaire manuellement. Toute université fonctionne.' },
  },
  {
    num: '3',
    en: { title: 'Open it when you sit down', desc: 'Click the icon, hit "Start Studying". Seren knows where you left off and what\'s coming up — ready before you are.' },
    fr: { title: 'Ouvrez-le quand vous vous installez', desc: 'Cliquez sur l\'icône, appuyez sur "Commencer à étudier". Seren sait où vous en étiez et ce qui s\'en vient.' },
  },
  {
    num: '4',
    en: { title: 'Select, right-click, learn', desc: 'Highlight anything on any page — an exercise, a concept, a paragraph. Right-click and Seren is already there with an answer.' },
    fr: { title: 'Sélectionnez, clic droit, apprenez', desc: 'Surlignez n\'importe quoi sur n\'importe quelle page. Clic droit et Seren est déjà là avec une réponse.' },
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

      {}
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
            'Install once, open every time you study. Seren is ready before you are.',
            'Installez une fois, ouvrez à chaque session d\'étude. Seren est prêt avant vous.'
          )}
        </p>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 relative">

        {}
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