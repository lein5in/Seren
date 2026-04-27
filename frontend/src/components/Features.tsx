import { useEffect, useRef } from 'react'
import { useLang } from '../context/LangContext'

interface Feature {
  icon: string
  en: { title: string; desc: string }
  fr: { title: string; desc: string }
}

const features: Feature[] = [
  {
    icon: '💬',
    en: { title: 'Smart study chat', desc: 'Ask Seren anything about your courses, notes, or deadlines. It knows your material and answers in context — like a tutor who never gets tired.' },
    fr: { title: 'Chat de révision intelligent', desc: 'Posez n\'importe quelle question sur vos cours, notes ou deadlines. Seren connaît votre matière et répond en contexte.' },
  },
  {
    icon: '🖱️',
    en: { title: 'Right-click to learn', desc: 'Select any text on any page, right-click, and choose "Solve with Seren". A focused window opens instantly with your answer — no tab switching.' },
    fr: { title: 'Clic droit pour apprendre', desc: 'Sélectionnez n\'importe quel texte, clic droit, choisissez "Résoudre avec Seren". Une fenêtre s\'ouvre instantanément avec votre réponse.' },
  },
  {
    icon: '📅',
    en: { title: 'Smart scheduling', desc: 'Import your university timetable via .ics from uOzone or any portal. Seren auto-detects deadlines, exams, and assignments — then prioritizes them calmly.' },
    fr: { title: 'Planning intelligent', desc: 'Importez votre horaire via .ics depuis uOzone. Seren détecte automatiquement les deadlines et les priorise calmement.' },
  },
  {
    icon: '🧠',
    en: { title: 'Academic memory', desc: 'Upload your PDFs, slides, and notes. Seren reads them and remembers everything across every session — your knowledge base, always at hand.' },
    fr: { title: 'Mémoire académique', desc: 'Importez vos PDFs, slides et notes. Seren les lit et s\'en souvient dans chaque session — votre base de connaissances, toujours disponible.' },
  },
  {
    icon: '🎯',
    en: { title: 'Generative quizzes', desc: 'Seren generates quizzes directly from your own notes. Study smarter, not longer — test yourself on exactly what matters.' },
    fr: { title: 'Quiz génératifs', desc: 'Seren génère des quiz directement depuis vos propres notes. Étudiez plus intelligemment — testez-vous sur ce qui compte vraiment.' },
  },
  {
    icon: '🆘',
    en: { title: 'Overwhelm mode', desc: 'Feeling overwhelmed? One button. Seren shows you just ONE task to do right now — nothing else. Breathe. Focus. Move forward.' },
    fr: { title: 'Mode submersion', desc: 'Vous sentez débordé ? Un bouton. Seren vous montre UNE seule tâche à faire maintenant. Respirez. Concentrez-vous.' },
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
            'Seren lives in your browser and knows your courses. Every feature is designed to help you study — not manage an app.',
            'Seren vit dans votre navigateur et connaît vos cours. Chaque fonctionnalité est conçue pour vous aider à étudier — pas à gérer une app.'
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