import React, { useState } from "react";
import { Plus, Mic } from "lucide-react";

interface InputFooterProps {
  isDark?: boolean;
  isChannel: boolean;
  isMuted?: boolean;
  placeholder?: string;
  t: (key: string) => string;
  onMuteToggle?: () => void;
}

export const InputFooter = ({ isDark = false, isChannel, isMuted, placeholder, t, onMuteToggle }: InputFooterProps) => {
  return (
    <div
      className={`p-4 md:p-5 flex items-center justify-center gap-3 md:gap-4 relative z-10 ${isDark ? "bg-[#1a1d24]/90 border-t border-white/5 backdrop-blur-md" : "bg-[#f4f7f9]/90 border-t border-black/5 backdrop-blur-md"}`}
    >
      {isChannel ? (
        <button
          onClick={onMuteToggle}
          className={`w-full py-3 md:py-3.5 rounded-2xl flex items-center justify-center cursor-pointer transition-colors font-medium text-sm tracking-wide min-h-[44px] ${
            isDark
              ? "bg-[#13151b] hover:bg-[#20242e] text-orange-400 border border-white/5"
              : "bg-white hover:bg-slate-50 text-orange-600 border border-black/5 shadow-sm"
          }`}
        >
          {isMuted ? t('chat.filters.unmuteChannel') : t('chat.filters.muteChannel')}
        </button>
      ) : (
        <>
          <button
            className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 min-w-[44px] min-h-[44px] ${
              isDark
                ? "bg-[#13151b] hover:bg-[#20242e] text-gray-400 shadow-[0_4px_8px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/[0.02]"
                : "bg-[#eaeff4] hover:bg-white text-slate-500 shadow-[-2px_-2px_6px_rgba(255,255,255,0.9),_4px_4px_8px_rgba(165,175,190,0.4),_inset_1px_1px_2px_rgba(255,255,255,1)]"
            }`}
          >
            <Plus size={22} />
          </button>
          <div className={`flex-1 min-w-0 h-12 rounded-full px-4 md:px-5 flex items-center transition-all duration-300 focus-within:scale-[1.01] ${
            isDark
              ? "bg-[#13151b] border border-white/5 shadow-[inset_0_4px_8px_rgba(0,0,0,0.8),_0_2px_4px_rgba(255,255,255,0.02)] focus-within:border-orange-500/30 focus-within:shadow-[inset_0_4px_8px_rgba(0,0,0,0.8),_0_0_12px_rgba(249,115,22,0.15)]"
              : "bg-[#eaeff4] border border-black/5 shadow-[inset_3px_3px_6px_rgba(165,175,190,0.3),_inset_-2px_-2px_4px_rgba(255,255,255,1)] focus-within:border-orange-400/40 focus-within:shadow-[inset_3px_3px_6px_rgba(165,175,190,0.3),_inset_-2px_-2px_4px_rgba(255,255,255,1),_0_0_12px_rgba(249,115,22,0.1)]"
          }`}>
            <input
              type="text"
              placeholder={placeholder || "Type a message..."}
              className={`w-full bg-transparent border-none outline-none text-[14px] md:text-[14.5px] ${isDark ? "text-white placeholder:text-gray-500" : "text-slate-700 placeholder:text-slate-400"}`}
            />
          </div>
          <button
            className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 min-w-[44px] min-h-[44px] ${
              isDark
                ? "bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/20 shadow-[0_4px_8px_rgba(249,115,22,0.15)]"
                : "bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 border border-orange-500/20 shadow-[0_2px_6px_rgba(249,115,22,0.15)]"
            }`}
          >
            <Mic size={20} />
          </button>
        </>
      )}
    </div>
  );
};
