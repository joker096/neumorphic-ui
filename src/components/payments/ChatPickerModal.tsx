import { useAppStore } from '../../store'
import { X } from 'lucide-react'

interface ChatPickerModalProps {
  open: boolean
  onClose: () => void
  onPick: (chat: any) => void
  title?: string
}

export const ChatPickerModal = ({ open, onClose, onPick, title }: ChatPickerModalProps) => {
  const chats = useAppStore((s: any) => s.chats || [])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            {title || 'Send to chat'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-primary)] opacity-70 hover:opacity-100 active:scale-95 transition-transform"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {chats.length === 0 && (
            <div className="p-4 text-center text-sm text-[var(--text-primary)] opacity-60">
              No chats yet
            </div>
          )}
          {chats.map((chat: any) => (
            <button
              key={chat.id}
              onClick={() => onPick(chat)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] active:scale-[0.99] transition-transform"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--button-primary-text)] font-bold shrink-0">
                {(chat.name || chat.title || '?').toString().slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-[var(--text-primary)] truncate">
                  {chat.name || chat.title || `Chat ${chat.id}`}
                </span>
                {chat.lastMessage && (
                  <span className="block text-xs opacity-60 truncate">{chat.lastMessage}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
