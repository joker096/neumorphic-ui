/**
 * Mess&Anger embed widget loader — `widget.js`.
 *
 * Include on any site with a single classic <script> tag:
 *
 *   <script src="https://chat.example.com/widget.js"></script>
 *   <script>window.MyMessengerChat?.init({ widgetId: "WIDGET_ID" })</script>
 *
 * The loader is deliberately framework-free and dependency-free (vanilla, IIFE).
 * It creates the launcher + unread badge + an isolated <iframe> pointing at the
 * embed app (`/embed-widget.html?widgetId=...`). All chat UI lives inside the
 * frame, so host CSS and JS are never touched. Communication between the host
 * page and the frame happens over `postMessage` (mm:* events).
 *
 * The command queue pattern means `window.MyMessengerChat(...)` calls made
 * *before* this script loads are buffered and replayed — see `q` handling below.
 */

(function () {
  'use strict'

  var EMBED_ORIGIN = (window.__MM_EMBED_ORIGIN__) || ''
  var iframe = null
  var launcher = null
  var badge = null
  var frameWrap = null
  var config = {}
  var open = false

  function qs(name, fallback) {
    var params = new URLSearchParams(window.location.search)
    return params.get(name) || fallback
  }

  function resolveEmbedOrigin() {
    if (EMBED_ORIGIN) return EMBED_ORIGIN
    return window.location.origin
  }

  function buildStyle() {
    var style = document.createElement('style')
    style.id = 'mm-widget-styles'
    style.textContent = [
      '#mm-root { position: fixed; bottom: 20px; right: 20px; z-index: 2147483000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }',
      '#mm-root.mm-left { right: auto; left: 20px; }',
      '#mm-launcher { width: 60px; height: 60px; border-radius: 9999px; background: var(--mm-primary, #2563eb); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(0,0,0,.18); transition: transform .15s ease; }',
      '#mm-launcher:hover { transform: scale(1.05); }',
      '#mm-badge { position: absolute; top: -4px; right: -4px; min-width: 20px; height: 20px; border-radius: 9999px; background: #ef4444; color: #fff; font-size: 12px; font-weight: 700; display: none; align-items: center; justify-content: center; padding: 0 6px; }',
      '#mm-frame-wrap { position: fixed; bottom: 96px; right: 20px; width: 380px; height: 600px; max-width: calc(100vw - 40px); max-height: calc(100vh - 120px); border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,.22); display: none; background: #fff; }',
      '#mm-root.mm-left #mm-frame-wrap { right: auto; left: 20px; }',
      '#mm-frame { width: 100%; height: 100%; border: 0; }',
      '@media (max-width: 640px) { #mm-frame-wrap { bottom: 0; right: 0; left: 0 !important; width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; } }'
    ].join('\n')
    document.head.appendChild(style)
  }

  function setUnread(count) {
    if (!badge) return
    if (count > 0) {
      badge.style.display = 'flex'
      badge.textContent = count > 99 ? '99+' : String(count)
    } else {
      badge.style.display = 'none'
    }
  }

  function postToFrame(type, payload) {
    if (!iframe || !iframe.contentWindow) return
    iframe.contentWindow.postMessage({ type: type, payload: payload }, resolveEmbedOrigin())
  }

  function build() {
    var root = document.createElement('div')
    root.id = 'mm-root'
    if (config.position === 'bottom-left') root.classList.add('mm-left')

    launcher = document.createElement('button')
    launcher.id = 'mm-launcher'
    launcher.setAttribute('aria-label', config.ariaLabel || 'Открыть чат')
    launcher.style.setProperty('--mm-primary', config.primaryColor || '#2563eb')
    launcher.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3C7.03 3 3 6.58 3 11c0 2.39 1.19 4.53 3.06 5.98L6 21l4.05-1.75c.62.14 1.28.22 1.95.22 4.97 0 9-3.58 9-8s-4.03-8-9-8Z" fill="white"/></svg>'

    badge = document.createElement('span')
    badge.id = 'mm-badge'

    launcher.appendChild(badge)

    frameWrap = document.createElement('div')
    frameWrap.id = 'mm-frame-wrap'
    iframe = document.createElement('iframe')
    iframe.id = 'mm-frame'
    iframe.title = 'Mess&Anger Chat'
    iframe.allow = 'clipboard-write; camera; microphone'
    iframe.src = resolveEmbedOrigin() + '/embed-widget.html?widgetId=' + encodeURIComponent(config.widgetId || '')

    frameWrap.appendChild(iframe)
    root.appendChild(launcher)
    root.appendChild(frameWrap)

    document.body.appendChild(root)

    launcher.addEventListener('click', toggle)
  }

  function openChat() {
    if (!frameWrap) return
    open = true
    frameWrap.style.display = 'block'
    setUnread(0)
    postToFrame('mm:open')
    window.dispatchEvent(new CustomEvent('mm:opened'))
  }

  function closeChat() {
    if (!frameWrap) return
    open = false
    frameWrap.style.display = 'none'
    postToFrame('mm:close')
    window.dispatchEvent(new CustomEvent('mm:closed'))
  }

  function toggle() {
    if (open) closeChat()
    else openChat()
  }

  function init(options) {
    config = options || {}
    if (!config.widgetId) {
      console.error('MyMessengerChat: widgetId is required')
      return
    }
    if (window.__mmInitialized) {
      console.warn('MyMessengerChat already initialized')
      return
    }
    window.__mmInitialized = true
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { buildStyle(); build() })
    } else {
      buildStyle(); build()
    }
  }

  // Command queue: calls before this script ran are buffered in `q`.
  function run(scope, args) {
    var method = args[0]
    var payload = args[1]
    switch (method) {
      case 'init': init(payload); break
      case 'open': openChat(); break
      case 'close': closeChat(); break
      case 'toggle': toggle(); break
      case 'setVisitor': postToFrame('mm:set-visitor', payload); break
      case 'setAttributes': postToFrame('mm:set-attributes', payload); break
      case 'sendMessage': postToFrame('mm:send-message', payload); break
      default: break
    }
  }

  var queue = window.MyMessengerChat && window.MyMessengerChat.q ? window.MyMessengerChat.q : []
  window.MyMessengerChat = function () { run(this, Array.prototype.slice.call(arguments)) }
  window.MyMessengerChat.q = []
  // Convenience method API — `MyMessengerChat.init({...})`, `open()`,
  // `close()`, `toggle()`, `setVisitor(...)`, `sendMessage(...)`. Both the
  // queued-call style (`MyMessengerChat('init', {...})`) and these methods
  // work; the methods are what the docs/demo use.
  window.MyMessengerChat.init = init
  window.MyMessengerChat.open = openChat
  window.MyMessengerChat.close = closeChat
  window.MyMessengerChat.toggle = toggle
  window.MyMessengerChat.setVisitor = function (payload) { postToFrame('mm:set-visitor', payload) }
  window.MyMessengerChat.setAttributes = function (payload) { postToFrame('mm:set-attributes', payload) }
  window.MyMessengerChat.sendMessage = function (payload) { postToFrame('mm:send-message', payload) }
  queue.forEach(function (args) { run(window, args) })

  // Listen for unread-count updates from the frame to refresh the badge.
  window.addEventListener('message', function (ev) {
    if (ev.origin !== resolveEmbedOrigin()) return
    var data = ev.data || {}
    if (data.type === 'mm:unread-count') {
      setUnread((data.payload && data.payload.count) || 0)
    }
    window.dispatchEvent(new CustomEvent('mm:' + data.type, { detail: data.payload }))
  })
})()
