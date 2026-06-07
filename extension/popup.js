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

// ── Chat messages ─────────────────────────────────────────────────

function appendMessage(role, text) {
  const container = document.getElementById('chat-messages')
  const div = document.createElement('div')
  div.className = `message ${role}`
  if (role === 'seren') {
    div.innerHTML = marked.parse(text)
    div.querySelectorAll('pre code').forEach(block => {
      if (typeof hljs !== 'undefined') hljs.highlightElement(block)
    })
  } else {
    div.innerHTML = `<p>${text}</p>`
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

function checkPendingAction() {
  chrome.storage.local.get(['pendingQuery', 'pendingAction'], (res) => {
    if (res.pendingQuery && res.pendingAction) {
      const prompt = ACTION_PROMPTS[res.pendingAction]
        ? ACTION_PROMPTS[res.pendingAction](res.pendingQuery)
        : res.pendingQuery
      chrome.storage.local.remove(['pendingQuery', 'pendingAction'])
      sendToSeren(prompt)
    }
  })
}

// ── Init ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadGreeting()
  loadDeadlines()
  checkPendingAction()

  if (isTabMode) showPanel('chat')

  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.panel))
  })

  document.querySelectorAll('.sidebar-quick-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action
      const prompt = ACTION_PROMPTS[action] ? ACTION_PROMPTS[action]('(no text selected)') : 'How can I help you?'
      sendToSeren(prompt)
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
      const prompt = ACTION_PROMPTS[action] ? ACTION_PROMPTS[action]('(no text selected)') : 'How can I help you?'
      showView('view-chat')
      sendToSeren(prompt)
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
    sendToSeren(text)
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
})