import { useEffect, useRef } from 'react'
import { useLang } from '../context/LangContext'

interface Feature {
  icon: string
  en: { title: string; desc: string }
  fr: { title: string; desc: string }
}

const features: Feature[] = [
  {
    icon: '🌿',
    en: { title: 'Caring onboarding', desc: 'Before building your schedule, Seren asks about your availability, priorities, and anxiety level. It adapts to you — not the other way around.' },
    fr: { title: 'Onboarding bienveillant', desc: 'Avant de construire votre planning, Seren demande vos disponibilités, priorités et niveau d\'anxiété. Il s\'adapte à vous — pas l\'inverse.' },
  },
  {
    icon: '📅',
    en: { title: 'Smart scheduling', desc: 'Import your university timetable via .ics from uOzone. Seren auto-detects deadlines, exams, and assignments — then prioritizes them calmly.' },
    fr: { title: 'Planning intelligent', desc: 'Importez votre horaire via .ics depuis uOzone. Seren détecte automatiquement les deadlines et les priorise calmement.' },
  },
  {
    icon: '🔔',
    en: { title: 'Early reminders', desc: 'Get reminded 3 days before every deadline — never be caught off guard again. Reminders are calm, not alarming.' },
    fr: { title: 'Rappels anticipés', desc: 'Recevez des rappels 3 jours avant chaque deadline. Les rappels sont calmes, pas alarmants.' },
  },
  {
    icon: '😌',
    en: { title: 'Daily check-ins', desc: 'Every morning, Seren asks how you feel. Overwhelmed? It simplifies your day. Energized? It challenges you gently.' },
    fr: { title: 'Check-ins quotidiens', desc: 'Chaque matin, Seren demande comment vous vous sentez. Submergé ? Il simplifie votre journée. Energisé ? Il vous challenge doucement.' },
  },
  {
    icon: '🆘',
    en: { title: 'Overwhelm mode', desc: 'Feeling overwhelmed? One button. Seren shows you just ONE task to do right now — nothing else. Breathe. Focus. Move forward.' },
    fr: { title: 'Mode submersion', desc: 'Vous sentez débordé ? Un bouton. Seren vous montre UNE seule tâche à faire maintenant. Respirez. Concentrez-vous.' },
  },
  {
    icon: '💰',
    en: { title: 'Budget planner', desc: 'Track your student budget alongside your schedule. Seren knows when stressful weeks are coming — and adjusts your financial nudges accordingly.' },
    fr: { title: 'Planificateur budgétaire', desc: 'Suivez votre budget étudiant en parallèle de votre planning. Seren sait quand les semaines stressantes arrivent.' },
  },
]

export default function Features() {
  const { t } = useLang()
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('opacity-100', 'translate-y-0'); e.target.classList.remove('opacity-0', 'translate-y-8') } }),
      { threshold: 0.1 }
    )
    const elements = sectionRef.current?.querySelectorAll('.reveal')
    elements?.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" className="py-24 px-[5%]" ref={sectionRef}>

      {/* Header */}
      <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
        <p className="text-xs tracking-[3px] text-[#1D9E75] font-medium mb-4 uppercase">
          {t('FEATURES', 'FONCTIONNALITÉS')}
        </p>
      </div>
      <div className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-100">
        <h2 className="font-display text-[clamp(32px,4vw,52px)] leading-[1.15] text-[#085041] mb-5">
          {t('Everything you need,', 'Tout ce qu\'il vous faut,')}<br />
          <em className="italic text-[#1D9E75]">{t('nothing you don\'t.', 'rien de plus.')}</em>
        </h2>
      </div>
      <div className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-200">
        <p className="text-[17px] text-[#88877F] leading-relaxed font-light max-w-[600px] mb-16">
          {t(
            'Seren is built around one philosophy: ask before planning. Every feature is designed to reduce friction, not add it.',
            'Seren est construit autour d\'une philosophie : demander avant de planifier. Chaque fonctionnalité est conçue pour réduire la friction, pas l\'augmenter.'
          )}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <div
            key={f.en.title}
            className="reveal opacity-0 translate-y-8 transition-all duration-700 bg-white border border-[#E1F5EE] rounded-2xl p-8 group hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,110,86,0.1)] hover:border-[#9FE1CB] relative overflow-hidden cursor-default"
            style={{ transitionDelay: `${(i % 3) * 100}ms` }}
          >
            {/* Bottom bar on hover */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#5DCAA5] to-[#9FE1CB] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

            <div className="w-12 h-12 bg-[#E1F5EE] rounded-2xl flex items-center justify-center text-[22px] mb-5">
              {f.icon}
            </div>
            <h3 className="text-[17px] font-medium text-[#085041] mb-2.5">
              {t(f.en.title, f.fr.title)}
            </h3>
            <p className="text-sm text-[#88877F] leading-relaxed">
              {t(f.en.desc, f.fr.desc)}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}