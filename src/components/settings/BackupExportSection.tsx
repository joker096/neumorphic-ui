import React, { useRef, useState } from 'react';
import { Database, FileJson, FileUp, Lock, Trash2, Upload, X } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { SettingsGroup, SettingsRow, SettingsSectionTitle } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { toast } from '../ui/Toast';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { TextInputModal } from './TextInputModal';
import {
  applyBackup, clearLocalCache, decryptBackupFile, downloadBackup, downloadChatsExport,
  LAST_BACKUP_KEY, parseBackupFile,
} from '../../lib/backup';
import { isEncryptedBackup } from '../../lib/backupCrypto';
import type { BackupData } from '../../lib/backup';

interface BackupExportSectionProps {
  isDark?: boolean;
  onBack: () => void;
}

type PromptMode = 'backup' | 'chats' | 'decrypt' | null;

const readLastBackup = (): string | null => {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY);
  } catch {
    return null;
  }
};

export const BackupExportSection = ({ isDark = false, onBack }: BackupExportSectionProps) => {
  const { t } = useI18n();
  const [lastBackup, setLastBackup] = useState<string | null>(readLastBackup);
  const [busy, setBusy] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<PromptMode>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importPending, setImportPending] = useState<BackupData | null>(null);
  const [clearPending, setClearPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatLastBackup = (value: string | null): string => {
    if (!value) return t('settings.never', 'Never');
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const markBackupDone = () => {
    const now = new Date().toISOString();
    try {
      localStorage.setItem(LAST_BACKUP_KEY, now);
    } catch {
      /* storage unavailable */
    }
    setLastBackup(now);
  };

  const handleBackup = () => {
    if (busy === 'backup') return;
    setPrompt('backup');
  };

  const handleExportChats = () => setPrompt('chats');

  const confirmPassword = (value: string) => {
    const mode = prompt;
    if (mode === null) return;
    if (!value.trim()) {
      toast(t('toast.noPasswordProvided', 'No password provided'), 'error');
      return;
    }
    if (mode === 'backup' || mode === 'chats') {
      setBusy(mode);
      const task = mode === 'backup'
        ? downloadBackup(value).then(() => {
          markBackupDone();
          toast(t('toast.encryptedBackupCreated', 'Encrypted backup created'), 'success');
        })
        : downloadChatsExport(value).then(() => {
          toast(t('settings.exportSuccess', 'Export successful'), 'success');
        });
      void task
        .catch(() => toast(t('toast.couldNotEncryptBackup', 'Could not encrypt backup data'), 'error'))
        .finally(() => {
          setBusy(null);
          setPrompt(null);
        });
      return;
    }
    const file = pendingFile;
    if (!file) return;
    setBusy('import');
    void decryptBackupFile(file, value)
      .then((data) => setImportPending(data))
      .catch(() => toast(t('toast.couldNotDecryptBackup', 'Could not decrypt backup'), 'error'))
      .finally(() => {
        setBusy(null);
        setPrompt(null);
        setPendingFile(null);
      });
  };

  const handleFilePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy('import');
    void file.arrayBuffer()
      .then(async (buf) => {
        if (isEncryptedBackup(buf)) {
          setPendingFile(file);
          setPrompt('decrypt');
        } else {
          const data = await parseBackupFile(file);
          setImportPending(data);
        }
      })
      .catch(() => toast(t('settings.importFailed', 'Import failed'), 'error'))
      .finally(() => setBusy(null));
  };

  const confirmImport = async () => {
    const data = importPending;
    setImportPending(null);
    if (!data) return;
    setBusy('import');
    try {
      await applyBackup(data);
      markBackupDone();
      toast(t('toast.backupRestored', 'Backup restored'), 'success');
    } catch {
      toast(t('settings.importFailed', 'Import failed'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const confirmClear = async () => {
    setClearPending(false);
    setBusy('clear');
    try {
      await clearLocalCache();
      setLastBackup(null);
      toast(t('settings.cacheCleared', 'Cache cleared'), 'success');
    } catch {
      toast(t('settings.cacheClearFailed', 'Failed to clear cache'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const promptTitle = prompt === 'decrypt'
    ? t('toast.passwordRequiredDecryption', 'Password required')
    : t('toast.enterBackupPassword', 'Enter a password to encrypt your backup');

  return (
    <SubView title={t('settings.backupExport', 'Backup & Export')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.backup', 'Backup')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<Database size={16} />}
          iconBg={isDark ? 'bg-purple-500/10' : 'bg-purple-100'}
          iconColor={isDark ? 'text-purple-400' : 'text-purple-600'}
          title={t('settings.lastBackup', 'Last backup')}
          subtitle={formatLastBackup(lastBackup)}
          isDark={isDark}
        />
        <SettingsRow
          icon={<Upload size={16} />}
          iconBg={isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'}
          iconColor={isDark ? 'text-emerald-400' : 'text-emerald-600'}
          title={busy === 'backup' ? t('settings.working', 'Working…') : t('settings.createBackup', 'Back up now')}
          subtitle={t('settings.backupHowToExport', 'Create an encrypted backup file with all your data')}
          isDark={isDark}
          onClick={handleBackup}
        />
        <SettingsRow
          icon={<Lock size={16} />}
          iconBg={isDark ? 'bg-amber-500/10' : 'bg-amber-100'}
          iconColor={isDark ? 'text-amber-400' : 'text-amber-600'}
          title={t('settings.backupPasswordNote', 'Backups are encrypted with your password')}
          subtitle={t('settings.backupStoreSecurely', 'Store the backup file in a safe place')}
          isDark={isDark}
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.exportData', 'Export data')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<FileJson size={16} />}
          iconBg={isDark ? 'bg-cyan-500/10' : 'bg-cyan-100'}
          iconColor={isDark ? 'text-cyan-400' : 'text-cyan-600'}
          title={t('settings.exportJson', 'Export chat history (encrypted)')}
          subtitle={busy === 'export' ? t('settings.working', 'Working…') : t('settings.exportJsonSub', 'Messages, media links, settings')}
          isDark={isDark}
          onClick={handleExportChats}
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.importBackupFile', 'Import from backup file')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".enc,.json"
          className="hidden"
          onChange={handleFilePicked}
        />
        <SettingsRow
          icon={<FileUp size={16} />}
          iconBg={isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'}
          iconColor={isDark ? 'text-emerald-400' : 'text-emerald-600'}
          title={busy === 'import' ? t('settings.importing', 'Importing...') : t('settings.importBackupFile', 'Import from backup file')}
          subtitle={t('settings.importHowToImport', 'Select an encrypted backup file to restore')}
          isDark={isDark}
          onClick={() => fileInputRef.current?.click()}
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.dangerZone', 'Danger Zone')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<Trash2 size={16} />}
          iconBg={isDark ? 'bg-rose-500/10' : 'bg-rose-100'}
          iconColor={isDark ? 'text-rose-400' : 'text-rose-600'}
          title={t('settings.clearCache', 'Clear cache')}
          subtitle={t('settings.clearCacheSubtitle', 'Clear temporary files and cache data')}
          isDark={isDark}
          onClick={() => setClearPending(true)}
        />
      </SettingsGroup>

      <TextInputModal
        isOpen={prompt !== null}
        title={promptTitle}
        placeholder={t('settings.enterBackupPassword', 'Enter backup password...')}
        type="password"
        confirmLabel={t('common.confirm', 'Confirm')}
        cancelLabel={t('common.cancel', 'Cancel')}
        onConfirm={confirmPassword}
        onCancel={() => setPrompt(null)}
      />
      <ConfirmDialog
        isOpen={importPending !== null}
        title={t('settings.importBackupFile', 'Import from backup file')}
        message={t('settings.importWarning', 'Import will overwrite your current data')}
        confirmLabel={t('common.confirm', 'Confirm')}
        cancelLabel={t('common.cancel', 'Cancel')}
        confirmIcon={<Trash2 />}
        cancelIcon={<X />}
        variant="danger"
        theme={isDark ? 'dark' : 'light'}
        onConfirm={() => { void confirmImport(); }}
        onCancel={() => setImportPending(null)}
      />
      <ConfirmDialog
        isOpen={clearPending}
        title={t('settings.clearCache', 'Clear cache')}
        message={t('settings.confirmClearCache', 'Are you sure you want to clear all cache data?')}
        confirmLabel={t('common.confirm', 'Confirm')}
        cancelLabel={t('common.cancel', 'Cancel')}
        confirmIcon={<Trash2 />}
        cancelIcon={<X />}
        variant="danger"
        theme={isDark ? 'dark' : 'light'}
        onConfirm={() => { void confirmClear(); }}
        onCancel={() => setClearPending(false)}
      />
    </SubView>
  );
};
