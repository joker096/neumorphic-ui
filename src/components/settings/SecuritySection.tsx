import { Monitor } from 'lucide-react';
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

      {/* Only facts we can actually observe are shown. The previous
          "Active sessions — no other active sessions" and "Login history"
          rows were static text for capabilities the local-first app does not
          have: there is no session registry to read, so the first row asserted
          something unverifiable (and wrong as soon as a second peer connects)
          and the second advertised a log that does not exist. */}
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
      </SettingsGroup>

      <DangerZonePanel isDark={isDark} t={t} />
    </SubView>
  );
};