import { useEffect, useRef } from 'react'
import { useLang } from '../context/LangContext'

export default function About() {
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

  const paragraphs = [
    {
      en: "I'm a university student who juggles courses, assignments, and deadlines across a dozen different platforms. Every semester I'd start organized and end up lost — tabs everywhere, notes scattered, no idea where to begin.",
      fr: "Je suis un étudiant universitaire qui jongle entre les cours, les devoirs et les deadlines sur une dizaine de plateformes différentes. Chaque semestre je commençais organisé et finissais perdu — des onglets partout, des notes éparpillées, sans savoir par où commencer.",
    },
    {
      en: "I tried every study app out there. They were all cold, rigid, and built for people who are already organized. None of them actually knew my courses, my notes, or my schedule.",
      fr: "J'ai essayé toutes les apps d'études. Elles étaient toutes froides, rigides, et faites pour des gens déjà organisés. Aucune ne connaissait vraiment mes cours, mes notes ou mon horaire.",
    },
    {
      en: "So I built Seren — the companion I wish I had. It lives in your browser, knows your material, and is ready every time you sit down to work. You don't manage it. It studies with you.",
      fr: "Alors j'ai créé Seren — le compagnon que j'aurais voulu avoir. Il vit dans votre navigateur, connaît votre matière, et est prêt chaque fois que vous vous installez pour travailler. Vous ne le gérez pas. Il étudie avec vous.",
    },
  ]

  return (
    <section id="about" className="py-24 px-[5%] bg-white" ref={sectionRef}>

      {}
      <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
        <p className="text-xs tracking-[3px] text-[#1D9E75] font-medium mb-4 uppercase">
          {t('ABOUT', 'À PROPOS')}
        </p>
      </div>
      <div className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-100">
        <h2 className="font-display text-[clamp(32px,4vw,52px)] leading-[1.15] text-[#085041] mb-16">
          {t('Why I built ', 'Pourquoi j\'ai créé ')}
          <em className="italic text-[#1D9E75]">Seren.</em>
        </h2>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

        {}
        <div className="reveal opacity-0 translate-y-8 transition-all duration-700 w-full aspect-square rounded-3xl bg-gradient-to-br from-[#E1F5EE] to-[#9FE1CB] flex items-center justify-center text-[100px] max-w-[420px]">
          🌿
        </div>

        {}
        <div className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-200">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[16px] text-[#88877F] leading-[1.8] mb-5 font-light">
              {t(p.en, p.fr)}
            </p>
          ))}

          {}
          <div className="mt-8 border-l-4 border-[#1D9E75] pl-5 py-1">
            <p className="text-[15px] text-[#0F6E56] font-medium leading-relaxed">
              {t(
                'You don\'t manage Seren. Seren studies with you.',
                'Vous ne gérez pas Seren. Seren étudie avec vous.'
              )}
            </p>
          </div>

          {}
          <p className="font-display text-[28px] italic text-[#0F6E56] mt-8">— Habib</p>
        </div>
      </div>
    </section>
  )
}