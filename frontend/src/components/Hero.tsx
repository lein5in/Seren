import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'

export default function Hero() {
  const { t } = useLang()
  const navigate = useNavigate()

  function handleChromeBtn() {
    const stored = localStorage.getItem('seren_user')
    if (stored) {
      navigate('/chat')
    } else {
      navigate('/register')
    }
  }

  return (
    <section className="min-h-screen pt-[120px] pb-20 px-[5%] grid grid-cols-1 lg:grid-cols-2 items-center gap-16 relative overflow-hidden">

      {}
      <div className="absolute top-[-100px] right-[-100px] w-[600px] h-[600px] rounded-full pointer-events-none opacity-60"
        style={{ background: 'radial-gradient(circle, #E1F5EE 0%, transparent 70%)' }}
      />

      {}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 bg-[#E1F5EE] border border-[#9FE1CB] rounded-full px-4 py-1.5 text-xs text-[#0F6E56] tracking-widest font-medium mb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
          {t('YOUR DAILY STUDY COMPANION', "VOTRE COMPAGNON D'ÉTUDES QUOTIDIEN")}
        </div>

        <h1 className="font-display text-[clamp(40px,5vw,64px)] leading-[1.1] text-[#085041] mb-6">
          {t('Study smarter,', 'Étudiez mieux,')}<br />
          {t('remember ', 'retenez ')}<em className="italic text-[#1D9E75]">{t('everything.', 'tout.')}</em>
        </h1>

        <p className="text-lg text-[#88877F] leading-relaxed mb-10 max-w-[480px] font-light">
          {t(
            'Seren is the AI companion that knows your courses, revises with you, and remembers everything — right where you study.',
            "Seren est le compagnon IA qui connaît vos cours, révise avec vous et se souvient de tout — là où vous étudiez."
          )}
        </p>

        <div className="flex gap-4 flex-wrap items-center">
          <button
            onClick={handleChromeBtn}
            className="bg-[#0F6E56] text-white text-[15px] px-8 py-3.5 rounded-full border-none cursor-pointer font-body font-medium hover:bg-[#085041] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,110,86,0.25)] transition-all duration-200"
          >
            {t("Add to Chrome — it's free", "Ajouter à Chrome — c'est gratuit")}
          </button>
          <a
            href="#how"
            className="text-[15px] text-[#0F6E56] bg-transparent border border-[#9FE1CB] px-7 py-3.5 rounded-full cursor-pointer font-body hover:border-[#1D9E75] hover:bg-[#E1F5EE] transition-all duration-200 no-underline"
          >
            {t('See how it works', 'Voir comment ça marche')}
          </a>
        </div>

        <p className="text-xs text-[#88877F] mt-4">
          {t('No credit card required · Free plan available', 'Aucune carte requise · Plan gratuit disponible')}
        </p>
      </div>

      {}
      <div className="relative h-[520px] flex items-center justify-center">

        {}
        {[
          { label: t('Right-click any text', 'Clic droit sur n\'importe quel texte'), value: '→ Solve with Seren', pos: 'top-8 left-0', anim: 'animate-float-a' },
          { label: t('Focus session', 'Session focus'), value: '🎯 45 min deep work', pos: 'bottom-16 left-0', anim: 'animate-float-b' },
          { label: t('Schedule imported', 'Horaire importé'), value: '✓ uOzone sync', pos: 'top-8 right-0', anim: 'animate-float-c' },
          { label: t('Academic memory', 'Mémoire académique'), value: '📚 12 notes saved', pos: 'bottom-16 right-0', anim: 'animate-float-a', valueClass: 'text-[#1D9E75]' },
        ].map(card => (
          <div key={card.label} className={`absolute ${card.pos} bg-white rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(15,110,86,0.12),0_0_0_1px_#E1F5EE] ${card.anim} z-20`}>
            <p className="text-[10px] text-[#88877F] mb-0.5">{card.label}</p>
            <p className={`text-[12px] font-medium text-[#0F6E56] ${card.valueClass ?? ''}`}>{card.value}</p>
          </div>
        ))}

        {}
        <div className="relative w-[420px] z-10">

          {}
          <div
            className="relative w-full rounded-t-[16px] overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #e8e8e8 0%, #d0d0d0 50%, #c8c8c8 100%)',
              padding: '10px 10px 0 10px',
              boxShadow: '0 -1px 0 #f0f0f0 inset, 0 1px 0 #b8b8b8 inset, 0 -20px 40px rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex justify-center mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#b8b8b8] border border-[#c8c8c8]" />
            </div>
            <div
              className="w-full overflow-hidden"
              style={{ borderRadius: '6px 6px 0 0', aspectRatio: '16/10', background: '#1a1a1a', padding: '2px' }}
            >
              <div className="w-full h-full bg-white relative overflow-hidden" style={{ borderRadius: '4px 4px 0 0' }}>

                {}
                <div className="bg-[#F2F2F2] px-3 py-2 flex items-center gap-2 border-b border-[#E0E0E0]">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  </div>
                  <div className="flex-1 bg-white border border-[#D8D8D8] rounded-full px-3 py-0.5 flex items-center gap-1.5 mx-2">
                    <span className="text-[9px] text-[#999]">🔒</span>
                    <span className="text-[9px] text-[#888]">brightspace.uottawa.ca</span>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-[#0F6E56] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-[7px] text-white font-bold">S</span>
                  </div>
                </div>

                {}
                <div className="px-6 pt-4 pb-2 opacity-80">
                  <p className="text-[7px] text-[#aaa] uppercase tracking-widest mb-1">CSI2110 — Week 6</p>
                  <p className="text-[12px] font-semibold text-[#1a1a1a] mb-3">Binary Search Trees</p>
                  <p className="text-[7.5px] text-[#666] leading-relaxed mb-2">
                    A binary search tree stores keys such that every left child is smaller and every right child is larger than the parent node.
                  </p>
                  <p className="text-[7.5px] leading-relaxed mb-2">
                    <span className="text-[#666]">The </span>
                    <span className="bg-[#C7F0E0] text-[#085041] px-0.5 rounded-sm">average time complexity is O(log n)</span>
                    <span className="text-[#666]"> for search, insertion, and deletion in a balanced tree.</span>
                  </p>
                  <p className="text-[7.5px] leading-relaxed">
                    <span className="bg-[#C7F0E0] text-[#085041] px-0.5 rounded-sm">AVL and Red-Black trees</span>
                    <span className="text-[#666]"> are self-balancing variants that guarantee O(log n) in the worst case.</span>
                  </p>
                </div>

                {}
                <div
                  className="absolute right-3 top-[36px] w-[148px] bg-white overflow-hidden"
                  style={{ borderRadius: '12px', boxShadow: '0 8px 40px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(15,110,86,0.25)' }}
                >
                  <div className="bg-[#0F6E56] px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 32 32" fill="none">
                        <path d="M16 2 A14 14 0 1 1 26.1 22" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                        <circle cx="26.5" cy="23.5" r="2.5" fill="#9FE1CB"/>
                      </svg>
                      <span className="text-[10px] text-white font-medium tracking-widest">SEREN</span>
                    </div>
                    <span className="text-[10px]">🌿</span>
                  </div>
                  <div className="p-3">
                    <p className="text-[8px] text-[#88877F] mb-0.5">{t('Ready to study,', 'Prêt à étudier,')}</p>
                    <p className="font-display text-[13px] text-[#085041] mb-2.5">Habib 🌿</p>
                    <div className="bg-[#E1F5EE] rounded-lg p-2 mb-2.5">
                      <p className="text-[7px] text-[#0F6E56] font-medium mb-1.5">{t('Where do you start?', 'Par où commencer ?')}</p>
                      <div className="flex flex-col gap-1">
                        {[
                          t('📖 Explain BST deletion', '📖 Expliquer BST'),
                          t('🧪 Quiz me on Week 6', '🧪 Quiz semaine 6'),
                        ].map(action => (
                          <div key={action} className="text-[7px] bg-white text-[#0F6E56] rounded-md px-2 py-1.5">{action}</div>
                        ))}
                      </div>
                    </div>
                    {[
                      { dot: 'bg-red-400', title: 'MAT1320 — Midterm', date: t('in 3 days', 'dans 3 jours'), badge: t('Urgent', 'Urgent'), badgeStyle: 'bg-red-50 text-red-600' },
                      { dot: 'bg-amber-400', title: 'CSI2110 — A3', date: t('in 6 days', 'dans 6 jours'), badge: t('Soon', 'Bientôt'), badgeStyle: 'bg-amber-50 text-amber-600' },
                    ].map(task => (
                      <div key={task.title} className="flex items-center gap-1.5 py-1.5 border-b border-[#F0F0F0] last:border-0">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[7px] font-medium text-[#2C2C2A] truncate">{task.title}</p>
                          <p className="text-[6px] text-[#88877F]">{task.date}</p>
                        </div>
                        <span className={`text-[6px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${task.badgeStyle}`}>{task.badge}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {}
          <div style={{ height: '4px', background: 'linear-gradient(to bottom, #b8b8b8, #c8c8c8)', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />

          {}
          <div style={{
            background: 'linear-gradient(160deg, #e0e0e0 0%, #cacaca 50%, #c0c0c0 100%)',
            height: '20px', borderRadius: '0 0 6px 6px',
            boxShadow: '0 1px 0 #f0f0f0 inset', position: 'relative',
          }}>
            <div style={{
              width: '56px', height: '9px', background: '#b8b8b8',
              border: '0.5px solid #c8c8c8', borderRadius: '3px',
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            }} />
          </div>

          {}
          <div style={{
            height: '8px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.06), transparent)',
            borderRadius: '0 0 50% 50%', marginTop: '1px',
          }} />

        </div>
      </div>
    </section>
  )
}