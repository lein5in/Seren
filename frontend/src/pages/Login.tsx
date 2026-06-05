import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API_BASE = 'http://localhost:8000'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Something went wrong.'); setLoading(false); return }
      localStorage.setItem('seren_token', data.token)
      localStorage.setItem('seren_user', JSON.stringify({ id: data.user_id, name: data.name, email: data.email }))
      navigate('/dashboard')
    } catch {
      setError('Could not reach the server. Is the backend running?')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col items-center justify-center px-4">
      <Link to="/" className="flex items-center gap-2 no-underline mb-10">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <path d="M16 2 A14 14 0 1 1 26.1 22" stroke="#0F6E56" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="26.5" cy="23.5" r="2.5" fill="#1D9E75"/>
          <line x1="10" y1="13" x2="22" y2="13" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.8"/>
          <line x1="9"  y1="18" x2="23" y2="18" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
          <line x1="10" y1="23" x2="22" y2="23" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.3"/>
        </svg>
        <span style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[22px] text-[#0F6E56] tracking-wide">Seren</span>
      </Link>
      <div className="bg-white rounded-2xl border border-[#E1F5EE] shadow-[0_4px_32px_rgba(15,110,86,0.07)] w-full max-w-[400px] p-8">
        <h1 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[28px] text-[#04342C] font-normal mb-1">Welcome back</h1>
        <p className="text-sm text-[#88877F] mb-7">Log in to your Seren account.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#4A4A47] uppercase tracking-wider">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required
              className="w-full px-4 py-3 rounded-xl border border-[#E1F5EE] bg-[#F8F8F6] text-sm text-[#2C2C2A] outline-none focus:border-[#5DCAA5] transition-colors font-sans" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#4A4A47] uppercase tracking-wider">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
              className="w-full px-4 py-3 rounded-xl border border-[#E1F5EE] bg-[#F8F8F6] text-sm text-[#2C2C2A] outline-none focus:border-[#5DCAA5] transition-colors font-sans" />
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#0F6E56] hover:bg-[#085041] text-white text-sm font-medium py-3 rounded-xl border-none cursor-pointer transition-all hover:-translate-y-px disabled:opacity-60 mt-1 font-sans">
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="text-sm text-[#88877F] text-center mt-6">
          No account yet?{' '}
          <Link to="/register" className="text-[#0F6E56] font-medium no-underline hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}