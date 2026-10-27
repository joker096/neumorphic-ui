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
    <SubView title={t('settings.security')} onBack={onBack}>
      <AppLockPanel t={t} />

      <TwoFactorPanel t={t} />

      <KeyRecoveryPanel t={t} />

      {/* Only facts we can actually observe are shown. The previous
          "Active sessions — no other active sessions" and "Login history"
          rows were static text for capabilities the local-first app does not
          have: there is no session registry to read, so the first row asserted
          something unverifiable (and wrong as soon as a second peer connects)
          and the second advertised a log that does not exist. */}
      <SettingsSectionTitle title={t('settings.sessionsDevices')} />
      <SettingsGroup className="mb-6">
        <SettingsRow
          icon={<Monitor size={16} />}
          iconBg="bg-emerald-100 dark:bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
          title={t('settings.thisDevice')}
          subtitle={t('settings.thisDeviceSubtitle')}
          
        />
      </SettingsGroup>

      <DangerZonePanel t={t} />
    </SubView>
  );
};