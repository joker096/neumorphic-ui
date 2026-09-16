import React, { useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Archive, ArchiveRestore, Phone, Video, Bell, BellOff, Trash2, MessageSquare, Megaphone, Check, MapPin, AlertTriangle, Paperclip } from "lucide-react";
import { FormattedText } from "./FormattedText";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useAppStore } from "../../store";
import { p2pNetwork } from "../../lib/p2p/network";

interface ChatListItemProps {
  chat: any;
  theme?: "light" | "dark";
  type?: "chat" | "channel";
  active?: boolean;
  onClick?: () => void;
  onArchive?: (id: string | number) => void;
  onMute?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
  onAvatarClick?: (chat: any) => void;
  archiveLabel?: string;
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  t: (key: string, options?: any) => string;
  pinned?: boolean;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onMenuRequest?: (chat: any, anchor: { x: number; y: number } | null) => void;
  draftText?: string;
}

const PRESS_DURATION = 500;

export const ChatListItem: React.FC<ChatListItemProps> = React.memo(({
  chat,
  theme = "dark",
  type = "chat",
  active = false,
  onClick,
  onArchive,
  onMute,
  onDelete,
  onAvatarClick,
  archiveLabel,
  onCall,
  onVideoCall,
  t,
  pinned: _pinned,
  selectMode = false,
  selected = false,
  onToggleSelect,
  onMenuRequest,
  draftText,
}: ChatListItemProps) => {
  const isDark = theme === "dark";
  const stealthMode = useAppStore((state) => state.stealthMode);
  const typingIndicators = useAppStore((state) => state.typingIndicators);
  const contactAvatars = useAppStore((state) => state.contactAvatars);
  const overrideAvatar = contactAvatars[chat.name];
  const [remoteTyping, setRemoteTyping] = React.useState(false);

  React.useEffect(() => {
    if (!typingIndicators || !chat.name) return;
    return p2pNetwork.onTypingIndicator((name, isTyping) => {
      if (name === chat.name) setRemoteTyping(isTyping);
    });
  }, [typingIndicators, chat.name]);

  const dragged = useRef(false);
  const dragDistance = useRef(0);
  const [swipedOpen, setSwipedOpen] = React.useState<"closed" | "left" | "right">("closed");
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPressing, setIsPressing] = React.useState(false);

  const clearPressTimer = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setIsPressing(false);
  }, []);

  const handlePointerDown = useCallback(() => {
    if (!selectMode && onMenuRequest) {
      setIsPressing(true);
      pressTimer.current = setTimeout(() => {
        setIsPressing(false);
        onMenuRequest?.(chat, null);
        navigator.vibrate?.(50);
      }, PRESS_DURATION);
    }
  }, [selectMode, onMenuRequest]);

  const handlePointerUp = useCallback(() => {
    clearPressTimer();
  }, [clearPressTimer]);

  const handlePointerLeave = useCallback(() => {
    clearPressTimer();
  }, [clearPressTimer]);

  React.useEffect(() => {
    return () => {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
      }
    };
  }, []);

  const isArchived = archiveLabel === t("chat.unarchive");
  const roundedClass = "rounded-full";

  const fuzzedTime = React.useMemo(() => {
    if (!stealthMode || !chat.time) return chat.time;
    const match = chat.time.match(/(\d{1,2}):(\d{2})/);
    if (!match) return chat.time;
    let h = parseInt(match[1]);
    let m = parseInt(match[2]);
    const offset = (chat.id % 11) - 5;
    m += offset;
    if (m < 0) { m += 60; h = (h - 1 + 24) % 24; }
    else if (m >= 60) { m -= 60; h = (h + 1) % 24; }
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }, [chat.time, chat.id, stealthMode]);

  const handleSwipeAction = (action: string) => {
    if (action === "message") {
      setSwipedOpen("closed");
      onClick?.();
      return;
    } else if (action === "call" && onCall) {
      onCall(chat.name, chat.color);
      setSwipedOpen("closed");
      return;
    } else if (action === "video" && onVideoCall) {
      onVideoCall(chat.name, chat.color);
      setSwipedOpen("closed");
      return;
    } else if (action === "mute" && onMute) {
      onMute(chat.id);
    } else if (action === "archive" && onArchive) {
      onArchive(chat.id);
    } else if (action === "delete") {
      setSwipedOpen("closed");
      setShowDeleteConfirm(true);
      return;
    }
    setSwipedOpen("closed");
  };

  const targetX = swipedOpen === "left" ? -186 : swipedOpen === "right" ? 200 : 0;

  return (
    <div
      className={`relative mb-1 last:mb-0 overflow-hidden chat-list-item group ${active ? "chat-list-item-active" : ""}`}
      role="listitem"
      onContextMenu={(e) => {
        e.preventDefault();
        onMenuRequest?.(chat, { x: e.clientX, y: e.clientY });
      }}
    >
      {(onClick || (onCall && onVideoCall)) && (
        <div
          className={`absolute inset-0 flex items-stretch justify-start gap-1 overflow-hidden rounded-2xl bg-[var(--bg-tertiary)] px-2 transition-opacity duration-200 ${
            swipedOpen === "right" ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={swipedOpen !== "right"}
        >
          {onClick && (
            <button
              onClick={() => handleSwipeAction("message")}
              className={`my-1.5 flex aspect-square w-[56px] min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 ${isDark ? "bg-[#2b2f42] hover:bg-[#363b52]" : "bg-slate-500 hover:bg-slate-600"}`}
              aria-label={t('chat.openChat')}
            >
             <MessageSquare size={20} fill="currentColor" stroke="currentColor" />
           </button>
          )}
          {onCall && (
            <button
              onClick={() => handleSwipeAction("call")}
              className={`my-1.5 flex aspect-square w-[56px] min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 ${isDark ? "bg-[#2b2f42] hover:bg-[#363b52]" : "bg-slate-500 hover:bg-slate-600"}`}
              aria-label={t('chat.startCall')}
            >
             <Phone size={20} fill="currentColor" stroke="currentColor" />
           </button>
          )}
          {onVideoCall && (
            <button
              onClick={() => handleSwipeAction("video")}
              className={`my-1.5 flex aspect-square w-[56px] min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 ${"bg-[var(--accent)] hover:brightness-110"}`}
              aria-label={t('chat.startVideoCall')}
            >
             <Video size={20} fill="currentColor" stroke="currentColor" />
           </button>
          )}
        </div>
      )}
    {(onMute || onArchive || onDelete) && (
      <div
        className={`absolute inset-0 flex items-stretch justify-end gap-1 overflow-hidden rounded-2xl bg-[var(--bg-tertiary)] px-2 transition-opacity duration-200 ${
          swipedOpen === "left" ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={swipedOpen !== "left"}
      >
        {onMute && (
          <button
            onClick={() => handleSwipeAction("mute")}
            className={`my-1.5 flex aspect-square w-[50px] min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 ${isDark ? "bg-amber-500 hover:bg-amber-400" : "bg-amber-500 hover:bg-amber-600"}`}
            aria-label={chat.isMuted ? t('chat.unmute') : t('chat.mute')}
          >
            {chat.isMuted ? <BellOff size={20} /> : <Bell size={20} />}
          </button>
        )}
        {onArchive && (
          <button
            onClick={() => handleSwipeAction("archive")}
            className={`my-1.5 flex aspect-square w-[50px] min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 ${isArchived ? (isDark ? "bg-[var(--chat-online-dot)] hover:bg-[var(--chat-online-dot-hover)]" : "bg-emerald-500 hover:bg-emerald-600") : "bg-[var(--accent)] hover:brightness-110"}`}
            aria-label={archiveLabel}
          >
            {isArchived
              ? <ArchiveRestore size={20} />
              : <Archive size={20} />
            }
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => handleSwipeAction("delete")}
            className={`my-1.5 flex aspect-square w-[50px] min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 ${isDark ? "bg-red-500 hover:bg-red-400" : "bg-red-500 hover:bg-red-600"}`}
            aria-label={t('chat.delete')}
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>
    )}
      <motion.div
        drag={selectMode ? false : "x"}
        dragConstraints={{ left: -200, right: 240 }}
        dragElastic={0.05}
        onDragStart={() => {
          dragged.current = false;
          dragDistance.current = 0;
        }}
        onDrag={(_, info) => {
          dragDistance.current = Math.abs(info.offset.x);
        }}
        onDragEnd={(_, info) => {
          const wasClosed = swipedOpen === "closed";
          let next: "closed" | "left" | "right" = swipedOpen;
          if (wasClosed) {
            if (info.offset.x < -70) next = "left";
            else if (info.offset.x > 70) next = "right";
          } else if (swipedOpen === "left" && info.offset.x > 30) next = "closed";
          else if (swipedOpen === "right" && info.offset.x < -30) next = "closed";
          if (next !== swipedOpen && next !== "closed") navigator.vibrate?.(20);
          setSwipedOpen(next);
          if (dragDistance.current > 10) dragged.current = true;
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={(e: any) => {
          if (swipedOpen !== "closed") {
            setSwipedOpen("closed");
            e.stopPropagation();
            return;
          }
          if (dragged.current) {
            dragged.current = false;
            return;
          }
          if (selectMode) {
            onToggleSelect?.();
            return;
          }
          onClick?.();
        }}
        animate={{ x: targetX }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`relative z-10 w-full px-2.5 md:px-3 py-[var(--chat-item-pad-y,0.625rem)] md:py-[var(--chat-item-pad-y-md,0.75rem)] flex items-center gap-3 cursor-pointer transition-all duration-200 select-none min-h-[var(--chat-item-min-h,68px)] chat-item ${active ? "active" : ""}`}
      >
        <div
          onClick={(e) => {
            if (selectMode) {
              onToggleSelect?.();
              e.stopPropagation();
              return;
            }
            if (onAvatarClick && type !== "channel") {
              e.stopPropagation();
              onAvatarClick(chat);
            }
          }}
          className={`relative shrink-0 ${roundedClass} avatar transition-transform duration-200 ${active ? "scale-95" : ""}`}
        >
          {selectMode ? (
            <div
              className={`w-full h-full ${roundedClass} flex items-center justify-center shadow-sm ${
                selected
                  ? "bg-[var(--accent)]"
                  : isDark
                    ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]"
                    : "bg-white border border-[var(--border-color)]"
              }`}
            >
              {selected ? (
                <Check size={16} strokeWidth={2.5} className="text-white" />
              ) : (
                <div className={`w-4 h-4 rounded-full border-2 ${isDark ? "border-gray-500" : "border-slate-300"}`} />
              )}
            </div>
          ) : overrideAvatar ? (
            <img
              src={overrideAvatar}
              alt=""
              role="presentation"
              className={`w-full h-full ${roundedClass} object-cover`}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div
              className={`w-full h-full ${roundedClass} bg-gradient-to-br ${chat.color} flex items-center justify-center text-[var(--text-primary)] font-bold text-sm shadow-sm`}
            >
              {chat.name.charAt(0)}
            </div>
          )}
          {chat.online && !selectMode && (
            <div
              role="img"
              aria-label={t("chat.filters.online")}
              className="avatar-status"
            />
          )}
          {type === "channel" && !selectMode && (
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-[15px] h-[15px] rounded-full border-2 z-10 flex items-center justify-center ${"bg-[var(--accent)] border-[var(--bg-secondary)]"}`}
            >
              <Megaphone size={12} className="text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center pr-2">
          <div className="flex justify-between items-center mb-[2px]">
            <span
              className={`chat-item-title truncate pr-2 flex items-center gap-1`}
            >
              {chat.pinned && (
                <MapPin size={12} className="shrink-0 opacity-60 rotate-45" />
              )}
              {chat.name}
            </span>
            <span
              className={`chat-item-time shrink-0`}
            >
              {fuzzedTime}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span
              className={`chat-item-subtitle truncate pr-4 flex items-center gap-1 ${active ? "text-[var(--accent)]" : ""} ${chat.unread ? "font-medium" : ""}`}
            >
                {(() => {
                  const lastMsg = (chat.history || []).at(-1);
                  const lastHasAttach = lastMsg && (lastMsg.type === "image" || lastMsg.type === "video" || lastMsg.type === "audio" || lastMsg.type === "file");
                  const lastMustFail = lastMsg && lastMsg.sender === "me" && lastMsg.status === "failed";
                  return (
                    <span className="flex items-center gap-1 min-w-0">
                      {lastHasAttach && <Paperclip size={12} className="shrink-0 opacity-70" />}
                      {lastMustFail && <AlertTriangle size={12} className="shrink-0 text-red-500" />}
                    </span>
                  );
                })()}
                {typingIndicators && (chat.isTyping || remoteTyping) && type === "chat" ? (
                <span className="font-bold tracking-wide italic text-[var(--accent)]">
                  {t("chat.typing")}
                </span>
              ) : draftText ? (
                <span className="italic text-[var(--text-secondary)]">
                  {t("chat.draft", "Draft")}: <FormattedText text={draftText} />
                </span>
              ) : (
                <FormattedText text={chat.message} />
              )}
            </span>
            {chat.unread > 0 && (
              <div
                className={`badge unread shrink-0`}
              >
                <span className="text-xs font-bold pb-[0.5px] leading-none">
                  {chat.unread}
                </span>
              </div>
            )}
            {(chat as any).hasMentions && (
              <div
                className={`shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center shadow-sm bg-[var(--chat-mention-bg)] text-[var(--chat-mention-text)]`}
              >
                <span className="text-xs font-bold pb-[0.5px] leading-none">@</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={t("chat.deleteChat")}
        message={t("chat.deleteConfirm")}
        variant="danger"
        theme={theme}
        confirmLabel={t("chat.delete")}
        cancelLabel={t("common.cancel")}
        confirmIcon={<Trash2 size={18} />}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete?.(chat.id);
          setShowDeleteConfirm(false);
        }}
      />
    </div>
  );
});




