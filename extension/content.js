// ── Seren content.js ─────────────────────────────────────────────
// Shows a floating action bar when the user selects text on any page.

;(function () {
  // Guard against double-injection
  if (window.__serenInjected) return
  window.__serenInjected = true

  const ACTIONS = [
    {
      id: 'seren-solve',
      label: 'Solve',
      svg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
    },
    {
      id: 'seren-summarize',
      label: 'Summarize',
      svg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>`
    },
    {
      id: 'seren-quiz',
      label: 'Quiz me',
      svg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`
    },
    {
      id: 'seren-save',
      label: 'Save',
      svg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`
    }
  ]

  let tooltip = null
  let toast = null
  let hideTooltipTimer = null

  // ── Styles ────────────────────────────────────────────────────

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
    #seren-tooltip .seren-action svg { flex-shrink: 0; opacity: 0.7; }
    #seren-tooltip .seren-action:hover svg { opacity: 1; }
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

  // ── Tooltip ───────────────────────────────────────────────────

  function removeTooltip() {
    if (tooltip) { tooltip.remove(); tooltip = null }
    clearTimeout(hideTooltipTimer)
  }

  function removeToast() {
    if (toast) { toast.remove(); toast = null }
  }

  function showTooltip(selectedText, rect) {
    removeTooltip()

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

    ACTIONS.forEach((action, i) => {
      if (i > 0) {
        const divider = document.createElement('div')
        divider.className = 'seren-divider'
        tooltip.appendChild(divider)
      }

      const btn = document.createElement('button')
      btn.className = 'seren-action'
      btn.dataset.action = action.id
      btn.innerHTML = `${action.svg} ${action.label}`

      btn.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation() })
      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation()
        handleAction(action.id, selectedText)
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
  }

  // ── Toast ─────────────────────────────────────────────────────

  function showToast() {
    removeToast()
    toast = document.createElement('div')
    toast.id = 'seren-toast'
    toast.innerHTML = `<span class="seren-toast-dot"></span>Sent to Seren — click the icon to see the answer`
    document.body.appendChild(toast)
    setTimeout(removeToast, 3500)
  }

  // ── Handle action ─────────────────────────────────────────────

  function handleAction(actionId, text) {
    chrome.runtime.sendMessage({
      type: 'SEREN_CONTENT_ACTION',
      action: actionId,
      text: text
    }, () => { showToast() })
  }

  // ── Selection detection ───────────────────────────────────────

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

  // ── Auth sync bridge ──────────────────────────────────────────
  // Runs once on page load. If the user is logged in on the Seren
  // website (localhost:5173), their token is in localStorage.
  // We forward it to background.js → stored in chrome.storage
  // → popup reads the real name instead of "there".

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
      // localStorage unavailable on some pages — silently ignore
    }
  }

  syncAuth()

})()