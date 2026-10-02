import React from 'react';
import { MessageCircle, Phone, Video, VolumeX, Volume2, UserPlus } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import type { ChatProfileKind } from './ChatProfileBody';

interface ChatProfileActionsProps {
  kind: ChatProfileKind;
  isChatMuted: boolean;
  onMessage?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onClose: () => void;
  onMute: () => void;
  onInvite: () => void;
}

const ICON_BTN = 'shrink-0 w-10 h-10 min-w-11 min-h-11 rounded-xl flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--text-primary)] active:scale-95 transition-transform';

/** Message / call / video-or-mute / invite row shown under the profile identity. */
export const ChatProfileActions = ({
  kind, isChatMuted, onMessage, onCall, onVideoCall, onClose, onMute, onInvite,
}: ChatProfileActionsProps) => {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 mt-3">
      <button onClick={() => { onMessage?.(); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[var(--accent)] text-[var(--button-primary-text)] font-medium min-h-11 active:scale-95 transition-transform">
        <MessageCircle size={16} /> {t('profile.message', 'Message')}
      </button>
      {kind !== 'channel' && (
        <button onClick={() => { onCall?.(); onClose(); }} aria-label={t('profile.call')} className={ICON_BTN}>
          <Phone size={16} />
        </button>
      )}
      {kind === 'user' || kind === 'bot' ? (
        <button onClick={() => { onVideoCall?.(); onClose(); }} aria-label={t('profile.video')} className={ICON_BTN}>
          <Video size={16} />
        </button>
      ) : (
        <button onClick={onMute} aria-label={t('profile.mute')} className={ICON_BTN}>
          {isChatMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}
      {kind === 'channel' && (
        <button onClick={onInvite} aria-label={t('invite')} className={ICON_BTN}>
          <UserPlus size={16} />
        </button>
      )}
    </div>
  );
};
