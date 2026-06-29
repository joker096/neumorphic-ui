import React, { useRef } from "react";
import { motion } from "motion/react";
import { Archive, Phone, Video } from "lucide-react";
import { FormattedText } from "../FormattedText";
import { useAppStore } from "../../store";

interface ChatListItemProps {
  chat: any;
  theme: "light" | "dark";
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
  onLongPress?: () => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  theme,
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
  onLongPress,
}) => {
  const isDark = theme === "dark";
  const { stealthMode, typingIndicators } = useAppStore();
  const dragged = useRef(false);
  const dragDistance = useRef(0);
  const [swipedOpen, setSwipedOpen] = React.useState<"closed" | "left" | "right">("closed");
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = () => {
    if (!selectMode) {
      pressTimer.current = setTimeout(() => {
        onLongPress?.();
      }, 500);
    }
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const isGroup = type === "channel";
  const roundedClass = isGroup ? "rounded-xl" : "rounded-full";

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
    <div className="relative mb-4 last:mb-0 overflow-hidden" role="listitem">
      {!isGroup && onCall && onVideoCall && (
        <div className={`absolute inset-0 flex items-center justify-start overflow-hidden ${swipedOpen === "right" ? "z-10" : ""}`} aria-hidden={swipedOpen !== "right"}>
          <div className={`flex h-full ${swipedOpen === "right" ? "pointer-events-auto" : "pointer-events-none"}`}>
            <button
              onClick={() => handleSwipeAction("call")}
              className={`h-full flex flex-col items-center justify-center gap-1 px-3 sm:px-4 text-[10px] sm:text-[11px] font-bold text-white cursor-pointer border-none ${isDark ? "bg-[#2b2f42]" : "bg-slate-600"}`}
              style={{ width: "64px" }}
              aria-label={t('chat.startCall')}
            >
              <Phone size={16} fill="white" stroke="white" />
              <span className="text-[8px] sm:text-[10px]">{t('chat.startCall')}</span>
            </button>
           <button
              onClick={() => handleSwipeAction("video")}
              className={`h-full flex flex-col items-center justify-center gap-1 px-3 sm:px-4 text-[10px] sm:text-[11px] font-bold text-white cursor-pointer border-none bg-blue-500`}
              style={{ width: "64px" }}
              aria-label={t('chat.startVideoCall')}
            >
              <Video size={16} fill="white" stroke="white" />
              <span className="text-[8px] sm:text-[10px]">Video</span>
            </button>
          </div>
        </div>
      )}
    <div className={`absolute inset-0 flex items-center justify-end px-4 sm:px-6 text-white overflow-hidden ${swipedOpen === "left" ? "z-10" : ""}`} aria-hidden={swipedOpen !== "left"}>
         <button
           onClick={() => handleSwipeAction("archive")}
           className={`flex items-center gap-1.5 sm:gap-2 cursor-pointer ${swipedOpen === "left" ? "pointer-events-auto" : "pointer-events-none"}`}
           aria-label={t('chat.unarchive')}
         >
           <Archive size={16} className={`${isDark ? "text-orange-500" : "text-white"}`} />
           <span className={`text-[10px] sm:text-sm font-bold ${isDark ? "text-orange-500" : "text-white"}`}>{archiveLabel}</span>
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
        className={`relative w-full p-3 flex items-center gap-4 cursor-pointer transition-all duration-300 select-none group ${
          isDark
            ? active
              ? "bg-[#101216] shadow-[inset_0_12px_24px_rgba(0,0,0,0.9),_inset_0_3px_6px_rgba(0,0,0,0.9)] border border-orange-500/20"
              : "bg-[#13151b] shadow-[0_8px_16px_rgba(0,0,0,0.3),_inset_0_1.5px_2px_rgba(255,255,255,0.05),_inset_0_-2px_4px_rgba(0,0,0,0.6)] border border-white/[0.02] hover:scale-[1.02]"
            : active
              ? "bg-[#e2e8f0] shadow-[inset_4px_4px_10px_rgba(165,175,190,0.4),_inset_-2px_-2px_6px_rgba(255,255,255,1)] border border-black/5"
              : "bg-[#eaeff4] shadow-[-6px_-6px_12px_rgba(255,255,255,0.8),_8px_8px_16px_rgba(165,175,190,0.4),_inset_1.5px_1.5px_3px_rgba(255,255,255,1)] border border-white/80 hover:scale-[1.02]"
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
          className={`relative shrink-0 w-[52px] h-[52px] ${roundedClass} p-[2px] transition-transform duration-300 ${active ? "scale-95" : ""}`}
        >
          {selectMode ? (
            <div
              className={`w-full h-full ${roundedClass} flex items-center justify-center shadow-sm ${
                selected
                  ? isDark
                    ? "bg-orange-500"
                    : "bg-orange-500"
                  : isDark
                    ? "bg-[#1a1d24] border border-white/10"
                    : "bg-white border border-black/10"
              }`}
            >
              {selected ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <div className={`w-5 h-5 rounded-full border-2 ${isDark ? "border-gray-500" : "border-slate-300"}`} />
              )}
            </div>
          ) : (
            <div
              className={`w-full h-full ${roundedClass} bg-gradient-to-br ${chat.color} flex items-center justify-center text-white font-bold text-xl shadow-sm`}
            >
              {chat.name.charAt(0)}
            </div>
          )}
          {chat.online && !selectMode && (
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full border-[2.5px] z-10 ${isDark ? "bg-green-400 border-[#13151b]" : "bg-emerald-500 border-[#eaeff4]"}`}
            />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center pr-2">
          <div className="flex justify-between items-center mb-[2px]">
            <span
              className={`font-bold text-[14.5px] truncate pr-2 flex items-center gap-1 ${isDark ? "text-[#e8ecf2]" : "text-slate-800"}`}
            >
              {chat.pinned && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 opacity-60 rotate-45">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                </svg>
              )}
              {chat.name}
            </span>
            <span
              className={`text-[10.5px] font-semibold tracking-wide shrink-0 ${isDark ? "text-gray-500" : "text-slate-400"}`}
            >
              {fuzzedTime}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span
              className={`text-[12.5px] truncate pr-4 ${isDark ? (active ? "text-orange-300" : "text-[#7a8190]") : active ? "text-orange-600" : "text-slate-500"} ${chat.unread ? "font-medium" : ""}`}
            >
              {typingIndicators && chat.id === 1 && type === "chat" ? (
                <span className={`font-bold tracking-wide italic ${isDark ? "text-orange-500" : "text-orange-600"}`}>
                  {t("chat.typing")}
                </span>
              ) : (
                <FormattedText text={chat.message} />
              )}
            </span>
            {chat.unread > 0 && (
              <div
                className={`shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm ${
                  isDark
                    ? "bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                    : "bg-gradient-to-tr from-orange-400 to-orange-300 text-orange-950 shadow-[0_2px_4px_rgba(249,115,22,0.5)]"
                }`}
              >
                <span className="text-[10px] font-bold pb-[0.5px] leading-none">
                  {chat.unread}
                </span>
              </div>
            )}
            {(chat as any).hasMentions && (
              <div
                className={`shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm ${
                  isDark
                    ? "bg-blue-500/90 text-white shadow-[0_0_8px_rgba(59,130,250,0.5)]"
                    : "bg-blue-500 text-white shadow-[0_2px_4px_rgba(29,78,183,0.5)]"
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
};