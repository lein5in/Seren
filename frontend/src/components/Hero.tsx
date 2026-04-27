import { useLang } from '../context/LangContext'

export default function Hero() {
  const { t } = useLang()

  return (
    <section className="min-h-screen pt-[120px] pb-20 px-[5%] grid grid-cols-1 lg:grid-cols-2 items-center gap-16 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-[-100px] right-[-100px] w-[600px] h-[600px] rounded-full pointer-events-none opacity-60"
        style={{ background: 'radial-gradient(circle, #E1F5EE 0%, transparent 70%)' }}
      />

      {/* Left — Content */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 bg-[#E1F5EE] border border-[#9FE1CB] rounded-full px-4 py-1.5 text-xs text-[#0F6E56] tracking-widest font-medium mb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
          {t('YOUR DAILY STUDY COMPANION', 'VOTRE COMPAGNON D\'ÉTUDES QUOTIDIEN')}
        </div>

        <h1 className="font-display text-[clamp(40px,5vw,64px)] leading-[1.1] text-[#085041] mb-6">
          {t('Study smarter,', 'Étudiez mieux,')}<br />
          {t('remember ', 'retenez ')}<em className="italic text-[#1D9E75]">{t('everything.', 'tout.')}</em>
        </h1>

        <p className="text-lg text-[#88877F] leading-relaxed mb-10 max-w-[480px] font-light">
          {t(
            'Seren is the AI companion that knows your courses, revises with you, and remembers everything — right where you study.',
            'Seren est le compagnon IA qui connaît vos cours, révise avec vous et se souvient de tout — là où vous étudiez.'
          )}
        </p>

        <div className="flex gap-4 flex-wrap items-center">
          <button className="bg-[#0F6E56] text-white text-[15px] px-8 py-3.5 rounded-full border-none cursor-pointer font-body font-medium hover:bg-[#085041] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,110,86,0.25)] transition-all duration-200">
            {t('Add to Chrome — it\'s free', 'Ajouter à Chrome — c\'est gratuit')}
          </button>
          <button className="text-[15px] text-[#0F6E56] bg-transparent border border-[#9FE1CB] px-7 py-3.5 rounded-full cursor-pointer font-body hover:border-[#1D9E75] hover:bg-[#E1F5EE] transition-all duration-200">
            {t('See how it works', 'Voir comment ça marche')}
          </button>
        </div>

        <p className="text-xs text-[#88877F] mt-4">
          {t('No credit card required · Free plan available', 'Aucune carte requise · Plan gratuit disponible')}
        </p>
      </div>

      {/* Right — Browser + Extension mockup */}
      <div className="relative h-[500px] flex items-center justify-center">

        {/* Browser window */}
        <div className="relative w-[340px] h-[440px] bg-white rounded-2xl shadow-[0_40px_80px_rgba(15,110,86,0.15),0_0_0_1px_#E1F5EE] overflow-hidden">

          {/* Browser bar */}
          <div className="bg-[#F8F8F6] border-b border-[#E1F5EE] px-4 py-2.5 flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbdbd]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#fde68a]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#9FE1CB]" />
            </div>
            <div className="flex-1 bg-white border border-[#E1F5EE] rounded-full px-3 py-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1D9E75]" />
              <span className="text-[10px] text-[#88877F]">brightspace.uottawa.ca</span>
            </div>
            <div className="w-5 h-5 rounded-full bg-[#0F6E56] flex items-center justify-center flex-shrink-0">
              <span className="text-[8px] text-white font-bold">S</span>
            </div>
          </div>

          {/* Page content — simulated course page */}
          <div className="p-5 overflow-hidden">
            {/* Course title */}
            <p className="text-[9px] text-[#88877F] mb-1 uppercase tracking-widest">CSI2110 — Data Structures</p>
            <p className="text-[13px] font-semibold text-[#2C2C2A] mb-3">Week 6 — Binary Search Trees</p>

            {/* Paragraph with highlight */}
            <p className="text-[10px] text-[#88877F] leading-relaxed mb-1">
              A binary search tree (BST) is a rooted binary tree where each node stores a key greater than all keys in its left subtree and less than those in its right subtree.
            </p>
            <p className="text-[10px] leading-relaxed mb-1">
              <span className="text-[#88877F]">The </span>
              <span className="bg-[#C7F0E0] text-[#085041] px-0.5 rounded">time complexity of search, insertion, and deletion</span>
              <span className="text-[#88877F]"> in a balanced BST is O(log n), making it highly efficient for large datasets.</span>
            </p>
            <p className="text-[10px] text-[#88877F] leading-relaxed mb-3">
              In the worst case (degenerate tree), operations degrade to O(n). This is why self-balancing trees like AVL and Red-Black trees are preferred in practice.
            </p>

            {/* Second section */}
            <p className="text-[11px] font-semibold text-[#2C2C2A] mb-1.5">Key Operations</p>
            <p className="text-[10px] text-[#88877F] leading-relaxed">
              <span className="bg-[#C7F0E0] text-[#085041] px-0.5 rounded">Insert</span>
              <span className="text-[#88877F]"> — traverse until a null node is found, place the new key there. </span>
              <span className="bg-[#C7F0E0] text-[#085041] px-0.5 rounded">Delete</span>
              <span className="text-[#88877F]"> — three cases: leaf, one child, two children (replace with inorder successor).</span>
            </p>
          </div>

          {/* Seren extension popup */}
          <div className="absolute top-[44px] right-3 w-[170px] bg-white rounded-2xl shadow-[0_12px_40px_rgba(15,110,86,0.18),0_0_0_1px_#9FE1CB] overflow-hidden">
            <div className="bg-[#0F6E56] px-4 py-2.5 flex items-center justify-between">
              <span className="text-[11px] text-white/80 tracking-widest font-medium">SEREN</span>
              <span className="text-[10px] text-[#9FE1CB]">🌿</span>
            </div>
            <div className="p-3.5">
              <p className="text-[10px] text-[#88877F] mb-0.5">{t('Ready to study,', 'Prêt à étudier,')}</p>
              <p className="font-display text-[15px] text-[#085041] mb-3">Adam 🌿</p>

              <div className="bg-[#E1F5EE] rounded-xl p-2.5 mb-2.5">
                <p className="text-[9px] text-[#0F6E56] font-medium mb-2">
                  {t('Where do you start?', 'Par où commencer ?')}
                </p>
                <div className="flex flex-col gap-1">
                  {[
                    t('📖 Explain BST deletion', '📖 Expliquer suppression BST'),
                    t('🧪 Quiz me on Week 6', '🧪 Teste-moi semaine 6'),
                  ].map(action => (
                    <button key={action} className="text-left text-[9px] bg-white text-[#0F6E56] rounded-lg px-2.5 py-1.5 border-none cursor-pointer">
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              {[
                { dot: 'bg-red-500', title: 'MAT1320 — Midterm', date: t('in 3 days', 'dans 3 jours'), badge: t('Urgent', 'Urgent'), badgeStyle: 'bg-red-50 text-red-700' },
                { dot: 'bg-amber-400', title: 'CSI2110 — A3', date: t('in 6 days', 'dans 6 jours'), badge: t('Soon', 'Bientôt'), badgeStyle: 'bg-amber-50 text-amber-700' },
              ].map(task => (
                <div key={task.title} className="flex items-center gap-2 py-1.5 border-b border-[#E1F5EE]">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.dot}`} />
                  <div className="flex-1">
                    <p className="text-[9px] font-medium text-[#2C2C2A]">{task.title}</p>
                    <p className="text-[8px] text-[#88877F]">{task.date}</p>
                  </div>
                  <span className={`text-[7px] px-1.5 py-0.5 rounded-full ${task.badgeStyle}`}>{task.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating cards */}
        {[
          { label: t('Right-click any text', 'Clic droit sur n\'importe quel texte'), value: '→ Solve with Seren', pos: 'top-6 left-0', anim: 'animate-float-a' },
          { label: t('Focus session', 'Session focus'), value: '🎯 45 min deep work', pos: 'bottom-16 left-[-10px]', anim: 'animate-float-b' },
          { label: t('Schedule imported', 'Horaire importé'), value: '✓ uOzone sync', pos: 'top-16 right-[-10px]', anim: 'animate-float-c' },
          { label: t('Academic memory', 'Mémoire académique'), value: '📚 12 notes saved', pos: 'bottom-6 right-[-10px]', anim: 'animate-float-a', valueClass: 'text-[#1D9E75]' },
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