import { useState } from 'react';
import { HardDrive, Download, Upload, Trash2, Key, Cloud, Info } from 'lucide-react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { toast } from 'sonner';
import { ConfirmModal } from './ConfirmModal';
import { TextInputModal } from './TextInputModal';
import { exportBackup, importBackup } from '../../lib/backup';
import { useAppStore } from '../../store';
import { getMasterKeySet } from '../../lib/identity/masterKey';

interface StorageSectionProps {
  isDark: boolean;
  onBack: () => void;
  t: (key: string) => string;
}

export const StorageSection = ({ isDark, onBack, t }: StorageSectionProps) => {
  const [importStatus, setImportStatus] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBackupInfo, setShowBackupInfo] = useState(false);
  const [showImportInfo, setShowImportInfo] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [activeImport, setActiveImport] = useState(false);

  const handleExport = () => {
    setActiveImport(false);
    setShowPasswordModal(true);
  };

  const handleImport = () => {
    setActiveImport(true);
    setShowPasswordModal(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    setShowPasswordModal(false);
    if (!password) return;

    if (activeImport) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.mabak';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        setImportStatus('importing');
        try {
          await importBackup(file, { password });
          setImportStatus('');
          toast.success(t('settings.importSuccess'));
        } catch {
          setImportStatus('');
          toast.error(t('settings.importFailed'));
        }
      };
      input.click();
    } else {
      try {
        const storeState = {
          chats: useAppStore.getState().chats,
          contacts: useAppStore.getState().contacts,
          channels: useAppStore.getState().channels,
          bots: useAppStore.getState().bots,
          settings: {
            soundEnabled: useAppStore.getState().soundEnabled,
            currentLanguage: useAppStore.getState().currentLanguage,
          }
        };
        const blob = await exportBackup(storeState, { password });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mess-anger-backup-${new Date().toISOString().slice(0, 10)}.mabak`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t('settings.exportSuccess'));
      } catch {
        toast.error(t('settings.exportFailed'));
      }
    }
  };

  const handleExportEncryptionKeys = async () => {
    try {
      const masterSet = await getMasterKeySet();
      const keysData = {
        exportedAt: new Date().toISOString(),
        masterSeed: Array.from(masterSet.seed).map(b => b.toString(16).padStart(2, '0')).join(''),
        x25519Public: Array.from(masterSet.x25519Public).map(b => b.toString(16).padStart(2, '0')).join('')
      };
      const blob = new Blob([JSON.stringify(keysData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mess-anger-keys-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('settings.encryptionKeysExported'));
    } catch {
      toast.error(t('settings.exportFailed'));
    }
  };

  const handleCloudBackup = async () => {
    try {
      const masterSet = await getMasterKeySet();
      const keysData = {
        exportedAt: new Date().toISOString(),
        masterSeed: Array.from(masterSet.seed).map(b => b.toString(16).padStart(2, '0')).join(''),
        x25519Public: Array.from(masterSet.x25519Public).map(b => b.toString(16).padStart(2, '0')).join('')
      };
      const blob = new Blob([JSON.stringify(keysData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mess-anger-cloud-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('settings.cloudBackupExported'));
    } catch {
      toast.error(t('settings.exportFailed'));
    }
  };

  const handleClearCache = () => {
    setShowConfirmClear(true);
  };

  const handleConfirmClear = () => {
    setShowConfirmClear(false);
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('mess_') && key !== 'mess_storage_import') {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      toast.success(t('settings.cacheCleared'));
    } catch {
      toast.error(t('settings.cacheClearFailed'));
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
rightElement={
              <div
                onClick={(e) => { e.stopPropagation(); setShowBackupInfo(true); }}
                className={`p-1 hover:text-emerald-400 transition-colors cursor-pointer`}
                title={t('settings.hexportHelp')}
              >
                <Info size={14} />
              </div>
            }
        />
        <SettingsRow
          icon={<Upload size={16} />}
          iconBg={isDark ? "bg-amber-500/10" : "bg-amber-100"}
          iconColor={isDark ? "text-amber-400" : "text-amber-600"}
          title={t('settings.importBackup.title')}
          subtitle={importStatus === 'importing' ? t('settings.importing') : t('settings.importBackupFile')}
          isDark={isDark}
          onClick={handleImport}
rightElement={
              <div
                onClick={(e) => { e.stopPropagation(); setShowImportInfo(true); }}
                className={`p-1 hover:text-amber-400 transition-colors cursor-pointer`}
                title={t('settings.himportHelp')}
              >
                <Info size={14} />
              </div>
            }
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
          onClick={handleExportEncryptionKeys}
        />
       <SettingsRow
             icon={<Cloud size={16} />}
             iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
             iconColor={isDark ? "text-blue-400" : "text-blue-600"}
             title={t('settings.cloudBackup')}
             subtitle={t('settings.cloudBackupSubtitle')}
           isDark={isDark}
           onClick={handleCloudBackup}
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

      <ConfirmModal
        isOpen={showConfirmClear}
        title={t('settings.clearCache')}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={handleConfirmClear}
        onCancel={() => setShowConfirmClear(false)}
      />

<TextInputModal
         isOpen={showPasswordModal}
         title={t('settings.backupPassword')}
         placeholder={t('settings.backupPassword')}
         type="password"
         onConfirm={handlePasswordConfirm}
         onCancel={() => { setShowPasswordModal(false); setImportStatus(''); }}
         confirmLabel={t('common.confirm')}
         cancelLabel={t('common.cancel')}
       />

      {/* Backup Info Modal */}
      {showBackupInfo && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBackupInfo(false)} />
          <div className={`relative w-full max-w-sm rounded-3xl shadow-2xl p-6 border ${isDark ? 'bg-[#1a1d24] border-white/10' : 'bg-white border-black/10'}`}>
            <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('settings.exportBackup')}</h3>
            <div className={`text-sm leading-relaxed space-y-3 mb-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              <p>• {t('settings.backupHowToExport')}</p>
              <p className="mt-2">• {t('settings.backupPasswordNote')}</p>
              <p className="mt-2">• {t('settings.backupStoreSecurely')}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBackupInfo(false)}
                className={`flex-1 h-11 rounded-2xl text-sm font-bold transition-colors active:scale-95 ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
              >
                {t('common.close')}
              </button>
              <button
                onClick={() => { setShowBackupInfo(false); handleExport(); }}
                className={`flex-1 h-11 rounded-2xl text-sm font-bold transition-colors active:scale-95 bg-emerald-500 hover:bg-emerald-600 text-white`}
              >
                {t('settings.exportBackup')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Info Modal */}
      {showImportInfo && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowImportInfo(false)} />
          <div className={`relative w-full max-w-sm rounded-3xl shadow-2xl p-6 border ${isDark ? 'bg-[#1a1d24] border-white/10' : 'bg-white border-black/10'}`}>
            <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('settings.importBackup.title')}</h3>
            <div className={`text-sm leading-relaxed space-y-3 mb-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              <p>• {t('settings.importHowToImport')}</p>
              <p className="mt-2">• {t('settings.importWarning')}</p>
              <p className="mt-2">• {t('settings.importCurrentDataWiped')}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowImportInfo(false)}
                className={`flex-1 h-11 rounded-2xl text-sm font-bold transition-colors active:scale-95 ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
              >
                {t('common.close')}
              </button>
<button
                 onClick={() => { setShowImportInfo(false); handleImport(); }}
                 className={`flex-1 h-11 rounded-2xl text-sm font-bold transition-colors active:scale-95 bg-amber-500 hover:bg-amber-600 text-white`}
               >
                 {t('settings.importBackup.title')}
               </button>
            </div>
          </div>
        </div>
      )}
    </SubView>
  );
};
