import { HardDrive, Download, Database, Trash2, MessageSquare, Shield } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, SettingsToggleRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { useAppStore } from '../../store';

interface StorageSectionProps {
  isDark?: boolean;
  onBack: () => void;
}

const AUTO_LOAD_OPTIONS = ['never', 'wifi', 'always'] as const;
type AutoLoadOption = typeof AUTO_LOAD_OPTIONS[number];

export const StorageSection = ({ isDark = false, onBack }: StorageSectionProps) => {
  const { t } = useI18n();
  const mediaAutoLoad = useAppStore((s) => s.mediaAutoLoad);
  const setMediaAutoLoad = useAppStore((s) => s.setMediaAutoLoad);
  const draftsEnabled = useAppStore((s) => s.draftsEnabled);
  const setDraftsEnabled = useAppStore((s) => s.setDraftsEnabled);
  const offlineMode = useAppStore((s) => s.offlineMode);
  const setOfflineMode = useAppStore((s) => s.setOfflineMode);

  const cycleAutoLoad = () => {
    const current: AutoLoadOption = (AUTO_LOAD_OPTIONS as readonly string[]).includes(mediaAutoLoad)
      ? (mediaAutoLoad as AutoLoadOption)
      : 'wifi';
    const idx = AUTO_LOAD_OPTIONS.indexOf(current);
    setMediaAutoLoad(AUTO_LOAD_OPTIONS[(idx + 1) % AUTO_LOAD_OPTIONS.length]);
  };

  const handleClearCache = () => {
    try {
      if (typeof caches !== 'undefined') {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  return (
    <SubView title={t('settings.dataStorage')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.storageMediaSection', 'Media')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<Download size={16} />}
          iconBg={isDark ? "bg-amber-500/10" : "bg-amber-100"}
          iconColor={isDark ? "text-amber-400" : "text-amber-600"}
          title={t('settings.mediaAutoLoad', 'Auto-load media')}
          subtitle={t('settings.mediaAutoLoadSubtitle', 'Automatically download photos and videos')}
          isDark={isDark}
          value={t(`settings.autoLoad.${mediaAutoLoad}`, mediaAutoLoad)}
          onClick={cycleAutoLoad}
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.storageSecuritySection', 'Storage')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<Shield size={16} />}
          iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
          iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
          title={t('settings.localEncryption', 'Local encryption at rest')}
          subtitle={t('settings.localEncryptionSubtitle', 'AES-256-GCM for all local data')}
          isDark={isDark}
          value={t('settings.enabled', 'On')}
        />
        <SettingsToggleRow
          icon={<MessageSquare size={16} />}
          iconBg="t-accent-bg"
          iconColor="t-accent"
          title={t('settings.draftsSaved', 'Message drafts')}
          subtitle={t('settings.draftsSavedSubtitle', 'Unsent messages saved per chat')}
          isOn={draftsEnabled}
          isDark={isDark}
          onToggle={() => setDraftsEnabled(!draftsEnabled)}
        />
        <SettingsToggleRow
          icon={<Database size={16} />}
          iconBg={isDark ? "bg-purple-500/10" : "bg-purple-100"}
          iconColor={isDark ? "text-purple-400" : "text-purple-600"}
          title={t('settings.feedCacheSize', 'Offline mode (PWA)')}
          subtitle={t('settings.offlineModeSubtitle', 'Read chats and send messages when offline')}
          isOn={offlineMode}
          isDark={isDark}
          onToggle={() => setOfflineMode(!offlineMode)}
        />
        <SettingsRow
          icon={<Trash2 size={16} />}
          iconBg={isDark ? "bg-rose-500/10" : "bg-rose-100"}
          iconColor={isDark ? "text-rose-400" : "text-rose-600"}
          title={t('settings.clearCache', 'Clear cache')}
          subtitle={t('settings.clearCacheSubtitle', 'Remove downloaded media and temporary data')}
          isDark={isDark}
          onClick={handleClearCache}
        />
      </SettingsGroup>
    </SubView>
  );
};
