import React, { useState } from 'react';
import {
  MessageCircle, Users, Megaphone, AtSign, Volume2,
  Eye, Moon, Timer, Music,
} from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { SettingsGroup, SettingsSectionTitle, SettingsRow, SettingsToggleRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { toast } from '../ui/Toast';
import { NotificationsExceptions } from './NotificationsExceptions';
import { soundConfig, type SoundEventType } from '../../lib/sounds/config';

interface NotificationsSectionProps {
  isDark?: boolean;
  onBack: () => void;
}

type BadgeMode = 'all' | 'mentions' | 'unmuted' | 'none';

const BADGE_MODES: { id: BadgeMode; label: string }[] = [
  { id: 'all', label: 'All unread' },
  { id: 'mentions', label: 'Mentions only' },
  { id: 'unmuted', label: 'Unmuted chats' },
  { id: 'none', label: 'Hidden' },
];

const NOTIFY_TONES: { id: SoundEventType; key: string; fallback: string }[] = [
  { id: 'incoming-chat', key: 'settings.soundIncomingChat', fallback: 'New message' },
  { id: 'incoming-sms', key: 'settings.soundIncomingSms', fallback: 'Incoming SMS' },
  { id: 'incoming-file', key: 'settings.soundIncomingFile', fallback: 'File received' },
  { id: 'file-transfer-done', key: 'settings.soundFileDone', fallback: 'Transfer complete' },
  { id: 'birthday-reminder', key: 'settings.soundBirthday', fallback: 'Birthday' },
  { id: 'contact-signs-in', key: 'settings.soundContactSignIn', fallback: 'Contact online' },
];

export const NotificationsSection = ({ isDark = false, onBack }: NotificationsSectionProps) => {
  const { t } = useI18n();

  const [privateChats, setPrivateChats] = useState(true);
  const [groups, setGroups] = useState(true);
  const [channels, setChannels] = useState(false);
  const [mentions, setMentions] = useState(true);
  const [inAppSound, setInAppSound] = useState(true);
  const [preview, setPreview] = useState(true);
  const [quietHours, setQuietHours] = useState(false);
  const [customTone, setCustomTone] = useState(false);
  const [customToneId, setCustomToneId] = useState<SoundEventType>('incoming-chat');
  const [badgeMode, setBadgeMode] = useState<BadgeMode>('all');
  const [quietFrom, setQuietFrom] = useState('22:00');
  const [quietTo, setQuietTo] = useState('08:00');

  const playTone = (id: SoundEventType) => {
    try {
      const audio = new Audio(soundConfig[id]);
      audio.play().catch(() => undefined);
    } catch {
      // Audio not supported in this environment — ignore.
    }
  };

  return (
    <SubView title={t('settings.notifications', 'Notifications')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.notifyScope', 'Notify me about')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsToggleRow
          icon={<MessageCircle size={16} />}
          iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
          iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
          title={t('settings.privateChats', 'Private chats')}
          subtitle={t('settings.privateChatsSub', 'Messages from contacts')}
          isOn={privateChats}
          isDark={isDark}
          onToggle={() => setPrivateChats(v => !v)}
        />
        <SettingsRow
          icon={<Users size={16} />}
          iconBg="t-accent-bg"
          iconColor="t-accent"
          title={t('settings.groups', 'Groups')}
          subtitle={t('settings.groupsSub', 'Group conversations')}
          isDark={isDark}
          rightElement={<ToggleSwitchLoose isOn={groups} onToggle={() => setGroups(v => !v)} isDark={isDark} ariaLabel={t('settings.groups', 'Groups')} />}
        />
        <SettingsRow
          icon={<Megaphone size={16} />}
          iconBg={isDark ? "bg-purple-500/10" : "bg-purple-100"}
          iconColor={isDark ? "text-purple-400" : "text-purple-600"}
          title={t('settings.channels', 'Channels')}
          subtitle={t('settings.channelsSub', 'Broadcast channels')}
          isDark={isDark}
          rightElement={<ToggleSwitchLoose isOn={channels} onToggle={() => setChannels(v => !v)} isDark={isDark} ariaLabel={t('settings.channels', 'Channels')} />}
        />
        <SettingsToggleRow
          icon={<AtSign size={16} />}
          iconBg={isDark ? "bg-amber-500/10" : "bg-amber-100"}
          iconColor={isDark ? "text-amber-400" : "text-amber-600"}
          title={t('settings.mentions', 'Mentions & replies')}
          subtitle={t('settings.mentionsSub', '@you and replies')}
          isOn={mentions}
          isDark={isDark}
          onToggle={() => setMentions(v => !v)}
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.notifyBehavior', 'Behavior')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsToggleRow
          icon={<Volume2 size={16} />}
          iconBg={isDark ? "bg-cyan-500/10" : "bg-cyan-100"}
          iconColor={isDark ? "text-cyan-400" : "text-cyan-600"}
          title={t('settings.inAppSound', 'In-app sound')}
          subtitle={t('settings.inAppSoundSub', 'Play sound while app is open')}
          isOn={inAppSound}
          isDark={isDark}
          onToggle={() => setInAppSound(v => !v)}
        />
        <SettingsToggleRow
          icon={<Eye size={16} />}
          iconBg={isDark ? "bg-teal-500/10" : "bg-teal-100"}
          iconColor={isDark ? "text-teal-400" : "text-teal-600"}
          title={t('settings.messagePreview', 'Message preview')}
          subtitle={t('settings.messagePreviewSub', 'Show text in notifications')}
          isOn={preview}
          isDark={isDark}
          onToggle={() => setPreview(v => !v)}
        />
        <SettingsToggleRow
          icon={<Music size={16} />}
          iconBg={isDark ? "bg-fuchsia-500/10" : "bg-fuchsia-100"}
          iconColor={isDark ? "text-fuchsia-400" : "text-fuchsia-600"}
          title={t('settings.customTone', 'Custom notification tone')}
          subtitle={t('settings.customToneSub', 'Use a distinct sound')}
          isOn={customTone}
          isDark={isDark}
          onToggle={() => setCustomTone(v => !v)}
        />
        {customTone && NOTIFY_TONES.map((tone, i) => (
          <div key={tone.id}>
            {i > 0 && <div className={`border-t ${"border-[var(--border-color)]"}`} />}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => { setCustomToneId(tone.id); toast(t('settings.saved', 'Saved'), 'success'); }}
                aria-label={t(tone.key, tone.fallback)}
                title={t(tone.key, tone.fallback)}
                className={`flex-1 min-h-11 flex items-center gap-3 px-4 py-3 text-left transition-colors active:scale-[0.99] ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${customToneId === tone.id ? "border-[var(--accent)]" : (isDark ? "border-gray-600" : "border-[var(--border-color)]")}`}>
                  {customToneId === tone.id && <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
                </span>
                <span className={`text-sm truncate text-[var(--text-primary)]`}>{t(tone.key, tone.fallback)}</span>
              </button>
              <button
                type="button"
                onClick={() => playTone(tone.id)}
                aria-label={t('settings.previewSound', 'Play sound')}
                title={t('settings.previewSound', 'Play sound')}
                className={`w-9 h-9 min-w-11 min-h-11 flex items-center justify-center rounded-lg transition-colors text-[var(--accent)] ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
              >
                <Volume2 size={16} />
                <span className="sr-only">{t('settings.previewSound', 'Play sound')}</span>
              </button>
            </div>
          </div>
        ))}
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.badgeBehavior', 'Badge counter')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        {BADGE_MODES.map((mode, i) => (
          <div key={mode.id}>
            {i > 0 && <div className={`border-t ${"border-[var(--border-color)]"}`} />}
            <button
              onClick={() => setBadgeMode(mode.id)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors active:scale-[0.99] ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
            >
              <span className={`text-sm text-[var(--text-primary)]`}>{t(`settings.badge_${mode.id}`, mode.label)}</span>
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${badgeMode === mode.id ? "border-[var(--accent)]" : (isDark ? "border-gray-600" : "border-[var(--border-color)]")}`}>
                {badgeMode === mode.id && <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
              </span>
            </button>
          </div>
        ))}
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.quietHours', 'Quiet hours')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsToggleRow
          icon={<Moon size={16} />}
          iconBg={isDark ? "bg-indigo-500/10" : "bg-indigo-100"}
          iconColor={isDark ? "text-indigo-400" : "text-indigo-600"}
          title={t('settings.quietHoursTitle', 'Enable quiet hours')}
          subtitle={t('settings.quietHoursSub', 'Mute notifications on schedule')}
          isOn={quietHours}
          isDark={isDark}
          onToggle={() => { setQuietHours(v => !v); toast(t('settings.saved', 'Saved'), 'success'); }}
        />
        {quietHours && (
          <div className="flex items-center gap-3 px-4 py-3">
            <Timer size={16} className={isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"} />
            <span className={`text-sm flex-1 text-[var(--text-primary)]`}>{t('settings.timeRange', 'From – To')}</span>
            <input
              type="time"
              value={quietFrom}
              onChange={e => setQuietFrom(e.target.value)}
              aria-label={t('settings.quietFrom', 'Quiet from')}
              className={`rounded-lg px-2 py-1 text-sm bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)]`}
            />
            <span className={isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}>–</span>
            <input
              type="time"
              value={quietTo}
              onChange={e => setQuietTo(e.target.value)}
              aria-label={t('settings.quietTo', 'Quiet to')}
              className={`rounded-lg px-2 py-1 text-sm bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)]`}
            />
          </div>
        )}
      </SettingsGroup>

      <NotificationsExceptions isDark={isDark} />
    </SubView>
  );
};

// Local loose toggle so we can reuse the styled switch inside SettingsRow rightElement
const ToggleSwitchLoose = ({ isOn, onToggle, isDark, ariaLabel }: { isOn: boolean; onToggle: () => void; isDark?: boolean; ariaLabel?: string }) => (
  <button
    type="button"
    role="switch"
    aria-label={ariaLabel}
    aria-checked={isOn}
    onClick={(e) => { e.stopPropagation(); onToggle(); }}
    className="my-[-10px] min-w-11 min-h-11 flex items-center cursor-pointer"
  >
    <span className={`w-11 h-6 flex items-center rounded-full px-1 transition-colors duration-200 ${isOn ? 'bg-emerald-500 justify-end' : (isDark ? 'bg-gray-600 justify-start' : 'bg-black/20 justify-start')}`}>
      <span className={`w-4 h-4 rounded-full bg-white shadow-sm shrink-0`} />
    </span>
  </button>
);
