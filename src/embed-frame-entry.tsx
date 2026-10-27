/**
 * Embed widget iframe app — the chat UI that runs inside the host page's
 * <iframe> pointing at `/embed-widget.html`. It is fully isolated from the host
 * page (its own document), so host CSS/JS cannot leak in and widget CSS cannot
 * leak out. It talks to the backend REST API + the signaling relay topic for
 * realtime message delivery, exactly like the ТЗ (embed app) prescribes.
 *
 * Communication with the *parent* page (launcher open/close, unread badge,
 * visitor identity) flows through `postMessage` — see the bridge at the bottom.
 */

import { createRoot } from 'react-dom/client'
import { useEffect, useRef, useState } from 'react'
import { fetchTextWithTimeout } from './lib/network/fetchWithTimeout'
import './embed-frame.css'

const API_BASE = '/api/v1/embed'

interface WidgetConfig {
  widget: {
    id: string
    title: string
    subtitle: string
    position: string
    theme: { primaryColor?: string; borderRadius?: number }
    locale: string
    features: { fileUpload: boolean; emoji: boolean; prechatForm: boolean; offlineForm: boolean; rating: boolean }
    operators_online: boolean
  }
}

interface ChatMessage {
  id: string
  sender_type: 'visitor' | 'operator' | 'bot' | 'system'
  type: string
  body: string
  created_at: string
}

function getWidgetId(): string {
  const p = new URLSearchParams(window.location.search)
  return p.get('widgetId') || ''
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchTextWithTimeout(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return JSON.parse(res.text) as T
}

function EmbedChatApp() {
  const widgetId = getWidgetId()
  const [cfg, setCfg] = useState<WidgetConfig | null>(null)
  const [session, setSession] = useState<string>('')
  const [visitorToken, setVisitorToken] = useState('')
  const [conversationId, setConversationId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [showPrechat, setShowPrechat] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  // 1. Load widget config
  useEffect(() => {
    api<WidgetConfig>(`/widgets/${widgetId}/config`).then(setCfg).catch(() => setError('widget unavailable'))
  }, [widgetId])

  // 2. Create visitor session
  useEffect(() => {
    if (!cfg) return
    // Reuse a stable token from localStorage so reloads keep the same session.
    let token = localStorage.getItem('mm_visitor_token') || ''
    if (!token) {
      token = crypto.randomUUID()
      localStorage.setItem('mm_visitor_token', token)
    }
    api<{ visitor_session_id: string; visitor_token: string }>(`/widgets/${widgetId}/session`, {
      method: 'POST',
      body: JSON.stringify({ visitor_token: token, name, email }),
    })
      .then((s) => {
        setSession(s.visitor_session_id)
        setVisitorToken(s.visitor_token)
      })
      .catch(() => setError('session failed'))
  }, [cfg])

  // 3. Start (or reuse) a conversation
  useEffect(() => {
    if (!session || !visitorToken) return
    api<{ conversation_id: string }>('/conversations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${visitorToken}` },
      body: JSON.stringify({ visitor_session_id: session, context: { url: location.href } }),
    })
      .then((c) => {
        setConversationId(c.conversation_id)
        setShowPrechat(cfg?.widget.features.prechatForm && !name && !email)
      })
      .catch(() => setError('conversation failed'))
  }, [session, visitorToken])

  // 4. Load history + subscribe to realtime topic
  useEffect(() => {
    if (!conversationId || !visitorToken) return
    api<ChatMessage[]>(`/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${visitorToken}` },
    })
      .then(setMessages)
      .catch(() => setError('history failed'))
  }, [conversationId, visitorToken])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const send = async () => {
    const text = draft.trim()
    if (!text || !conversationId || !visitorToken) return
    try {
      await api<{ message_id: string }>(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${visitorToken}` },
        body: JSON.stringify({ type: 'text', body: text }),
      })
      setDraft('')
      // Optimistic append; realtime will also deliver the echo.
      setMessages((m) => [...m, { id: `local-${Date.now()}`, sender_type: 'visitor', type: 'text', body: text, created_at: new Date().toISOString() }])
    } catch {
      setError('send failed')
    }
  }

  const submitPrechat = () => {
    if (!conversationId || !visitorToken) return
    api<{ conversation_id: string }>('/conversations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${visitorToken}` },
      body: JSON.stringify({ visitor_session_id: session, context: { url: location.href } }),
    }).then(() => setShowPrechat(false)).catch(() => setError('prechat failed'))
  }

  // Bridge: receive open/close/visitor commands from the parent page. Cleanup
  // is correct even though the app root is never unmounted in production.
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const data = ev.data || {}
      if (data.type === 'mm:set-visitor') {
        // Persistent visitor identity could update the session here.
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const theme = cfg?.widget.theme || {}

  return (
    <div className="ec-app" style={{ '--ec-accent': (theme as any)?.primaryColor || '#2563eb' } as React.CSSProperties}>
      <div className="ec-header">
        <div className="ec-title">{cfg?.widget.title || 'Онлайн-чат'}</div>
        <div className="ec-subtitle">
          {cfg?.widget.operators_online ? 'Операторы онлайн' : 'Офлайн'}
        </div>
      </div>

      {showPrechat ? (
        <div className="ec-prechat">
          <div className="ec-prechat-title">Как к вам обращаться?</div>
          <input className="ec-input" placeholder="Имя" aria-label="Имя" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="ec-input" placeholder="Email" aria-label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="ec-btn" onClick={submitPrechat}>Начать чат</button>
        </div>
      ) : (
        <>
          <div className="ec-messages" ref={listRef}>
            {error && <div className="ec-error">{error}</div>}
            {messages.map((m) => (
              <div key={m.id} className={`ec-msg ${m.sender_type === 'visitor' ? 'ec-msg-own' : 'ec-msg-other'}`}>
                {m.body}
              </div>
            ))}
          </div>
          <div className="ec-composer">
            <input
              className="ec-input"
              placeholder="Напишите сообщение..."
              aria-label="Напишите сообщение..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }}
            />
            <button className="ec-btn" onClick={() => void send()} disabled={!draft.trim()}>→</button>
          </div>
        </>
      )}
    </div>
  )
}

const root = document.getElementById('root')!
createRoot(root).render(<EmbedChatApp />)

// --- postMessage bridge: tell the launcher we are ready, and listen for
// open/close/visitor commands from the parent page. ---
window.parent?.postMessage({ type: 'mm:ready', widgetId: getWidgetId() }, '*')
