import { useLang } from '../context/LangContext'

export default function Hero() {
  const { t } = useLang()

  return (
    <section className="min-h-screen pt-[120px] pb-20 px-[5%] grid grid-cols-1 lg:grid-cols-2 items-center gap-16 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-[-100px] right-[-100px] w-[600px] h-[600px] rounded-full bg-radial-gradient pointer-events-none opacity-60"
        style={{ background: 'radial-gradient(circle, #E1F5EE 0%, transparent 70%)' }}
      />

      {/* Left — Content */}
      <div className="relative z-10">
        {/* Tag */}
        <div className="inline-flex items-center gap-2 bg-[#E1F5EE] border border-[#9FE1CB] rounded-full px-4 py-1.5 text-xs text-[#0F6E56] tracking-widest font-medium mb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
          {t('YOUR CALM COMPANION', 'VOTRE COMPAGNON CALME')}
        </div>

        {/* Headline */}
        <h1 className="font-display text-[clamp(40px,5vw,64px)] leading-[1.1] text-[#085041] mb-6">
          {t('Manage deadlines,', 'Gérez vos deadlines,')}<br />
          {t('not ', 'pas votre ')}<em className="italic text-[#1D9E75]">{t('anxiety.', 'anxiété.')}</em>
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-[#88877F] leading-relaxed mb-10 max-w-[480px] font-light">
          {t(
            'Seren is the AI companion built for anxious students. It listens first, plans second — and always keeps you three steps ahead.',
            'Seren est le compagnon IA conçu pour les étudiants anxieux. Il écoute d\'abord, planifie ensuite — et vous garde toujours en avance.'
          )}
        </p>

        {/* Actions */}
        <div className="flex gap-4 flex-wrap items-center">
          <button className="bg-[#0F6E56] text-white text-[15px] px-8 py-3.5 rounded-full border-none cursor-pointer font-body font-medium hover:bg-[#085041] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,110,86,0.25)] transition-all duration-200">
            {t('Get started free', 'Commencer gratuitement')}
          </button>
          <button className="text-[15px] text-[#0F6E56] bg-transparent border border-[#9FE1CB] px-7 py-3.5 rounded-full cursor-pointer font-body hover:border-[#1D9E75] hover:bg-[#E1F5EE] transition-all duration-200">
            {t('See how it works', 'Voir comment ça marche')}
          </button>
        </div>

        <p className="text-xs text-[#88877F] mt-4">
          {t('No credit card required · Free plan available', 'Aucune carte requise · Plan gratuit disponible')}
        </p>
      </div>

      {/* Right — Phone mockup */}
      <div className="relative h-[480px] flex items-center justify-center">

        {/* Phone */}
        <div className="relative w-[240px] h-[420px] bg-white rounded-[36px] shadow-[0_40px_80px_rgba(15,110,86,0.15),0_0_0_1px_#9FE1CB] overflow-hidden">
          {/* Status bar */}
          <div className="bg-[#0F6E56] h-10 flex items-center justify-center">
            <span className="text-[11px] text-white/70 tracking-widest">SEREN</span>
          </div>
          {/* Content */}
          <div className="p-5">
            <p className="text-xs text-[#88877F] mb-1">{t('Good morning,', 'Bonjour,')}</p>
            <p className="font-display text-xl text-[#085041] mb-5">Habib 🌿</p>

            {/* Check-in */}
            <div className="bg-[#E1F5EE] rounded-xl p-3.5 mb-3.5">
              <p className="text-[11px] text-[#0F6E56] font-medium mb-2">
                {t('How are you feeling today?', 'Comment tu te sens aujourd\'hui ?')}
              </p>
              <div className="flex gap-1.5">
                {['😌', '😐', '😰', '😊'].map(emoji => (
                  <button key={emoji} className="flex-1 text-center text-lg bg-white rounded-lg py-1.5 cursor-pointer hover:scale-110 transition-transform duration-200 border-none">
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks */}
            {[
              { dot: 'bg-red-500', title: 'MAT1320 — Midterm', date: t('in 3 days', 'dans 3 jours'), badge: t('Urgent', 'Urgent'), badgeStyle: 'bg-red-50 text-red-700' },
              { dot: 'bg-amber-400', title: 'CSI2110 — Assignment 3', date: t('in 6 days', 'dans 6 jours'), badge: t('Soon', 'Bientôt'), badgeStyle: 'bg-amber-50 text-amber-700' },
            ].map(task => (
              <div key={task.title} className="flex items-center gap-2.5 py-2.5 border-b border-[#E1F5EE]">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${task.dot}`} />
                <div className="flex-1">
                  <p className="text-[11px] font-medium text-[#2C2C2A]">{task.title}</p>
                  <p className="text-[10px] text-[#88877F]">{task.date}</p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${task.badgeStyle}`}>{task.badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating cards */}
        {[
          { label: t('Reminders set', 'Rappels activés'), value: '🔔 3 days ahead', pos: 'top-10 left-0', anim: 'animate-float-a' },
          { label: t("Today's focus", 'Focus du jour'), value: '1 task at a time', pos: 'bottom-20 left-[-20px]', anim: 'animate-float-b' },
          { label: t('Schedule imported', 'Horaire importé'), value: '✓ uOzone sync', pos: 'top-20 right-0', anim: 'animate-float-c' },
          { label: t('Anxiety level', "Niveau d'anxiété"), value: '↓ Calm mode', pos: 'bottom-10 right-0', anim: 'animate-float-a', valueClass: 'text-[#1D9E75]' },
        ].map(card => (
          <div key={card.label} className={`absolute ${card.pos} bg-white rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(15,110,86,0.12),0_0_0_1px_#E1F5EE] ${card.anim}`}>
            <p className="text-[10px] text-[#88877F] mb-0.5">{card.label}</p>
            <p className={`text-[12px] font-medium text-[#0F6E56] ${card.valueClass ?? ''}`}>{card.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}