import React, { useRef } from "react";
import { motion } from "motion/react";
import { Star, StarOff } from "lucide-react";
import { Phone, Video } from "lucide-react";
import type { Contact } from "../../types/contact";

interface ContactItemProps {
  contact: Contact;
  theme: "light" | "dark";
  isDark: boolean;
  onCall?: (name: string, color: string) => void;
  onVideoCall?: (name: string, color: string) => void;
  onToggleFavorite: (id: string, currentStatus: boolean) => void;
  onClick: () => void;
  t: (key: string, options?: any) => string;
}

export const ContactItem: React.FC<ContactItemProps> = ({
  contact,
  theme,
  isDark,
  onCall,
  onVideoCall,
  onToggleFavorite,
  onClick,
  t,
}) => {
  const dragged = useRef(false);
  const dragDistance = useRef(0);
  const [swipedOpen, setSwipedOpen] = React.useState<"closed" | "left" | "right">("closed");
  const targetX = swipedOpen === "left" ? -120 : swipedOpen === "right" ? 120 : 0;

  const handleSwipeAction = (action: "call" | "video") => {
    if (action === "call" && onCall) onCall(contact.name, contact.color);
    if (action === "video" && onVideoCall) onVideoCall(contact.name, contact.color);
    setSwipedOpen("closed");
  };

  return (
    <div className="relative mb-4 last:mb-0 overflow-hidden rounded-3xl">
      {onCall && onVideoCall && (
        <>
          {/* Left swipe (call) - only visible when swiped left */}
          <div
            className="absolute left-0 top-0 flex items-center h-[64px] z-10"
            style={{
              opacity: swipedOpen === "left" ? 1 : 0,
              pointerEvents: "none",
              transition: "opacity 0.2s ease",
            }}
          >
            <button
              onClick={() => handleSwipeAction("call")}
              className={`h-full flex flex-col items-center justify-center gap-1 px-3 text-[11px] font-bold text-white cursor-pointer border-none ${isDark ? "bg-[#2b2f42]" : "bg-slate-600"}`}
              style={{ width: "76px" }}
            >
              <Phone size={18} fill="white" stroke="white" />
              <span className="text-[9px] md:text-[11px]">{t('contacts.call')}</span>
            </button>
          </div>

          {/* Right swipe (video) - only visible when swiped right */}
          <div
            className="absolute right-0 top-0 flex items-center justify-end h-[64px] z-10"
            style={{
              opacity: swipedOpen === "right" ? 1 : 0,
              pointerEvents: "none",
              transition: "opacity 0.2s ease",
            }}
          >
            <button
              onClick={() => handleSwipeAction("video")}
              className="h-full flex flex-col items-center justify-center gap-1 px-3 text-[11px] font-bold text-white cursor-pointer border-none bg-blue-500"
              style={{ width: "76px" }}
            >
              <Video size={18} fill="white" stroke="white" />
              <span className="text-[9px] md:text-[11px]">{t('contacts.videoCall')}</span>
            </button>
          </div>
        </>
      )}
      <motion.div
        layout
        drag="x"
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
            if (info.offset.x < -70) {
              setSwipedOpen("left");
            } else if (info.offset.x > 70) {
              setSwipedOpen("right");
            }
          } else if (swipedOpen === "left" && info.offset.x > 30) {
            setSwipedOpen("closed");
          } else if (swipedOpen === "right" && info.offset.x < -30) {
            setSwipedOpen("closed");
          }
          if (dragDistance.current > 10) {
            dragged.current = true;
          }
        }}
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
          onClick();
        }}
        animate={{ x: targetX }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`flex items-center gap-3 md:gap-4 p-3 cursor-pointer transition-all rounded-2xl active:scale-95 min-h-[56px] ${isDark ? "hover:bg-[#1a1d24]" : "hover:bg-white shadow-sm"}`}
      >
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${contact.color} text-white font-bold text-lg shadow-md shrink-0`}>
          {contact.name.charAt(0)}
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-bold truncate text-sm ${isDark ? "text-gray-100" : "text-slate-800"}`}>{contact.name}</span>
            {contact.isFavorite && <Star size={12} className="text-yellow-400 shrink-0" />}
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-[9px] md:text-[10px] tracking-wider truncate ${isDark ? "text-gray-500" : "text-slate-400"}`}>{contact.id}</span>
            <span className={`text-[9px] md:text-[10px] font-bold shrink-0 ${isDark ? "text-gray-600" : "text-slate-400"}`}>
              &bull; {(() => {
                const delta = Date.now() - contact.lastSeen;
                if (delta < 0 || isNaN(delta) || !contact.lastSeen) return "—";
                const MAX_DAYS = 365;
                if (delta < 3600000)
                  return t("chat.minutesAgo", { count: Math.floor(delta / 60000) || 1 });
                if (delta < 86400000)
                  return t("chat.hoursAgo", { count: Math.floor(delta / 3600000) });
                const days = Math.floor(delta / 86400000);
                if (days > MAX_DAYS)
                  return t("chat.yearsAgo", { count: Math.floor(days / 365) });
                return t("chat.daysAgo", { count: days });
              })()}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(contact.id, contact.isFavorite);
          }}
          className={`shrink-0 transition-transform active:scale-90 min-w-[36px] min-h-[36px] flex items-center justify-center ${contact.isFavorite ? (isDark ? "text-yellow-400" : "text-yellow-500") : (isDark ? "text-gray-600" : "text-slate-300")}`}
        >
          {contact.isFavorite ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
        </button>
      </motion.div>
    </div>
  );
};