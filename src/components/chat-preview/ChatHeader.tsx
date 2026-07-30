import React from "react";
import { ChevronRight, Search } from "lucide-react";

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
  onSearchToggle?: () => void;
  t: (key: string, options?: any) => string;
  typing?: boolean;
}

export const ChatHeader = ({ chat, isDark = false, onClose, onProfileClick, onSearchToggle, t, typing }: ChatHeaderProps) => {
  return (
     <div
       className={`px-2 sm:px-3 py-2 flex items-center gap-2 sm:gap-3 relative z-10 ${
        isDark
          ? "bg-[var(--bg-tertiary)]/90 border-b border-[var(--border-color)] backdrop-blur-md"
          : "bg-[var(--bg-primary)]/90 border-b border-[var(--border-color)] backdrop-blur-md"
      }`}
    >
     <div
          onClick={onClose}
          className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 shrink-0 ${
            isDark
              ? "bg-[var(--bg-secondary)] hover:bg-[#20242e] text-gray-400"
              : "bg-[var(--bg-primary)] hover:bg-white text-slate-500 shadow-sm"
          }`}
        >
         <ChevronRight size={14} className="sm:size-16 rotate-180" strokeWidth={2} />
     </div>

    <div
          onClick={onProfileClick}
          className={`w-10 h-10 rounded-full bg-gradient-to-br shrink-0 ${chat.color} flex items-center justify-center text-[var(--text-primary)] font-bold text-sm shadow-sm relative cursor-pointer`}
        >
         {chat.name.charAt(0)}
         {chat.online && (
           <div className={`absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full border-[2px] ${isDark ? "bg-green-400 border-[var(--bg-tertiary)]" : "bg-emerald-500 border-[var(--bg-primary)]"}`} />
         )}
       </div>

       <div className="flex-1 flex items-center gap-1.5 sm:gap-2 min-w-0">
         <div className="flex flex-col min-w-0">
           <div className="flex items-center gap-1.5 sm:gap-2">
             <span className={`font-bold text-[12px] sm:text-[13px] tracking-tight truncate ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>
               {chat.name}
             </span>
             <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${chat.online ? "bg-emerald-400" : "bg-gray-500"}`} />
             <span className={`text-[8px] sm:text-[9px] font-semibold tracking-wider uppercase shrink-0 ${isDark ? "text-orange-400/90" : "text-orange-500/90"}`}>
               {chat.online ? t('chat.filters.online') : t('chat.filters.offline')}
             </span>
           </div>
           {typing && (
             <div className="flex items-center gap-1 mt-0.5">
               <span className={`text-[11px] italic animate-pulse ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                 {t('chat.typing')}
               </span>
               <span className="flex gap-0.5">
                 <span className={`w-1 h-1 rounded-full animate-bounce ${isDark ? "bg-emerald-400" : "bg-emerald-600"}`} style={{ animationDelay: "0ms" }} />
                 <span className={`w-1 h-1 rounded-full animate-bounce ${isDark ? "bg-emerald-400" : "bg-emerald-600"}`} style={{ animationDelay: "150ms" }} />
                 <span className={`w-1 h-1 rounded-full animate-bounce ${isDark ? "bg-emerald-400" : "bg-emerald-600"}`} style={{ animationDelay: "300ms" }} />
               </span>
             </div>
           )}
         </div>
       </div>

      {onSearchToggle && (
        <div
          onClick={onSearchToggle}
          className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 shrink-0 ${
            isDark
              ? "bg-[var(--bg-secondary)] hover:bg-[#20242e] text-gray-400"
              : "bg-[var(--bg-primary)] hover:bg-white text-slate-500 shadow-sm"
          }`}
        >
          <Search size={16} strokeWidth={2} />
        </div>
      )}
    </div>
  );
};




