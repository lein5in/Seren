// ── Seren background.js ──────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'seren-solve',     title: 'Solve with Seren',          contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'seren-summarize', title: 'Summarize with Seren',       contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'seren-quiz',      title: 'Quiz me on this',            contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'seren-schedule',  title: 'Create a schedule with Seren', contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'seren-reminder',  title: 'Add a reminder with Seren',  contexts: ['selection'] })
  chrome.contextMenus.create({ id: 'seren-save',      title: 'Save to my notes',           contexts: ['selection'] })
})

// ── Context menu clicks ───────────────────────────────────────────

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.selectionText) {
    chrome.storage.local.set({
      pendingQuery: info.selectionText,
      pendingAction: info.menuItemId
    }, () => {
      chrome.action.openPopup().catch(() => {})
    })
  }
})

// ── Messages from content.js ──────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // Floating tooltip action → save to storage and open popup
  if (msg.type === 'SEREN_CONTENT_ACTION' && msg.text && msg.action) {
    chrome.storage.local.set({
      pendingQuery: msg.text,
      pendingAction: msg.action
    }, () => {
      chrome.action.openPopup().catch(() => {})
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