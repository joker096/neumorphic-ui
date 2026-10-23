import React from 'react';
import {
  BadgeCheck, Globe, Lock, Clock,
  Bot as BotIcon,
} from 'lucide-react';
import { ChatProfileActions } from './ChatProfileActions';
import type { ChatProfileKind, ProfileChat } from './ChatProfileBody';
import { selfDestructOptions, selfDestructLabel } from '../../lib/selfDestruct';
import { HINT_TEXT_TIGHT_CLASS, SECONDARY_TEXT_CLASS } from '../ui/textClasses';
import {
  CHAT_PROFILE_DEFAULT_SUBSCRIBERS,
  CHAT_PROFILE_DEFAULT_MEMBERS,
} from '../../constants/chatConstants';

interface ChatProfileHeaderProps {
  chat: ProfileChat;
  kind: ChatProfileKind;
  t: (key: string, options?: any) => string;
  autoDeleteValue: string;
  onCycleAutoDelete: () => void;
  isChatMuted: boolean;
  chatWallpaper?: Record<string, string>;
  onSetWallpaper: (chatId: string | number, bg: string) => void;
  onMessage?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onClose?: () => void;
  onMute: () => void;
  onInvite: () => void;
}

function subtitle(chat: ProfileChat, kind: ChatProfileKind, t: (key: string, options?: any) => string): string {
  if (kind === 'channel') {
    const subscriberCount = chat.subscriberCount ?? chat.subscribers ?? CHAT_PROFILE_DEFAULT_SUBSCRIBERS;
    const postCount = chat.postCount ?? chat.history?.length ?? 0;
    return `${t('chat.subscribers', { count: subscriberCount })} · ${t('chat.posts', { count: postCount })}`;
  }
  if (kind === 'group') {
    const memberCount = Array.isArray(chat.members) ? chat.members.length : (chat.members ?? CHAT_PROFILE_DEFAULT_MEMBERS);
    return t('profile.membersCount', { count: memberCount });
  }
  if (kind === 'bot') return t('profile.bot', 'Bot');
  return chat.online ? t('profile.online', 'online') : chat.username ?? t('profile.offline', 'last seen recently');
}

/**
 * Identity block of the chat profile: avatar, name, subtitle, channel
 * visibility, description, per-chat auto-delete and wallpaper controls and the
 * primary action row. Extracted from `ChatProfileView` to keep it under 300
 * lines; byte-faithful transfer, no behaviour change.
 */
export const ChatProfileHeader = ({
  chat,
  kind,
  t,
  autoDeleteValue,
  onCycleAutoDelete,
  isChatMuted,
  chatWallpaper,
  onSetWallpaper,
  onMessage,
  onCall,
  onVideoCall,
  onClose,
  onMute,
  onInvite,
}: ChatProfileHeaderProps) => {
  return (
    <div className="flex flex-col items-center text-center px-5 pt-5 pb-2">
      <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${chat.color} flex items-center justify-center text-white text-[32px] font-bold shadow-lg relative`}>
        {chat.name.charAt(0)}
        {kind === 'bot' && <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs text-[var(--ink-on-saturate)] border-2 border-[var(--bg-secondary)]"><BotIcon size={14} /></span>}
      </div>
      <div className="mt-2.5 font-bold text-lg flex items-center gap-1 text-[var(--text-primary)]">
        {chat.name}
        {chat.verified && <BadgeCheck size={18} className="text-[var(--accent)]" />}
      </div>
      <div className={SECONDARY_TEXT_CLASS}>{subtitle(chat, kind, t)}</div>
      {chat.username && <div className={HINT_TEXT_TIGHT_CLASS}>@{chat.username}</div>}
      {kind === 'channel' && (
        <div className="flex items-center gap-1 text-xs mt-1 text-[var(--text-secondary)]">
          {chat.isPublic ? <Globe size={12} /> : <Lock size={12} />}
          <span>{chat.isPublic ? t('profile.channelPublic', 'Public channel') : t('profile.channelPrivate', 'Private channel')}</span>
        </div>
      )}
      {chat.description && <div className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">{chat.description}</div>}
      <div className="mt-4 w-full flex items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Clock size={16} className="shrink-0 text-[var(--accent)]" />
          <div className="min-w-0 text-left">
            <div className="text-sm font-medium text-[var(--text-primary)]">{t('profile.autoDelete', 'Auto-delete messages')}</div>
            <div className={HINT_TEXT_TIGHT_CLASS}>{t('profile.autoDeleteSubtitle', 'New messages disappear after this time')}</div>
          </div>
        </div>
        <button
          onClick={onCycleAutoDelete}
          aria-label={t('profile.autoDelete', 'Auto-delete messages')}
          className="shrink-0 min-h-11 px-3 rounded-xl bg-[var(--msg-bg-panel)] text-sm font-semibold text-[var(--accent)] active:scale-95 transition-transform"
        >
          {selfDestructLabel(t, autoDeleteValue)}
        </button>
      </div>
      <div className="mt-3 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-4 py-3">
        <div className="flex items-center gap-2.5 mb-2.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">{t('profile.chatWallpaper', 'Chat background')}</span>
        </div>
        <div className="flex items-center gap-2">
          {(['default', 'light', 'dark'] as const).map((bg) => {
            const active = (chatWallpaper?.[String(chat.id)] ?? 'default') === bg;
            return (
              <button
                key={bg}
                onClick={() => onSetWallpaper(chat.id, bg)}
                aria-pressed={active}
                className={`min-h-11 flex-1 rounded-xl text-sm font-semibold transition-colors active:scale-95 ${
                  active
                    ? 'bg-[var(--accent)] text-[var(--ink-on-saturate)]'
                    : 'bg-[var(--msg-bg-panel)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t(`settings.chatbg.${bg}`)}
              </button>
            );
          })}
        </div>
      </div>
      <ChatProfileActions
        kind={kind}
        isChatMuted={isChatMuted}
        onMessage={onMessage}
        onCall={onCall}
        onVideoCall={onVideoCall}
        onClose={onClose}
        onMute={onMute}
        onInvite={onInvite}
      />
    </div>
  );
};
