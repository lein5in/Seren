import { useEffect, useRef } from 'react'
import { useLang } from '../context/LangContext'

interface Plan {
  id: string
  price: string
  featured?: boolean
  en: { plan: string; period: string; features: string[]; cta: string }
  fr: { plan: string; period: string; features: string[]; cta: string }
}

const plans: Plan[] = [
  {
    id: 'free',
    price: '$0',
    en: {
      plan: 'FREE',
      period: 'forever',
      cta: 'Add to Chrome — free',
      features: [
        'Schedule import (.ics)',
        'Basic reminders (3 days)',
        'Up to 20 AI messages/day',
        'Right-click context menu',
      ],
    },
    fr: {
      plan: 'GRATUIT',
      period: 'pour toujours',
      cta: 'Ajouter à Chrome — gratuit',
      features: [
        'Import d\'horaire (.ics)',
        'Rappels de base (3 jours)',
        'Jusqu\'à 20 messages IA/jour',
        'Menu clic droit contextuel',
      ],
    },
  },
  {
    id: 'student',
    price: '$4',
    featured: true,
    en: {
      plan: 'STUDENT',
      period: 'per month',
      cta: 'Start free trial',
      features: [
        'Everything in Free',
        'Unlimited AI messages',
        'PDF & notes upload',
        'Academic memory',
        'Generative quizzes',
        'Focus sessions',
        'Overwhelm mode',
      ],
    },
    fr: {
      plan: 'ÉTUDIANT',
      period: 'par mois',
      cta: 'Essai gratuit',
      features: [
        'Tout du plan Gratuit',
        'Messages IA illimités',
        'Upload PDF et notes',
        'Mémoire académique',
        'Quiz génératifs',
        'Sessions focus',
        'Mode submersion',
      ],
    },
  },
  {
    id: 'pro',
    price: '$9',
    en: {
      plan: 'PRO',
      period: 'per month',
      cta: 'Get Pro',
      features: [
        'Everything in Student',
        'Google Calendar sync',
        'Notion integration',
        'Opus model for complex tasks',
        'Priority support',
      ],
    },
    fr: {
      plan: 'PRO',
      period: 'par mois',
      cta: 'Obtenir Pro',
      features: [
        'Tout du plan Étudiant',
        'Sync Google Calendar',
        'Intégration Notion',
        'Modèle Opus pour tâches complexes',
        'Support prioritaire',
      ],
    },
  },
]

export default function Pricing() {
  const { lang, t } = useLang()
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
    <section id="pricing" className="py-24 px-[5%]" ref={sectionRef}>

      <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
        <p className="text-xs tracking-[3px] text-[#1D9E75] font-medium mb-4 uppercase">
          {t('PRICING', 'TARIFS')}
        </p>
      </div>
      <div className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-100">
        <h2 className="font-display text-[clamp(32px,4vw,52px)] leading-[1.15] text-[#085041] mb-16">
          {t('Fair pricing for', 'Des tarifs justes pour')}<br />
          <em className="italic text-[#1D9E75]">{t('student budgets.', 'les budgets étudiants.')}</em>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {plans.map((plan, i) => {
          const data = lang === 'en' ? plan.en : plan.fr
          return (
            <div
              key={plan.id}
              className={`reveal opacity-0 translate-y-8 transition-all duration-700 rounded-3xl p-10 relative
                ${plan.featured
                  ? 'bg-[#0F6E56] border border-[#0F6E56] scale-[1.03] shadow-[0_30px_60px_rgba(15,110,86,0.25)]'
                  : 'bg-white border border-[#E1F5EE] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,110,86,0.1)]'
                }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#5DCAA5] text-[#04342C] text-[11px] font-medium px-4 py-1 rounded-full tracking-wide whitespace-nowrap">
                  {t('MOST POPULAR', 'PLUS POPULAIRE')}
                </div>
              )}

              <p className={`text-[13px] font-medium tracking-widest mb-3 ${plan.featured ? 'text-[#9FE1CB]' : 'text-[#1D9E75]'}`}>
                {data.plan}
              </p>
              <p className={`font-display text-5xl leading-none mb-1.5 ${plan.featured ? 'text-white' : 'text-[#085041]'}`}>
                {plan.price}
              </p>
              <p className={`text-sm mb-7 ${plan.featured ? 'text-white/60' : 'text-[#88877F]'}`}>
                {data.period}
              </p>

              <ul className="mb-8 space-y-0">
                {data.features.map(f => (
                  <li
                    key={f}
                    className={`flex items-center gap-2.5 py-2 border-b text-sm
                      ${plan.featured
                        ? 'text-white/70 border-white/10'
                        : 'text-[#88877F] border-[#E1F5EE]'
                      }`}
                  >
                    <span className={`flex-shrink-0 font-medium ${plan.featured ? 'text-[#9FE1CB]' : 'text-[#1D9E75]'}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button className={`w-full py-3.5 rounded-full text-sm font-medium cursor-pointer font-body transition-all duration-200
                ${plan.featured
                  ? 'bg-white text-[#0F6E56] border-none hover:bg-[#E1F5EE]'
                  : 'bg-[#E1F5EE] text-[#0F6E56] border border-[#9FE1CB] hover:bg-[#9FE1CB]/30'
                }`}>
                {data.cta}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}