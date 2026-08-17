import React, { useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Archive, ArchiveRestore, Phone, Video } from "lucide-react";
import { FormattedText } from "./FormattedText";
import { useAppStore } from "../../store";
import { CHAT_SEND_GRADIENT } from "../../constants/chatConstants";

interface ChatListItemProps {
  chat: any;
  theme?: "light" | "dark";
  type?: "chat" | "channel";
  active?: boolean;
  onClick?: () => void;
  onArchive?: (id: string | number) => void;
  onAvatarClick?: (chat: any) => void;
  archiveLabel?: string;
  onCall?: () => void;
  onVideoCall?: () => void;
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
  const dragged = useRef(false);
  const dragDistance = useRef(0);
  const [swipedOpen, setSwipedOpen] = React.useState<"closed" | "left" | "right">("closed");
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

  const isGroup = type === "channel";
  const isArchived = archiveLabel === t("chat.unarchive");
  const roundedClass = isGroup ? "rounded-[12px]" : "rounded-[12px]";

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
    if (action === "archive" && onArchive) onArchive(chat.id);
    if (action === "call" && onCall) onCall();
    if (action === "video" && onVideoCall) onVideoCall();
    setSwipedOpen("closed");
  };

  const targetX = swipedOpen === "left" ? -120 : swipedOpen === "right" ? 120 : 0;

  return (
    <div
      className={`relative mb-4 last:mb-0 overflow-hidden chat-list-item ${active ? "chat-list-item-active" : ""}`}
      role="listitem"
      onContextMenu={(e) => {
        e.preventDefault();
        onMenuRequest?.(chat, { x: e.clientX, y: e.clientY });
      }}
    >
      {!isGroup && onCall && onVideoCall && (
        <div className="absolute inset-0 flex items-center justify-start overflow-hidden pointer-events-none bg-[var(--bg-tertiary)]" aria-hidden={swipedOpen !== "right"}>
          <div className="flex h-full" style={swipedOpen === "right" ? { pointerEvents: "auto" } : undefined}>
              <button
                onClick={() => handleSwipeAction("call")}
                className={`h-full flex flex-col items-center justify-center gap-1 px-2 text-[10px] font-bold text-white cursor-pointer border-none w-[60px] min-h-[44px] shrink-0 transition-colors ${isDark ? "bg-[#2b2f42] hover:bg-[#363b52]" : "bg-slate-500 hover:bg-slate-600"}`}
                aria-label={t('chat.startCall')}
              >
               <Phone size={16} fill="currentColor" stroke="currentColor" />
               <span className="text-[8px] md:text-[10px] leading-tight text-center">{t('chat.startCall')}</span>
             </button>
            <button
                onClick={() => handleSwipeAction("video")}
                className={`h-full flex flex-col items-center justify-center gap-1 px-2 text-[10px] font-bold text-white cursor-pointer border-none w-[60px] min-h-[44px] shrink-0 transition-colors ${isDark ? "bg-blue-600 hover:bg-blue-500" : "bg-blue-500 hover:bg-blue-600"}`}
                aria-label={t('chat.startVideoCall')}
              >
               <Video size={16} fill="currentColor" stroke="currentColor" />
               <span className="text-[8px] md:text-[10px] leading-tight text-center">{t('chat.startVideoCall')}</span>
             </button>
          </div>
        </div>
      )}
    <div className="absolute inset-0 flex items-center justify-end px-3 md:px-4 text-[var(--text-primary)] overflow-hidden pointer-events-none bg-[var(--bg-tertiary)]" aria-hidden={swipedOpen !== "left"}>
         <button
           onClick={() => handleSwipeAction("archive")}
           className={`flex items-center gap-1.5 sm:gap-2 cursor-pointer min-h-[44px] px-3 py-1.5 rounded-xl border transition-all duration-200 active:scale-[0.98] ${
             isArchived
               ? isDark
                 ? "bg-[#38d69a]/10 border-[#38d69a]/20 hover:bg-[#38d69a]/20"
                 : "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15"
               : isDark
                 ? "bg-[var(--accent-soft)] border-[var(--accent)]/20 hover:bg-[var(--accent)]/20"
                 : "bg-[var(--accent-soft)] border-[var(--accent)]/15 hover:bg-[var(--accent)]/12"
           } ${swipedOpen === "left" ? "pointer-events-auto" : "pointer-events-none"}`}
           aria-label={archiveLabel}
         >
           {isArchived
             ? <ArchiveRestore size={14} className={isDark ? "text-[#38d69a]" : "text-emerald-600"} />
             : <Archive size={14} className={isDark ? "text-[var(--accent)]" : "text-orange-500"} />
           }
            <span className={`text-[10px] md:text-xs font-bold ${
              isArchived
                ? isDark ? "text-[#38d69a]" : "text-emerald-600"
                : isDark ? "text-[var(--accent)]" : "text-orange-500"
            }`}>{archiveLabel}</span>
         </button>
       </div>
      <motion.div
        drag={selectMode ? false : "x"}
        dragConstraints={{ left: -160, right: 160 }}
        dragElastic={0.05}
        onDragStart={() => {
          dragged.current = false;
          dragDistance.current = 0;
        }}
        onDrag={(_, info) => {
          dragDistance.current = Math.abs(info.offset.x);
        }}
        onDragEnd={(_, info) => {
          if (swipedOpen === "closed") {
            if (info.offset.x < -70) setSwipedOpen("left");
            else if (info.offset.x > 70) setSwipedOpen("right");
          } else if (swipedOpen === "left" && info.offset.x > 30) setSwipedOpen("closed");
          else if (swipedOpen === "right" && info.offset.x < -30) setSwipedOpen("closed");
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
          className={`relative z-10 w-full p-2.5 md:p-3 flex items-center gap-3 cursor-pointer transition-all duration-200 select-none group min-h-[52px] ${
           isDark
             ? active
               ? "bg-[var(--accent-soft)] border border-[var(--accent)]/20"
               : "hover:bg-white/[0.03] border border-transparent"
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
                  ? isDark
                    ? "bg-[#6f7fff]"
                    : "bg-[#6f7fff]"
                  : isDark
                    ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]"
                    : "bg-white border border-[var(--border-color)]"
              }`}
            >
              {selected ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <div className={`w-4 h-4 rounded-full border-2 ${isDark ? "border-gray-500" : "border-slate-300"}`} />
              )}
            </div>
          ) : (
            <div
              className={`w-full h-full ${roundedClass} bg-gradient-to-br ${chat.color} flex items-center justify-center text-[var(--text-primary)] font-bold text-sm shadow-sm`}
            >
              {chat.name.charAt(0)}
            </div>
          )}
          {chat.online && !selectMode && (
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full border-2 z-10 ${isDark ? "bg-[#38d69a] border-[var(--bg-secondary)]" : "bg-emerald-500 border-[var(--bg-secondary)]"}`}
            />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center pr-2">
          <div className="flex justify-between items-center mb-[2px]">
            <span
              className={`font-bold text-[13px] md:text-sm truncate pr-2 flex items-center gap-1 ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}
            >
              {chat.pinned && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 opacity-60 rotate-45">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                </svg>
              )}
              {chat.name}
            </span>
            <span
              className={`text-[10px] md:text-[11px] font-medium tracking-wide shrink-0 ${isDark ? "text-[var(--text-tertiary)]" : "text-slate-400"}`}
            >
              {fuzzedTime}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span
              className={`text-[11px] md:text-xs truncate pr-4 ${isDark ? (active ? "text-[var(--accent)]" : "text-[var(--text-secondary)]") : active ? "text-orange-600" : "text-slate-500"} ${chat.unread ? "font-medium" : ""}`}
            >
               {typingIndicators && chat.isTyping && type === "chat" ? (
                <span className={`font-bold tracking-wide italic ${isDark ? "text-[var(--accent)]" : "text-orange-600"}`}>
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
                <span className="text-[9px] font-bold pb-[0.5px] leading-none">
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
                <span className="text-[10px] font-bold pb-[0.5px] leading-none">@</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
});




