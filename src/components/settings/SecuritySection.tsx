import { Shield } from 'lucide-react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, SettingsToggleRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';

interface SecuritySectionProps {
  isDark: boolean;
  onBack: () => void;
}

export const SecuritySection = ({ isDark, onBack }: SecuritySectionProps) => {
  return (
    <SubView title="Security" isDark={isDark} onBack={onBack}>
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          icon={<Shield size={16} />}
          iconBg={isDark ? "bg-rose-500/10" : "bg-rose-100"}
          iconColor={isDark ? "text-rose-400" : "text-rose-600"}
          title="App lock PIN"
          subtitle="Require PIN on app open"
          isDark={isDark}
          onClick={() => {}}
        />
      </SettingsGroup>
    </SubView>
  );
};