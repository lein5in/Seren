import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API_BASE = 'https://seren-production-834b.up.railway.app'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Something went wrong.'); setLoading(false); return }
      localStorage.setItem('seren_token', data.token)
      localStorage.setItem('seren_user', JSON.stringify({ id: data.user_id, name: data.name, email: data.email }))
      navigate('/chat')
    } catch {
      setError('Could not reach the server. Is the backend running?')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#04342C] px-14 py-12 relative overflow-hidden">

        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px] rounded-full bg-[#0F6E56] opacity-20 blur-3xl" />
          <div className="absolute bottom-[-60px] left-[-60px] w-[260px] h-[260px] rounded-full bg-[#1D9E75] opacity-15 blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid2)" />
          </svg>
        </div>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline relative z-10">
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
            <path d="M16 2 A14 14 0 1 1 26.1 22" stroke="#5DCAA5" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="26.5" cy="23.5" r="2.5" fill="#5DCAA5"/>
            <line x1="10" y1="13" x2="22" y2="13" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round" opacity="0.8"/>
            <line x1="9" y1="18" x2="23" y2="18" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
            <line x1="10" y1="23" x2="22" y2="23" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round" opacity="0.3"/>
          </svg>
          <span style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[22px] text-white tracking-wide">Seren</span>
        </Link>

        {/* Center content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#5DCAA5] animate-pulse" />
            <span className="text-xs text-[#9FE1CB] font-medium tracking-wide">Free to get started</span>
          </div>
          <h2 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[42px] leading-[1.15] text-white font-normal mb-6">
            Study smarter,<br/>not harder.
          </h2>
          <p className="text-[#9FE1CB] text-sm leading-relaxed max-w-[280px]">
            Seren lives in your browser, knows your courses, and is always there when you sit down to work.
          </p>
        </div>

        {/* Feature pills */}
        <div className="relative z-10 flex flex-col gap-3">
          {[
            { icon: '📚', text: 'Knows your syllabus & deadlines' },
            { icon: '🧠', text: 'Quizzes you on your actual notes' },
            { icon: '🌿', text: 'Calm mode for stressful moments' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3 bg-white/8 border border-white/10 rounded-xl px-4 py-3">
              <span className="text-base">{f.icon}</span>
              <span className="text-[#9FE1CB] text-sm">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 bg-[#F8F8F6]">

        {/* Mobile logo */}
        <Link to="/" className="flex lg:hidden items-center gap-2 no-underline mb-10">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path d="M16 2 A14 14 0 1 1 26.1 22" stroke="#0F6E56" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="26.5" cy="23.5" r="2.5" fill="#1D9E75"/>
            <line x1="10" y1="13" x2="22" y2="13" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.8"/>
            <line x1="9" y1="18" x2="23" y2="18" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
            <line x1="10" y1="23" x2="22" y2="23" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.3"/>
          </svg>
          <span style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[22px] text-[#0F6E56] tracking-wide">Seren</span>
        </Link>

        <div className="w-full max-w-[400px]">
          <h1 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[32px] text-[#04342C] font-normal mb-1">Create your account</h1>
          <p className="text-sm text-[#88877F] mb-8">Your companion is ready when you are.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#4A4A47] uppercase tracking-widest">First name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your first name" required
                className="w-full px-4 py-3.5 rounded-xl border border-[#E1F5EE] bg-white text-sm text-[#2C2C2A] outline-none focus:border-[#0F6E56] focus:ring-2 focus:ring-[#0F6E56]/10 transition-all font-sans shadow-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#4A4A47] uppercase tracking-widest">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu" required
                className="w-full px-4 py-3.5 rounded-xl border border-[#E1F5EE] bg-white text-sm text-[#2C2C2A] outline-none focus:border-[#0F6E56] focus:ring-2 focus:ring-[#0F6E56]/10 transition-all font-sans shadow-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#4A4A47] uppercase tracking-widest">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6}
                className="w-full px-4 py-3.5 rounded-xl border border-[#E1F5EE] bg-white text-sm text-[#2C2C2A] outline-none focus:border-[#0F6E56] focus:ring-2 focus:ring-[#0F6E56]/10 transition-all font-sans shadow-sm"
              />
              <p className="text-xs text-[#88877F]">Minimum 6 characters</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-[#0F6E56] hover:bg-[#085041] text-white text-sm font-semibold py-3.5 rounded-xl border-none cursor-pointer transition-all hover:-translate-y-px active:translate-y-0 disabled:opacity-60 shadow-[0_4px_14px_rgba(15,110,86,0.3)] mt-1 font-sans"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2.5" strokeDasharray="32" strokeDashoffset="12"/></svg>
                  Creating account…
                </span>
              ) : 'Get started →'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E1F5EE]" />
            <span className="text-xs text-[#88877F]">or</span>
            <div className="flex-1 h-px bg-[#E1F5EE]" />
          </div>

          <p className="text-sm text-[#88877F] text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-[#0F6E56] font-semibold no-underline hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}