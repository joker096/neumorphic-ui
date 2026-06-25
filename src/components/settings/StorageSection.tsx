import { useState } from 'react';
import { HardDrive, Download, Upload, Trash2, Key, Cloud } from 'lucide-react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { toast } from 'sonner';
import { exportBackupFromStore } from '../../lib/backup';

interface StorageSectionProps {
  isDark: boolean;
  onBack: () => void;
  t: (key: string) => string;
}

export const StorageSection = ({ isDark, onBack, t }: StorageSectionProps) => {
  const [importStatus, setImportStatus] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [backupPassword, setBackupPassword] = useState("");

  const handleExport = async () => {
    try {
      await exportBackupFromStore(t);
      toast.success(t('settings.exportSuccess'));
    } catch {
      toast.error(t('settings.exportFailed'));
    }
  };

  const handleExportHtml = async () => {
    try {
      await exportBackupFromStore(t, true);
      toast.success(t('settings.exportSuccess'));
    } catch {
      toast.error(t('settings.exportFailed'));
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImportStatus('importing');
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        localStorage.setItem('mess_storage_import', JSON.stringify(data));
        setImportStatus('');
        toast.success(t('settings.importSuccess'));
      } catch {
        setImportStatus('');
        toast.error(t('settings.importFailed'));
      }
    };
    input.click();
  };

  const handleClearCache = () => {
    if (confirm(t('settings.confirmClearCache'))) {
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('mess_') && key !== 'mess_storage_import') {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        toast.success('Cache cleared');
      } catch {
        toast.error('Failed to clear cache');
      }
    }
  };

  return (
    <SubView title={t('settings.dataStorage')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.backup')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          icon={<Download size={16} />}
          iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
          iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
          title={t('settings.exportBackup')}
          subtitle={t('settings.jsonFormat')}
          isDark={isDark}
          onClick={handleExport}
        />
        <SettingsRow
          icon={<Download size={16} />}
          iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
          iconColor={isDark ? "text-blue-400" : "text-blue-600"}
          title={t('settings.exportHtml')}
          subtitle={t('settings.htmlFormat')}
          isDark={isDark}
          onClick={handleExportHtml}
        />
        <SettingsRow
          icon={<Upload size={16} />}
          iconBg={isDark ? "bg-amber-500/10" : "bg-amber-100"}
          iconColor={isDark ? "text-amber-400" : "text-amber-600"}
          title={t('settings.importBackup')}
          subtitle={importStatus === 'importing' ? t('settings.importing') : 'JSON file'}
          isDark={isDark}
          onClick={handleImport}
        />
      </SettingsGroup>

       <SettingsSectionTitle title={t('settings.encryptionKeys')} isDark={isDark} />
        <SettingsGroup isDark={isDark} className="mb-6">
          <SettingsRow
            icon={<Key size={16} />}
            iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
            iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
            title={t('settings.exportEncryptionKeys')}
            subtitle={t('settings.exportEncryptionKeysSubtitle')}
          isDark={isDark}
          onClick={() => toast.info('Encryption keys export')}
        />
       <SettingsRow
            icon={<Cloud size={16} />}
            iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
            iconColor={isDark ? "text-blue-400" : "text-blue-600"}
            title={t('settings.cloudBackup')}
            subtitle={t('settings.cloudBackupSubtitle')}
          isDark={isDark}
          onClick={() => toast.info('Cloud backup setup')}
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.storageUsage')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<Trash2 size={16} />}
          iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
          iconColor={isDark ? "text-red-400" : "text-red-600"}
          title={t('settings.clearCache')}
          subtitle={t('settings.clearCacheSubtitle')}
          isDark={isDark}
          onClick={handleClearCache}
        />
        <SettingsRow
          icon={<HardDrive size={16} />}
          iconBg={isDark ? "bg-gray-500/10" : "bg-gray-100"}
          iconColor={isDark ? "text-gray-400" : "text-gray-500"}
           title={t('settings.storageInfo')}
            subtitle={t('settings.storageInfo')}
          isDark={isDark}
          onClick={() => {
            if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
              navigator.storage.estimate().then(estimate => {
                toast.info(`Using ${(estimate.usage! / 1024 / 1024).toFixed(1)} MB of ${(estimate.quota! / 1024 / 1024).toFixed(1)} MB`);
              });
            } else {
              toast.info(t('settings.storageInfo'));
            }
          }}
        />
      </SettingsGroup>
    </SubView>
  );
};
