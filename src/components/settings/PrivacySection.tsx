import { useState } from 'react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, ToggleSwitch } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { EyeOff, Shield, ShieldOff, Eye, Bell, BellOff, Check, X, MessageSquare, Wifi, WifiOff, Share, Download, Clock, UserX } from 'lucide-react';
import { TextInputModal } from '../settings/TextInputModal';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store';
import { selfDestructLabel as selfDestructLabelShared, selfDestructOptions } from '../../lib/selfDestruct';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

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
  t: (key: string, fallback?: string | Record<string, string | number>) => string;
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
  const [timePrompt, setTimePrompt] = useState<'from' | 'to' | null>(null);
  const [showBlacklist, setShowBlacklist] = useState(false);
  const spamFilter = useAppStore((s) => s.spamFilter);
  const setSpamFilter = useAppStore((s) => s.setSpamFilter);
  const setContactBlocked = useAppStore((s) => s.setContactBlocked);
  const contacts = useAppStore((s) => s.contacts);
  const blockedContacts = contacts.filter((c: any) => c.isBlocked);
  const blockedCount = blockedContacts.length;

  const cycleMediaAutoLoad = () => {
    const options = ['Off', 'Wi-Fi', 'Always'];
    const idx = options.indexOf(mediaAutoLoad as string);
    const next = options[(idx + 1) % options.length];
    if (setMediaAutoLoad) setMediaAutoLoad(next);
  };

  const cycleSelfDestructDefault = () => {
    const options = selfDestructOptions(!!premium);
    const idx = options.indexOf(selfDestructDefault as string);
    const next = options[(idx + 1) % options.length]!;
    if (setSelfDestructDefault) setSelfDestructDefault(next);
  };

  const mediaAutoLoadLabel = (v: string) =>
    v === 'Off' ? t('settings.autoLoad.never', 'Off')
      : v === 'Wi-Fi' ? t('settings.autoLoad.wifi', 'Wi-Fi')
      : v === 'Always' ? t('settings.autoLoad.always', 'Always')
      : v;

  const selfDestructLabel = (v: string) => selfDestructLabelShared(t, v);


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
        <SettingsRow
          icon={<UserX size={16} />}
          iconBg={isDark ? "bg-rose-500/10" : "bg-rose-100"}
          iconColor={isDark ? "text-rose-400" : "text-rose-600"}
          title={t('settings.blacklist')}
          value={blockedCount > 0 ? t('settings.blacklistCount', { n: blockedCount }) : t('settings.blacklistEmpty', 'Empty')}
          isDark={isDark}
          onClick={blockedCount > 0 ? () => setShowBlacklist(true) : undefined}
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.spamProtection', 'Spam Protection')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          icon={<ShieldOff size={16} />}
          iconBg={isDark ? "bg-amber-500/10" : "bg-amber-100"}
          iconColor={isDark ? "text-amber-400" : "text-amber-600"}
          title={t('settings.spamFilter')}
          subtitle={t('settings.spamFilterSubtitle')}
          isDark={isDark}
          rightElement={<ToggleSwitch isOn={spamFilter} onToggle={() => setSpamFilter(!spamFilter)} isDark={isDark} onIcon={<Shield size={14} />} offIcon={<ShieldOff size={14} />} ariaLabel={t('settings.spamFilter')} />}
          onClick={() => setSpamFilter(!spamFilter)}
        />
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
              onClick={() => setTimePrompt('from')}
            />
            <SettingsRow
              title={t('settings.dndTo')}
              value={dndTo}
              isDark={isDark}
              onClick={() => setTimePrompt('to')}
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

        <TextInputModal
          isOpen={timePrompt !== null}
          title={timePrompt === 'from' ? t('settings.dndFrom') : t('settings.dndTo')}
          placeholder="22:00"
          initial={timePrompt === 'from' ? dndFrom : dndTo}
          onConfirm={(value) => {
            const next = value.trim();
            if (TIME_RE.test(next)) {
              if (timePrompt === 'from') setDndFrom?.(next);
              else setDndTo?.(next);
            }
            setTimePrompt(null);
          }}
          onCancel={() => setTimePrompt(null)}
          confirmLabel={t('common.confirm')}
          cancelLabel={t('common.cancel')}
        />

        <Modal
          isOpen={showBlacklist}
          onClose={() => setShowBlacklist(false)}
          title={t('settings.blacklist')}
          isDark={isDark}
          size="sm"
        >
          <ul className="flex flex-col divide-y divide-[var(--border-color)]">
            {blockedContacts.map((c: any) => (
              <li key={c.id} className="flex items-center gap-3 py-2 min-h-11">
                <span className="flex-1 min-w-0 truncate text-sm text-foreground">{c.name}</span>
                <button
                  type="button"
                  onClick={() => setContactBlocked(c.id, false)}
                  className="min-w-11 min-h-11 px-3 rounded-full text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors"
                >
                  {t('settings.unblock', 'Unblock')}
                </button>
              </li>
            ))}
          </ul>
        </Modal>
    </SubView>
  );
};
