import React from 'react';
import { motion } from 'motion/react';
import { Archive } from 'lucide-react';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { FormattedText } from '../FormattedText';

interface ChatData {
  id: string | number;
  name: string;
  message?: string;
  time?: string;
  unread?: number;
  online?: boolean;
  color?: string;
  history?: any[];
  [key: string]: any;
}

interface ChatListItemProps {
  chat: ChatData;
  theme: 'light' | 'dark';
  type?: 'chat' | 'channel';
  active?: boolean;
  onClick?: () => void;
  onArchive?: (id: string | number) => void;
  onAvatarClick?: (chat: any) => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  theme,
  type = 'chat',
  active = false,
  onClick,
  onArchive,
  onAvatarClick,
}) => {
  const isDark = theme === 'dark';
  const { stealthMode, typingIndicators } = useAppStore();

  const roundedClass = type === 'channel' ? 'rounded-2xl' : 'rounded-full';
  const { t } = useI18n();
  const isMockTyping = typingIndicators && chat.id === 1 && type === 'chat';

  const fuzzedTime = React.useMemo(() => {
    if (!stealthMode || !chat.time) return chat.time;
    const match = chat.time.match(/(\d{1,2}):(\d{2})/);
    if (!match) return chat.time;
    let h = parseInt(match[1]);
    let m = parseInt(match[2]);
    const offset = (Number(chat.id) % 11) - 5;
    m += offset;
    if (m < 0) { m += 60; h = (h - 1 + 24) % 24; }
    else if (m >= 60) { m -= 60; h = (h + 1) % 24; }
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }, [chat.time, chat.id, stealthMode]);

  return (
    <div className="relative mb-4 last:mb-0">
      <div className={`absolute inset-0 flex items-center justify-end px-6 rounded-3xl ${isDark ? 'bg-red-500/20' : 'bg-red-500'} text-white overflow-hidden`}>
        <Archive size={20} className={isDark ? 'text-red-500' : 'text-white'} />
        <span className={`ml-2 text-sm font-bold ${isDark ? 'text-red-500' : 'text-white'}`}>{t('chat.archive')}</span>
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.5, right: 0 }}
        onDragEnd={(e, info) => {
          if (info.offset.x < -100 && onArchive) {
            onArchive(chat.id);
          }
        }}
        onClick={onClick}
        className={`relative w-full p-3 flex items-center gap-4 cursor-pointer transition-all duration-300 select-none group rounded-3xl ${
          isDark
            ? active
              ? 'bg-[#101216] shadow-[inset_0_12px_24px_rgba(0,0,0,0.9),_inset_0_3px_6px_rgba(0,0,0,0.9)] border border-orange-500/20'
              : 'bg-[#13151b] shadow-[0_8px_16px_rgba(0,0,0,0.3),_inset_0_1.5px_2px_rgba(255,255,255,0.05),_inset_0_-2px_4px_rgba(0,0,0,0.6)] border border-white/[0.02] hover:scale-[1.02]'
            : active
              ? 'bg-[#e2e8f0] shadow-[inset_4px_4px_10px_rgba(165,175,190,0.4),_inset_-2px_-2px_6px_rgba(255,255,255,1)] border border-black/5'
              : 'bg-[#eaeff4] shadow-[-6px_-6px_12px_rgba(255,255,255,0.8),_8px_8px_16px_rgba(165,175,190,0.4),_inset_1.5px_1.5px_3px_rgba(255,255,255,1)] border border-white/80 hover:scale-[1.02]'
        }`}
      >
        <div
          onClick={(e) => {
            if (onAvatarClick && type !== 'channel') {
              e.stopPropagation();
              onAvatarClick(chat);
            }
          }}
          className={`relative shrink-0 w-[52px] h-[52px] ${roundedClass} shadow-inner p-[2px] transition-transform duration-300 ${active ? 'scale-95' : ''}`}
        >
          <div
            className={`w-full h-full ${roundedClass} bg-gradient-to-br ${chat.color} flex items-center justify-center text-white font-bold text-xl shadow-sm`}
          >
            {chat.name.charAt(0)}
          </div>
          {chat.online && (
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full border-[2.5px] z-10 ${isDark ? 'bg-green-400 border-[#13151b]' : 'bg-emerald-500 border-[#eaeff4]'}`}
            />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center pr-2">
          <div className="flex justify-between items-center mb-[2px]">
            <span
              className={`font-bold text-[14.5px] truncate pr-2 ${isDark ? 'text-[#e8ecf2]' : 'text-slate-800'}`}
            >
              {chat.name}
            </span>
            <span
              className={`text-[10.5px] font-semibold tracking-wide shrink-0 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}
            >
              {fuzzedTime}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span
              className={`text-[12.5px] truncate pr-4 ${isDark ? (active ? 'text-orange-300' : 'text-[#7a8190]') : active ? 'text-orange-600' : 'text-slate-500'} ${chat.unread ? 'font-medium' : ''}`}
            >
              {isMockTyping ? (
                <span className={`font-bold tracking-wide italic ${isDark ? 'text-orange-500' : 'text-orange-600'}`}>
                  {t('chat.typing')}
                </span>
              ) : (
                <FormattedText text={chat.message} />
              )}
            </span>
            {chat.unread > 0 && (
              <div
                className={`shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm ${
                  isDark
                    ? 'bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-[0_0_8px_rgba(249,115,22,0.5)]'
                    : 'bg-gradient-to-tr from-orange-400 to-orange-300 text-orange-950 shadow-[0_2px_4px_rgba(249,115,22,0.5)]'
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
                    ? 'bg-blue-500/90 text-white shadow-[0_0_8px_rgba(59,130,250,0.5)]'
                    : 'bg-blue-500 text-white shadow-[0_2px_4px_rgba(29,78,183,0.5)]'
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
