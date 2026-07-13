import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API_BASE = 'https://seren-production-834b.up.railway.app'

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

type CustomCommand = {
  id: string
  label: string
  prompt: string
  isDefault?: boolean   // true for the 4 built-in commands — can't be deleted, only edited/hidden
  inTooltip: boolean    // whether it shows in the floating selection tooltip
}

// ── Default commands — seeded into chrome.storage on first run ────
const DEFAULT_COMMANDS: CustomCommand[] = [
  { id: 'seren-solve',     label: 'Solve',      prompt: 'Solve or explain the following:',                          isDefault: true, inTooltip: true },
  { id: 'seren-summarize', label: 'Summarize',  prompt: 'Summarize the following in a clear and concise way:',       isDefault: true, inTooltip: true },
  { id: 'seren-quiz',      label: 'Quiz me',    prompt: 'Generate a quiz based on the following content:',           isDefault: true, inTooltip: true },
  { id: 'seren-save',      label: 'Save',       prompt: 'Confirm that the following has been saved to my notes and give a brief summary:', isDefault: true, inTooltip: true },
]

const MAX_TOOLTIP_COMMANDS = 4

// ── Storage bridge ──────────────────────────────────────────────
// This page runs as a normal website (localhost:5173) and has no
// direct access to chrome.storage. The Seren content script
// (injected into every page, including this one) relays requests
// to chrome.storage via window.postMessage.
//
// If the extension isn't installed, SEREN_BRIDGE_READY never
// arrives — we fall back to localStorage so Settings still works,
// it just won't be visible in the extension tooltip until the
// extension is installed.

const pendingRequests = new Map<string, (value: any) => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    if (event.source !== window) return
    const msg = event.data
    if (!msg || msg.source !== 'seren-extension') return

    if (msg.type === 'SEREN_STORAGE_RESULT' && msg.requestId) {
      const resolve = pendingRequests.get(msg.requestId)
      if (resolve) {
        resolve(msg.value !== undefined ? msg.value : msg.ok)
        pendingRequests.delete(msg.requestId)
      }
    }
  })
}

function bridgeRequest(payload: any, timeoutMs = 600): Promise<any> {
  return new Promise((resolve) => {
    const requestId = Math.random().toString(36).slice(2)
    pendingRequests.set(requestId, resolve)
    window.postMessage({ source: 'seren-web', requestId, ...payload }, '*')
    // If the extension isn't installed, nothing answers — fall back after a short wait
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId)
        resolve(undefined)
      }
    }, timeoutMs)
  })
}

async function storageGet(key: string): Promise<any> {
  const value = await bridgeRequest({ type: 'SEREN_STORAGE_GET', key })
  if (value !== undefined) return value
  // Fallback: extension not installed / bridge didn't respond in time
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : undefined
}

async function storageSet(key: string, value: any): Promise<void> {
  // Always write to localStorage too, so Settings still works standalone
  localStorage.setItem(key, JSON.stringify(value))
  await bridgeRequest({ type: 'SEREN_STORAGE_SET', key, value })
}

export default function Settings() {
  const navigate = useNavigate()
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
      .then(data => { setEvents(Array.isArray(data) ? data : []); setEventsLoading(false) })
      .catch(() => setEventsLoading(false))
  }, [user])

  const nextEvent = events.length > 0 ? events[0] : null

  const [showAddModal, setShowAddModal] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addCourse, setAddCourse] = useState('')
  const [addDate, setAddDate] = useState('')
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
          title: addTitle, course: addCourse,
          deadline: new Date(addDate).toISOString(),
          user_id: user.id, event_type: 'assignment', priority: 'medium', description: ''
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
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      })
      setEvents(prev => prev.filter(e => e.id !== eventId))
    } catch {}
  }

  // ── Account ───────────────────────────────────────────────────
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [accountMsg, setAccountMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) { setNewName(user.name); setNewEmail(user.email) }
  }, [user])

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true); setAccountMsg(null)
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

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!user) return
    setDeleting(true)
    const token = localStorage.getItem('seren_token')
    try {
      await fetch(`${API_BASE}/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
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

  // ── Commands (stored in chrome.storage, shared across popup/tooltip/web) ──
  const [commands, setCommands] = useState<CustomCommand[]>([])
  const [commandsLoading, setCommandsLoading] = useState(true)
  const [showCmdModal, setShowCmdModal] = useState(false)
  const [editingCmd, setEditingCmd] = useState<CustomCommand | null>(null)
  const [cmdLabel, setCmdLabel] = useState('')
  const [cmdPrompt, setCmdPrompt] = useState('')
  const [tooltipLimitMsg, setTooltipLimitMsg] = useState(false)

  useEffect(() => {
    (async () => {
      const saved = await storageGet('seren_commands')
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setCommands(saved)
      } else {
        // First run — seed defaults
        await storageSet('seren_commands', DEFAULT_COMMANDS)
        setCommands(DEFAULT_COMMANDS)
      }
      setCommandsLoading(false)
    })()
  }, [])

  async function persistCommands(updated: CustomCommand[]) {
    setCommands(updated)
    await storageSet('seren_commands', updated)
  }

  function openNewCmd() {
    setEditingCmd(null)
    setCmdLabel(''); setCmdPrompt('')
    setShowCmdModal(true)
  }

  function openEditCmd(cmd: CustomCommand) {
    setEditingCmd(cmd)
    setCmdLabel(cmd.label); setCmdPrompt(cmd.prompt)
    setShowCmdModal(true)
  }

  async function handleSaveCmd(e: React.FormEvent) {
    e.preventDefault()
    if (!cmdLabel.trim() || !cmdPrompt.trim()) return
    if (editingCmd) {
      await persistCommands(commands.map(c =>
        c.id === editingCmd.id ? { ...c, label: cmdLabel, prompt: cmdPrompt } : c
      ))
    } else {
      const newCmd: CustomCommand = {
        id: 'cmd-' + Date.now().toString(),
        label: cmdLabel,
        prompt: cmdPrompt,
        isDefault: false,
        inTooltip: false
      }
      await persistCommands([...commands, newCmd])
    }
    setShowCmdModal(false)
  }

  async function handleDeleteCmd(id: string) {
    const cmd = commands.find(c => c.id === id)
    if (cmd?.isDefault) return // default commands can't be deleted, only hidden from tooltip
    await persistCommands(commands.filter(c => c.id !== id))
  }

  async function toggleTooltip(id: string) {
    const cmd = commands.find(c => c.id === id)
    if (!cmd) return
    const tooltipCount = commands.filter(c => c.inTooltip).length
    if (!cmd.inTooltip && tooltipCount >= MAX_TOOLTIP_COMMANDS) {
      setTooltipLimitMsg(true)
      setTimeout(() => setTooltipLimitMsg(false), 2500)
      return
    }
    await persistCommands(commands.map(c => c.id === id ? { ...c, inTooltip: !c.inTooltip } : c))
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F6F6F4] dark:bg-[#0B1210] transition-colors">

      <nav className="bg-white dark:bg-[#141F1C] border-b border-[#E1F5EE] dark:border-white/10 px-6 h-[64px] flex items-center justify-between sticky top-0 z-40">
        <Link to="/chat" className="flex items-center gap-2 no-underline">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <path d="M16 2 A14 14 0 1 1 26.1 22" stroke="#0F6E56" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="26.5" cy="23.5" r="2.5" fill="#1D9E75"/>
            <line x1="10" y1="13" x2="22" y2="13" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.8"/>
            <line x1="9"  y1="18" x2="23" y2="18" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
            <line x1="10" y1="23" x2="22" y2="23" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" opacity="0.3"/>
          </svg>
          <span style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[20px] text-[#0F6E56]">Seren</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/chat" className="text-sm text-[#88877F] dark:text-white/40 hover:text-[#0F6E56] no-underline transition-colors">← Back to chat</Link>
          <button onClick={handleLogout} className="text-sm text-[#88877F] dark:text-white/40 hover:text-[#0F6E56] bg-transparent border-none cursor-pointer font-sans transition-colors">Log out</button>
        </div>
      </nav>

      <div className="max-w-[1100px] mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

        {/* LEFT */}
        <div className="flex flex-col gap-6">

          {/* Hero */}
          <div className="bg-[#04342C] rounded-2xl p-7 text-white">
            <p className="text-xs text-white/40 uppercase tracking-widest font-medium mb-2">Settings</p>
            <h1 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[32px] font-normal leading-tight mb-1">
              {user.name.split(' ')[0]}'s workspace
            </h1>
            <p className="text-sm text-white/50">{user.email}</p>
            <div className="mt-6">
              <div className="bg-white/10 rounded-xl px-4 py-3 inline-flex items-center gap-3">
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
            </div>
          </div>

          {/* Deadlines */}
          <div className="bg-white dark:bg-[#141F1C] rounded-2xl border border-[#E1F5EE] dark:border-white/10 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[20px] text-[#04342C] dark:text-white font-normal">Upcoming deadlines</h2>
              <button onClick={() => setShowAddModal(true)}
                className="text-xs font-semibold text-[#0F6E56] bg-[#E1F5EE] px-3 py-1.5 rounded-lg border-none cursor-pointer hover:bg-[#C8F0E3] transition-colors">
                + Add deadline
              </button>
            </div>
            {eventsLoading ? (
              <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-[#F6F6F4] dark:bg-[#1A2622] animate-pulse" />)}</div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#E1F5EE] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <p className="text-sm text-[#88877F] dark:text-white/40">No deadlines yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {events.map(event => {
                  const days = getDaysUntil(event.deadline)
                  const urgency = getUrgency(days)
                  const dotColor = urgency === 'urgent' ? 'bg-red-400' : urgency === 'soon' ? 'bg-amber-400' : 'bg-[#5DCAA5]'
                  const badgeStyle = urgency === 'urgent' ? 'bg-red-50 text-red-600' : urgency === 'soon' ? 'bg-amber-50 text-amber-600' : 'bg-[#E1F5EE] text-[#0F6E56]'
                  return (
                    <div key={event.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#F0F0EE] hover:border-[#E1F5EE] dark:border-white/10 hover:bg-[#FAFAF8] dark:hover:bg-white/5 transition-all group">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2C2C2A] dark:text-white/90 truncate">{event.title}</p>
                        <p className="text-xs text-[#88877F] dark:text-white/40">{event.course} · {formatDeadline(event.deadline)}</p>
                      </div>
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${badgeStyle}`}>
                        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                      </span>
                      <button onClick={() => handleDeleteEvent(event.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#AEADA8] dark:text-white/25 hover:text-red-400 bg-transparent border-none cursor-pointer transition-all p-1">
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

          {/* Commands */}
          <div className="bg-white dark:bg-[#141F1C] rounded-2xl border border-[#E1F5EE] dark:border-white/10 p-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[20px] text-[#04342C] dark:text-white font-normal">Commands</h2>
                <p className="text-xs text-[#88877F] dark:text-white/40 mt-1">
                  Used in the chat sidebar and the selection tooltip on any webpage. Toggle which ones appear in the tooltip — max {MAX_TOOLTIP_COMMANDS}.
                </p>
              </div>
              <button onClick={openNewCmd}
                className="text-xs font-semibold text-[#0F6E56] bg-[#E1F5EE] px-3 py-1.5 rounded-lg border-none cursor-pointer hover:bg-[#C8F0E3] transition-colors flex-shrink-0">
                + New command
              </button>
            </div>

            {tooltipLimitMsg && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
                Tooltip can only show {MAX_TOOLTIP_COMMANDS} commands at once. Turn one off first.
              </p>
            )}

            {commandsLoading ? (
              <div className="flex flex-col gap-2 mt-5">{[1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl bg-[#F6F6F4] dark:bg-[#1A2622] animate-pulse" />)}</div>
            ) : (
              <div className="flex flex-col gap-2 mt-5">
                {commands.map(cmd => (
                  <div key={cmd.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#F0F0EE] hover:border-[#E1F5EE] dark:border-white/10 hover:bg-[#FAFAF8] dark:hover:bg-white/5 transition-all group">
                    <span className="text-[#5DCAA5] font-bold text-sm flex-shrink-0">/</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#2C2C2A] dark:text-white/90">{cmd.label}</p>
                        {cmd.isDefault && (
                          <span className="text-[9px] font-semibold text-[#AEADA8] dark:text-white/25 bg-[#F6F6F4] dark:bg-[#1A2622] px-1.5 py-0.5 rounded uppercase tracking-wide">Default</span>
                        )}
                      </div>
                      <p className="text-xs text-[#88877F] dark:text-white/40 truncate mt-0.5">{cmd.prompt}</p>
                    </div>

                    {/* Tooltip toggle */}
                    <button onClick={() => toggleTooltip(cmd.id)}
                      title={cmd.inTooltip ? 'Showing in tooltip' : 'Hidden from tooltip'}
                      className={`flex-shrink-0 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors font-sans ${
                        cmd.inTooltip
                          ? 'bg-[#E1F5EE] border-[#C8F0E3] text-[#0F6E56]'
                          : 'bg-[#F6F6F4] dark:bg-[#1A2622] border-[#EEEEEC] dark:border-white/10 text-[#AEADA8] dark:text-white/25'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cmd.inTooltip ? 'bg-[#5DCAA5]' : 'bg-[#CECECA]'}`} />
                      Tooltip
                    </button>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                      <button onClick={() => openEditCmd(cmd)}
                        className="text-[#AEADA8] dark:text-white/25 hover:text-[#0F6E56] bg-transparent border-none cursor-pointer p-1 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {!cmd.isDefault && (
                        <button onClick={() => handleDeleteCmd(cmd.id)}
                          className="text-[#AEADA8] dark:text-white/25 hover:text-red-400 bg-transparent border-none cursor-pointer p-1 transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-6">

          {/* Get extension */}
          <div className="bg-[#0F6E56] rounded-2xl p-6 text-white">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path d="M16 2 A14 14 0 1 1 26.1 22" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="26.5" cy="23.5" r="2.5" fill="#5DCAA5"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[20px] font-normal mb-1">Get the extension</h2>
            <p className="text-xs text-white/60 mb-5 leading-relaxed">Seren lives in your browser. Add it to Chrome to study smarter.</p>
            <a href="#" className="flex items-center justify-center gap-2 bg-white dark:bg-[#141F1C] text-[#0F6E56] text-sm font-semibold px-4 py-2.5 rounded-xl no-underline hover:bg-[#E1F5EE] dark:hover:bg-white/10 transition-colors">
              Add to Chrome
            </a>
          </div>

          {/* Account */}
          <div className="bg-white dark:bg-[#141F1C] rounded-2xl border border-[#E1F5EE] dark:border-white/10 p-6">
            <h2 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[20px] text-[#04342C] dark:text-white font-normal mb-5">Account</h2>
            <form onSubmit={handleSaveAccount} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#4A4A47] dark:text-white/50 uppercase tracking-wider">Name</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E1F5EE] dark:border-white/10 bg-[#F6F6F4] dark:bg-[#1A2622] text-sm text-[#2C2C2A] dark:text-white/90 outline-none focus:border-[#5DCAA5] transition-colors font-sans" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#4A4A47] dark:text-white/50 uppercase tracking-wider">Email</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E1F5EE] dark:border-white/10 bg-[#F6F6F4] dark:bg-[#1A2622] text-sm text-[#2C2C2A] dark:text-white/90 outline-none focus:border-[#5DCAA5] transition-colors font-sans" />
              </div>
              <div className="border-t border-[#F0F0EE] pt-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-[#4A4A47] dark:text-white/50 uppercase tracking-wider">Change password</p>
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Current password"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E1F5EE] dark:border-white/10 bg-[#F6F6F4] dark:bg-[#1A2622] text-sm text-[#2C2C2A] dark:text-white/90 outline-none focus:border-[#5DCAA5] transition-colors font-sans" />
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E1F5EE] dark:border-white/10 bg-[#F6F6F4] dark:bg-[#1A2622] text-sm text-[#2C2C2A] dark:text-white/90 outline-none focus:border-[#5DCAA5] transition-colors font-sans" />
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
          <div className="bg-white dark:bg-[#141F1C] rounded-2xl border border-red-100 p-6">
            <h2 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[18px] text-red-700 font-normal mb-1">Danger zone</h2>
            <p className="text-xs text-[#88877F] dark:text-white/40 mb-4">Permanently delete your account and all your data.</p>
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
                    className="flex-1 text-sm text-[#88877F] dark:text-white/40 bg-[#F6F6F4] dark:bg-[#1A2622] hover:bg-[#EEEEEC] dark:hover:bg-white/10 border border-[#E1F5EE] dark:border-white/10 px-3 py-2 rounded-xl cursor-pointer font-medium transition-colors font-sans">
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
          <div className="bg-white dark:bg-[#141F1C] rounded-2xl p-6 w-full max-w-[400px] shadow-2xl">
            <h2 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[22px] text-[#04342C] dark:text-white font-normal mb-5">Add a deadline</h2>
            <form onSubmit={handleAddDeadline} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#4A4A47] dark:text-white/50 uppercase tracking-wider">Title</label>
                <input type="text" value={addTitle} onChange={e => setAddTitle(e.target.value)} placeholder="e.g. Midterm exam" required
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E1F5EE] dark:border-white/10 bg-[#F6F6F4] dark:bg-[#1A2622] text-sm outline-none focus:border-[#5DCAA5] transition-colors font-sans" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#4A4A47] dark:text-white/50 uppercase tracking-wider">Course</label>
                <input type="text" value={addCourse} onChange={e => setAddCourse(e.target.value)} placeholder="e.g. CSI2110" required
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E1F5EE] dark:border-white/10 bg-[#F6F6F4] dark:bg-[#1A2622] text-sm outline-none focus:border-[#5DCAA5] transition-colors font-sans" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#4A4A47] dark:text-white/50 uppercase tracking-wider">Due date</label>
                <input type="datetime-local" value={addDate} onChange={e => setAddDate(e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E1F5EE] dark:border-white/10 bg-[#F6F6F4] dark:bg-[#1A2622] text-sm outline-none focus:border-[#5DCAA5] transition-colors font-sans" />
              </div>
              <div className="flex gap-3 mt-1">
                <button type="submit" disabled={addLoading}
                  className="flex-1 bg-[#0F6E56] hover:bg-[#085041] text-white text-sm font-medium py-2.5 rounded-xl border-none cursor-pointer transition-colors disabled:opacity-60 font-sans">
                  {addLoading ? 'Adding…' : 'Add deadline'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-[#F6F6F4] dark:bg-[#1A2622] text-[#88877F] dark:text-white/40 text-sm font-medium py-2.5 rounded-xl border border-[#E1F5EE] dark:border-white/10 cursor-pointer transition-colors font-sans">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Command modal */}
      {showCmdModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-[#141F1C] rounded-2xl p-6 w-full max-w-[420px] shadow-2xl">
            <h2 style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[22px] text-[#04342C] dark:text-white font-normal mb-2">
              {editingCmd ? 'Edit command' : 'New command'}
            </h2>
            <p className="text-xs text-[#88877F] dark:text-white/40 mb-5">The prompt will be pasted into the chat — you can edit it before sending.</p>
            <form onSubmit={handleSaveCmd} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#4A4A47] dark:text-white/50 uppercase tracking-wider">Command name</label>
                <input type="text" value={cmdLabel} onChange={e => setCmdLabel(e.target.value)}
                  placeholder="e.g. Explain" required
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E1F5EE] dark:border-white/10 bg-[#F6F6F4] dark:bg-[#1A2622] text-sm outline-none focus:border-[#5DCAA5] transition-colors font-sans" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#4A4A47] dark:text-white/50 uppercase tracking-wider">Prompt template</label>
                <textarea value={cmdPrompt} onChange={e => setCmdPrompt(e.target.value)}
                  placeholder="e.g. Explain the following concept in simple terms:" required rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E1F5EE] dark:border-white/10 bg-[#F6F6F4] dark:bg-[#1A2622] text-sm outline-none focus:border-[#5DCAA5] transition-colors font-sans resize-none" />
                <p className="text-[10px] text-[#AEADA8] dark:text-white/25">This will be pasted into the input. You can add your content after it.</p>
              </div>
              <div className="flex gap-3 mt-1">
                <button type="submit"
                  className="flex-1 bg-[#0F6E56] hover:bg-[#085041] text-white text-sm font-medium py-2.5 rounded-xl border-none cursor-pointer transition-colors font-sans">
                  {editingCmd ? 'Save changes' : 'Create command'}
                </button>
                <button type="button" onClick={() => setShowCmdModal(false)}
                  className="flex-1 bg-[#F6F6F4] dark:bg-[#1A2622] text-[#88877F] dark:text-white/40 text-sm font-medium py-2.5 rounded-xl border border-[#E1F5EE] dark:border-white/10 cursor-pointer transition-colors font-sans">
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