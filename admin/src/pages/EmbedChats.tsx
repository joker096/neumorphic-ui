import { useState, useEffect, useCallback, useRef, FormEvent } from 'react'
import { api, EmbedConversation, EmbedMessage } from '../api/client'
import { useAdminI18n } from '../lib/i18n'
import { adminErrorMessage, isSessionLost } from '../lib/errorMessage'
import ErrorState from '../components/ErrorState'

const STATUS_ALL = 'all'
const STATUS_OPEN = 'open'
const STATUS_CLOSED = 'closed'

export default function EmbedChats() {
  const { t } = useAdminI18n()
  const [convs, setConvs] = useState<EmbedConversation[]>([])
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_OPEN)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [thread, setThread] = useState<EmbedMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const selectedIdRef = useRef<string | null>(null)
  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])

  const load = useCallback(() => {
    setError(null)
    setLoading(true)
    api
      .embedConversations({ status: statusFilter })
      .then((list) => {
        setConvs(list ?? [])
        setLoading(false)
        // Keep the open thread in sync when the list reloads.
        setSelectedId((cur) => {
          if (cur && !list.some((c) => c.conversation_id === cur)) return null
          return cur
        })
      })
      .catch((err) => {
        setLoading(false)
        if (!isSessionLost(err)) setError(adminErrorMessage(err) ?? '')
      })
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  // Keep the console live without a WS bridge: refresh the list (and the open
  // thread) on a short interval so inbound visitor messages appear without a
  // manual reload. Backed by the operator REST endpoints; the interval is
  // cheap (list = 100 rows) and stopped while the window is not focused.
  useEffect(() => {
    const refresh = () => {
      if (document.hidden) return
      setError(null)
      api.embedConversations({ status: statusFilter }).then((list) => {
        setConvs(list ?? [])
        setSelectedId((cur) => (cur && !list.some((c) => c.conversation_id === cur) ? null : cur))
      }).catch((err) => {
        if (!isSessionLost(err)) setError(adminErrorMessage(err) ?? '')
      })
      const cur = selectedIdRef.current
      if (cur) {
        api.embedThread(cur).then(setThread).catch((err) => {
          if (!isSessionLost(err)) setError(adminErrorMessage(err) ?? '')
        })
      }
    }
    const id = setInterval(refresh, 10_000)
    return () => clearInterval(id)
  }, [statusFilter])

  const openThread = (id: string) => {
    setSelectedId(id)
    setDraft('')
    setError(null)
    api
      .embedThread(id)
      .then(setThread)
      .catch((err) => {
        if (!isSessionLost(err)) setError(adminErrorMessage(err) ?? '')
      })
  }

  const handleReply = async (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || !selectedId || sending) return
    setSending(true)
    setError(null)
    try {
      await api.embedReply(selectedId, text)
      setDraft('')
      setThread((cur) => [
        ...cur,
        {
          id: `local-${Date.now()}`,
          conversation_id: selectedId,
          sender_type: 'operator',
          type: 'text',
          body: text,
          status: 'sent',
          created_at: new Date().toISOString(),
        },
      ])
      load()
    } catch (err) {
      if (!isSessionLost(err)) setError(adminErrorMessage(err) ?? t('common.actionFailed'))
    } finally {
      setSending(false)
    }
  }

  const setStatus = async (id: string, status: string) => {
    setError(null)
    try {
      await api.embedUpdateConversation(id, { status })
      load()
      if (selectedId === id && status === STATUS_CLOSED) { setThread([]); setSelectedId(null) }
    } catch (err) {
      if (!isSessionLost(err)) setError(adminErrorMessage(err) ?? t('common.actionFailed'))
    }
  }

  const fmtWhen = (iso?: string) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString()
  }

  const selected = convs.find((c) => c.conversation_id === selectedId) || null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h1 className="text-lg font-bold">{t('embedChats.title')}</h1>
        <div className="flex gap-2">
          {[STATUS_OPEN, STATUS_ALL, STATUS_CLOSED].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === s ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {t(`embedChats.filter.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {error !== null && <ErrorState message={error} onRetry={load} />}

      <div className="grid md:grid-cols-2 gap-4 items-start">
        {/* Conversation list */}
        <div className="bg-[var(--bg-tertiary)] rounded-xl min-h-64">
          {loading ? (
            <p className="text-center text-gray-500 py-8">{t('common.loading')}</p>
          ) : convs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">{t('embedChats.noConversations')}</p>
          ) : (
            <div className="divide-y divide-white/5">
              {convs.map((c) => (
                <button
                  key={c.conversation_id}
                  onClick={() => openThread(c.conversation_id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    selectedId === c.conversation_id ? 'bg-orange-500/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm truncate">
                      {c.visitor?.name || c.visitor?.email || t('embedChats.visitor')}
                    </div>
                    <div className="text-[10px] text-gray-500 shrink-0">
                      {c.status === STATUS_CLOSED ? t('embedChats.closed') : t('embedChats.open')}
                    </div>
                  </div>
                  <div data-testid="embed-conv-meta" className="text-xs text-gray-500 truncate mt-0.5">
                    {c.visitor?.email ? `${c.visitor.email} · ` : ''}
                    {c.message_count} {t('embedChats.messages')}
                  </div>
                  {c.last_message?.body ? (
                    <div className="text-xs text-gray-400 truncate mt-1">{c.last_message.body}</div>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Thread */}
        <div className="bg-[var(--bg-tertiary)] rounded-xl flex flex-col min-h-64">
          {!selected ? (
            <p className="text-center text-gray-500 py-8">{t('embedChats.selectConversation')}</p>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-white/5">
                <div className="font-semibold text-sm">
                  {selected.visitor?.name || t('embedChats.visitor')}
                  {selected.visitor?.identity?.uid ? ` · ${selected.visitor.identity.uid}` : ''}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {selected.visitor?.email ? `${selected.visitor.email} ` : ''}
                  {selected.visitor?.phone ? `${selected.visitor.phone} ` : ''}
                  · {t('embedChats.started')} {fmtWhen(selected.started_at)}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 max-h-96">
                {thread.length === 0 ? (
                  <div className="text-center text-xs text-gray-500 py-6">{t('embedChats.noMessages')}</div>
                ) : (
                  thread.map((m) => {
                    const own = m.sender_type === 'operator'
                    return (
                      <div key={m.id} className={`flex flex-col max-w-[85%] ${own ? 'self-end items-end' : 'self-start items-start'}`}>
                        {!own && <div className="text-[10px] text-gray-500 mb-0.5">{t('embedChats.visitor')}</div>}
                        <div className={`px-3 py-2 rounded-xl text-sm break-words ${own ? 'bg-orange-500 text-white' : 'bg-white/5 text-[var(--text-primary)]'}`}>
                          {m.body}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{fmtWhen(m.created_at)}</div>
                      </div>
                    )
                  })
                )}
              </div>

              <form onSubmit={handleReply} className="p-3 border-t border-white/5 flex items-center gap-2">
                <input
                  aria-label={t('embedChats.reply')}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t('embedChats.replyPlaceholder')}
                  className="flex-1 bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm border border-[var(--border-color)] outline-none focus:border-orange-500/50"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {sending ? t('embedChats.sending') : t('embedChats.send')}
                </button>
              </form>

              <div className="px-4 py-2 border-t border-white/5 flex items-center gap-2">
                {selected.status === STATUS_OPEN ? (
                  <button
                    onClick={() => setStatus(selected.conversation_id, STATUS_CLOSED)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs"
                  >
                    {t('embedChats.closeConversation')}
                  </button>
                ) : (
                  <button
                    onClick={() => setStatus(selected.conversation_id, STATUS_OPEN)}
                    className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs"
                  >
                    {t('embedChats.reopenConversation')}
                  </button>
                )}
                {selected.rating !== undefined && selected.rating !== null ? (
                  <span className="text-xs text-gray-400">{t('embedChats.rating')}: {selected.rating}/5</span>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
