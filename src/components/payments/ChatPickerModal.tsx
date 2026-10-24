import { useEffect, useState } from 'react'
import { useAppStore } from '../../store'
import { createPortal } from 'react-dom'
import { Bookmark, Check, X } from 'lucide-react'
import { useI18n } from '../../lib/i18n'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { BOLD_LABEL_CLASS } from '../ui/textClasses';
import { SECTION_HEADER_ROW_CLASS } from '../ui/rowClasses';

/** Sentinel target for Telegram-style "forward to Saved Messages". */
export const SAVED_FORWARD_ID = '__saved_forward__';

interface ChatPickerModalProps {
  open: boolean
  onClose: () => void
  onPick: (chat: any) => void
  title?: string
  /** Chat that cannot be picked, e.g. the source chat of a forward. */
  excludeChatId?: string | number | null
  /**
   * Turns the picker into a checkbox list with one confirm button, so a single
   * action can reach several chats at once. Tapping a row only toggles it —
   * nothing is sent until the footer button is pressed.
   */
  multiSelect?: boolean
  /** Receives the whole selection in multi-select mode. */
  onPickMany?: (chats: any[]) => void
  /** Optional caption for a forward: rendered above the list when both caption
   *  props are present. Payments single-select never passes them, so none of
   *  the existing call sites change. */
  caption?: string
  onCaptionChange?: (value: string) => void
  /** When set, a "Saved Messages" row appears as the first forward target. */
  savedLabel?: string
}

export const ChatPickerModal = ({
  open,
  onClose,
  onPick,
  title,
  excludeChatId,
  multiSelect = false,
  onPickMany,
  caption,
  onCaptionChange,
  savedLabel,
}: ChatPickerModalProps) => {
  const { t } = useI18n()
  const chats = useAppStore((s: any) => s.chats || [])
  const [selected, setSelected] = useState<string[]>([])
  useEscapeKey(onClose, open)

  // A fresh open starts from an empty selection; reopening must not inherit
  // the previous action's targets.
  useEffect(() => {
    if (!open) setSelected([])
  }, [open])

  if (!open) return null

  const pickableChats = excludeChatId == null
    ? chats
    : chats.filter((c: any) => String(c.id) !== String(excludeChatId))

  const savedRow = multiSelect && savedLabel ? [{ id: SAVED_FORWARD_ID, name: savedLabel, saved: true }] : []
  const allRows = [...savedRow, ...pickableChats]

  const toggle = (chat: any) => {
    const id = String(chat.id)
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const selectedChats = allRows.filter((c: any) => selected.includes(String(c.id)))

  const confirm = () => {
    if (selectedChats.length === 0) return
    onPickMany?.(selectedChats)
    setSelected([])
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={SECTION_HEADER_ROW_CLASS}>
          <h3 className={BOLD_LABEL_CLASS}>
            {title || t('payments.sendToChat')}
          </h3>
<button
  type="button"
  aria-label={t('common.close')}
  onClick={onClose}
  className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-[var(--text-primary)] opacity-70 hover:opacity-100 active:scale-95 transition-transform"
>
  <X size={18} />
</button>
        </div>
        {onCaptionChange && (
          <div className="px-4 pb-1">
            <textarea
              value={caption ?? ""}
              onChange={(e) => onCaptionChange(e.target.value)}
              aria-label={t('chat.captionPlaceholder')}
              placeholder={t('chat.captionPlaceholder')}
              rows={2}
              className="w-full resize-none rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        )}
        <div className="max-h-[60vh] overflow-y-auto">
          {allRows.length === 0 && (
            <div className="p-4 text-center text-sm text-[var(--text-primary)] opacity-60">
              {t('chat.noChats')}
            </div>
          )}
          {allRows.map((chat: any) => {
            const isSelected = multiSelect && selected.includes(String(chat.id))
            return (
              <button
                key={chat.id}
                onClick={() => (multiSelect ? toggle(chat) : onPick(chat))}
                aria-pressed={multiSelect ? isSelected : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] active:scale-[0.99] transition-transform ${
                  isSelected ? 'bg-[var(--accent-soft)]' : ''
                }`}
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--button-primary-text)] font-bold shrink-0">
                  {chat.saved ? <Bookmark size={18} /> : (chat.name || chat.title || '?').toString().slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[var(--text-primary)] truncate">
                    {chat.name || chat.title || t('chat.chatName', { id: chat.id })}
                  </span>
                  {chat.lastMessage && (
                    <span className="block text-xs opacity-60 truncate">{chat.lastMessage}</span>
                  )}
                </span>
                {multiSelect && (
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-full border shrink-0 ${
                      isSelected
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--ink-on-saturate)]'
                        : 'border-[var(--text-tertiary)]/60 text-transparent'
                    }`}
                  >
                    <Check size={14} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {multiSelect && (
          <div className="p-3 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={confirm}
              disabled={selectedChats.length === 0}
              className="w-full min-h-11 rounded-xl bg-[var(--accent)] text-[var(--ink-on-saturate)] text-sm font-semibold active:scale-[0.99] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('chat.forwardCount', { count: selectedChats.length })}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
