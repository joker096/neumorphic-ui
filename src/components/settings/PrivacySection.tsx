import { useState } from 'react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, ToggleSwitch } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { EyeOff, Shield, ShieldOff, Eye, Bell, BellOff, UserCheck, UserX, Check, X, MessageSquare, Wifi, WifiOff, Share, FileText } from 'lucide-react';
import { TextInputModal } from '../settings/TextInputModal';

interface PrivacySectionProps {
  isDark?: boolean;
  visNumber: string;
  setVisNumber: (v: string) => void;
  visActivity: string;
  setVisActivity: (v: string) => void;
  dndEnabled: boolean;
  setDndEnabled: (v: boolean) => void;
  dndFrom?: string;
  setDndFrom?: (v: string) => void;
  dndTo?: string;
  setDndTo?: (v: string) => void;
  priorityContacts?: string;
  setPriorityContacts?: (v: string) => void;
  stealthMode: boolean;
  anonymousMode: boolean;
  deliveryReceipts: boolean;
  readReceipts: boolean;
  typingIndicators: boolean;
  ghostViewMode?: boolean;
  forwardAnonymization?: boolean;
  onlineStatus?: boolean;
  allowForwarding?: boolean;
  setAllowForwarding?: (v: boolean) => void;
  allowMetadata?: boolean;
  setAllowMetadata?: (v: boolean) => void;
  forwardCountLimit?: number;
  setForwardCountLimit?: (v: number) => void;
  onUpdateSettings: (settings: Record<string, unknown>) => void;
  onBack: () => void;
  t: (key: string) => string;
}

export const PrivacySection = ({
  isDark = false, visNumber, setVisNumber, visActivity, setVisActivity,
  dndEnabled, setDndEnabled, dndFrom, setDndFrom, dndTo, setDndTo,
  priorityContacts, setPriorityContacts,
  stealthMode, anonymousMode, deliveryReceipts, readReceipts, typingIndicators,
  ghostViewMode, forwardAnonymization, onlineStatus, allowForwarding, setAllowForwarding,
  allowMetadata, setAllowMetadata, forwardCountLimit, setForwardCountLimit,
  onUpdateSettings, onBack, t
}: PrivacySectionProps) => {
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const handlePrioritySave = (name: string) => {
    if (setPriorityContacts && name.trim()) {
      setPriorityContacts(name.trim());
    }
    setShowPriorityModal(false);
  };

  return (
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
          onClick={() => setVisActivity(visActivity === t('settings.visibility.none') ? t('settings.visibility.contacts') : visActivity === t('settings.visibility.everyone') ? t('settings.visibility.none') : t('settings.visibility.contacts'))}
        />
        <SettingsRow
          title={t('settings.ghostViewMode')}
          subtitle={t('settings.ghostViewModeSubtitle')}
          isDark={isDark}
          rightElement={<ToggleSwitch isOn={ghostViewMode || false} onToggle={() => onUpdateSettings({ ghostViewMode: !ghostViewMode })} isDark={isDark} onIcon={<Eye size={14} />} offIcon={<EyeOff size={14} />} />}
          onClick={() => onUpdateSettings({ ghostViewMode: !ghostViewMode })}
        />
        <SettingsRow title={t('settings.blacklist')} value="0 users" isDark={isDark} />
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.dndMode')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          title={t('settings.dnd')}
          subtitle={t('settings.dndSubtitle')}
          isDark={isDark}
          rightElement={<ToggleSwitch isOn={dndEnabled} onToggle={() => setDndEnabled(!dndEnabled)} isDark={isDark} onIcon={<BellOff size={14} />} offIcon={<Bell size={14} />} />}
          onClick={() => setDndEnabled(!dndEnabled)}
        />
        {dndFrom && dndTo && setDndFrom && setDndTo && (
          <>
            <SettingsRow
              title={t('settings.dndFrom')}
              value={dndFrom}
              isDark={isDark}
              onClick={() => setDndFrom(dndFrom === '22:00' ? '21:00' : '22:00')}
            />
            <SettingsRow
              title={t('settings.dndTo')}
              value={dndTo}
              isDark={isDark}
              onClick={() => setDndTo(dndTo === '08:00' ? '09:00' : '08:00')}
            />
          </>
        )}
        {priorityContacts && setPriorityContacts && (
          <SettingsRow
            title={t('settings.priorityContacts')}
            subtitle={priorityContacts || t('settings.noPriorityContacts')}
            isDark={isDark}
            onClick={() => setShowPriorityModal(true)}
          />
        )}
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.advancedPrivacy')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          title={t('settings.stealthMode')}
          subtitle={t('settings.stealthModeSubtitle')}
          isDark={isDark}
          rightElement={<ToggleSwitch isOn={stealthMode} onToggle={() => onUpdateSettings({ stealthMode: !stealthMode })} isDark={isDark} onIcon={<ShieldOff size={14} />} offIcon={<Shield size={14} />} />}
          onClick={() => onUpdateSettings({ stealthMode: !stealthMode })}
        />
        <SettingsRow
          title={t("settings.anonymousMode")}
          subtitle={t('settings.anonymousModeSubtitle')}
          isDark={isDark}
          icon={<EyeOff size={16} />}
          iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
          iconColor={isDark ? "text-red-400" : "text-red-600"}
          rightElement={<ToggleSwitch isOn={anonymousMode} onToggle={() => onUpdateSettings({ anonymousMode: !anonymousMode })} isDark={isDark} onIcon={<EyeOff size={14} />} offIcon={<Eye size={14} />} />}
          onClick={() => onUpdateSettings({ anonymousMode: !anonymousMode })}
        />
        <SettingsRow
          title={t('settings.deliveryReceipts')}
          subtitle={t('settings.deliveryReceiptsSubtitle')}
          isDark={isDark}
          rightElement={<ToggleSwitch isOn={deliveryReceipts} onToggle={() => onUpdateSettings({ deliveryReceipts: !deliveryReceipts })} isDark={isDark} onIcon={<Check size={14} />} offIcon={<X size={14} />} />}
          onClick={() => onUpdateSettings({ deliveryReceipts: !deliveryReceipts })}
        />
        <SettingsRow
          title={t('settings.receipts')}
          subtitle={t('settings.receiptsEnableSubtitle')}
          isDark={isDark}
          rightElement={<ToggleSwitch isOn={readReceipts} onToggle={() => onUpdateSettings({ readReceipts: !readReceipts })} isDark={isDark} onIcon={<Check size={14} />} offIcon={<X size={14} />} />}
          onClick={() => onUpdateSettings({ readReceipts: !readReceipts })}
        />
        <SettingsRow
          title={t('settings.typingIndicators')}
          subtitle={t('settings.typingIndicatorsSubtitle')}
          isDark={isDark}
          rightElement={<ToggleSwitch isOn={typingIndicators} onToggle={() => onUpdateSettings({ typingIndicators: !typingIndicators })} isDark={isDark} onIcon={<MessageSquare size={14} />} offIcon={<MessageSquare size={14} />} />}
          onClick={() => onUpdateSettings({ typingIndicators: !typingIndicators })}
        />
        {onlineStatus !== undefined && (
          <SettingsRow
            title={t('settings.onlineStatus')}
            subtitle={t('settings.onlineStatusSubtitle') || 'Show when you are online'}
            isDark={isDark}
            rightElement={<ToggleSwitch isOn={onlineStatus} onToggle={() => onUpdateSettings({ onlineStatus: !onlineStatus })} isDark={isDark} onIcon={<Wifi size={14} />} offIcon={<WifiOff size={14} />} />}
            onClick={() => onUpdateSettings({ onlineStatus: !onlineStatus })}
          />
        )}
        {allowForwarding !== undefined && setAllowForwarding && (
          <SettingsRow
            title={t('settings.forwardAllow')}
            subtitle={t('settings.forwardAllowSubtitle')}
            isDark={isDark}
            rightElement={<ToggleSwitch isOn={allowForwarding} onToggle={() => setAllowForwarding(!allowForwarding)} isDark={isDark} onIcon={<Share size={14} />} offIcon={<Share size={14} />} />}
            onClick={() => setAllowForwarding(!allowForwarding)}
          />
        )}
        {allowMetadata !== undefined && setAllowMetadata && (
          <SettingsRow
            title={t('settings.allowMetadata')}
            subtitle={t('settings.allowMetadataSubtitle')}
            isDark={isDark}
            rightElement={<ToggleSwitch isOn={allowMetadata} onToggle={() => setAllowMetadata(!allowMetadata)} isDark={isDark} onIcon={<FileText size={14} />} offIcon={<FileText size={14} />} />}
            onClick={() => setAllowMetadata(!allowMetadata)}
          />
        )}
        {forwardCountLimit !== undefined && setForwardCountLimit && (
          <SettingsRow
            title={t('settings.forwardLimit')}
            value={String(forwardCountLimit)}
            isDark={isDark}
            onClick={() => setForwardCountLimit(forwardCountLimit === 3 ? 5 : forwardCountLimit === 5 ? 10 : 3)}
          />
        )}
      </SettingsGroup>

<TextInputModal
         isOpen={showPriorityModal}
         title={t('settings.priorityContacts')}
         placeholder={t('settings.enterPriorityContacts')}
         onConfirm={(name) => {
           if (setPriorityContacts && name.trim()) setPriorityContacts(name.trim());
           setShowPriorityModal(false);
         }}
         onCancel={() => setShowPriorityModal(false)}
         confirmLabel={t('common.confirm')}
         cancelLabel={t('common.cancel')}
       />
    </SubView>
  );
};
