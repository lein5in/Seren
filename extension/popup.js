const API_BASE = "http://localhost:8000";
const WEB_APP_BASE = "http://localhost:5174";

const ACTION_PROMPTS = {
  'seren-solve':     (text) => `Solve or explain the following:\n\n${text}`,
  'seren-summarize': (text) => `Summarize the following in a clear and concise way:\n\n${text}`,
  'seren-quiz':      (text) => `Generate a quiz based on the following content:\n\n${text}`,
  'seren-schedule':  (text) => `Extract a structured schedule or list of deadlines from the following:\n\n${text}`,
  'seren-reminder':  (text) => `Extract a reminder or deadline from the following and confirm it clearly:\n\n${text}`,
  'seren-save':      (text) => `Confirm that the following has been saved to my notes and give a brief summary:\n\n${text}`,
}

const isTabMode = window.innerWidth >= 600

let pendingUploadedFile = null
let activeConversationId = null

function storageGet(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve))
}

function storageSet(obj) {
  return new Promise(resolve => chrome.storage.local.set(obj, resolve))
}

async function getSession() {
  const res = await storageGet(['userId', 'serenToken'])
  if (!res.userId || !res.serenToken) return null
  return { userId: res.userId, token: res.serenToken }
}

function activeConversationKey(userId) {
  return `seren_active_conversation_${userId}`
}

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
  document.getElementById(id).classList.add('active')
}

function showPanel(panelId) {
  showView('view-' + panelId)
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.panel === panelId)
  })
}

function loadGreeting() {
  chrome.storage.local.get(['userName'], (res) => {
    const name = res.userName || 'there'
    const popup = document.getElementById('user-name')
    const sidebar = document.getElementById('sidebar-user-name')
    if (popup) popup.textContent = name
    if (sidebar) sidebar.textContent = name
  })
}

function getDaysUntil(deadline) {
  const now = new Date()
  const due = new Date(deadline)
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24))
}

function getUrgency(days) {
  if (days <= 3) return 'urgent'
  if (days <= 7) return 'soon'
  return 'upcoming'
}

function formatDeadline(deadline) {
  const days = getDaysUntil(deadline)
  if (days < 0) return 'Overdue'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `in ${days} days`
}

function renderDeadlines(container, events, dark = false) {
  if (!container) return
  if (events.length === 0) {
    if (dark) {
      container.innerHTML = `<p style="font-size:12px;color:rgba(255,255,255,0.3);padding:4px 0;">No upcoming deadlines.</p>`
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <p class="empty-state-text">No upcoming deadlines.</p>
          <button class="empty-state-cta" id="btn-import-schedule">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Import your schedule
          </button>
        </div>
      `
      document.getElementById('btn-import-schedule')?.addEventListener('click', () => {
        showView('view-chat')
        sendToSeren('I want to import my course schedule. How do I do that?')
      })
    }
    return
  }
  if (dark) {
    container.innerHTML = events.map(event => {
      const days = getDaysUntil(event.deadline)
      const urgency = getUrgency(days)
      return `
        <div class="sidebar-deadline-item">
          <span class="deadline-dot ${urgency}" style="flex-shrink:0;"></span>
          <span class="sidebar-deadline-title">${event.title}</span>
          <span class="sidebar-deadline-date">${formatDeadline(event.deadline)}</span>
        </div>
      `
    }).join('')
  } else {
    container.innerHTML = events.map(event => {
      const days = getDaysUntil(event.deadline)
      const urgency = getUrgency(days)
      const label = urgency.charAt(0).toUpperCase() + urgency.slice(1)
      return `
        <div class="deadline-item">
          <span class="deadline-dot ${urgency}"></span>
          <div class="deadline-info">
            <p class="deadline-title">${event.title}</p>
            <p class="deadline-date">${event.course ? event.course + ' · ' : ''}${formatDeadline(event.deadline)}</p>
          </div>
          <span class="deadline-badge ${urgency}">${label}</span>
        </div>
      `
    }).join('')
  }
}

function loadDeadlines() {
  chrome.storage.local.get(['userId', 'serenToken'], (res) => {
    const userId = res.userId
    const token = res.serenToken
    if (!userId || !token) {
      renderDeadlines(document.getElementById('deadlines-list'), [], false)
      renderDeadlines(document.getElementById('sidebar-deadlines-list'), [], true)
      return
    }
    fetch(`${API_BASE}/events/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(events => {
        const upcoming = Array.isArray(events) ? events.filter(e => getDaysUntil(e.deadline) >= 0) : []
        renderDeadlines(document.getElementById('deadlines-list'), upcoming, false)
        renderDeadlines(document.getElementById('sidebar-deadlines-list'), upcoming, true)
        loadOverwhelmTask(upcoming)
      })
      .catch(() => {
        renderDeadlines(document.getElementById('deadlines-list'), [], false)
        renderDeadlines(document.getElementById('sidebar-deadlines-list'), [], true)
      })
  })
}

function loadOverwhelmTask(events) {
  const container = document.getElementById('overwhelm-task')
  if (!container) return
  if (!events || events.length === 0) {
    container.innerHTML = `
      <p class="overwhelm-task-title">No tasks found</p>
      <p class="overwhelm-task-date">Import your schedule to get started</p>
    `
    return
  }
  const top = events[0]
  const days = getDaysUntil(top.deadline)
  container.innerHTML = `
    <p class="overwhelm-task-title">${top.title}</p>
    <p class="overwhelm-task-date">${top.course ? top.course + ' · ' : ''}${formatDeadline(top.deadline)}</p>
  `
  const overwhelmPrompt = `I'm feeling overwhelmed. My most urgent task is "${top.title}"${top.course ? ` for ${top.course}` : ''}, due ${days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`}. Help me break it down into small, manageable steps to get started right now.`
  document.getElementById('btn-overwhelm-send')?.addEventListener('click', () => {
    sendToSeren(overwhelmPrompt)
  })
}

function showInputFileChip(filename) {
  removeInputFileChip()
  const chatFooter = document.querySelector('.chat-footer')
  if (!chatFooter) return
  const chip = document.createElement('div')
  chip.className = 'input-file-chip'
  chip.id = 'input-file-chip'
  chip.innerHTML = `
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
    <span>${filename}</span>
    <button class="input-file-chip-remove" id="chip-remove">×</button>
  `
  chatFooter.insertBefore(chip, chatFooter.firstChild)
  document.getElementById('chip-remove')?.addEventListener('click', () => {
    removeInputFileChip()
    pendingUploadedFile = null
  })
}

function removeInputFileChip() {
  document.getElementById('input-file-chip')?.remove()
}

function exportMessageAsPDF(text) {
  const { jsPDF } = window.jspdf
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
}

function appendMessage(role, text) {
  const container = document.getElementById('chat-messages')
  const div = document.createElement('div')
  div.className = `message ${role}`
  if (role === 'seren') {
    div.innerHTML = DOMPurify.sanitize(marked.parse(text))
    div.querySelectorAll('pre code').forEach(block => {
      if (typeof hljs !== 'undefined') hljs.highlightElement(block)
    })
    if (text.length > 150) {
      const exportBtn = document.createElement('button')
      exportBtn.className = 'export-btn'
      exportBtn.textContent = 'Export PDF'
      exportBtn.addEventListener('click', () => exportMessageAsPDF(text))
      div.appendChild(exportBtn)
    }
  } else {
    div.innerHTML = DOMPurify.sanitize(`<p>${text}</p>`)
  }
  container.appendChild(div)
  container.scrollTop = container.scrollHeight
}

function appendLoading() {
  const container = document.getElementById('chat-messages')
  const div = document.createElement('div')
  div.className = 'message seren loading'
  div.id = 'loading-msg'
  div.innerHTML = `<div class="loading-dots"><span></span><span></span><span></span></div>`
  container.appendChild(div)
  container.scrollTop = container.scrollHeight
}

function removeLoading() {
  const el = document.getElementById('loading-msg')
  if (el) el.remove()
}

function appendFlashcards(data) {
  const container = document.getElementById('chat-messages')
  const cards = data.cards || []
  const topic = data.topic || 'Flashcards'
  let currentIndex = 0

  const wrapper = document.createElement('div')
  wrapper.className = 'flashcard-wrapper'
  wrapper.innerHTML = `
    <div class="flashcard-header">
      <span class="flashcard-topic">${topic}</span>
      <span class="flashcard-counter" id="fc-counter">1 / ${cards.length}</span>
    </div>
    <div class="flashcard-scene">
      <div class="flashcard" id="fc-card">
        <div class="flashcard-front">
          <p>${cards[0]?.front || ''}</p>
          <span class="flashcard-hint">Tap to flip</span>
        </div>
        <div class="flashcard-back">
          <p>${cards[0]?.back || ''}</p>
        </div>
      </div>
    </div>
    <div class="flashcard-nav">
      <button class="fc-btn" id="fc-prev">← Prev</button>
      <button class="fc-btn fc-btn-flip" id="fc-flip">Flip</button>
      <button class="fc-btn" id="fc-next">Next →</button>
    </div>
  `
  container.appendChild(wrapper)
  container.scrollTop = container.scrollHeight

  const card = wrapper.querySelector('#fc-card')
  const counter = wrapper.querySelector('#fc-counter')

  function updateCard() {
    card.classList.remove('flipped')
    setTimeout(() => {
      card.querySelector('.flashcard-front p').textContent = cards[currentIndex].front
      card.querySelector('.flashcard-back p').textContent = cards[currentIndex].back
      counter.textContent = `${currentIndex + 1} / ${cards.length}`
    }, 150)
  }

  wrapper.querySelector('#fc-flip').addEventListener('click', () => card.classList.toggle('flipped'))
  card.addEventListener('click', () => card.classList.toggle('flipped'))
  wrapper.querySelector('#fc-prev').addEventListener('click', () => { if (currentIndex > 0) { currentIndex--; updateCard() } })
  wrapper.querySelector('#fc-next').addEventListener('click', () => { if (currentIndex < cards.length - 1) { currentIndex++; updateCard() } })
}

function appendQuiz(data) {
  const container = document.getElementById('chat-messages')
  const questions = data.questions || []
  const topic = data.topic || 'Quiz'
  let currentIndex = 0
  let score = 0
  let answered = false

  const wrapper = document.createElement('div')
  wrapper.className = 'quiz-wrapper'

  function renderQuestion() {
    const q = questions[currentIndex]
    answered = false
    wrapper.innerHTML = `
      <div class="quiz-header">
        <span class="quiz-topic">${topic}</span>
        <span class="quiz-counter">${currentIndex + 1} / ${questions.length}</span>
      </div>
      <p class="quiz-question">${q.question}</p>
      <div class="quiz-options" id="quiz-options">
        ${q.options.map((opt, i) => `<button class="quiz-option" data-index="${i}">${opt}</button>`).join('')}
      </div>
      <div class="quiz-feedback" id="quiz-feedback"></div>
      <div class="quiz-footer">
        <span class="quiz-score">Score: ${score} / ${questions.length}</span>
        ${currentIndex < questions.length - 1
          ? `<button class="fc-btn fc-btn-flip" id="quiz-next" style="display:none">Next →</button>`
          : `<button class="fc-btn fc-btn-flip" id="quiz-finish" style="display:none">See results</button>`
        }
      </div>
    `

    wrapper.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return
        answered = true
        const selected = parseInt(btn.dataset.index)
        const correct = q.correct
        const feedback = wrapper.querySelector('#quiz-feedback')
        const nextBtn = wrapper.querySelector('#quiz-next') || wrapper.querySelector('#quiz-finish')
        wrapper.querySelectorAll('.quiz-option').forEach((b, i) => {
          if (i === correct) b.classList.add('correct')
          else if (i === selected && selected !== correct) b.classList.add('wrong')
          b.disabled = true
        })
        if (selected === correct) { score++; feedback.innerHTML = `<span class="quiz-fb-correct">✓ Correct!</span>` }
        else { feedback.innerHTML = `<span class="quiz-fb-wrong">✗ Answer: ${q.options[correct]}</span>` }
        if (nextBtn) nextBtn.style.display = 'inline-flex'
      })
    })

    wrapper.querySelector('#quiz-next')?.addEventListener('click', () => { currentIndex++; renderQuestion() })
    wrapper.querySelector('#quiz-finish')?.addEventListener('click', () => {
      const pct = Math.round((score / questions.length) * 100)
      const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚'
      wrapper.innerHTML = `
        <div class="quiz-result">
          <p class="quiz-result-emoji">${emoji}</p>
          <p class="quiz-result-score">${score} / ${questions.length}</p>
          <p class="quiz-result-pct">${pct}% correct</p>
          <p class="quiz-result-msg">${pct >= 80 ? 'Great job!' : pct >= 60 ? 'Good effort! Keep reviewing.' : "Keep studying — you'll get there!"}</p>
          <button class="fc-btn fc-btn-flip" id="quiz-retry">Try again</button>
        </div>
      `
      wrapper.querySelector('#quiz-retry')?.addEventListener('click', () => { currentIndex = 0; score = 0; renderQuestion() })
    })
  }

  container.appendChild(wrapper)
  renderQuestion()
  container.scrollTop = container.scrollHeight
}

function appendVisual(html) {
  const container = document.getElementById('chat-messages')
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'width:100%;margin:4px 0;'

  const header = document.createElement('div')
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;'
  header.innerHTML = `
    <span style="font-size:10px;font-weight:600;color:#0F6E56;text-transform:uppercase;letter-spacing:0.08em;">Interactive visual</span>
    <button id="visual-expand-btn" style="font-size:10px;color:#AEADA8;background:none;border:none;cursor:pointer;font-family:inherit;">Expand ↓</button>
  `
  wrapper.appendChild(header)

  const iframe = document.createElement('iframe')
  iframe.srcdoc = html
  iframe.sandbox = 'allow-scripts'
  iframe.style.cssText = 'width:100%;height:340px;border:1px solid #EEEEEC;border-radius:14px;display:block;transition:height 0.3s;'
  wrapper.appendChild(iframe)

  let expanded = false
  header.querySelector('#visual-expand-btn').addEventListener('click', () => {
    expanded = !expanded
    iframe.style.height = expanded ? '560px' : '340px'
    header.querySelector('#visual-expand-btn').textContent = expanded ? 'Collapse ↑' : 'Expand ↓'
  })

  container.appendChild(wrapper)
  container.scrollTop = container.scrollHeight
}

function loadSidebarCommands() {
  const container = document.getElementById('sidebar-commands-list')
  if (!container) return
  storageGet(['userId']).then((res) => {
    const key = `seren_commands_${res.userId || 'guest'}`
    chrome.storage.local.get([key], (res2) => {
      const commands = Array.isArray(res2[key]) ? res2[key] : []
      if (commands.length === 0) {
        container.innerHTML = ''
        return
      }
      container.innerHTML = commands.map(cmd => `
        <button class="sidebar-quick-item" data-command-id="${cmd.id}">
          <span style="color:#5DCAA5;font-weight:700;font-size:11px;">/</span>
          ${cmd.label}
        </button>
      `).join('')
      container.querySelectorAll('[data-command-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          const cmd = commands.find(c => c.id === btn.dataset.commandId)
          if (cmd) pasteIntoInput(cmd.prompt + ' ')
        })
      })
    })
  })
}

if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return
    const changedKey = Object.keys(changes).find(k => k.startsWith('seren_commands_'))
    if (changedKey) loadSidebarCommands()
  })
}

function applyDarkMode(enabled) {
  document.body.classList.toggle('dark', enabled)
  const sunIcon = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`
  const moonIcon = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`
  const icon = document.getElementById('dark-toggle-icon')
  const iconSidebar = document.getElementById('dark-toggle-icon-sidebar')
  const label = document.getElementById('dark-toggle-label-sidebar')
  if (icon) icon.innerHTML = enabled ? moonIcon : sunIcon
  if (iconSidebar) iconSidebar.innerHTML = enabled ? moonIcon : sunIcon
  if (label) label.textContent = enabled ? 'Light mode' : 'Dark mode'
}

async function toggleDarkMode() {
  const res = await storageGet(['seren_ext_dark'])
  const next = !res.seren_ext_dark
  await storageSet({ seren_ext_dark: next })
  applyDarkMode(next)
}

async function initDarkMode() {
  const res = await storageGet(['seren_ext_dark'])
  applyDarkMode(!!res.seren_ext_dark)
}

function pasteIntoInput(text) {
  const input = document.getElementById('chat-input')
  if (!input) return
  if (isTabMode) showPanel('chat')
  else showView('view-chat')
  input.value = text
  input.focus()
  input.setSelectionRange(text.length, text.length)
}

function showLoginRequired() {
  const container = document.getElementById('chat-messages')
  container.innerHTML = `
    <div class="message seren">
      <p>Please log in on the Seren website first, then reopen this popup.</p>
    </div>
  `
}

function renderMessageFromApi(msg) {
  if (msg.type === 'flashcards' && msg.data) {
    appendFlashcards(msg.data)
  } else if (msg.type === 'quiz' && msg.data) {
    appendQuiz(msg.data)
  } else if (msg.type === 'visual' && msg.data) {
    appendVisual(msg.data)
  } else {
    appendMessage(msg.role === 'assistant' ? 'seren' : 'user', msg.content || '')
  }
}

function formatConversationDate(iso) {
  const date = new Date(iso)
  const now = new Date()
  const days = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

async function loadSidebarConversations(session) {
  const container = document.getElementById('sidebar-conversations-list')
  if (!container) return
  try {
    const res = await fetch(`${API_BASE}/conversations/`, {
      headers: { Authorization: `Bearer ${session.token}` }
    })
    if (!res.ok) throw new Error()
    const conversations = await res.json()
    container.innerHTML = conversations.map(conv => `
      <div class="sidebar-quick-item" data-conv-id="${conv.id}" style="justify-content:space-between;padding-right:6px;${conv.id === activeConversationId ? 'background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.9);' : ''}">
        <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${conv.title}</span>
        <span style="font-size:9px;opacity:0.4;flex-shrink:0;margin-left:6px;">${formatConversationDate(conv.updated_at)}</span>
        <button class="conv-delete-btn" data-conv-id="${conv.id}" style="background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.25);padding:0 0 0 6px;flex-shrink:0;display:flex;align-items:center;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          </svg>
        </button>
      </div>
    `).join('')
    container.querySelectorAll('[data-conv-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.conv-delete-btn')) return
        const id = parseInt(el.dataset.convId)
        switchConversation(session, id)
      })
    })
    container.querySelectorAll('.conv-delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const id = parseInt(btn.dataset.convId)
        await deleteConversationFromSidebar(session, id)
      })
    })
  } catch {}
}

async function switchConversation(session, conversationId) {
  activeConversationId = conversationId
  await storageSet({ [activeConversationKey(session.userId)]: conversationId })
  await loadConversationMessages(session, conversationId)
  loadSidebarConversations(session)
}

async function deleteConversationFromSidebar(session, conversationId) {
  try {
    await fetch(`${API_BASE}/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.token}` }
    })
  } catch {}
  if (conversationId === activeConversationId) {
    try {
      activeConversationId = await ensureActiveConversation(session)
      await loadConversationMessages(session, activeConversationId)
    } catch {}
  }
  loadSidebarConversations(session)
}

async function ensureActiveConversation(session) {
  const key = activeConversationKey(session.userId)
  const stored = await storageGet([key])
  const storedId = stored[key]

  const listRes = await fetch(`${API_BASE}/conversations/`, {
    headers: { Authorization: `Bearer ${session.token}` }
  })
  if (!listRes.ok) throw new Error('conversations_list_failed')
  const conversations = await listRes.json()

  if (storedId && conversations.some(c => c.id === storedId)) {
    return storedId
  }

  if (conversations.length > 0) {
    await storageSet({ [key]: conversations[0].id })
    return conversations[0].id
  }

  const createRes = await fetch(`${API_BASE}/conversations/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
    body: JSON.stringify({ title: 'New conversation' })
  })
  if (!createRes.ok) throw new Error('conversation_create_failed')
  const created = await createRes.json()
  await storageSet({ [key]: created.id })
  return created.id
}

async function loadConversationMessages(session, conversationId) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}`, {
    headers: { Authorization: `Bearer ${session.token}` }
  })
  if (!res.ok) throw new Error('conversation_load_failed')
  const data = await res.json()
  const container = document.getElementById('chat-messages')
  container.innerHTML = ''
  const messages = data.messages || []
  if (messages.length === 0) {
    container.innerHTML = `<div class="message seren"><p>Hi! What do you want to work on today?</p></div>`
    return
  }
  messages.forEach(renderMessageFromApi)
  container.scrollTop = container.scrollHeight
}

async function initConversation() {
  const session = await getSession()
  if (!session) {
    showLoginRequired()
    return
  }
  try {
    activeConversationId = await ensureActiveConversation(session)
    await loadConversationMessages(session, activeConversationId)
    loadSidebarConversations(session)
  } catch {
    appendMessage('seren', 'Could not load your conversation. Is the backend running?')
  }
}

async function startNewConversation() {
  const session = await getSession()
  if (!session) { showLoginRequired(); return }
  try {
    const createRes = await fetch(`${API_BASE}/conversations/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ title: 'New conversation' })
    })
    if (!createRes.ok) throw new Error()
    const created = await createRes.json()
    activeConversationId = created.id
    await storageSet({ [activeConversationKey(session.userId)]: created.id })
    document.getElementById('chat-messages').innerHTML = `<div class="message seren"><p>What do you want to work on?</p></div>`
    removeInputFileChip()
    pendingUploadedFile = null
    loadSidebarConversations(session)
  } catch {
    appendMessage('seren', 'Could not start a new conversation. Is the backend running?')
  }
}

let activeStreamController = null

function setSendButtonMode(mode) {
  const btn = document.getElementById('btn-send')
  if (!btn) return
  btn.dataset.mode = mode
  if (mode === 'stop') {
    btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`
    btn.title = 'Stop generating'
  } else {
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`
    btn.title = ''
  }
}

function appendStreamingMessage() {
  const container = document.getElementById('chat-messages')
  const div = document.createElement('div')
  div.className = 'message seren'
  container.appendChild(div)
  container.scrollTop = container.scrollHeight

  return {
    el: div,
    update(text) {
      div.innerHTML = DOMPurify.sanitize(marked.parse(text))
      div.querySelectorAll('pre code').forEach(block => {
        if (typeof hljs !== 'undefined') hljs.highlightElement(block)
      })
      container.scrollTop = container.scrollHeight
    },
    finalize(text) {
      if (text.length > 150) {
        const exportBtn = document.createElement('button')
        exportBtn.className = 'export-btn'
        exportBtn.textContent = 'Export PDF'
        exportBtn.addEventListener('click', () => exportMessageAsPDF(text))
        div.appendChild(exportBtn)
      }
    }
  }
}

async function sendToSeren(userText) {
  if (isTabMode) { showPanel('chat') } else { showView('view-chat') }

  const session = await getSession()
  if (!session) { showLoginRequired(); return }
  if (!activeConversationId) {
    try {
      activeConversationId = await ensureActiveConversation(session)
    } catch {
      appendMessage('seren', 'Could not reach Seren. Is the backend running?')
      return
    }
  }

  appendMessage('user', userText)
  appendLoading()

  const controller = new AbortController()
  activeStreamController = controller
  setSendButtonMode('stop')

  let stream = null
  let accumulated = ''

  try {
    const response = await fetch(`${API_BASE}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`
      },
      body: JSON.stringify({ conversation_id: activeConversationId, message: userText }),
      signal: controller.signal
    })

    if (!response.ok || !response.body) {
      removeLoading()
      if (response.status === 429) {
        appendMessage('seren', "You're sending messages a bit too fast — wait a few seconds and try again.")
      } else if (response.status === 401 || response.status === 403) {
        appendMessage('seren', 'Your session expired. Please log out and log back in from Settings.')
      } else {
        appendMessage('seren', 'Could not reach Seren. Is the backend running?')
      }
      setSendButtonMode('send')
      activeStreamController = null
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let handledStructured = false

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
          if (!stream) { removeLoading(); stream = appendStreamingMessage() }
          accumulated += json.text
          stream.update(accumulated)
        } else if (json.event === 'complete') {
          removeLoading()
          handledStructured = true
          if (json.type === 'flashcards') appendFlashcards(json.data)
          else if (json.type === 'quiz') appendQuiz(json.data)
          else if (json.type === 'visual') appendVisual(json.data)
        } else if (json.event === 'error') {
          removeLoading()
          appendMessage('seren', json.message || 'Something went wrong.')
        }
      }
    }

    if (stream && !handledStructured) stream.finalize(accumulated)
  } catch (err) {
    removeLoading()
    if (err?.name !== 'AbortError') {
      appendMessage('seren', 'Could not reach Seren. Is the backend running?')
    } else if (stream && accumulated) {
      stream.finalize(accumulated)
    }
  } finally {
    setSendButtonMode('send')
    activeStreamController = null
    loadSidebarConversations(session)
  }
}

function stopSerenGeneration() {
  activeStreamController?.abort()
}

let focusInterval = null
let focusSeconds = 25 * 60
const FOCUS_TOTAL = 25 * 60

function updateTimerDisplay() {
  const m = String(Math.floor(focusSeconds / 60)).padStart(2, '0')
  const s = String(focusSeconds % 60).padStart(2, '0')
  document.getElementById('focus-timer').textContent = `${m}:${s}`
  const progress = document.getElementById('focus-progress')
  if (progress) {
    progress.style.strokeDashoffset = 326.7 * (1 - focusSeconds / FOCUS_TOTAL)
  }
}

function checkPendingAction() {
  chrome.storage.local.get(['pendingQuery', 'pendingAction', 'pendingPromptText'], (res) => {
    if (res.pendingPromptText) {
      chrome.storage.local.remove(['pendingQuery', 'pendingAction', 'pendingPromptText'])
      pasteIntoInput(res.pendingPromptText)
    } else if (res.pendingQuery && res.pendingAction) {
      const prompt = ACTION_PROMPTS[res.pendingAction]
        ? ACTION_PROMPTS[res.pendingAction](res.pendingQuery)
        : res.pendingQuery
      chrome.storage.local.remove(['pendingQuery', 'pendingAction'])
      pasteIntoInput(prompt)
    }
  })
}

document.addEventListener('DOMContentLoaded', () => {
  loadGreeting()
  loadDeadlines()
  loadSidebarCommands()
  initConversation()
  checkPendingAction()
  initDarkMode()

  if (isTabMode) showPanel('chat')

  document.getElementById('btn-dark-toggle')?.addEventListener('click', toggleDarkMode)
  document.getElementById('btn-dark-toggle-sidebar')?.addEventListener('click', toggleDarkMode)

  document.getElementById('sidebar-new-chat')?.addEventListener('click', () => {
    startNewConversation()
  })

  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.panel))
  })

  document.querySelectorAll('.sidebar-quick-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action
      const prompt = ACTION_PROMPTS[action] ? ACTION_PROMPTS[action]('') : ''
      pasteIntoInput(prompt)
    })
  })

  document.getElementById('btn-start-studying')?.addEventListener('click', () => showView('view-chat'))
  document.getElementById('btn-focus')?.addEventListener('click', () => showView('view-focus'))
  document.getElementById('btn-overwhelm')?.addEventListener('click', () => showView('view-overwhelm'))
  document.getElementById('btn-back')?.addEventListener('click', () => showView('view-home'))
  document.getElementById('btn-back-focus')?.addEventListener('click', () => showView('view-home'))
  document.getElementById('btn-back-overwhelm')?.addEventListener('click', () => showView('view-home'))

  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action
      const prompt = ACTION_PROMPTS[action] ? ACTION_PROMPTS[action]('') : ''
      showView('view-chat')
      pasteIntoInput(prompt)
    })
  })

  document.getElementById('btn-expand')?.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') })
    }
  })

  document.getElementById('btn-new-chat')?.addEventListener('click', () => {
    startNewConversation()
  })

  document.getElementById('btn-send')?.addEventListener('click', () => {
    const btn = document.getElementById('btn-send')
    if (btn.dataset.mode === 'stop') {
      stopSerenGeneration()
      return
    }
    const input = document.getElementById('chat-input')
    const text = input.value.trim()
    if (!text) return
    input.value = ''
    if (pendingUploadedFile) {
      removeInputFileChip()
      pendingUploadedFile = null
    }
    sendToSeren(text)
  })

  document.getElementById('btn-attach')?.addEventListener('click', () => {
    document.getElementById('pdf-input').click()
  })

  document.getElementById('pdf-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''

    const session = await getSession()
    if (!session) { showLoginRequired(); return }
    if (!activeConversationId) {
      try { activeConversationId = await ensureActiveConversation(session) }
      catch { appendMessage('seren', 'Could not reach Seren. Is the backend running?'); return }
    }

    if (isTabMode) showPanel('chat')
    else showView('view-chat')

    appendLoading()

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE}/upload/pdf/${activeConversationId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: formData
      })
      const data = await response.json()
      removeLoading()
      if (response.ok) {
        pendingUploadedFile = { filename: data.filename, characters: data.characters }
        showInputFileChip(data.filename)
        appendMessage('seren', `I've read **${data.filename}** (${data.characters.toLocaleString()} characters). What would you like to do with it?`)
        pasteIntoInput(`I've uploaded "${data.filename}". `)
      } else {
        appendMessage('seren', `Couldn't read that PDF: ${data.detail}`)
      }
    } catch {
      removeLoading()
      appendMessage('seren', 'Upload failed. Is the backend running?')
    }
  })

  document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return
    const btn = document.getElementById('btn-send')
    if (btn.dataset.mode === 'stop') return
    btn.click()
  })

  document.getElementById('btn-focus-start')?.addEventListener('click', () => {
    const btn = document.getElementById('btn-focus-start')
    if (focusInterval) {
      clearInterval(focusInterval); focusInterval = null; btn.textContent = 'Start'
    } else {
      btn.textContent = 'Pause'
      focusInterval = setInterval(() => {
        if (focusSeconds <= 0) { clearInterval(focusInterval); focusInterval = null; btn.textContent = 'Start'; return }
        focusSeconds--; updateTimerDisplay()
      }, 1000)
    }
  })

  document.getElementById('btn-focus-reset')?.addEventListener('click', () => {
    clearInterval(focusInterval); focusInterval = null
    focusSeconds = FOCUS_TOTAL; updateTimerDisplay()
    document.getElementById('btn-focus-start').textContent = 'Start'
  })

  document.getElementById('btn-settings')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEB_APP_BASE}/settings` })
  })

  document.getElementById('btn-settings-sidebar')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEB_APP_BASE}/settings` })
  })
})