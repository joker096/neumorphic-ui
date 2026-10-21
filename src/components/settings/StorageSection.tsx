import { useState } from 'react';
import { Trash2, Shield, CloudOff, FileText, X } from 'lucide-react';
import { toast } from '../ui/Toast';
import { useI18n } from '../../lib/i18n';
import { clearAppCache } from '../../lib/appCache';
import { useAppStore } from '../../store';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, SettingsToggleRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface StorageSectionProps {
  isDark?: boolean;
  onBack: () => void;
}

export const StorageSection = ({ isDark = false, onBack }: StorageSectionProps) => {
  const { t } = useI18n();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const offlineMode = useAppStore((s) => s.offlineMode);
  const setOfflineMode = useAppStore((s) => s.setOfflineMode);
  const draftsEnabled = useAppStore((s) => s.draftsEnabled);
  const setDraftsEnabled = useAppStore((s) => s.setDraftsEnabled);

  const handleClearCache = async () => {
    setConfirmOpen(false);
    try {
      const removed = await clearAppCache();
      toast(t('settings.cacheCleared', 'Cache cleared'), 'success');
      if (removed === 0) toast(t('settings.cacheAlreadyEmpty', 'Nothing to clear'), 'info');
    } catch {
      toast(t('settings.cacheClearFailed', 'Failed to clear cache'), 'error');
    }
  };

  return (
    <SubView title={t('settings.dataStorage')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.storageSecuritySection', 'Storage')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<Shield size={16} />}
          iconBg="bg-emerald-100 dark:bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
          title={t('settings.localEncryption', 'Local encryption at rest')}
          subtitle={t('settings.localEncryptionSubtitle', 'Secrets (2FA, TURN) encrypted with AES-256-GCM. Chats stay readable to the browser')}
          isDark={isDark}
          value={t('settings.enabled', 'On')}
        />
        <SettingsToggleRow
          icon={<CloudOff size={16} />}
          iconBg="bg-sky-100 dark:bg-sky-500/10"
          iconColor="text-sky-600 dark:text-sky-400"
          title={t('settings.offlineMode', 'Offline queue')}
          subtitle={t('settings.offlineModeSubtitle', 'Keep messages on this device and send them when the connection returns')}
          isOn={offlineMode}
          onToggle={() => setOfflineMode(!offlineMode)}
          isDark={isDark}
        />
        <SettingsToggleRow
          icon={<FileText size={16} />}
          iconBg="bg-violet-100 dark:bg-violet-500/10"
          iconColor="text-violet-600 dark:text-violet-400"
          title={t('settings.draftsSaved', 'Message drafts')}
          subtitle={t('settings.draftsSavedSubtitle', 'Unsent messages saved per chat')}
          isOn={draftsEnabled}
          onToggle={() => setDraftsEnabled(!draftsEnabled)}
          isDark={isDark}
        />
        <SettingsRow
          icon={<Trash2 size={16} />}
          iconBg="bg-rose-100 dark:bg-rose-500/10"
          iconColor="text-rose-600 dark:text-rose-400"
          title={t('settings.clearCache', 'Clear cache')}
          subtitle={t('settings.clearCacheSubtitle', 'Re-downloadable media and app cache only. Recordings, drafts and chats are kept')}
          isDark={isDark}
          onClick={() => setConfirmOpen(true)}
        />
      </SettingsGroup>

      <ConfirmDialog
        isOpen={confirmOpen}
        title={t('settings.clearCache', 'Clear cache')}
        message={t('settings.confirmClearCache', 'Re-downloadable media and the app cache will be removed. Chats, contacts, drafts, saved messages and call recordings are kept.')}
        confirmLabel={t('common.confirm', 'Confirm')}
        cancelLabel={t('common.cancel', 'Cancel')}
        confirmIcon={<Trash2 />}
        cancelIcon={<X />}
        variant="danger"
        theme={isDark ? 'dark' : 'light'}
        onConfirm={() => { void handleClearCache(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </SubView>
  );
};
