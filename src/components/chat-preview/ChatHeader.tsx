import React from "react";
import { ChevronRight } from "lucide-react";
import { useAppStore } from "../../store";

interface ChatHeaderProps {
  chat: {
    name: string;
    color: string;
    online: boolean;
    isFavorite?: boolean;
    id: string | number;
  };
  isDark?: boolean;
  onClose: () => void;
  onProfileClick: () => void;
  t: (key: string, options?: any) => string;
}

export const ChatHeader = ({ chat, isDark = false, onClose, onProfileClick, t }: ChatHeaderProps) => {
  return (
     <div
       className={`px-2 sm:px-3 py-2 flex items-center gap-2 sm:gap-3 relative z-10 ${
        isDark
          ? "bg-[#1a1d24]/90 border-b border-white/5 backdrop-blur-md"
          : "bg-[#f4f7f9]/90 border-b border-black/5 backdrop-blur-md"
      }`}
    >
     <div
         onClick={onClose}
         className={`cursor-pointer w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
           isDark
             ? "bg-[#13151b] hover:bg-[#20242e] text-gray-400"
             : "bg-[#f4f7f9] hover:bg-white text-slate-500 shadow-sm"
         }`}
       >
         <ChevronRight size={14} className="sm:size-16 rotate-180" strokeWidth={2} />
      </div>

    <div
         onClick={onProfileClick}
         className={`w-8 h-8 rounded-full bg-gradient-to-br shrink-0 ${chat.color} flex items-center justify-center text-white font-bold text-sm shadow-sm relative cursor-pointer`}
       >
         {chat.name.charAt(0)}
         {chat.online && (
           <div className={`absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full border-[2px] ${isDark ? "bg-green-400 border-[#1a1d24]" : "bg-emerald-500 border-[#f4f7f9]"}`} />
         )}
       </div>

       <div className="flex-1 flex items-center gap-1.5 sm:gap-2 min-w-0">
         <span className={`font-bold text-[12px] sm:text-[13px] tracking-tight truncate ${isDark ? "text-white" : "text-slate-800"}`}>
           {chat.name}
         </span>
         <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${chat.online ? "bg-emerald-400" : "bg-gray-500"}`} />
         <span className={`text-[8px] sm:text-[9px] font-semibold tracking-wider uppercase shrink-0 ${isDark ? "text-orange-400/90" : "text-orange-500/90"}`}>
           {chat.online ? t('chat.filters.online') : t('chat.filters.offline')}
         </span>
       </div>
    </div>
  );
};
