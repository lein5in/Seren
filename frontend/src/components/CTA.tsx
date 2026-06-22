import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'

export default function CTA() {
  const { t } = useLang()
  const navigate = useNavigate()
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

  function handleChromeBtn() {
    const stored = localStorage.getItem('seren_user')
    if (stored) {
      navigate('/chat')
    } else {
      navigate('/register')
    }
  }

  return (
    <section className="py-24 px-[5%] bg-[#085041] text-center relative overflow-hidden" ref={sectionRef}>

      <div
        className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(93,202,165,0.15) 0%, transparent 70%)' }}
      />

      <div className="relative z-10">
        <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
          <p className="text-xs tracking-[3px] text-[#5DCAA5] font-medium mb-4 uppercase">
            {t('GET STARTED', 'COMMENCER')}
          </p>
        </div>

        <div className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-100">
          <h2 className="font-display text-[clamp(32px,4vw,52px)] leading-[1.15] text-white mb-6">
            {t('Your smartest semester', 'Votre semestre le plus intelligent')}<br />
            {t('starts ', 'commence ')}<em className="italic text-[#5DCAA5]">{t("today.", "aujourd'hui.")}</em>
          </h2>
        </div>

        <div className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-200">
          <p className="text-[17px] text-white/60 leading-relaxed font-light max-w-[560px] mx-auto mb-12">
            {t(
              'Join students who study with a companion that knows their courses, remembers their notes, and is ready every time they sit down to work.',
              "Rejoignez les étudiants qui étudient avec un compagnon qui connaît leurs cours, se souvient de leurs notes, et est prêt à chaque session."
            )}
          </p>
        </div>

        <div className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-300 flex justify-center gap-4 flex-wrap">
          <button
            onClick={handleChromeBtn}
            className="bg-white text-[#0F6E56] text-[16px] font-medium px-10 py-4 rounded-full border-none cursor-pointer font-body hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] transition-all duration-200"
          >
            {t("Add to Chrome — it's free", "Ajouter à Chrome — c'est gratuit")}
          </button>
          <a
            href="#how"
            className="bg-transparent text-white text-[16px] px-8 py-4 rounded-full border border-white/30 cursor-pointer font-body hover:border-white hover:bg-white/5 transition-all duration-200 no-underline"
          >
            {t('See how it works', 'Voir comment ça marche')}
          </a>
        </div>
      </div>
    </section>
  )
}