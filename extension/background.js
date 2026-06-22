// ── Seren background.js ──────────────────────────────────────────

const DEFAULT_COMMANDS = [
  { id: 'seren-solve',     label: 'Solve',      prompt: 'Solve or explain the following:',                          isDefault: true, inTooltip: true },
  { id: 'seren-summarize', label: 'Summarize',  prompt: 'Summarize the following in a clear and concise way:',       isDefault: true, inTooltip: true },
  { id: 'seren-quiz',      label: 'Quiz me',    prompt: 'Generate a quiz based on the following content:',           isDefault: true, inTooltip: true },
  { id: 'seren-save',      label: 'Save',       prompt: 'Confirm that the following has been saved to my notes and give a brief summary:', isDefault: true, inTooltip: true },
]

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'seren-solve',     title: 'Solve with Seren',          contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'seren-summarize', title: 'Summarize with Seren',       contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'seren-quiz',      title: 'Quiz me on this',            contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'seren-save',      title: 'Save to my notes',           contexts: ['selection'] })

  chrome.storage.local.get(['seren_commands'], (res) => {
    if (!res.seren_commands || !Array.isArray(res.seren_commands) || res.seren_commands.length === 0) {
      chrome.storage.local.set({ seren_commands: DEFAULT_COMMANDS })
    }
  })
})

chrome.runtime.onStartup?.addListener(() => {
  chrome.storage.local.get(['seren_commands'], (res) => {
    if (!res.seren_commands || !Array.isArray(res.seren_commands) || res.seren_commands.length === 0) {
      chrome.storage.local.set({ seren_commands: DEFAULT_COMMANDS })
    }
  })
})

// ── Context menu clicks ───────────────────────────────────────────

const CONTEXT_MENU_PROMPTS = {
  'seren-solve':     'Solve or explain the following:',
  'seren-summarize': 'Summarize the following in a clear and concise way:',
  'seren-quiz':      'Generate a quiz based on the following content:',
  'seren-save':      'Confirm that the following has been saved to my notes and give a brief summary:'
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.selectionText) {
    const promptPrefix = CONTEXT_MENU_PROMPTS[info.menuItemId] || ''
    chrome.storage.local.set({
      pendingPromptText: `${promptPrefix}\n\n${info.selectionText}`
    }, () => {
      chrome.action.openPopup()
    })
  }
})

// ── Messages from content.js ──────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // Floating tooltip action → save prompt and open popup
  if (msg.type === 'SEREN_CONTENT_ACTION' && msg.promptText) {
    chrome.storage.local.set({
      pendingPromptText: msg.promptText
    }, () => {
      chrome.action.openPopup()
      sendResponse({ ok: true })
    })
    return true
  }

  // Auth sync → store user info so popup shows real name
  if (msg.type === 'SEREN_AUTH_SYNC' && msg.name && msg.userId) {
    chrome.storage.local.set({
      userName: msg.name,
      userId:   msg.userId,
      userEmail: msg.email || '',
      serenToken: msg.token || ''
    }, () => {
      sendResponse({ ok: true })
    })
    return true
  }

})