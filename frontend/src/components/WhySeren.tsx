import { useEffect, useRef } from 'react'
import { useLang } from '../context/LangContext'

export default function WhySeren() {
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

  const stats = [
    {
      num: '73%',
      en: 'of students report feeling overwhelmed by academic deadlines',
      fr: 'des étudiants se sentent dépassés par les deadlines académiques',
    },
    {
      num: '3×',
      en: 'more likely to complete tasks when reminded 3 days in advance',
      fr: 'plus de chances de compléter une tâche avec un rappel 3 jours à l\'avance',
    },
    {
      num: '5 min',
      en: 'average setup time — from zero to fully organized',
      fr: 'temps moyen d\'installation — de zéro à complètement organisé',
    },
    {
      num: '∞',
      en: 'works year-round — semester, internship, or vacation',
      fr: 'fonctionne toute l\'année — semestre, stage ou vacances',
    },
  ]

  return (
    <section id="why" className="py-24 px-[5%] bg-[#F8F8F6]" ref={sectionRef}>

      {/* Header */}
      <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
        <p className="text-xs tracking-[3px] text-[#1D9E75] font-medium mb-4 uppercase">
          {t('WHY SEREN', 'POURQUOI SEREN')}
        </p>
      </div>
      <div className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-100">
        <h2 className="font-display text-[clamp(32px,4vw,52px)] leading-[1.15] text-[#085041] mb-16">
          {t('Built for the student', 'Conçu pour l\'étudiant')}<br />
          {t('who ', 'qui ')}<em className="italic text-[#1D9E75]">{t('feels everything.', 'ressent tout.')}</em>
        </h2>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6">
          {stats.map((s, i) => (
            <div
              key={s.num}
              className="reveal opacity-0 translate-y-8 transition-all duration-700 bg-[#E1F5EE] rounded-2xl p-7"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <p className="font-display text-[40px] text-[#0F6E56] leading-none mb-2">{s.num}</p>
              <p className="text-sm text-[#88877F] leading-relaxed">{t(s.en, s.fr)}</p>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-200 bg-[#085041] rounded-2xl p-10">
          <p className="font-display text-[22px] italic leading-relaxed text-[#9FE1CB] mb-6">
            {t(
              '"Most productivity tools are built for people who are already organized. Seren is built for the rest of us."',
              '"La plupart des outils de productivité sont faits pour ceux qui sont déjà organisés. Seren est fait pour les autres."'
            )}
          </p>
          <p className="text-sm text-[#5DCAA5]">
            {t(
              '— Habib, Creator of Seren · University of Ottawa',
              '— Habib, Créateur de Seren · Université d\'Ottawa'
            )}
          </p>
        </div>
      </div>
    </section>
  )
}