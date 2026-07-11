import { SettingsSection } from './SettingsSection';
import { SettingsRow, SettingsGroup, SettingsSectionTitle } from '../ui/SettingsRow';
import { SettingsToggleRow } from '../ui/SettingsRow';
import { Bell, Volume2, Moon } from 'lucide-react';

interface NotificationsSectionProps {
  onBack: () => void;
  t: (key: string) => string;
  isDark?: boolean;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  dndEnabled: boolean;
  setDndEnabled: (v: boolean) => void;
  dndFrom: string;
  setDndFrom: (v: string) => void;
  dndTo: string;
  setDndTo: (v: string) => void;
}

export const NotificationsSection = ({
  onBack, t, isDark = false,
  notificationsEnabled, setNotificationsEnabled,
  soundEnabled, setSoundEnabled,
  dndEnabled, setDndEnabled, dndFrom, setDndFrom, dndTo, setDndTo,
}: NotificationsSectionProps) => (
  <SettingsSection title={t('settings.notificationsSection')} onBack={onBack}>

    <SettingsSectionTitle title={t('settings.notificationsSection')} isDark={isDark} />
    <SettingsGroup isDark={isDark}>
      <SettingsToggleRow
        icon={<Bell size={14} />}
        iconBg="bg-orange-500/10"
        iconColor="text-orange-600"
        title={t('settings.notifications')}
        subtitle={t('settings.notificationsSubtitle')}
        isOn={notificationsEnabled}
        onToggle={() => setNotificationsEnabled(!notificationsEnabled)}
        isDark={isDark}
      />
    </SettingsGroup>

    <SettingsSectionTitle title={t('settings.sound')} isDark={isDark} />
    <SettingsGroup isDark={isDark}>
      <SettingsToggleRow
        icon={<Volume2 size={14} />}
        iconBg="bg-emerald-500/10"
        iconColor="text-emerald-600"
        title={t('settings.soundOption')}
        isOn={soundEnabled}
        onToggle={() => setSoundEnabled(!soundEnabled)}
        isDark={isDark}
      />
    </SettingsGroup>

    <SettingsSectionTitle title={t('settings.dndMode')} isDark={isDark} />
    <SettingsGroup isDark={isDark}>
      <SettingsToggleRow
        icon={<Moon size={14} />}
        iconBg="bg-purple-500/10"
        iconColor="text-purple-600"
        title={t('settings.dnd')}
        subtitle={dndEnabled ? t('settings.dndActive') : t('settings.dndSubtitle')}
        isOn={dndEnabled}
        onToggle={() => setDndEnabled(!dndEnabled)}
        isDark={isDark}
      />
      {dndEnabled && (
        <div className="grid grid-cols-2 gap-4 px-4 py-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-secondary)]">
              {t('settings.dndFrom')}
            </label>
            <input
              type="time"
              value={dndFrom}
              onChange={(e) => setDndFrom(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors border bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)] focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-secondary)]">
              {t('settings.dndTo')}
            </label>
            <input
              type="time"
              value={dndTo}
              onChange={(e) => setDndTo(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors border bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)] focus:border-purple-500/50"
            />
          </div>
        </div>
      )}
    </SettingsGroup>
  </SettingsSection>
);
