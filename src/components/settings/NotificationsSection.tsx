import React, { useState } from 'react';
import {
  Bell, BellOff, MessageCircle, Users, Megaphone, AtSign, Volume2,
  Eye, Moon, Timer, Music,
} from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { SettingsGroup, SettingsSectionTitle, SettingsRow, SettingsToggleRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { toast } from '../ui/Toast';
import { ChatPickerModal } from '../payments/ChatPickerModal';
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
  const [exceptionPickerOpen, setExceptionPickerOpen] = useState(false);
  const [exceptions, setExceptions] = useState<{ id: string | number; name: string; muted: boolean }[]>([
    { id: 1, name: 'Work Group', muted: false },
    { id: 2, name: 'Mom', muted: true },
  ]);

  const toggleException = (id: string | number) => {
    setExceptions(prev => prev.map(e => (e.id === id ? { ...e, muted: !e.muted } : e)));
    toast(t('settings.saved', 'Saved'), 'success');
  };

  const playTone = (id: SoundEventType) => {
    try {
      const audio = new Audio(soundConfig[id]);
      audio.play().catch(() => undefined);
    } catch {
      // Audio not supported in this environment — ignore.
    }
  };

  const pickExceptionChat = (chat: { id: string | number; name?: string; title?: string }) => {
    setExceptionPickerOpen(false);
    if (exceptions.some(e => e.id === chat.id)) {
      toast(t('settings.addedException', 'Already in exceptions'), 'info');
      return;
    }
    setExceptions(prev => [...prev, { id: chat.id, name: chat.name || chat.title || `Chat ${chat.id}`, muted: false }]);
    toast(t('settings.added', 'Added'), 'success');
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
            {i > 0 && <div className={`border-t ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`} />}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => { setCustomToneId(tone.id); toast(t('settings.saved', 'Saved'), 'success'); }}
                aria-label={t(tone.key, tone.fallback)}
                title={t(tone.key, tone.fallback)}
                className={`flex-1 min-h-11 flex items-center gap-3 px-4 py-3 text-left transition-colors active:scale-[0.99] ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${customToneId === tone.id ? "border-[var(--accent)]" : (isDark ? "border-gray-600" : "border-slate-300")}`}>
                  {customToneId === tone.id && <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
                </span>
                <span className={`text-sm truncate ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t(tone.key, tone.fallback)}</span>
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
            {i > 0 && <div className={`border-t ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`} />}
            <button
              onClick={() => setBadgeMode(mode.id)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors active:scale-[0.99] ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
            >
              <span className={`text-sm ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t(`settings.badge_${mode.id}`, mode.label)}</span>
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${badgeMode === mode.id ? "border-[var(--accent)]" : (isDark ? "border-gray-600" : "border-slate-300")}`}>
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
            <Timer size={16} className={isDark ? "text-gray-400" : "text-slate-500"} />
            <span className={`text-sm flex-1 ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.timeRange', 'From – To')}</span>
            <input
              type="time"
              value={quietFrom}
              onChange={e => setQuietFrom(e.target.value)}
              aria-label={t('settings.quietFrom', 'Quiet from')}
              className={`rounded-lg px-2 py-1 text-sm bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)]`}
            />
            <span className={isDark ? "text-gray-500" : "text-slate-400"}>–</span>
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

      <SettingsSectionTitle title={t('settings.exceptions', 'Exceptions')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        {exceptions.length === 0 && (
          <div className={`px-4 py-6 text-center text-sm ${isDark ? "text-gray-500" : "text-slate-400"}`}>{t('settings.noExceptions', 'No exceptions yet')}</div>
        )}
        {exceptions.map((e, i) => (
          <div key={e.id}>
            {i > 0 && <div className={`border-t ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`} />}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-gray-500/10" : "bg-gray-100"}`}>
                  <Bell size={16} className={isDark ? "text-gray-400" : "text-slate-500"} />
                </div>
                <span className={`text-sm truncate ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{e.name}</span>
              </div>
              <button
                onClick={() => toggleException(e.id)}
                aria-label={e.muted ? t('settings.muted', 'Muted') : t('settings.allowed', 'Allowed')}
                title={e.muted ? t('settings.muted', 'Muted') : t('settings.allowed', 'Allowed')}
                className={`w-9 h-9 min-w-11 min-h-11 flex items-center justify-center rounded-lg transition-colors ${e.muted ? (isDark ? "bg-gray-600/30 text-gray-300" : "bg-slate-200 text-slate-600") : "bg-[var(--accent)] text-[var(--button-primary-text)]"}`}
              >
                {e.muted ? <BellOff size={16} /> : <Bell size={16} />}
                <span className="sr-only">{e.muted ? t('settings.muted', 'Muted') : t('settings.allowed', 'Allowed')}</span>
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => setExceptionPickerOpen(true)}
          aria-label={t('settings.addException', 'Add exception')}
          title={t('settings.addException', 'Add exception')}
          className={`w-9 h-9 min-w-11 min-h-11 flex items-center justify-center rounded-lg text-[var(--accent)] transition-colors active:scale-[0.99] ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
        >
          <Bell size={16} />
          <span className="sr-only">{t('settings.addException', 'Add exception')}</span>
        </button>
      </SettingsGroup>
      <ChatPickerModal
        open={exceptionPickerOpen}
        onClose={() => setExceptionPickerOpen(false)}
        onPick={pickExceptionChat}
        title={t('settings.pickExceptionChat', 'Add exception')}
      />
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
    className={`relative min-w-11 min-h-[24px] w-11 h-6 flex items-center rounded-full px-1 cursor-pointer transition-colors duration-200 ${isOn ? 'bg-emerald-500 justify-end' : (isDark ? 'bg-gray-600 justify-start' : 'bg-slate-300 justify-start')}`}
  >
    <div className={`w-4 h-4 rounded-full bg-white shadow-sm shrink-0`} />
    <span aria-hidden="true" className="absolute inset-y-[-10px] left-0 right-0 pointer-events-none" />
  </button>
);
