const API_BASE = 'http://localhost:8000'

const ACTION_PROMPTS = {
  'seren-solve':     (text) => `Solve or explain the following:\n\n${text}`,
  'seren-summarize': (text) => `Summarize the following in a clear and concise way:\n\n${text}`,
  'seren-quiz':      (text) => `Generate a quiz based on the following content:\n\n${text}`,
  'seren-schedule':  (text) => `Extract a structured schedule or list of deadlines from the following:\n\n${text}`,
  'seren-reminder':  (text) => `Extract a reminder or deadline from the following and confirm it clearly:\n\n${text}`,
  'seren-save':      (text) => `Confirm that the following has been saved to my notes and give a brief summary:\n\n${text}`,
}

const isTabMode = window.innerWidth >= 600

// ── Pending file upload state ─────────────────────────────────────
let pendingUploadedFile = null // { filename, characters, userId }

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

// ── Input file chip ───────────────────────────────────────────────

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

// ── Chat messages ─────────────────────────────────────────────────

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
    div.innerHTML = marked.parse(text)
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
    div.innerHTML = `<p>${text}</p>`
  }
  container.appendChild(div)
  container.scrollTop = container.scrollHeight
  saveHistory()
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

function saveHistory() {
  const messages = []
  document.querySelectorAll('#chat-messages .message').forEach(div => {
    if (div.classList.contains('loading')) return
    messages.push({
      role: div.classList.contains('user') ? 'user' : 'seren',
      html: div.innerHTML
    })
  })
  chrome.storage.local.set({ chatHistory: messages })
}

function restoreHistory() {
  chrome.storage.local.get(['chatHistory'], (res) => {
    if (!res.chatHistory || res.chatHistory.length === 0) return
    const container = document.getElementById('chat-messages')
    container.innerHTML = ''
    res.chatHistory.forEach(msg => {
      const div = document.createElement('div')
      div.className = `message ${msg.role}`
      div.innerHTML = msg.html
      container.appendChild(div)
    })
    container.scrollTop = container.scrollHeight
  })
}

// ── Flashcards ────────────────────────────────────────────────────

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
          <p>${cards[0].front}</p>
          <span class="flashcard-hint">Tap to flip</span>
        </div>
        <div class="flashcard-back">
          <p>${cards[0].back}</p>
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

// ── Quiz ──────────────────────────────────────────────────────────

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

// ── Visual ────────────────────────────────────────────────────────

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
  saveHistory()
}

// ── Custom commands (synced via chrome.storage with Settings page) ─

function loadSidebarCommands() {
  const container = document.getElementById('sidebar-commands-list')
  if (!container) return
  chrome.storage.local.get(['seren_commands'], (res) => {
    const commands = Array.isArray(res.seren_commands) ? res.seren_commands : []
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
}

if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.seren_commands) loadSidebarCommands()
  })
}

// ── Paste into input ──────────────────────────────────────────────

function pasteIntoInput(text) {
  const input = document.getElementById('chat-input')
  if (!input) return
  if (isTabMode) showPanel('chat')
  else showView('view-chat')
  input.value = text
  input.focus()
  input.setSelectionRange(text.length, text.length)
}

// ── Send to Seren ─────────────────────────────────────────────────

async function sendToSeren(userText) {
  if (isTabMode) { showPanel('chat') } else { showView('view-chat') }
  appendMessage('user', userText)
  appendLoading()

  chrome.storage.local.get(['userId', 'serenToken'], async (res) => {
    try {
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(res.serenToken ? { Authorization: `Bearer ${res.serenToken}` } : {})
        },
        body: JSON.stringify({ message: userText, user_id: res.userId || 1 })
      })
      const data = await response.json()
      removeLoading()

      if (data.type === 'flashcards' && data.data) {
        appendFlashcards(data.data)
      } else if (data.type === 'quiz' && data.data) {
        appendQuiz(data.data)
      } else if (data.type === 'visual' && data.data) {
        appendVisual(data.data)
      } else {
        appendMessage('seren', data.reply || 'Something went wrong.')
      }
    } catch {
      removeLoading()
      appendMessage('seren', 'Could not reach Seren. Is the backend running?')
    }
  })
}

// ── Focus timer ───────────────────────────────────────────────────

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

// ── checkPendingAction → paste into input instead of auto-send ────

function checkPendingAction() {
  chrome.storage.local.get(['pendingQuery', 'pendingAction', 'pendingPromptText'], (res) => {
    if (res.pendingPromptText) {
      // New format: content.js already built the full prompt from the user's command
      chrome.storage.local.remove(['pendingQuery', 'pendingAction', 'pendingPromptText'])
      pasteIntoInput(res.pendingPromptText)
    } else if (res.pendingQuery && res.pendingAction) {
      // Legacy format fallback (context menu still uses this)
      const prompt = ACTION_PROMPTS[res.pendingAction]
        ? ACTION_PROMPTS[res.pendingAction](res.pendingQuery)
        : res.pendingQuery
      chrome.storage.local.remove(['pendingQuery', 'pendingAction'])
      pasteIntoInput(prompt)
    }
  })
}

// ── Init ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadGreeting()
  loadDeadlines()
  loadSidebarCommands()
  restoreHistory()
  checkPendingAction()

  if (isTabMode) showPanel('chat')

  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.panel))
  })

  // Quick actions → paste into input
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

  // Quick buttons → paste into input
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

  document.getElementById('btn-send')?.addEventListener('click', () => {
    const input = document.getElementById('chat-input')
    const text = input.value.trim()
    if (!text) return
    input.value = ''
    // If there's a pending uploaded file, include it in context
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

    chrome.storage.local.get(['userId', 'serenToken'], async (res) => {
      if (!res.userId || !res.serenToken) {
        appendMessage('seren', 'Please log in to upload documents.')
        return
      }
      if (isTabMode) showPanel('chat')
      else showView('view-chat')

      appendLoading()

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch(`${API_BASE}/upload/pdf/${res.userId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${res.serenToken}` },
          body: formData
        })
        const data = await response.json()
        removeLoading()
        if (response.ok) {
          pendingUploadedFile = { filename: data.filename, characters: data.characters }
          // Show chip in input bar
          showInputFileChip(data.filename)
          // Confirm in chat
          appendMessage('seren', `I've read **${data.filename}** (${data.characters.toLocaleString()} characters). What would you like to do with it?`)
          // Pre-fill input so user can add their question
          pasteIntoInput(`I've uploaded "${data.filename}". `)
        } else {
          appendMessage('seren', `Couldn't read that PDF: ${data.detail}`)
        }
      } catch {
        removeLoading()
        appendMessage('seren', 'Upload failed. Is the backend running?')
      }
    })
  })

  document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-send').click()
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
    chrome.tabs.create({ url: 'http://localhost:5173/settings' })
  })

  document.getElementById('btn-settings-sidebar')?.addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:5173/settings' })
  })
})