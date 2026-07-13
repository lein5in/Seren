import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { marked } from 'marked'

const API_BASE = 'https://seren-production-834b.up.railway.app'

type Message = {
  role: 'user' | 'seren'
  content: string
  type?: 'text' | 'flashcards' | 'quiz' | 'visual'
  data?: any
}

type Event = {
  id: number
  title: string
  course: string
  deadline: string
}

type CustomCommand = {
  id: string
  label: string
  prompt: string
}

function getDaysUntil(deadline: string) {
  const now = new Date()
  const due = new Date(deadline)
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDeadline(deadline: string) {
  const days = getDaysUntil(deadline)
  if (days < 0) return 'Overdue'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `in ${days}d`
}

function getUrgencyColor(days: number) {
  if (days <= 3) return 'bg-red-400'
  if (days <= 7) return 'bg-amber-400'
  return 'bg-[#5DCAA5]'
}

// ── Storage bridge (same mechanism as Settings.tsx) ────────────────
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
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId)
        resolve(undefined)
      }
    }, timeoutMs)
  })
}

async function bridgeStorageGet(key: string): Promise<any> {
  const value = await bridgeRequest({ type: 'SEREN_STORAGE_GET', key })
  if (value !== undefined) return value
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : undefined
}

// ── Flashcards ────────────────────────────────────────────────────
function FlashcardsBlock({ data }: { data: any }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const cards = data.cards || []

  function go(dir: number) {
    setFlipped(false)
    setTimeout(() => setIndex(i => i + dir), 150)
  }

  return (
    <div className="w-full bg-white border border-[#EEEEEC] rounded-2xl p-4 my-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-[#0F6E56] uppercase tracking-widest">{data.topic}</span>
        <span className="text-[10px] text-[#AEADA8]">{index + 1} / {cards.length}</span>
      </div>
      <div className="relative h-[110px] cursor-pointer mb-3 [perspective:800px]" onClick={() => setFlipped(f => !f)}>
        <div className={`w-full h-full relative [transform-style:preserve-3d] transition-transform duration-400 ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
          <div className="absolute inset-0 [backface-visibility:hidden] bg-[#EBF7F2] border border-[#C8F0E3] rounded-xl flex flex-col items-center justify-center p-4 text-center">
            <p className="text-sm font-medium text-[#04342C]">{cards[index]?.front}</p>
            <span className="text-[10px] text-[#AEADA8] mt-2">Tap to flip</span>
          </div>
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#04342C] rounded-xl flex items-center justify-center p-4 text-center">
            <p className="text-[13px] text-white/90">{cards[index]?.back}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2 justify-center">
        <button onClick={() => go(-1)} disabled={index === 0} className="px-3 py-1.5 text-xs bg-[#F6F6F4] border border-[#EEEEEC] rounded-lg text-[#4A4A47] disabled:opacity-30 hover:bg-[#EEEEEC] transition-colors">← Prev</button>
        <button onClick={() => setFlipped(f => !f)} className="px-3 py-1.5 text-xs bg-[#0F6E56] text-white rounded-lg hover:bg-[#085041] transition-colors">Flip</button>
        <button onClick={() => go(1)} disabled={index === cards.length - 1} className="px-3 py-1.5 text-xs bg-[#F6F6F4] border border-[#EEEEEC] rounded-lg text-[#4A4A47] disabled:opacity-30 hover:bg-[#EEEEEC] transition-colors">Next →</button>
      </div>
    </div>
  )
}

// ── Quiz ──────────────────────────────────────────────────────────
function QuizBlock({ data }: { data: any }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const questions = data.questions || []
  const q = questions[index]

  function answer(i: number) {
    if (selected !== null) return
    setSelected(i)
    if (i === q.correct) setScore(s => s + 1)
  }

  function next() {
    if (index < questions.length - 1) { setIndex(i => i + 1); setSelected(null) }
    else setDone(true)
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="w-full bg-white border border-[#EEEEEC] rounded-2xl p-4 my-1 text-center">
        <p className="text-3xl mb-1">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚'}</p>
        <p className="font-display text-2xl text-[#04342C]">{score}/{questions.length}</p>
        <p className="text-xs text-[#0F6E56] font-semibold mt-1">{pct}% correct</p>
        <button onClick={() => { setIndex(0); setSelected(null); setScore(0); setDone(false) }}
          className="mt-3 px-4 py-1.5 text-xs bg-[#0F6E56] text-white rounded-lg hover:bg-[#085041] transition-colors">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="w-full bg-white border border-[#EEEEEC] rounded-2xl p-4 my-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-[#0F6E56] uppercase tracking-widest">{data.topic}</span>
        <span className="text-[10px] text-[#AEADA8]">{index + 1} / {questions.length}</span>
      </div>
      <p className="text-sm font-medium text-[#2C2C2A] mb-3">{q.question}</p>
      <div className="flex flex-col gap-2 mb-3">
        {q.options.map((opt: string, i: number) => {
          let style = 'bg-[#F6F6F4] border-[#EEEEEC] text-[#4A4A47] hover:bg-[#EBF7F2] hover:border-[#C8F0E3]'
          if (selected !== null) {
            if (i === q.correct) style = 'bg-[#EDFAF3] border-[#5DCAA5] text-[#085041]'
            else if (i === selected) style = 'bg-red-50 border-red-300 text-red-700'
            else style = 'bg-[#F6F6F4] border-[#EEEEEC] text-[#AEADA8]'
          }
          return (
            <button key={i} onClick={() => answer(i)} disabled={selected !== null}
              className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-medium transition-all ${style}`}>
              {opt}
            </button>
          )
        })}
      </div>
      {selected !== null && (
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold ${selected === q.correct ? 'text-[#085041]' : 'text-red-600'}`}>
            {selected === q.correct ? '✓ Correct!' : `✗ ${q.options[q.correct]}`}
          </span>
          <button onClick={next} className="px-3 py-1.5 text-xs bg-[#0F6E56] text-white rounded-lg hover:bg-[#085041] transition-colors">
            {index < questions.length - 1 ? 'Next →' : 'See results'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Visual ────────────────────────────────────────────────────────
function VisualBlock({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="w-full max-w-[580px]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-[#0F6E56] uppercase tracking-widest flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
          </svg>
          Interactive visual
        </span>
        <button onClick={() => setExpanded(e => !e)}
          className="text-[10px] text-[#AEADA8] hover:text-[#0F6E56] transition-colors bg-transparent border-none cursor-pointer font-sans">
          {expanded ? 'Collapse ↑' : 'Expand ↓'}
        </button>
      </div>
      <iframe srcDoc={html}
        className="w-full rounded-2xl border border-[#EEEEEC] transition-all duration-300"
        style={{ height: expanded ? '620px' : '400px' }}
        sandbox="allow-scripts"
        title="Seren visual"
      />
    </div>
  )
}

// ── Main Chat ─────────────────────────────────────────────────────
export default function Chat() {
  const navigate = useNavigate()
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = useState<string | null>(null) // chip in input bar
  const [customCommands, setCustomCommands] = useState<CustomCommand[]>([])
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('seren_dark') === '1')
  const [sidebarOpen, setSidebarOpen] = useState(false) // mobile overlay sidebar
  const [streaming, setStreaming] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // ── Dark mode ────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('seren_dark', darkMode ? '1' : '0')
  }, [darkMode])

  // ── Load user ─────────────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem('seren_user')
    if (!raw) { navigate('/login'); return }
    try {
      const u = JSON.parse(raw)
      setUser(u)
      const h = new Date().getHours()
      const greeting = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
      const welcome: Message = { role: 'seren', type: 'text', content: `${greeting}, ${u.name.split(' ')[0]} 👋 What do you want to work on today?` }
      const saved = localStorage.getItem('seren_chat_history')
      if (saved) {
        try { setMessages(JSON.parse(saved)) } catch { setMessages([welcome]) }
      } else {
        setMessages([welcome])
      }
    } catch { navigate('/login') }
  }, [])

  // ── Load custom commands ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      const saved = await bridgeStorageGet('seren_commands')
      if (saved && Array.isArray(saved)) setCustomCommands(saved)
    })()
  }, [])

  // ── Load events ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('seren_token')
    fetch(`${API_BASE}/events/user/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setEvents(Array.isArray(data) ? data.filter((e: Event) => getDaysUntil(e.deadline) >= 0) : []))
      .catch(() => {})
  }, [user])

  // ── Persist chat ──────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('seren_chat_history', JSON.stringify(messages))
    }
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleNewChat() {
    const welcome: Message = { role: 'seren', type: 'text', content: 'What do you want to work on?' }
    setMessages([welcome])
    localStorage.setItem('seren_chat_history', JSON.stringify([welcome]))
    setAttachedFile(null)
  }

  function handleLogout() {
    localStorage.removeItem('seren_token')
    localStorage.removeItem('seren_user')
    navigate('/')
  }

  // ── Paste into input ──────────────────────────────────────────
  function pasteIntoInput(text: string) {
    setInput(text)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(text.length, text.length)
    }, 50)
  }

  // ── Export PDF ────────────────────────────────────────────────
  function exportToPDF(text: string) {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF()
      const clean = text.replace(/#{1,6}\s/g, '').replace(/[*`_]/g, '')
      const lines = doc.splitTextToSize(clean, 180)
      doc.setFont('helvetica')
      doc.setFontSize(9)
      doc.setTextColor(150)
      doc.text('Exported from Seren · your study companion', 15, 12)
      doc.setTextColor(0)
      doc.setFontSize(12)
      doc.text(lines, 15, 24)
      doc.save('seren-export.pdf')
    })
  }

  // ── Send message (streamed via SSE) ─────────────────────────────
  async function sendMessage(text: string, opts?: { skipUserMessage?: boolean; historyOverride?: Message[] }) {
    if (!text.trim() || !user) return
    if (!opts?.skipUserMessage) {
      setMessages(prev => [...prev, { role: 'user', type: 'text', content: text }])
    }
    setInput('')
    setAttachedFile(null)
    setLoading(true)
    setStreaming(true)

    const token = localStorage.getItem('seren_token')
    const sourceMessages = opts?.historyOverride ?? messages
    const history = sourceMessages
      .filter(m => m.type === 'text' && m.content)
      .map(m => ({ role: m.role === 'seren' ? 'assistant' : 'user', content: m.content }))

    const controller = new AbortController()
    abortControllerRef.current = controller

    // Placeholder message that fills in as tokens arrive
    let assistantIndex = -1
    setMessages(prev => {
      assistantIndex = prev.length
      return [...prev, { role: 'seren', type: 'text', content: '' }]
    })

    let accumulated = ''

    try {
      const res = await fetch(`${API_BASE}/ai/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, user_id: user.id, conversation_history: history }),
        signal: controller.signal
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      setLoading(false) // tokens are arriving — drop the "..." loading dots

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const raw of events) {
          if (!raw.startsWith('data: ')) continue
          const json = JSON.parse(raw.slice(6))

          if (json.event === 'token') {
            accumulated += json.text
            const snapshot = accumulated
            setMessages(prev => prev.map((m, i) => i === assistantIndex ? { ...m, content: snapshot } : m))
          } else if (json.event === 'complete') {
            setMessages(prev => prev.map((m, i) => i === assistantIndex
              ? { role: 'seren', type: json.type, content: '', data: json.data }
              : m))
          } else if (json.event === 'error') {
            setMessages(prev => prev.map((m, i) => i === assistantIndex ? { ...m, content: json.message || 'Something went wrong.' } : m))
          }
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // User hit stop — keep whatever text streamed in so far
        if (!accumulated) {
          setMessages(prev => prev.map((m, i) => i === assistantIndex ? { ...m, content: '_(stopped)_' } : m))
        }
      } else {
        setMessages(prev => prev.map((m, i) => i === assistantIndex ? { ...m, content: 'Could not reach Seren. Is the backend running?' } : m))
      }
    } finally {
      setLoading(false)
      setStreaming(false)
      abortControllerRef.current = null
    }
  }

  function stopGeneration() {
    abortControllerRef.current?.abort()
  }

  function regenerate() {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMsg) return
    const idx = messages.map(m => m.role).lastIndexOf('user')
    const trimmed = idx >= 0 ? messages.slice(0, idx + 1) : messages
    setMessages(trimmed)
    sendMessage(lastUserMsg.content, { skipUserMessage: true, historyOverride: trimmed.slice(0, -1) })
  }

  function copyMessage(text: string, index: number) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(i => (i === index ? null : i)), 1500)
    })
  }

  // ── File upload → chip in input bar ──────────────────────────
  async function handleFileUpload(file: File) {
    if (!user) return
    const token = localStorage.getItem('seren_token')
    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/upload/pdf/${user.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      setLoading(false)
      if (res.ok) {
        // Show chip in input bar
        setAttachedFile(data.filename)
        // Confirm in chat
        setMessages(prev => [...prev, {
          role: 'seren', type: 'text',
          content: `I've read **${data.filename}** (${data.characters.toLocaleString()} characters). What would you like to do with it?`
        }])
        // Pre-fill input
        pasteIntoInput(`I've uploaded "${data.filename}". `)
      } else {
        setMessages(prev => [...prev, { role: 'seren', type: 'text', content: `Couldn't read that PDF: ${data.detail}` }])
      }
    } catch {
      setLoading(false)
      setMessages(prev => [...prev, { role: 'seren', type: 'text', content: 'Upload failed. Is the backend running?' }])
    }
  }

  if (!user) return null

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F6F6F4] dark:bg-[#0B1210] transition-colors" style={{ fontFamily: 'DM Sans, system-ui, sans-serif' }}>

      {/* Mobile backdrop — closes sidebar on tap outside */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`w-[260px] min-w-[260px] h-full bg-[#04342C] flex flex-col overflow-hidden fixed md:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>

        {/* Logo */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path d="M16 2 A14 14 0 1 1 26.1 22" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="26.5" cy="23.5" r="2.5" fill="#5DCAA5"/>
              <line x1="10" y1="13" x2="22" y2="13" stroke="rgba(255,255,255,0.8)" strokeWidth="1.7" strokeLinecap="round"/>
              <line x1="9"  y1="18" x2="23" y2="18" stroke="rgba(255,255,255,0.5)" strokeWidth="1.7" strokeLinecap="round"/>
              <line x1="10" y1="23" x2="22" y2="23" stroke="rgba(255,255,255,0.25)" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
            <span style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[18px] text-white font-normal">Seren</span>
          </div>
          <button onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white/50 hover:text-white/90 bg-transparent border-none cursor-pointer p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Greeting */}
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-[10px] text-white/35 uppercase tracking-widest font-medium mb-1">Good to see you,</p>
          <p style={{ fontFamily: 'DM Serif Display, serif' }} className="text-[22px] text-white font-normal leading-tight">
            {user.name.split(' ')[0]}
          </p>
        </div>

        {/* New chat */}
        <div className="px-4 pt-4">
          <button onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm text-white/80 font-medium transition-all cursor-pointer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New chat
          </button>
        </div>

        {/* Custom commands */}
        {customCommands.length > 0 && (
          <div className="px-5 pt-5">
            <p className="text-[9px] text-white/25 uppercase tracking-widest font-semibold mb-2">My commands</p>
            <div className="flex flex-col gap-1">
              {customCommands.map(cmd => (
                <button key={cmd.id}
                  onClick={() => pasteIntoInput(cmd.prompt + ' ')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/55 hover:text-white/85 hover:bg-white/07 transition-all text-left border-none bg-transparent cursor-pointer font-sans">
                  <span className="text-[#5DCAA5] text-[10px]">/</span>
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming deadlines */}
        <div className="px-5 pt-5 flex-1 overflow-y-auto">
          <p className="text-[9px] text-white/25 uppercase tracking-widest font-semibold mb-3">Upcoming</p>
          {events.length === 0 ? (
            <p className="text-xs text-white/25 leading-relaxed">No upcoming deadlines.</p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {events.slice(0, 6).map(event => {
                const days = getDaysUntil(event.deadline)
                return (
                  <div key={event.id} className="flex items-center gap-2.5 py-2 border-b border-white/5 last:border-0">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getUrgencyColor(days)}`} />
                    <span className="text-xs text-white/60 flex-1 truncate">{event.title}</span>
                    <span className="text-[10px] text-white/30 flex-shrink-0">{formatDeadline(event.deadline)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10 flex flex-col gap-1">
          <button onClick={() => setDarkMode(d => !d)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/45 hover:text-white/80 hover:bg-white/07 transition-all cursor-pointer border-none bg-transparent w-full text-left">
            {darkMode ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
            {darkMode ? 'Light mode' : 'Dark mode'}
          </button>
          <Link to="/settings"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/45 hover:text-white/80 hover:bg-white/07 transition-all no-underline">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/45 hover:text-white/80 hover:bg-white/07 transition-all cursor-pointer border-none bg-transparent w-full text-left">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Header */}
        <header className="h-[56px] flex items-center justify-between px-4 md:px-6 border-b border-[#EEEEEC] dark:border-white/10 bg-white dark:bg-[#0F1A17] flex-shrink-0 transition-colors">
          <button onClick={() => setSidebarOpen(true)}
            className="md:hidden text-[#88877F] dark:text-white/50 hover:text-[#2C2C2A] dark:hover:text-white bg-transparent border-none cursor-pointer p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <p className="text-xs text-[#AEADA8] dark:text-white/30 ml-auto">Seren · your study companion</p>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 flex flex-col gap-4">
          {messages.map((msg, i) => {
            const isLastSeren = msg.role === 'seren' && i === messages.length - 1
            return (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.type === 'flashcards' && msg.data ? (
                <div className="w-full max-w-[520px]"><FlashcardsBlock data={msg.data} /></div>
              ) : msg.type === 'quiz' && msg.data ? (
                <div className="w-full max-w-[520px]"><QuizBlock data={msg.data} /></div>
              ) : msg.type === 'visual' && msg.data ? (
                <VisualBlock html={msg.data} />
              ) : (
                <div className="flex flex-col gap-1 max-w-[80%] md:max-w-[65%]">
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed transition-colors ${
                  msg.role === 'user'
                    ? 'bg-[#085041] text-white rounded-br-sm'
                    : 'bg-white dark:bg-[#141F1C] border border-[#EEEEEC] dark:border-white/10 text-[#2C2C2A] dark:text-white/90 rounded-bl-sm'
                }`}>
                  {msg.role === 'seren' ? (
                    <>
                      <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }} className="prose-seren" />
                      {msg.content.length > 150 && (
                        <button onClick={() => exportToPDF(msg.content)}
                          className="mt-2 flex items-center gap-1 text-[10px] text-[#AEADA8] hover:text-[#0F6E56] transition-colors bg-transparent border-none cursor-pointer px-0 font-sans">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                          Export PDF
                        </button>
                      )}
                    </>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                {msg.role === 'seren' && msg.content && (
                  <div className="flex items-center gap-3 px-1">
                    <button onClick={() => copyMessage(msg.content, i)}
                      className="flex items-center gap-1 text-[10px] text-[#AEADA8] dark:text-white/30 hover:text-[#0F6E56] dark:hover:text-[#5DCAA5] transition-colors bg-transparent border-none cursor-pointer px-0 font-sans">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      {copiedIndex === i ? 'Copied' : 'Copy'}
                    </button>
                    {isLastSeren && !streaming && (
                      <button onClick={regenerate}
                        className="flex items-center gap-1 text-[10px] text-[#AEADA8] dark:text-white/30 hover:text-[#0F6E56] dark:hover:text-[#5DCAA5] transition-colors bg-transparent border-none cursor-pointer px-0 font-sans">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                        </svg>
                        Regenerate
                      </button>
                    )}
                  </div>
                )}
                </div>
              )}
            </div>
          )})}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-[#141F1C] border border-[#EEEEEC] dark:border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 bg-[#5DCAA5] rounded-full opacity-40 animate-bounce"
                      style={{ animationDelay: `${i * 0.18}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input zone — chip lives here */}
        <div className="border-t border-[#EEEEEC] dark:border-white/10 bg-white dark:bg-[#0F1A17] flex-shrink-0 transition-colors">

          {/* File chip — shown inside input zone when file attached */}
          {attachedFile && (
            <div className="px-6 pt-3">
              <div className="inline-flex items-center gap-1.5 bg-[#EBF7F2] border border-[#C8F0E3] text-[#0F6E56] text-xs font-medium px-2.5 py-1.5 rounded-lg">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span className="max-w-[200px] truncate">{attachedFile}</span>
                <button onClick={() => setAttachedFile(null)}
                  className="ml-0.5 text-[#0F6E56]/50 hover:text-[#0F6E56] bg-transparent border-none cursor-pointer text-sm leading-none">×</button>
              </div>
            </div>
          )}

          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center gap-3 bg-[#F6F6F4] dark:bg-[#1A2622] border border-[#EEEEEC] dark:border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#5DCAA5] transition-colors">
              <input type="file" ref={fileInputRef} accept=".pdf" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = '' }} />
              <button onClick={() => fileInputRef.current?.click()}
                className="text-[#AEADA8] dark:text-white/30 hover:text-[#0F6E56] dark:hover:text-[#5DCAA5] transition-colors bg-transparent border-none cursor-pointer p-0 flex-shrink-0"
                title="Upload PDF">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !streaming) { e.preventDefault(); sendMessage(input) } }}
                placeholder="Ask Seren anything…"
                className="flex-1 bg-transparent border-none outline-none text-sm text-[#2C2C2A] dark:text-white/90 placeholder-[#AEADA8] dark:placeholder-white/25 font-sans"
              />
              {streaming ? (
                <button onClick={stopGeneration}
                  className="w-8 h-8 bg-[#2C2C2A] dark:bg-white/15 hover:bg-black text-white rounded-xl border-none cursor-pointer flex items-center justify-center flex-shrink-0 transition-all"
                  title="Stop generating">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                </button>
              ) : (
                <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                  className="w-8 h-8 bg-[#0F6E56] hover:bg-[#085041] disabled:opacity-40 text-white rounded-xl border-none cursor-pointer flex items-center justify-center flex-shrink-0 transition-all">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              )}
            </div>
            <p className="text-center text-[10px] text-[#AEADA8] dark:text-white/25 mt-2">Seren can make mistakes. Always verify important information.</p>
          </div>
        </div>
      </main>
    </div>
  )
}