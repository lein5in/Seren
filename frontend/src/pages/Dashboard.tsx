import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API_BASE = 'http://localhost:8000'

function getGreeting(name: string) {
  const h = new Date().getHours()
  if (h < 12) return `Good morning, ${name.split(' ')[0]}`
  if (h < 18) return `Good afternoon, ${name.split(' ')[0]}`
  return `Good evening, ${name.split(' ')[0]}`
}

function getDaysUntil(deadline: string) {
  const now = new Date()
  const due = new Date(deadline)
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getUrgency(days: number) {
  if (days <= 3) return 'urgent'
  if (days <= 7) return 'soon'
  return 'upcoming'
}

function formatDeadline(deadline: string) {
  const days = getDaysUntil(deadline)
  if (days < 0) return 'Overdue'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `in ${days} days`
}

type Event = {
  id: number
  title: string
  course: string
  deadline: string
  priority: string
  event_type: string
}

export default function Dashboard() {
  const navigate = useNavigate()

  // ── Auth ──────────────────────────────────────────────────────
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('seren_user')
    if (!raw) { navigate('/login'); return }
    try { setUser(JSON.parse(raw)) } catch { navigate('/login') }
  }, [])

  // ── Deadlines ─────────────────────────────────────────────────
  const [events, setEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('seren_token')
    fetch(`${API_BASE}/events/user/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : [])
        setEventsLoading(false)
      })
      .catch(() => setEventsLoading(false))
  }, [user])

  const nextEvent = events.length > 0 ? events[0] : null

  // ── Add deadline modal ─────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false)
  const [addTitle, setAddTitle]   = useState('')
  const [addCourse, setAddCourse] = useState('')
  const [addDate, setAddDate]     = useState('')
  const [addLoading, setAddLoading] = useState(false)

  async function handleAddDeadline(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setAddLoading(true)
    const token = localStorage.getItem('seren_token')
    try {
      const res = await fetch(`${API_BASE}/events/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: addTitle,
          course: addCourse,
          deadline: new Date(addDate).toISOString(),
          user_id: user.id,
          event_type: 'assignment',
          priority: 'medium',
          description: ''
        })
      })
      if (res.ok) {
        const newEvent = await res.json()
        setEvents(prev => [...prev, newEvent].sort(
          (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        ))
        setShowAddModal(false)
        setAddTitle(''); setAddCourse(''); setAddDate('')
      }
    } catch {}
    setAddLoading(false)
  }

  async function handleDeleteEvent(eventId: number) {
    const token = localStorage.getItem('seren_token')
    try {
      await fetch(`${API_BASE}/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setEvents(prev => prev.filter(e => e.id !== eventId))
    } catch {}
  }

  // ── Account form ──────────────────────────────────────────────
  const [newName,     setNewName]     = useState('')
  const [newEmail,    setNewEmail]    = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [accountMsg,  setAccountMsg]  = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    if (user) { setNewName(user.name); setNewEmail(user.email) }
  }, [user])

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setAccountMsg(null)
    const token = localStorage.getItem('seren_token')
    try {
      if (newName !== user.name || newEmail !== user.email) {
        const res = await fetch(`${API_BASE}/users/${user.id}/identity`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: newName, email: newEmail })
        })
        if (!res.ok) {
          const d = await res.json()
          setAccountMsg({ type: 'err', text: d.detail || 'Could not update account.' })
          setSaving(false); return
        }
        const updated = { ...user, name: newName, email: newEmail }
        setUser(updated)
        localStorage.setItem('seren_user', JSON.stringify(updated))
      }
      if (oldPassword && newPassword) {
        const res = await fetch(`${API_BASE}/users/${user.id}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
        })
        if (!res.ok) {
          const d = await res.json()
          setAccountMsg({ type: 'err', text: d.detail || 'Could not update password.' })
          setSaving(false); return
        }
        setOldPassword(''); setNewPassword('')
      }
      setAccountMsg({ type: 'ok', text: 'Changes saved.' })
    } catch {
      setAccountMsg({ type: 'err', text: 'Server unreachable.' })
    }
    setSaving(false)
  }

  // ── Delete account ────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting,      setDeleting]      = useState(false)

  async function handleDelete() {
    if (!user) return
    setDeleting(true)
    try {
      await fetch(`${API_BASE}/users/${user.id}`, { method: 'DELETE' })
    } catch {}
    localStorage.removeItem('seren_token')
    localStorage.removeItem('seren_user')
    navigate('/')
  }

  function handleLogout() {
    localStorage.removeItem('seren_token')
    localStorage.removeItem('seren_user')
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F6F6F4]">

      {/* Top nav */}
      <nav className="bg-white border-b border-[#E1F5EE] px-6 h-[64px] flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <path d="M16 2 A14 14 0 1 1 26.1 22" stroke="#0F6E56" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="26.5" cy="23.5" r="2.5" fill="#1D9E75"/>
            <line x1="10" y1="13" x2="22" y2="13" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.8"/>
            <line x1="9"  y1="18" x2="23" y2="18" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
            <line x1="10" y1="23" x2="22" y2="23" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.3"/>
          </svg>
          <span style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[20px] text-[#0F6E56]">Seren</span>
        </Link>
        <button onClick={handleLogout} className="text-sm text-[#88877F] hover:text-[#0F6E56] bg-transparent border-none cursor-pointer font-sans transition-colors">
          Log out
        </button>
      </nav>

      {/* Page content */}
      <div className="max-w-[1100px] mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">

          {/* Welcome card */}
          <div className="bg-[#04342C] rounded-2xl p-7 text-white">
            <p className="text-xs text-white/40 uppercase tracking-widest font-medium mb-2">Dashboard</p>
            <h1 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[32px] font-normal leading-tight mb-1">
              {getGreeting(user.name)}
            </h1>
            <p className="text-sm text-white/50">{user.email}</p>

            <div className="mt-6 flex gap-3 flex-wrap">
              {/* Next deadline */}
              <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#5DCAA5]/20 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-white/40">Next deadline</p>
                  <p className="text-sm font-medium text-white/80">
                    {eventsLoading ? '…' : nextEvent ? `${nextEvent.title} — ${formatDeadline(nextEvent.deadline)}` : 'No deadlines yet'}
                  </p>
                </div>
              </div>
              {/* Focus placeholder */}
              <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#5DCAA5]/20 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-white/40">Focus this week</p>
                  <p className="text-sm font-medium text-white/80">0 min</p>
                </div>
              </div>
            </div>
          </div>

          {/* Deadlines */}
          <div className="bg-white rounded-2xl border border-[#E1F5EE] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[20px] text-[#04342C] font-normal">
                Upcoming deadlines
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs font-semibold text-[#0F6E56] bg-[#E1F5EE] px-3 py-1.5 rounded-lg border-none cursor-pointer hover:bg-[#C8F0E3] transition-colors"
              >
                + Add deadline
              </button>
            </div>

            {eventsLoading ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-14 rounded-xl bg-[#F6F6F4] animate-pulse" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#E1F5EE] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <p className="text-sm text-[#88877F]">No deadlines yet.</p>
                <p className="text-xs text-[#AEADA8]">Import your course schedule or add one manually.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {events.map(event => {
                  const days = getDaysUntil(event.deadline)
                  const urgency = getUrgency(days)
                  const dotColor = urgency === 'urgent' ? 'bg-red-400' : urgency === 'soon' ? 'bg-amber-400' : 'bg-[#5DCAA5]'
                  const badgeStyle = urgency === 'urgent'
                    ? 'bg-red-50 text-red-600'
                    : urgency === 'soon'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-[#E1F5EE] text-[#0F6E56]'

                  return (
                    <div key={event.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#F0F0EE] hover:border-[#E1F5EE] hover:bg-[#FAFAF8] transition-all group">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2C2C2A] truncate">{event.title}</p>
                        <p className="text-xs text-[#88877F]">{event.course} · {formatDeadline(event.deadline)}</p>
                      </div>
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${badgeStyle}`}>
                        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                      </span>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#AEADA8] hover:text-red-400 bg-transparent border-none cursor-pointer transition-all p-1"
                        title="Delete"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Import schedule */}
          <div className="bg-white rounded-2xl border border-[#E1F5EE] p-6">
            <h2 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[20px] text-[#04342C] font-normal mb-1">
              Import your schedule
            </h2>
            <p className="text-sm text-[#88877F] mb-5">
              Upload your syllabus or .ics file — Seren will extract your deadlines automatically.
            </p>
            <div className="flex gap-3 flex-wrap">
              <label className="flex items-center gap-2 bg-[#0F6E56] text-white text-sm font-medium px-4 py-2.5 rounded-xl cursor-pointer hover:bg-[#085041] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload PDF / .ics
                <input type="file" accept=".pdf,.ics" className="hidden" disabled title="Coming soon" />
              </label>
              <button disabled className="flex items-center gap-2 bg-[#F6F6F4] text-[#88877F] text-sm font-medium px-4 py-2.5 rounded-xl border border-[#E1F5EE] cursor-not-allowed opacity-60">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                Connect calendar
                <span className="text-[10px] bg-[#E1F5EE] text-[#0F6E56] px-1.5 py-0.5 rounded-md font-semibold">Soon</span>
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">

          {/* Download extension */}
          <div className="bg-[#0F6E56] rounded-2xl p-6 text-white">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path d="M16 2 A14 14 0 1 1 26.1 22" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="26.5" cy="23.5" r="2.5" fill="#5DCAA5"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[20px] font-normal mb-1">Get the extension</h2>
            <p className="text-xs text-white/60 mb-5 leading-relaxed">Seren lives in your browser. Add it to Chrome to start studying smarter.</p>
            <a href="#" className="flex items-center justify-center gap-2 bg-white text-[#0F6E56] text-sm font-semibold px-4 py-2.5 rounded-xl no-underline hover:bg-[#E1F5EE] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Add to Chrome
            </a>
          </div>

          {/* Account settings */}
          <div className="bg-white rounded-2xl border border-[#E1F5EE] p-6">
            <h2 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[20px] text-[#04342C] font-normal mb-5">Account</h2>
            <form onSubmit={handleSaveAccount} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#4A4A47] uppercase tracking-wider">Name</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E1F5EE] bg-[#F6F6F4] text-sm text-[#2C2C2A] outline-none focus:border-[#5DCAA5] transition-colors font-sans" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#4A4A47] uppercase tracking-wider">Email</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E1F5EE] bg-[#F6F6F4] text-sm text-[#2C2C2A] outline-none focus:border-[#5DCAA5] transition-colors font-sans" />
              </div>
              <div className="border-t border-[#F0F0EE] pt-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-[#4A4A47] uppercase tracking-wider">Change password</p>
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Current password"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E1F5EE] bg-[#F6F6F4] text-sm text-[#2C2C2A] outline-none focus:border-[#5DCAA5] transition-colors font-sans" />
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E1F5EE] bg-[#F6F6F4] text-sm text-[#2C2C2A] outline-none focus:border-[#5DCAA5] transition-colors font-sans" />
              </div>
              {accountMsg && (
                <p className={`text-sm px-3 py-2.5 rounded-xl ${accountMsg.type === 'ok' ? 'bg-[#E1F5EE] text-[#0F6E56]' : 'bg-red-50 text-red-500'}`}>
                  {accountMsg.text}
                </p>
              )}
              <button type="submit" disabled={saving}
                className="w-full bg-[#0F6E56] hover:bg-[#085041] text-white text-sm font-medium py-2.5 rounded-xl border-none cursor-pointer transition-colors disabled:opacity-60 font-sans">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>

          {/* Danger zone */}
          <div className="bg-white rounded-2xl border border-red-100 p-6">
            <h2 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[18px] text-red-700 font-normal mb-1">Danger zone</h2>
            <p className="text-xs text-[#88877F] mb-4">Permanently delete your account and all your data. This cannot be undone.</p>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="text-sm text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 px-4 py-2 rounded-xl cursor-pointer font-medium transition-colors font-sans">
                Delete my account
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-red-500 font-medium">Are you sure? This is permanent.</p>
                <div className="flex gap-2">
                  <button onClick={handleDelete} disabled={deleting}
                    className="flex-1 text-sm text-white bg-red-500 hover:bg-red-600 border-none px-3 py-2 rounded-xl cursor-pointer font-medium transition-colors font-sans disabled:opacity-60">
                    {deleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button onClick={() => setConfirmDelete(false)}
                    className="flex-1 text-sm text-[#88877F] bg-[#F6F6F4] hover:bg-[#EEEEEC] border border-[#E1F5EE] px-3 py-2 rounded-xl cursor-pointer font-medium transition-colors font-sans">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Add deadline modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[400px] shadow-2xl">
            <h2 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[22px] text-[#04342C] font-normal mb-5">
              Add a deadline
            </h2>
            <form onSubmit={handleAddDeadline} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#4A4A47] uppercase tracking-wider">Title</label>
                <input type="text" value={addTitle} onChange={e => setAddTitle(e.target.value)}
                  placeholder="e.g. Midterm exam" required
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E1F5EE] bg-[#F6F6F4] text-sm outline-none focus:border-[#5DCAA5] transition-colors font-sans" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#4A4A47] uppercase tracking-wider">Course</label>
                <input type="text" value={addCourse} onChange={e => setAddCourse(e.target.value)}
                  placeholder="e.g. CSI2110" required
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E1F5EE] bg-[#F6F6F4] text-sm outline-none focus:border-[#5DCAA5] transition-colors font-sans" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#4A4A47] uppercase tracking-wider">Due date</label>
                <input type="datetime-local" value={addDate} onChange={e => setAddDate(e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E1F5EE] bg-[#F6F6F4] text-sm outline-none focus:border-[#5DCAA5] transition-colors font-sans" />
              </div>
              <div className="flex gap-3 mt-1">
                <button type="submit" disabled={addLoading}
                  className="flex-1 bg-[#0F6E56] hover:bg-[#085041] text-white text-sm font-medium py-2.5 rounded-xl border-none cursor-pointer transition-colors disabled:opacity-60 font-sans">
                  {addLoading ? 'Adding…' : 'Add deadline'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-[#F6F6F4] text-[#88877F] text-sm font-medium py-2.5 rounded-xl border border-[#E1F5EE] cursor-pointer transition-colors font-sans">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}