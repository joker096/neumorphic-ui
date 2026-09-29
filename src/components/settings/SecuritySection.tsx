import { Monitor, Smartphone, Clock } from 'lucide-react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { AppLockPanel } from './security/AppLockPanel';
import { TwoFactorPanel } from './security/TwoFactorPanel';
import { KeyRecoveryPanel } from './security/KeyRecoveryPanel';
import { DangerZonePanel } from './security/DangerZonePanel';

interface SecuritySectionProps {
  isDark?: boolean;
  onBack: () => void;
  t: (key: string, fallback?: string) => string;
}

export const SecuritySection = ({ isDark = false, onBack, t }: SecuritySectionProps) => {
  return (
    <SubView title={t('settings.security')} isDark={isDark} onBack={onBack}>
      <AppLockPanel isDark={isDark} t={t} />

      <TwoFactorPanel isDark={isDark} t={t} />

      <KeyRecoveryPanel isDark={isDark} t={t} />

      <SettingsSectionTitle title={t('settings.sessionsDevices')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          icon={<Monitor size={16} />}
          iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
          iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
          title={t('settings.thisDevice')}
          subtitle={t('settings.thisDeviceSubtitle')}
          isDark={isDark}
        />
        <SettingsRow
          icon={<Smartphone size={16} />}
          iconBg={isDark ? "bg-gray-500/10" : "bg-gray-100"}
          iconColor={isDark ? "text-gray-400" : "text-gray-500"}
          title={t('settings.activeSessions')}
          subtitle={t('settings.noOtherSessions')}
          isDark={isDark}
        />
        <SettingsRow
          icon={<Clock size={16} />}
          iconBg={isDark ? "bg-gray-500/10" : "bg-gray-100"}
          iconColor={isDark ? "text-gray-400" : "text-gray-500"}
          title={t('settings.loginHistory')}
          subtitle={t('settings.loginHistoryUnavailable')}
          isDark={isDark}
        />
      </SettingsGroup>

      <DangerZonePanel isDark={isDark} t={t} />
    </SubView>
  );
};