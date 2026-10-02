import { Archive, ArchiveRestore, Bell, BellOff, MessageSquare, Phone, Trash2, Video } from "lucide-react";

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
          className="my-1.5 flex aspect-square w-[56px] min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 bg-[var(--accent)] hover:brightness-110"
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
  isDark: boolean;
  t: Translate;
  isMuted: boolean;
  isArchived: boolean;
  archiveLabel?: string;
  canMute: boolean;
  canArchive: boolean;
  canDelete: boolean;
  onAction: (action: "mute" | "archive" | "delete") => void;
}

/** Revealed by a left-swipe: mute, archive, delete. */
export function ChatListItemSwipeManageActions({ isOpen, isDark, t, isMuted, isArchived, archiveLabel, canMute, canArchive, canDelete, onAction }: SwipeManageActionsProps) {
  if (!canMute && !canArchive && !canDelete) return null;
  return (
    <div
      className={`absolute inset-0 flex items-stretch justify-end gap-1 overflow-hidden rounded-2xl bg-[var(--bg-tertiary)] px-2 transition-opacity duration-200 ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      inert={!isOpen}
    >
      {canMute && (
        <button
          onClick={() => onAction("mute")}
          className={`my-1.5 flex aspect-square w-[50px] min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 ${isDark ? "bg-amber-500 hover:bg-amber-400" : "bg-amber-500 hover:bg-amber-600"}`}
          aria-label={isMuted ? t('chat.unmute') : t('chat.mute')}
        >
          {isMuted ? <BellOff size={20} /> : <Bell size={20} />}
        </button>
      )}
      {canArchive && (
        <button
          onClick={() => onAction("archive")}
          className={`my-1.5 flex aspect-square w-[50px] min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 ${isArchived ? (isDark ? "bg-[var(--chat-online-dot)] hover:bg-[var(--chat-online-dot-hover)]" : "bg-emerald-500 hover:bg-emerald-600") : "bg-[var(--accent)] hover:brightness-110"}`}
          aria-label={archiveLabel}
        >
          {isArchived ? <ArchiveRestore size={20} /> : <Archive size={20} />}
        </button>
      )}
      {canDelete && (
        <button
          onClick={() => onAction("delete")}
          className={`my-1.5 flex aspect-square w-[50px] min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 ${isDark ? "bg-red-500 hover:bg-red-400" : "bg-red-500 hover:bg-red-600"}`}
          aria-label={t('chat.delete')}
        >
          <Trash2 size={20} />
        </button>
      )}
    </div>
  );
}
