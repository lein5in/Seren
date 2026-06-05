const API_BASE = 'http://localhost:8000'

const ACTION_PROMPTS = {
  'seren-solve':     (text) => `Solve or explain the following:\n\n${text}`,
  'seren-summarize': (text) => `Summarize the following in a clear and concise way:\n\n${text}`,
  'seren-quiz':      (text) => `Generate 3 quiz questions based on the following content:\n\n${text}`,
  'seren-schedule':  (text) => `Extract a structured schedule or list of deadlines from the following:\n\n${text}`,
  'seren-reminder':  (text) => `Extract a reminder or deadline from the following and confirm it clearly:\n\n${text}`,
  'seren-save':      (text) => `Confirm that the following has been saved to my notes and give a brief summary:\n\n${text}`,
}

// Detect if we're running in a full tab or as a popup
const isTabMode = window.innerWidth >= 600

// ── View management ──────────────────────────────────────────────

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
  document.getElementById(id).classList.add('active')
}

// In tab mode, switching panels also updates sidebar nav active state
function showPanel(panelId) {
  showView('view-' + panelId)
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.panel === panelId)
  })
}

// ── Greeting ─────────────────────────────────────────────────────

function loadGreeting() {
  chrome.storage.local.get(['userName'], (res) => {
    const name = res.userName || 'there'
    const popup = document.getElementById('user-name')
    const sidebar = document.getElementById('sidebar-user-name')
    if (popup) popup.textContent = name
    if (sidebar) sidebar.textContent = name
  })
}

// ── Deadlines ─────────────────────────────────────────────────────

function renderDeadlines(container, deadlines, dark = false) {
  if (!container) return

  if (deadlines.length === 0) {
    if (dark) {
      container.innerHTML = `
        <p style="font-size:12px;color:rgba(255,255,255,0.3);padding:4px 0;">No upcoming deadlines.</p>
      `
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
    container.innerHTML = deadlines.map(d => `
      <div class="sidebar-deadline-item">
        <span class="deadline-dot ${d.urgency}" style="flex-shrink:0;"></span>
        <span class="sidebar-deadline-title">${d.title}</span>
        <span class="sidebar-deadline-date">${d.date}</span>
      </div>
    `).join('')
  } else {
    container.innerHTML = deadlines.map(d => `
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
}

function loadDeadlines() {
  const deadlines = [] // empty until user imports schedule
  const popupContainer = document.getElementById('deadlines-list')
  const sidebarContainer = document.getElementById('sidebar-deadlines-list')
  renderDeadlines(popupContainer, deadlines, false)
  renderDeadlines(sidebarContainer, deadlines, true)
}

function loadOverwhelmTask() {
  const container = document.getElementById('overwhelm-task')
  if (!container) return
  container.innerHTML = `
    <p class="overwhelm-task-title">No tasks found</p>
    <p class="overwhelm-task-date">Import your schedule to get started</p>
  `
}

// ── Chat ──────────────────────────────────────────────────────────

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
  div.innerHTML = `<div class="loading-dots"><span></span><span></span><span></span></div>`
  container.appendChild(div)
  container.scrollTop = container.scrollHeight
}

function removeLoading() {
  const el = document.getElementById('loading-msg')
  if (el) el.remove()
}

async function sendToSeren(userText) {
  if (isTabMode) {
    showPanel('chat')
  } else {
    showView('view-chat')
  }
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
    const circumference = 326.7
    progress.style.strokeDashoffset = circumference * (1 - focusSeconds / FOCUS_TOTAL)
  }
}

// ── Pending actions (from context menu) ──────────────────────────

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
  loadOverwhelmTask()
  checkPendingAction()

  // In tab mode, default to chat panel
  if (isTabMode) {
    showPanel('chat')
  }

  // ── Sidebar nav (tab mode) ──
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.panel))
  })

  // Sidebar quick actions → go to chat and send
  document.querySelectorAll('.sidebar-quick-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action
      const prompt = ACTION_PROMPTS[action]
        ? ACTION_PROMPTS[action]('(no text selected — prompt the user)')
        : 'How can I help you?'
      sendToSeren(prompt)
    })
  })

  // ── Popup-mode navigation ──
  document.getElementById('btn-start-studying')?.addEventListener('click', () => showView('view-chat'))
  document.getElementById('btn-focus')?.addEventListener('click', () => showView('view-focus'))
  document.getElementById('btn-overwhelm')?.addEventListener('click', () => showView('view-overwhelm'))
  document.getElementById('btn-back')?.addEventListener('click', () => showView('view-home'))
  document.getElementById('btn-back-focus')?.addEventListener('click', () => showView('view-home'))
  document.getElementById('btn-back-overwhelm')?.addEventListener('click', () => showView('view-home'))

  // Popup quick actions
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

  // ── Expand to tab ──
  document.getElementById('btn-expand')?.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') })
    }
  })

  // ── Chat send ──
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

  // ── Focus timer controls ──
  document.getElementById('btn-focus-start')?.addEventListener('click', () => {
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

  document.getElementById('btn-focus-reset')?.addEventListener('click', () => {
    clearInterval(focusInterval)
    focusInterval = null
    focusSeconds = FOCUS_TOTAL
    updateTimerDisplay()
    document.getElementById('btn-focus-start').textContent = 'Start'
  })
})