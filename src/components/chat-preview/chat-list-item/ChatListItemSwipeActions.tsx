import { Bell, BellOff, Mail, MailOpen, MessageSquare, Phone, Pin, PinOff, Trash2, Video } from "lucide-react";

type Translate = (key: string, options?: any) => string;

interface SwipeOpenActionsProps {
  isOpen: boolean;
  t: Translate;
  canOpen: boolean;
  canCall: boolean;
  canVideoCall: boolean;
  onAction: (action: "message" | "call" | "video") => void;
}

/** Revealed by a right-swipe: open chat, call, video call. */
export function ChatListItemSwipeOpenActions({ isOpen, t, canOpen, canCall, canVideoCall, onAction }: SwipeOpenActionsProps) {
  if (!canOpen && !(canCall && canVideoCall)) return null;
  return (
    <div
      className={`absolute inset-0 flex items-stretch justify-start gap-1 overflow-hidden rounded-2xl bg-[var(--bg-tertiary)] px-2 transition-opacity duration-200 ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      inert={!isOpen}
    >
      {canOpen && (
        <button
          onClick={() => onAction("message")}
          className="my-1.5 flex aspect-square w-[56px] min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 bg-[var(--chat-swipe-bg)] hover:bg-[var(--chat-swipe-bg-hover)]"
          aria-label={t('chat.openChat')}
        >
          <MessageSquare size={20} fill="currentColor" stroke="currentColor" />
        </button>
      )}
      {canCall && (
        <button
          onClick={() => onAction("call")}
          className="my-1.5 flex aspect-square w-[56px] min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 bg-[var(--chat-swipe-bg)] hover:bg-[var(--chat-swipe-bg-hover)]"
          aria-label={t('chat.startCall')}
        >
          <Phone size={20} fill="currentColor" stroke="currentColor" />
        </button>
      )}
      {canVideoCall && (
        <button
          onClick={() => onAction("video")}
          className="my-1.5 flex aspect-square w-[56px] min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-[var(--ink-on-saturate)] transition-all active:scale-95 bg-[var(--accent)] hover:brightness-110"
          aria-label={t('chat.startVideoCall')}
        >
          <Video size={20} fill="currentColor" stroke="currentColor" />
        </button>
      )}
    </div>
  );
}

interface SwipeManageActionsProps {
  isOpen: boolean;
  t: Translate;
  isMuted: boolean;
  isPinned: boolean;
  isUnread: boolean;
  canMute: boolean;
  canPin: boolean;
  canToggleRead: boolean;
  canDelete: boolean;
  onAction: (action: "mute" | "pin" | "read" | "delete") => void;
}

/** One drawer square — same box as the open-actions drawer (56px), token colours only. */
const manageBtn =
  "my-1.5 flex aspect-square w-[56px] min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-[var(--ink-on-saturate)] transition-all active:scale-95";

/** Revealed by a left-swipe: read/unread, pin, mute, delete (Telegram order). */
export function ChatListItemSwipeManageActions({ isOpen, t, isMuted, isPinned, isUnread, canMute, canPin, canToggleRead, canDelete, onAction }: SwipeManageActionsProps) {
  if (!canMute && !canPin && !canToggleRead && !canDelete) return null;
  return (
    <div
      className={`absolute inset-0 flex items-stretch justify-end gap-1 overflow-hidden rounded-2xl bg-[var(--bg-tertiary)] px-2 transition-opacity duration-200 ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      inert={!isOpen}
    >
      {canToggleRead && (
        <button
          onClick={() => onAction("read")}
          className={`${manageBtn} bg-[var(--chat-online-dot)] hover:brightness-110`}
          aria-label={isUnread ? t('chat.markRead') : t('chat.markUnread')}
        >
          {isUnread ? <MailOpen size={20} /> : <Mail size={20} />}
        </button>
      )}
      {canPin && (
        <button
          onClick={() => onAction("pin")}
          className={`${manageBtn} bg-[var(--accent)] hover:brightness-110`}
          aria-label={isPinned ? t('chat.unpin') : t('chat.pin')}
        >
          {isPinned ? <PinOff size={20} /> : <Pin size={20} />}
        </button>
      )}
      {canMute && (
        <button
          onClick={() => onAction("mute")}
          className={`${manageBtn} bg-[var(--amber)] hover:brightness-110`}
          aria-label={isMuted ? t('chat.unmute') : t('chat.mute')}
        >
          {isMuted ? <BellOff size={20} /> : <Bell size={20} />}
        </button>
      )}
      {canDelete && (
        <button
          onClick={() => onAction("delete")}
          className={`${manageBtn} bg-[var(--danger)] hover:brightness-110`}
          aria-label={t('chat.delete')}
        >
          <Trash2 size={20} />
        </button>
      )}
    </div>
  );
}
