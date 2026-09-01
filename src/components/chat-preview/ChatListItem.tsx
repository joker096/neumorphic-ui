import React, { useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Archive, ArchiveRestore, Phone, Video, Bell, BellOff, Trash2, MessageSquare, X, Megaphone, Check, MapPin } from "lucide-react";
import { FormattedText } from "./FormattedText";
import { useAppStore } from "../../store";
import { p2pNetwork } from "../../lib/p2p/network";
import { CHAT_SEND_GRADIENT } from "../../constants/chatConstants";

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
  t: (key: string) => string;
  pinned?: boolean;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onMenuRequest?: (chat: any, anchor: { x: number; y: number } | null) => void;
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
}) => {
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
      className={`relative mb-4 last:mb-0 overflow-hidden chat-list-item group ${active ? "chat-list-item-active" : ""}`}
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
              className={`my-1.5 flex aspect-square w-[56px] min-h-[44px] shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 ${isDark ? "bg-[#2b2f42] hover:bg-[#363b52]" : "bg-slate-500 hover:bg-slate-600"}`}
              aria-label={t('chat.openChat')}
            >
             <MessageSquare size={20} fill="currentColor" stroke="currentColor" />
           </button>
          )}
          {onCall && (
            <button
              onClick={() => handleSwipeAction("call")}
              className={`my-1.5 flex aspect-square w-[56px] min-h-[44px] shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 ${isDark ? "bg-[#2b2f42] hover:bg-[#363b52]" : "bg-slate-500 hover:bg-slate-600"}`}
              aria-label={t('chat.startCall')}
            >
             <Phone size={20} fill="currentColor" stroke="currentColor" />
           </button>
          )}
          {onVideoCall && (
            <button
              onClick={() => handleSwipeAction("video")}
              className={`my-1.5 flex aspect-square w-[56px] min-h-[44px] shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 ${isDark ? "bg-[var(--accent)] hover:brightness-110" : "bg-[var(--accent)] hover:brightness-110"}`}
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
            className={`my-1.5 flex aspect-square w-[50px] min-h-[44px] shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 ${isDark ? "bg-amber-500 hover:bg-amber-400" : "bg-amber-500 hover:bg-amber-600"}`}
            aria-label={chat.isMuted ? t('chat.unmute') : t('chat.mute')}
          >
            {chat.isMuted ? <BellOff size={20} /> : <Bell size={20} />}
          </button>
        )}
        {onArchive && (
          <button
            onClick={() => handleSwipeAction("archive")}
            className={`my-1.5 flex aspect-square w-[50px] min-h-[44px] shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 ${isArchived ? (isDark ? "bg-[#38d69a] hover:bg-[#2fb985]" : "bg-emerald-500 hover:bg-emerald-600") : isDark ? "bg-[var(--accent)] hover:brightness-110" : "bg-[var(--accent)] hover:brightness-110"}`}
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
            className={`my-1.5 flex aspect-square w-[50px] min-h-[44px] shrink-0 cursor-pointer items-center justify-center rounded-xl border-none text-white transition-all active:scale-95 ${isDark ? "bg-red-500 hover:bg-red-400" : "bg-red-500 hover:bg-red-600"}`}
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
          className={`relative z-10 w-full p-2.5 md:p-3 flex items-center gap-3 cursor-pointer transition-all duration-200 select-none min-h-[52px] ${
           isDark
             ? active
              ? "bg-[var(--accent-soft)] border border-[var(--accent)]/20"
                : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-transparent"
             : active
               ? "bg-[var(--bg-secondary)] shadow-[inset_4px_4px_10px_rgba(165,175,190,0.4),_inset_-2px_-2px_6px_rgba(255,255,255,1)] border border-[var(--border-color)]"
               : "bg-[var(--bg-secondary)] shadow-[-6px_-6px_12px_rgba(255,255,255,0.8),_8px_8px_16px_rgba(165,175,190,0.4),_inset_1.5px_1.5px_3px_rgba(255,255,255,1)] border border-[var(--border-color)] hover:bg-black/5"
         }`}
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
          className={`relative shrink-0 w-[39px] h-[39px] ${roundedClass} p-[2px] transition-transform duration-200 ${active ? "scale-95" : ""}`}
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
              className={`absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full border-2 z-10 ${isDark ? "bg-[#38d69a] border-[var(--bg-secondary)]" : "bg-emerald-500 border-[var(--bg-secondary)]"}`}
            />
          )}
          {type === "channel" && !selectMode && (
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-[15px] h-[15px] rounded-full border-2 z-10 flex items-center justify-center ${isDark ? "bg-[var(--accent)] border-[var(--bg-secondary)]" : "bg-[var(--accent)] border-[var(--bg-secondary)]"}`}
            >
              <Megaphone size={12} className="text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center pr-2">
          <div className="flex justify-between items-center mb-[2px]">
            <span
              className={`font-bold text-[13px] md:text-sm truncate pr-2 flex items-center gap-1 ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}
            >
              {chat.pinned && (
                <MapPin size={12} className="shrink-0 opacity-60 rotate-45" />
              )}
              {chat.name}
            </span>
            <span
              className={`text-xs md:text-xs font-medium tracking-wide shrink-0 ${isDark ? "text-[var(--text-tertiary)]" : "text-slate-400"}`}
            >
              {fuzzedTime}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span
              className={`text-xs md:text-xs truncate pr-4 ${isDark ? (active ? "text-[var(--accent)]" : "text-[var(--text-secondary)]") : active ? "text-[var(--accent)]" : "text-slate-500"} ${chat.unread ? "font-medium" : ""}`}
            >
                {typingIndicators && (chat.isTyping || remoteTyping) && type === "chat" ? (
                <span className="font-bold tracking-wide italic text-[var(--accent)]">
                  {t("chat.typing")}
                </span>
              ) : (
                <FormattedText text={chat.message} />
              )}
            </span>
            {chat.unread > 0 && (
              <div
                className={`shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center shadow-sm ${CHAT_SEND_GRADIENT} text-[var(--text-primary)]`}
              >
                <span className="text-xs font-bold pb-[0.5px] leading-none">
                  {chat.unread}
                </span>
              </div>
            )}
            {(chat as any).hasMentions && (
              <div
                className={`shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center shadow-sm ${
                  isDark
                    ? "bg-[#51d7ff]/90 text-[var(--bg-primary)]"
                    : "bg-[#51d7ff] text-[var(--bg-primary)]"
                }`}
              >
                <span className="text-xs font-bold pb-[0.5px] leading-none">@</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={t('chat.deleteChat')}
            className="relative w-full max-w-[420px] rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-red-500/15 text-red-500">
                <Trash2 size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('chat.deleteChat')}</h3>
                <p className="text-xs mt-1 leading-relaxed text-[var(--text-secondary)]">{t('chat.deleteConfirm')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                aria-label={t('common.cancel')}
                title={t('common.cancel')}
                className="flex-1 min-w-11 h-[44px] rounded-xl font-bold transition-colors bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] flex items-center justify-center"
              >
                <X size={16} />
                <span className="sr-only">{t('common.cancel')}</span>
              </button>
              <button
                type="button"
                onClick={() => { onDelete?.(chat.id); setShowDeleteConfirm(false); }}
                aria-label={t('chat.delete')}
                title={t('chat.delete')}
                className="flex-1 min-w-11 h-[44px] rounded-xl font-bold transition-colors bg-red-500 text-white hover:bg-red-600 flex items-center justify-center"
              >
                <Trash2 size={16} />
                <span className="sr-only">{t('chat.delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});




