// ── Constants ──
const API_BASE = 'http://localhost:8000'

const ACTION_PROMPTS = {
  'seren-solve':     (text) => `Solve or explain the following:\n\n${text}`,
  'seren-summarize': (text) => `Summarize the following in a clear and concise way:\n\n${text}`,
  'seren-quiz':      (text) => `Generate 3 quiz questions based on the following content:\n\n${text}`,
  'seren-schedule':  (text) => `Extract a structured schedule or list of deadlines from the following:\n\n${text}`,
  'seren-reminder':  (text) => `Extract a reminder or deadline from the following and confirm it clearly:\n\n${text}`,
  'seren-save':      (text) => `Confirm that the following has been saved to my notes and give a brief summary:\n\n${text}`,
}

// ── Views ──
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
  document.getElementById(id).classList.add('active')
}

// ── Greeting ──
function loadGreeting() {
  chrome.storage.local.get(['userName'], (res) => {
    const name = res.userName || 'there'
    document.getElementById('user-name').textContent = `${name} 🌿`
  })
}

// ── Deadlines ──
function loadDeadlines() {
  const container = document.getElementById('deadlines-list')
  const mockDeadlines = [
    { title: 'MAT1320 — Midterm', date: 'in 3 days', urgency: 'urgent' },
    { title: 'CSI2110 — Assignment 3', date: 'in 6 days', urgency: 'soon' },
    { title: 'PHI1101 — Essay', date: 'in 12 days', urgency: 'normal' },
  ]

  container.innerHTML = mockDeadlines.map(d => `
    <div class="deadline-item">
      <span class="deadline-dot ${d.urgency}"></span>
      <div class="deadline-info">
        <p class="deadline-title">${d.title}</p>
        <p class="deadline-date">${d.date}</p>
      </div>
      <span class="deadline-badge ${d.urgency}">${d.urgency.charAt(0).toUpperCase() + d.urgency.slice(1)}</span>
    </div>
  `).join('')
}

// ── Overwhelm mode ──
function loadOverwhelmTask() {
  const container = document.getElementById('overwhelm-task')
  const mockTask = { title: 'MAT1320 — Midterm', date: 'Due in 3 days' }
  container.innerHTML = `
    <p class="overwhelm-task-title">${mockTask.title}</p>
    <p class="overwhelm-task-date">${mockTask.date}</p>
  `
}

// ── Chat ──
function appendMessage(role, text) {
  const container = document.getElementById('chat-messages')
  const div = document.createElement('div')
  div.className = `message ${role}`
  div.innerHTML = `<p>${text}</p>`
  container.appendChild(div)
  container.scrollTop = container.scrollHeight
}

function appendLoading() {
  const container = document.getElementById('chat-messages')
  const div = document.createElement('div')
  div.className = 'message seren loading'
  div.id = 'loading-msg'
  div.innerHTML = `<p></p>`
  container.appendChild(div)
  container.scrollTop = container.scrollHeight
}

function removeLoading() {
  const el = document.getElementById('loading-msg')
  if (el) el.remove()
}

async function sendToSeren(userText) {
  appendMessage('user', userText)
  appendLoading()

  try {
    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText, user_id: 1 })
    })
    const data = await response.json()
    removeLoading()
    appendMessage('seren', data.reply || 'Something went wrong.')
  } catch (err) {
    removeLoading()
    appendMessage('seren', 'Could not reach Seren. Is the backend running?')
  }
}

// ── Focus timer ──
let focusInterval = null
let focusSeconds = 25 * 60

function updateTimerDisplay() {
  const m = String(Math.floor(focusSeconds / 60)).padStart(2, '0')
  const s = String(focusSeconds % 60).padStart(2, '0')
  document.getElementById('focus-timer').textContent = `${m}:${s}`
}

// ── Pending action from context menu ──
function checkPendingAction() {
  chrome.storage.local.get(['pendingQuery', 'pendingAction'], (res) => {
    if (res.pendingQuery && res.pendingAction) {
      const prompt = ACTION_PROMPTS[res.pendingAction]
        ? ACTION_PROMPTS[res.pendingAction](res.pendingQuery)
        : res.pendingQuery

      chrome.storage.local.remove(['pendingQuery', 'pendingAction'])
      showView('view-chat')
      sendToSeren(prompt)
    }
  })
}

// ── Event listeners ──
document.addEventListener('DOMContentLoaded', () => {
  loadGreeting()
  loadDeadlines()
  loadOverwhelmTask()
  checkPendingAction()

  // Navigation
  document.getElementById('btn-start-studying').addEventListener('click', () => showView('view-chat'))
  document.getElementById('btn-focus').addEventListener('click', () => showView('view-focus'))
  document.getElementById('btn-overwhelm').addEventListener('click', () => showView('view-overwhelm'))
  document.getElementById('btn-back').addEventListener('click', () => showView('view-home'))
  document.getElementById('btn-back-focus').addEventListener('click', () => showView('view-home'))
  document.getElementById('btn-back-overwhelm').addEventListener('click', () => showView('view-home'))

  // Quick actions
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action
      const prompt = ACTION_PROMPTS[action]
        ? ACTION_PROMPTS[action]('(no text selected — prompt the user)')
        : 'How can I help you?'
      showView('view-chat')
      sendToSeren(prompt)
    })
  })

  // Chat send
  document.getElementById('btn-send').addEventListener('click', () => {
    const input = document.getElementById('chat-input')
    const text = input.value.trim()
    if (!text) return
    input.value = ''
    sendToSeren(text)
  })

  document.getElementById('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-send').click()
  })

  // Focus timer
  document.getElementById('btn-focus-start').addEventListener('click', () => {
    const btn = document.getElementById('btn-focus-start')
    if (focusInterval) {
      clearInterval(focusInterval)
      focusInterval = null
      btn.textContent = 'Start'
    } else {
      btn.textContent = 'Pause'
      focusInterval = setInterval(() => {
        if (focusSeconds <= 0) {
          clearInterval(focusInterval)
          focusInterval = null
          btn.textContent = 'Start'
          return
        }
        focusSeconds--
        updateTimerDisplay()
      }, 1000)
    }
  })

  document.getElementById('btn-focus-reset').addEventListener('click', () => {
    clearInterval(focusInterval)
    focusInterval = null
    focusSeconds = 25 * 60
    updateTimerDisplay()
    document.getElementById('btn-focus-start').textContent = 'Start'
  })
})