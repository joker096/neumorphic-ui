import { SettingsRow, SettingsGroup, SettingsSectionTitle, ToggleSwitch } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { EyeOff } from 'lucide-react';

interface PrivacySectionProps {
  isDark: boolean;
  visNumber: string;
  setVisNumber: (v: string) => void;
  visActivity: string;
  setVisActivity: (v: string) => void;
  dndEnabled: boolean;
  setDndEnabled: (v: boolean) => void;
  stealthMode: boolean;
  anonymousMode: boolean;
  deliveryReceipts: boolean;
  readReceipts: boolean;
  typingIndicators: boolean;
  onUpdateSettings: (settings: Record<string, unknown>) => void;
  onBack: () => void;
  t: (key: string) => string;
}

export const PrivacySection = ({
  isDark, visNumber, setVisNumber, visActivity, setVisActivity,
  dndEnabled, setDndEnabled, stealthMode, anonymousMode, deliveryReceipts, readReceipts, typingIndicators,
  onUpdateSettings, onBack, t
}: PrivacySectionProps) => (
  <SubView key="privacy" title={t('settings.privacy')} isDark={isDark} onBack={onBack}>
    <SettingsGroup isDark={isDark} className="mb-6">
      <SettingsRow 
        title={t('settings.whoSeesNumber')}
        value={visNumber} 
        isDark={isDark} 
        onClick={() => setVisNumber(visNumber === t('settings.visibility.none') ? t('settings.visibility.contacts') : visNumber === t('settings.visibility.contacts') ? t('settings.visibility.everyone') : t('settings.visibility.none'))}
      />
      <SettingsRow 
        title={t('settings.lastSeen')}
        value={visActivity} 
        isDark={isDark} 
        onClick={() => setVisActivity(visActivity === t('settings.visibility.none') ? t('settings.visibility.contacts') : visActivity === t('settings.visibility.contacts') ? t('settings.visibility.everyone') : t('settings.visibility.none'))}
      />
      <SettingsRow title={t('settings.blacklist')} value="0 users" isDark={isDark} />
    </SettingsGroup>
    
    <SettingsSectionTitle title={t('settings.dndMode')} isDark={isDark} />
    <SettingsGroup isDark={isDark} className="mb-6">
      <SettingsRow
        title={t('settings.dnd')}
        subtitle={t('settings.dndSubtitle')}
        isDark={isDark}
        rightElement={<ToggleSwitch isOn={dndEnabled} onToggle={() => setDndEnabled(!dndEnabled)} isDark={isDark} />}
        onClick={() => setDndEnabled(!dndEnabled)}
      />
    </SettingsGroup>
    
    <SettingsSectionTitle title={t('settings.advancedPrivacy')} isDark={isDark} />
    <SettingsGroup isDark={isDark}>
      <SettingsRow
        title={t('settings.stealthMode')}
        subtitle={t('settings.stealthModeSubtitle')}
        isDark={isDark}
        rightElement={<ToggleSwitch isOn={stealthMode} onToggle={() => onUpdateSettings({ stealthMode: !stealthMode })} isDark={isDark} />}
        onClick={() => onUpdateSettings({ stealthMode: !stealthMode })}
      />
      <SettingsRow
        title={t("settings.anonymousMode")}
        subtitle={t('settings.anonymousModeSubtitle')}
        isDark={isDark}
        icon={<EyeOff size={16} />}
        iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
        iconColor={isDark ? "text-red-400" : "text-red-600"}
        rightElement={<ToggleSwitch isOn={anonymousMode} onToggle={() => onUpdateSettings({ anonymousMode: !anonymousMode })} isDark={isDark} />}
        onClick={() => onUpdateSettings({ anonymousMode: !anonymousMode })}
      />
      <SettingsRow
        title={t('settings.deliveryReceipts')}
        subtitle={t('settings.deliveryReceiptsSubtitle')}
        isDark={isDark}
        rightElement={<ToggleSwitch isOn={deliveryReceipts} onToggle={() => onUpdateSettings({ deliveryReceipts: !deliveryReceipts })} isDark={isDark} />}
        onClick={() => onUpdateSettings({ deliveryReceipts: !deliveryReceipts })}
      />
      <SettingsRow
        title={t('settings.receipts')}
        subtitle={t('settings.receiptsEnableSubtitle')}
        isDark={isDark}
        rightElement={<ToggleSwitch isOn={readReceipts} onToggle={() => onUpdateSettings({ readReceipts: !readReceipts })} isDark={isDark} />}
        onClick={() => onUpdateSettings({ readReceipts: !readReceipts })}
      />
      <SettingsRow
        title={t('settings.typingIndicators')}
        subtitle={t('settings.typingIndicatorsSubtitle')}
        isDark={isDark}
        rightElement={<ToggleSwitch isOn={typingIndicators} onToggle={() => onUpdateSettings({ typingIndicators: !typingIndicators })} isDark={isDark} />}
        onClick={() => onUpdateSettings({ typingIndicators: !typingIndicators })}
      />
    </SettingsGroup>
  </SubView>
);