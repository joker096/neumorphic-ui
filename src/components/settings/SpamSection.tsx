import { SettingsRow, SettingsGroup, SettingsSectionTitle, ToggleSwitch } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';

interface SpamSectionProps {
  isDark: boolean;
  spamFilterEnabled: boolean;
  setSpamFilterEnabled: (v: boolean) => void;
  onBack: () => void;
  t: (key: string) => string;
}

export const SpamSection = ({ isDark, spamFilterEnabled, setSpamFilterEnabled, onBack, t }: SpamSectionProps) => (
  <SubView title={t('settings.spamProtection')} isDark={isDark} onBack={onBack}>
    <SettingsGroup isDark={isDark} className="mb-6">
      <SettingsRow
        title={t('settings.spamFilter')}
        subtitle={t('settings.spamFilterSubtitle')}
        isDark={isDark}
        rightElement={
          <ToggleSwitch isOn={spamFilterEnabled} onToggle={() => setSpamFilterEnabled(!spamFilterEnabled)} isDark={isDark} />
        }
        onClick={() => setSpamFilterEnabled(!spamFilterEnabled)}
      />
    </SettingsGroup>
  </SubView>
);
