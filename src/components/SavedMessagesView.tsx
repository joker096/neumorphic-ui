import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Bookmark, X, MessageCircle, Clock, ArrowLeft } from 'lucide-react';
import { useI18n } from '../lib/i18n';

export const SavedMessagesView = ({
  theme,
  savedMessages,
  onBack,
  onOpenChat,
}: {
  theme: 'light' | 'dark';
  savedMessages: any[];
  onBack: () => void;
  onOpenChat: (chatName: string) => void;
}) => {
  const { t } = useI18n();
  const isDark = theme === 'dark';

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    savedMessages.forEach(msg => {
      const existing = map.get(msg.chatName) || [];
      existing.push(msg);
      map.set(msg.chatName, existing);
    });
    return Array.from(map.entries());
  }, [savedMessages]);

  return (
    <div className={`w-full max-w-[400px] flex-1 flex flex-col overflow-y-auto rounded-[32px] p-6 mb-8 ${isDark ? "bg-[#11141c]/50 border border-white/5 scrollbar-ios" : "bg-[#eaeff4]/50 border border-black/5 shadow-inner scrollbar-ios"}`}>
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <div
          onClick={onBack}
          className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${isDark ? "bg-[#1a1d24] border border-white/10 hover:bg-white/10" : "bg-white border border-black/10 hover:bg-black/5 shadow-sm"}`}
        >
          <ArrowLeft size={18} className={isDark ? "text-gray-400" : "text-slate-500"} />
        </div>
        <div className={`flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}>
          <Bookmark size={20} className="text-orange-500" />
          <h2 className="text-lg font-bold font-sans">{t('chat.savedMessages')}</h2>
        </div>
        <div className={`text-xs ml-auto ${isDark ? "text-gray-500" : "text-slate-400"}`}>
          {t('chat.nSaved', { n: savedMessages.length })}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-16 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
          <Bookmark size={40} className="mb-4 opacity-30" />
          <span className="text-sm font-medium">{t('chat.noSavedMessages')}</span>
          <span className="text-xs mt-1 opacity-60">{t('chat.savedMessagesHint')}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(([chatName, messages]) => (
            <div key={chatName} className={`rounded-2xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white border border-black/5 shadow-sm"}`}>
              <div
                onClick={() => onOpenChat(chatName)}
                className={`flex items-center gap-2 p-3 cursor-pointer transition-colors ${isDark ? "hover:bg-white/5 border-b border-white/5" : "hover:bg-black/5 border-b border-black/5"}`}
              >
                <MessageCircle size={14} className="text-orange-500" />
                <span className={`text-xs font-bold flex-1 ${isDark ? "text-gray-300" : "text-slate-600"}`}>{chatName}</span>
                <span className={`text-[10px] ${isDark ? "text-gray-500" : "text-slate-400"}`}>{messages.length} messages</span>
              </div>
              <div className="flex flex-col">
                {messages.map(msg => (
                  <div key={msg.key} className={`px-3 py-2.5 border-b last:border-b-0 ${isDark ? "border-white/5" : "border-black/5"}`}>
                    <div className={`text-[13px] leading-relaxed ${isDark ? "text-gray-200" : "text-slate-700"}`}>
                      {msg.preview || t('chat.message')}
                    </div>
                    <div className={`flex items-center gap-2 mt-1 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                      <Clock size={10} />
                      <span className="text-[10px]">{msg.time || ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
