import { useState } from 'react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, ToggleSwitch } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { EyeOff, Shield, ShieldOff, Eye, Bell, BellOff, Check, X, MessageSquare, Wifi, WifiOff, Share, Download, Clock } from 'lucide-react';
import { TextInputModal } from '../settings/TextInputModal';

interface PrivacySectionProps {
  isDark?: boolean;
  dndEnabled: boolean;
  setDndEnabled: (v: boolean) => void;
  dndFrom?: string;
  setDndFrom?: (v: string) => void;
  dndTo?: string;
  setDndTo?: (v: string) => void;
  priorityContacts?: string;
  setPriorityContacts?: (v: string) => void;
  stealthMode: boolean;
  deliveryReceipts: boolean;
  readReceipts: boolean;
  typingIndicators: boolean;
  ghostViewMode?: boolean;
  forwardAnonymization?: boolean;
  setForwardAnonymization?: (v: boolean) => void;
  onlineStatus?: boolean;
  onUpdateSettings: (settings: Record<string, unknown>) => void;
  onBack: () => void;
  t: (key: string, fallback?: string) => string;
  mediaAutoLoad?: string;
  setMediaAutoLoad?: (v: string) => void;
  selfDestructDefault?: string;
  setSelfDestructDefault?: (v: string) => void;
  premium?: boolean;
}

export const PrivacySection = ({
  isDark = false,
  dndEnabled, setDndEnabled, dndFrom, setDndFrom, dndTo, setDndTo,
  priorityContacts, setPriorityContacts,
  stealthMode, deliveryReceipts, readReceipts, typingIndicators,
  ghostViewMode, forwardAnonymization, setForwardAnonymization, onlineStatus,
  onUpdateSettings, onBack, t, mediaAutoLoad, setMediaAutoLoad, selfDestructDefault, setSelfDestructDefault,
  premium
}: PrivacySectionProps) => {
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const handlePrioritySave = (name: string) => {
    if (setPriorityContacts && name.trim()) {
      setPriorityContacts(name.trim());
    }
    setShowPriorityModal(false);
  };

  const cycleMediaAutoLoad = () => {
    const options = ['Off', 'Wi-Fi', 'Always'];
    const idx = options.indexOf(mediaAutoLoad as string);
    const next = options[(idx + 1) % options.length];
    if (setMediaAutoLoad) setMediaAutoLoad(next);
  };

  const cycleSelfDestructDefault = () => {
    const options = premium ? ['Off', '1 min', '5 min', '1 hour', '1 day'] : ['Off', '1 min', '5 min'];
    const idx = options.indexOf(selfDestructDefault as string);
    const next = options[(idx + 1) % options.length];
    if (setSelfDestructDefault) setSelfDestructDefault(next);
  };

  const mediaAutoLoadLabel = (v: string) =>
    v === 'Off' ? t('settings.autoLoad.never', 'Off')
      : v === 'Wi-Fi' ? t('settings.autoLoad.wifi', 'Wi-Fi')
      : v === 'Always' ? t('settings.autoLoad.always', 'Always')
      : v;

  const selfDestructLabel = (v: string) =>
    v === 'Off' ? t('settings.selfDestruct.off', 'Off')
      : v === '1 min' ? t('settings.selfDestruct.1min', '1 min')
      : v === '5 min' ? t('settings.selfDestruct.5min', '5 min')
      : v === '1 hour' ? t('settings.selfDestruct.1hour', '1 hour')
      : v === '1 day' ? t('settings.selfDestruct.1day', '1 day')
      : v;

  return (
    <SubView key="privacy" title={t('settings.privacy')} isDark={isDark} onBack={onBack}>
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          title={t('settings.ghostViewMode')}
          subtitle={t('settings.ghostViewModeSubtitle')}
          isDark={isDark}
          rightElement={<ToggleSwitch isOn={ghostViewMode || false} onToggle={() => onUpdateSettings({ ghostViewMode: !ghostViewMode })} isDark={isDark} onIcon={<Eye size={14} />} offIcon={<EyeOff size={14} />} ariaLabel={t('settings.ghostViewMode')} />}
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
          rightElement={<ToggleSwitch isOn={dndEnabled} onToggle={() => setDndEnabled(!dndEnabled)} isDark={isDark} onIcon={<BellOff size={14} />} offIcon={<Bell size={14} />} ariaLabel={t('settings.dnd')} />}
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

      <SettingsSectionTitle title={t('settings.mediaAndMessages')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        {mediaAutoLoad !== undefined && setMediaAutoLoad && (
          <SettingsRow
            icon={<Download size={16} />}
            iconBg={isDark ? "bg-cyan-500/10" : "bg-cyan-100"}
            iconColor={isDark ? "text-cyan-400" : "text-cyan-600"}
            title={t('settings.mediaAutoLoad')}
            subtitle={t('settings.mediaAutoLoadSubtitle')}
            value={mediaAutoLoadLabel(mediaAutoLoad as string)}
            isDark={isDark}
            onClick={cycleMediaAutoLoad}
          />
        )}
        {selfDestructDefault !== undefined && setSelfDestructDefault && (
          <SettingsRow
            icon={<Clock size={16} />}
            iconBg="t-accent-bg"
            iconColor="t-accent"
            title={t('settings.selfDestructDefault')}
            subtitle={premium ? t('settings.selfDestructDefaultSubtitle') : t('premium.gatingSelfDestruct')}
            value={selfDestructLabel(selfDestructDefault as string)}
            isDark={isDark}
            onClick={cycleSelfDestructDefault}
          />
        )}
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.advancedPrivacy')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          title={t('settings.stealthMode')}
          subtitle={t('settings.stealthModeSubtitle')}
          isDark={isDark}
          rightElement={<ToggleSwitch isOn={stealthMode} onToggle={() => onUpdateSettings({ stealthMode: !stealthMode })} isDark={isDark} onIcon={<ShieldOff size={14} />} offIcon={<Shield size={14} />} ariaLabel={t('settings.stealthMode')} />}
          onClick={() => onUpdateSettings({ stealthMode: !stealthMode })}
        />
        <SettingsRow
          title={t('settings.deliveryReceipts')}
          subtitle={t('settings.deliveryReceiptsSubtitle')}
          isDark={isDark}
          rightElement={<ToggleSwitch isOn={deliveryReceipts} onToggle={() => onUpdateSettings({ deliveryReceipts: !deliveryReceipts })} isDark={isDark} onIcon={<Check size={14} />} offIcon={<X size={14} />} ariaLabel={t('settings.deliveryReceipts')} />}
          onClick={() => onUpdateSettings({ deliveryReceipts: !deliveryReceipts })}
        />
        <SettingsRow
          title={t('settings.receipts')}
          subtitle={t('settings.receiptsEnableSubtitle')}
          isDark={isDark}
          rightElement={<ToggleSwitch isOn={readReceipts} onToggle={() => onUpdateSettings({ readReceipts: !readReceipts })} isDark={isDark} onIcon={<Check size={14} />} offIcon={<X size={14} />} ariaLabel={t('settings.receipts')} />}
          onClick={() => onUpdateSettings({ readReceipts: !readReceipts })}
        />
        <SettingsRow
          title={t('settings.typingIndicators')}
          subtitle={t('settings.typingIndicatorsSubtitle')}
          isDark={isDark}
          rightElement={<ToggleSwitch isOn={typingIndicators} onToggle={() => onUpdateSettings({ typingIndicators: !typingIndicators })} isDark={isDark} onIcon={<MessageSquare size={14} />} offIcon={<MessageSquare size={14} />} ariaLabel={t('settings.typingIndicators')} />}
          onClick={() => onUpdateSettings({ typingIndicators: !typingIndicators })}
        />
        {onlineStatus !== undefined && (
          <SettingsRow
            title={t('settings.onlineStatus')}
            subtitle={t('settings.onlineStatusSubtitle')}
            isDark={isDark}
            rightElement={<ToggleSwitch isOn={onlineStatus} onToggle={() => onUpdateSettings({ onlineStatus: !onlineStatus })} isDark={isDark} onIcon={<Wifi size={14} />} offIcon={<WifiOff size={14} />} ariaLabel={t('settings.onlineStatus')} />}
            onClick={() => onUpdateSettings({ onlineStatus: !onlineStatus })}
          />
        )}
        {forwardAnonymization !== undefined && setForwardAnonymization && (
          <SettingsRow
            title={t('settings.forwardAnonymization')}
            subtitle={t('settings.forwardAnonymizationSubtitle')}
            isDark={isDark}
            rightElement={<ToggleSwitch isOn={forwardAnonymization} onToggle={() => setForwardAnonymization(!forwardAnonymization)} isDark={isDark} onIcon={<Share size={14} />} offIcon={<Share size={14} />} ariaLabel={t('settings.forwardAnonymization')} />}
            onClick={() => setForwardAnonymization(!forwardAnonymization)}
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
