
;(function () {
  
  if (window.__serenInjected) return
  window.__serenInjected = true

  const DEFAULT_COMMANDS = [
    { id: 'seren-solve',     label: 'Solve',      prompt: 'Solve or explain the following:',                          isDefault: true, inTooltip: true },
    { id: 'seren-summarize', label: 'Summarize',  prompt: 'Summarize the following in a clear and concise way:',       isDefault: true, inTooltip: true },
    { id: 'seren-quiz',      label: 'Quiz me',    prompt: 'Generate a quiz based on the following content:',           isDefault: true, inTooltip: true },
    { id: 'seren-save',      label: 'Save',       prompt: 'Confirm that the following has been saved to my notes and give a brief summary:', isDefault: true, inTooltip: true },
  ]

  let cachedCommands = null 
  let cachedCommandsKey = null 

  function getCommandsKey(callback) {
    chrome.storage.local.get(['userId'], (res) => {
      callback(`seren_commands_${res.userId || 'guest'}`)
    })
  }

  function loadCommands(callback) {
    getCommandsKey((key) => {
      cachedCommandsKey = key
      chrome.storage.local.get([key], (res) => {
        const cmds = (res[key] && Array.isArray(res[key]) && res[key].length > 0)
          ? res[key]
          : DEFAULT_COMMANDS
        cachedCommands = cmds
        callback(cmds)
      })
    })
  }

 
  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return
      if (cachedCommandsKey && changes[cachedCommandsKey]) {
        cachedCommands = changes[cachedCommandsKey].newValue || DEFAULT_COMMANDS
      }
    })
  }

  let tooltip = null
  let toast = null
  let hideTooltipTimer = null


  const style = document.createElement('style')
  style.textContent = `
    #seren-tooltip {
      position: absolute;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 2px;
      background: #04342C;
      border: 1px solid rgba(93, 202, 165, 0.2);
      border-radius: 10px;
      padding: 5px 6px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12);
      font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
      user-select: none;
      transform-origin: bottom center;
      animation: seren-pop 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: all;
    }
    @keyframes seren-pop {
      from { opacity: 0; transform: scale(0.88) translateY(4px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    #seren-tooltip .seren-logo {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 3px 7px 3px 4px;
      border-right: 1px solid rgba(255,255,255,0.08);
      margin-right: 2px;
      flex-shrink: 0;
    }
    #seren-tooltip .seren-logo-text {
      font-size: 11px;
      font-weight: 600;
      color: rgba(255,255,255,0.7);
      letter-spacing: 0.02em;
    }
    #seren-tooltip .seren-action {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 5px 9px;
      background: transparent;
      border: none;
      border-radius: 7px;
      color: rgba(255,255,255,0.6);
      font-size: 11.5px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.12s, color 0.12s;
      white-space: nowrap;
      line-height: 1;
    }
    #seren-tooltip .seren-action:hover {
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.95);
    }
    #seren-tooltip .seren-divider {
      width: 1px;
      height: 14px;
      background: rgba(255,255,255,0.08);
      flex-shrink: 0;
    }
    #seren-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #04342C;
      border: 1px solid rgba(93, 202, 165, 0.25);
      border-radius: 10px;
      padding: 10px 14px;
      font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
      font-size: 12.5px;
      font-weight: 500;
      color: rgba(255,255,255,0.85);
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      animation: seren-slide-in 0.2s ease;
      pointer-events: none;
    }
    #seren-toast .seren-toast-dot {
      width: 6px; height: 6px;
      background: #5DCAA5;
      border-radius: 50%;
      flex-shrink: 0;
      animation: seren-pulse 1.2s ease-in-out infinite;
    }
    @keyframes seren-slide-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes seren-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.5; transform: scale(0.7); }
    }
  `
  document.head.appendChild(style)

 

  function removeTooltip() {
    if (tooltip) { tooltip.remove(); tooltip = null }
    clearTimeout(hideTooltipTimer)
  }

  function removeToast() {
    if (toast) { toast.remove(); toast = null }
  }

  function showTooltip(selectedText, rect) {
    removeTooltip()
    loadCommands((commands) => {
      const tooltipCommands = commands.filter(c => c.inTooltip)
      if (tooltipCommands.length === 0) return

      tooltip = document.createElement('div')
      tooltip.id = 'seren-tooltip'

      const logoEl = document.createElement('div')
      logoEl.className = 'seren-logo'
      logoEl.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
          <path d="M16 2 A14 14 0 1 1 26.1 22" stroke="rgba(255,255,255,0.75)" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="26.5" cy="23.5" r="2.5" fill="#5DCAA5"/>
        </svg>
        <span class="seren-logo-text">Seren</span>
      `
      tooltip.appendChild(logoEl)

      tooltipCommands.forEach((cmd, i) => {
        if (i > 0) {
          const divider = document.createElement('div')
          divider.className = 'seren-divider'
          tooltip.appendChild(divider)
        }

        const btn = document.createElement('button')
        btn.className = 'seren-action'
        btn.dataset.commandId = cmd.id
        btn.textContent = cmd.label

        btn.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation() })
        btn.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation()
          handleAction(cmd, selectedText)
          removeTooltip()
        })

        tooltip.appendChild(btn)
      })

      document.body.appendChild(tooltip)

      const tooltipRect = tooltip.getBoundingClientRect()
      const scrollX = window.scrollX
      const scrollY = window.scrollY
      const margin = 8

      let left = rect.left + scrollX + (rect.width / 2) - (tooltipRect.width / 2)
      let top  = rect.top  + scrollY - tooltipRect.height - 10

      if (left < margin) left = margin
      if (left + tooltipRect.width > window.innerWidth - margin)
        left = window.innerWidth - tooltipRect.width - margin
      if (top < scrollY + margin)
        top = rect.bottom + scrollY + 10

      tooltip.style.left = `${left}px`
      tooltip.style.top  = `${top}px`
    })
  }



  function showToast() {
    removeToast()
    toast = document.createElement('div')
    toast.id = 'seren-toast'
    toast.innerHTML = `<span class="seren-toast-dot"></span>Opening Seren…`
    document.body.appendChild(toast)
    setTimeout(removeToast, 3500)
  }

 
  function handleAction(cmd, text) {
    const fullPrompt = `${cmd.prompt}\n\n${text}`
    chrome.runtime.sendMessage({
      type: 'SEREN_CONTENT_ACTION',
      action: cmd.id,
      promptText: fullPrompt
    }, () => { showToast() })
  }

 

  document.addEventListener('mouseup', (e) => {
    if (tooltip && tooltip.contains(e.target)) return
    setTimeout(() => {
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim()
      if (!selectedText || selectedText.length < 15) { removeTooltip(); return }
      try {
        const range = selection.getRangeAt(0)
        const rect  = range.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) return
        showTooltip(selectedText, rect)
      } catch (err) {}
    }, 60)
  })

  document.addEventListener('mousedown', (e) => {
    if (tooltip && !tooltip.contains(e.target)) removeTooltip()
  })

  document.addEventListener('scroll', () => removeTooltip(), { passive: true })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') removeTooltip() })

 


  function syncAuth() {
    try {
      const token = localStorage.getItem('seren_token')
      const raw   = localStorage.getItem('seren_user')
      if (!token || !raw) return

      const user = JSON.parse(raw)
      if (!user?.name || !user?.id) return

      chrome.runtime.sendMessage({
        type:   'SEREN_AUTH_SYNC',
        token:  token,
        userId: user.id,
        name:   user.name,
        email:  user.email || ''
      })
    } catch (err) {
      
    }
  }

  syncAuth()

 

  window.addEventListener('message', (event) => {
    if (event.source !== window) return
    const msg = event.data
    if (!msg || msg.source !== 'seren-web') return

    if (msg.type === 'SEREN_STORAGE_GET' && msg.key) {
      chrome.storage.local.get([msg.key], (res) => {
        window.postMessage({
          source: 'seren-extension',
          type: 'SEREN_STORAGE_RESULT',
          requestId: msg.requestId,
          value: res[msg.key]
        }, '*')
      })
    }

    if (msg.type === 'SEREN_STORAGE_SET' && msg.key) {
      chrome.storage.local.set({ [msg.key]: msg.value }, () => {
        window.postMessage({
          source: 'seren-extension',
          type: 'SEREN_STORAGE_RESULT',
          requestId: msg.requestId,
          ok: true
        }, '*')
      })
    }
  })

  
  window.postMessage({ source: 'seren-extension', type: 'SEREN_BRIDGE_READY' }, '*')

})()