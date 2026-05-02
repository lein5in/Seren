chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'seren-solve',
    title: '🔍 Solve with Seren',
    contexts: ['selection']
  })

  chrome.contextMenus.create({
    id: 'seren-summarize',
    title: '📝 Summarize with Seren',
    contexts: ['selection']
  })

  chrome.contextMenus.create({
    id: 'seren-quiz',
    title: '🧪 Quiz me on this',
    contexts: ['selection']
  })

  chrome.contextMenus.create({
    id: 'seren-schedule',
    title: '📅 Create a schedule with Seren',
    contexts: ['selection']
  })

  chrome.contextMenus.create({
    id: 'seren-reminder',
    title: '🔔 Add a reminder with Seren',
    contexts: ['selection']
  })

  chrome.contextMenus.create({
    id: 'seren-save',
    title: '💾 Save to my notes',
    contexts: ['selection']
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.selectionText) {
    chrome.storage.local.set({
      pendingQuery: info.selectionText,
      pendingAction: info.menuItemId
    }, () => {
      chrome.action.openPopup()
    })
  }
})