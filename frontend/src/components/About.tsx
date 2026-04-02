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
      en: "I'm a university student who struggles with anxiety. Every time a new deadline appeared out of nowhere, I'd lose my momentum completely. I'd feel lost, frozen, unable to start.",
      fr: "Je suis un étudiant universitaire qui lutte contre l'anxiété. Chaque fois qu'une nouvelle deadline apparaissait de nulle part, je perdais complètement mon élan. Je me sentais perdu, figé, incapable de commencer.",
    },
    {
      en: "I tried every productivity app out there. They were all cold, rigid, and built for people who don't struggle the way I do.",
      fr: "J'ai essayé toutes les applications de productivité. Elles étaient toutes froides, rigides, et faites pour des gens qui ne luttent pas comme moi.",
    },
    {
      en: "So I built Seren — the companion I wish I had. It doesn't bark orders at you, it asks how you're doing first. It doesn't overwhelm you with tasks, it shows you just what you need to see. It's calm because you deserve calm.",
      fr: "Alors j'ai créé Seren — le compagnon que j'aurais voulu avoir. Il ne vous aboie pas dessus, il demande d'abord comment vous allez. Il ne vous submerge pas de tâches, il vous montre juste ce que vous devez voir. Il est calme parce que vous méritez le calme.",
    },
  ]

  return (
    <section id="about" className="py-24 px-[5%] bg-white" ref={sectionRef}>

      {/* Header */}
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

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

        {/* Avatar */}
        <div className="reveal opacity-0 translate-y-8 transition-all duration-700 w-full aspect-square rounded-3xl bg-gradient-to-br from-[#E1F5EE] to-[#9FE1CB] flex items-center justify-center text-[100px] max-w-[420px]">
          🌿
        </div>

        {/* Text */}
        <div className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-200">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[16px] text-[#88877F] leading-[1.8] mb-5 font-light">
              {t(p.en, p.fr)}
            </p>
          ))}

          {/* Highlight box */}
          <div className="mt-8 border-l-4 border-[#1D9E75] pl-5 py-1">
            <p className="text-[15px] text-[#0F6E56] font-medium leading-relaxed">
              {t(
                'Seren is calm because you deserve calm.',
                'Seren est calme parce que vous méritez le calme.'
              )}
            </p>
          </div>

          {/* Signature */}
          <p className="font-display text-[28px] italic text-[#0F6E56] mt-8">— Habib</p>
        </div>
      </div>
    </section>
  )
}