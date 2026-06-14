import { Sheet } from './ui/Sheet';
import { useI18n } from '../lib/i18n';
import React, { useState } from 'react';
import { X, MessageCircle, ChevronUp } from 'lucide-react';

export const SlideUpPreview = ({
  theme,
  chat,
  onClose,
  onOpenChat,
  onSendMessage,
}: {
  theme: 'light' | 'dark';
  chat: any;
  onClose: () => void;
  onOpenChat: () => void;
  onSendMessage: (text: string) => void;
}) => {
  const isDark = theme === 'dark';
  const { t } = useI18n();
  const [replyText, setReplyText] = useState('');
  const history = chat.history || [];
  const recentMessages = history.slice(-5);

  return (
    <Sheet isOpen={true} onClose={onClose} detent="large">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${chat.color || (isDark ? "from-orange-400 to-amber-500" : "from-orange-500 to-amber-600")} text-white font-bold`}>
              {chat.name?.charAt(0) || '?'}
            </div>
            <div>
              <div className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{chat.name}</div>
              <div className={`text-[10px] ${isDark ? "text-gray-500" : "text-slate-400"}`}>{chat.online ? t('slideup.online') : `${history.length} messages`}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              onClick={onOpenChat}
              className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-colors ${isDark ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-100 text-orange-600 hover:bg-orange-200"}`}
            >
{t('slideup.open')}
            </div>
            <div
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${isDark ? "bg-[#1a1d24] text-gray-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-800"}`}
            >
              <ChevronUp size={16} />
            </div>
          </div>
        </div>

        <div className={`max-h-[200px] overflow-y-auto flex flex-col gap-2 mb-4 p-2 rounded-2xl ${isDark ? "bg-[#1a1d24]" : "bg-slate-50"}`}>
          {recentMessages.length === 0 ? (
            <div className={`text-center py-4 text-xs ${isDark ? "text-gray-500" : "text-slate-400"}`}>{t('slideup.noMessages')}</div>
          ) : (
            recentMessages.map((msg: any, i: number) => (
              <div key={msg.id || i} className={`flex gap-2 ${msg.sender === "me" ? "flex-row-reverse" : ""}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-[13px] ${msg.sender === "me"
                  ? (isDark ? "bg-orange-500/20 text-orange-200" : "bg-orange-100 text-orange-800")
                  : (isDark ? "bg-white/10 text-gray-200" : "bg-white text-slate-700 shadow-sm border border-black/5")
                }`}>
                  {msg.text || (msg.type === "audio" ? t('slideup.voiceMessage') : msg.type === "image" ? t('slideup.photo') : t('slideup.attachment'))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && replyText.trim()) {
                onSendMessage(replyText.trim());
                setReplyText('');
                onClose();
              }
            }}
            placeholder={t('slideup.quickReply')}
            className={`flex-1 outline-none text-sm p-3 rounded-xl ${isDark ? "bg-[#1a1d24] text-white placeholder:text-gray-500 border border-white/5" : "bg-slate-50 text-slate-800 placeholder:text-slate-400 border border-black/5"}`}
          />
          <div
            onClick={() => {
              if (replyText.trim()) {
                onSendMessage(replyText.trim());
                setReplyText('');
                onClose();
              }
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer ${isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"}`}
          >
            <MessageCircle size={18} />
          </div>
        </div>
    </Sheet>
  );
};
