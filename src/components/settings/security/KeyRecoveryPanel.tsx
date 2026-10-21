import { useState } from 'react';
import { Key, ShieldCheck } from 'lucide-react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle } from '../../ui/SettingsRow';
import { toast } from 'sonner';
import { deviceSecurity } from '../../../lib/deviceSecurity';
import { useSecurityChallenge } from '../../../hooks/useSecurityChallenge';
import { SecurityChallengeModal } from './SecurityChallengeModal';
import { PANEL_FOOTER_CLASS } from './securityClasses';

interface KeyRecoveryPanelProps {
  isDark?: boolean;
  t: (key: string, fallback?: string) => string;
}

export const KeyRecoveryPanel = ({ isDark = false, t }: KeyRecoveryPanelProps) => {
  const [showKeyRecovery, setShowKeyRecovery] = useState(false);
  const [keyExportPass, setKeyExportPass] = useState('');
  const [keyExportPassConfirm, setKeyExportPassConfirm] = useState('');
  const [keyExportBundle, setKeyExportBundle] = useState('');
  const [keyImportBundle, setKeyImportBundle] = useState('');
  const [keyImportPass, setKeyImportPass] = useState('');
  const [keyBusy, setKeyBusy] = useState(false);
  const { challenge, require } = useSecurityChallenge();

  const handleKeyExport = async () => {
    if (keyBusy) return;
    if (!keyExportPass) {
      toast.error(t('settings.keyRecovery.exportPass'));
      return;
    }
    if (keyExportPass !== keyExportPassConfirm) {
      toast.error(t('settings.keyRecovery.exportPassMismatch'));
      return;
    }
    setKeyBusy(true);
    try {
      setKeyExportBundle(await deviceSecurity.exportEncryptedKey(keyExportPass));
      toast.success(t('settings.keyRecovery.exported'));
    } catch {
      toast.error(t('settings.keyRecovery.failed'));
    } finally {
      setKeyBusy(false);
    }
  };

  const generateBundle = () => {
    const started = require({
      level: 'strong',
      title: t('lock.stepUpTitle', "Confirm it's you"),
      message: t('lock.stepUpExportKey'),
      onVerified: handleKeyExport,
    });
    if (!started) toast.error(t('lock.setupPinFirst'));
  };

  const handleKeyCopy = async () => {
    try {
      await navigator.clipboard.writeText(keyExportBundle);
      toast.success(t('settings.keyRecovery.copied'));
    } catch {
      toast.error(t('settings.keyRecovery.failed'));
    }
  };

  const handleKeyImport = async () => {
    if (keyBusy) return;
    if (!keyImportBundle.trim() || !keyImportPass) {
      toast.error(t('settings.keyRecovery.failed'));
      return;
    }
    setKeyBusy(true);
    try {
      await deviceSecurity.importEncryptedKey(keyImportPass, keyImportBundle.trim());
      toast.success(t('settings.keyRecovery.imported'));
      setKeyImportBundle('');
      setKeyImportPass('');
    } catch {
      toast.error(t('settings.keyRecovery.failed'));
    } finally {
      setKeyBusy(false);
    }
  };

  const importBundle = () => {
    // Replacing the device key re-binds encryption to foreign key material,
    // so it needs the same proof as exporting it.
    const started = require({
      level: 'strong',
      title: t('lock.stepUpTitle', "Confirm it's you"),
      message: t('lock.stepUpImportKey'),
      onVerified: handleKeyImport,
    });
    if (!started) toast.error(t('lock.setupPinFirst'));
  };

  const handleKeyRestoreConfirm = async () => {
    try {
      await deviceSecurity.clearDeviceKeyOverride();
      toast.success(t('settings.keyRecovery.restored'));
    } catch {
      toast.error(t('settings.keyRecovery.failed'));
    }
  };

  const restoreDeviceKey = () => {
    const started = require({
      level: 'pin',
      title: t('lock.stepUpTitle', "Confirm it's you"),
      message: t('lock.stepUpRestoreKey'),
      onVerified: handleKeyRestoreConfirm,
    });
    if (!started) toast.error(t('lock.setupPinFirst'));
  };

  return (
    <>
      <SettingsSectionTitle title={t('settings.keyRecovery.title')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          icon={<Key size={16} />}
          iconBg="bg-emerald-100 dark:bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
          title={t('settings.keyRecovery.export')}
          subtitle={t('settings.keyRecovery.subtitle')}
          isDark={isDark}
          onClick={() => setShowKeyRecovery(v => !v)}
        />
        {showKeyRecovery && (
          <div className={PANEL_FOOTER_CLASS}>
            <p className={"text-xs mb-3 text-[var(--text-tertiary)] dark:text-[var(--text-secondary)]"}>
              {t('settings.keyRecovery.hint')}
            </p>
            <label htmlFor="key-recovery-export-pass" className={`block text-xs font-medium mb-1 text-[var(--text-secondary)]`}>
              {t('settings.keyRecovery.exportPass')}
            </label>
            <input
              id="key-recovery-export-pass"
              type="password"
              value={keyExportPass}
              onChange={e => setKeyExportPass(e.target.value)}
              placeholder={t('settings.keyRecovery.exportPassHint')}
              autoComplete="new-password"
              className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors border bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]`}
            />
            <label htmlFor="key-recovery-export-pass-confirm" className={`block text-xs font-medium mt-2 mb-1 text-[var(--text-secondary)]`}>
              {t('settings.keyRecovery.exportPassConfirm')}
            </label>
            <input
              id="key-recovery-export-pass-confirm"
              type="password"
              value={keyExportPassConfirm}
              onChange={e => setKeyExportPassConfirm(e.target.value)}
              placeholder={t('settings.keyRecovery.exportPassHint')}
              autoComplete="new-password"
              aria-invalid={!!keyExportPass && keyExportPassConfirm !== keyExportPass}
              className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors border bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] ${keyExportPassConfirm && keyExportPassConfirm !== keyExportPass ? "border-red-500" : ""}`}
            />
            <button
              type="button"
              onClick={generateBundle}
              disabled={keyBusy}
              className={"mt-2 w-full py-2 rounded-lg text-xs font-medium transition-colors bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 disabled:opacity-50"}
            >
              {t('settings.keyRecovery.generate')}
            </button>
            {keyExportBundle && (
              <div className="mt-2">
                <textarea
                  readOnly
                  value={keyExportBundle}
                  aria-label={t('settings.keyRecovery.export')}
                  className={"w-full h-28 px-2 py-2 rounded-lg text-xs font-mono resize-none focus:outline-none border bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]"}
                />
                <button
                  type="button"
                  onClick={handleKeyCopy}
                  className={"mt-1 w-full py-2 rounded-lg text-xs font-medium transition-colors bg-black/5 text-[var(--text-secondary)] hover:bg-black/10 dark:bg-white/10 dark:text-[var(--text-primary)] dark:hover:bg-white/20"}
                >
                  {t('settings.keyRecovery.copy')}
                </button>
              </div>
            )}
            <label htmlFor="key-recovery-import-bundle" className={`block text-xs font-medium mt-3 mb-1 text-[var(--text-secondary)]`}>
              {t('settings.keyRecovery.importBundle')}
            </label>
            <textarea
              id="key-recovery-import-bundle"
              value={keyImportBundle}
              onChange={e => setKeyImportBundle(e.target.value)}
              placeholder={t('settings.keyRecovery.import')}
              className={`w-full h-24 px-2 py-2 rounded-lg text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]`}
            />
            <label htmlFor="key-recovery-import-pass" className={`block text-xs font-medium mt-2 mb-1 text-[var(--text-secondary)]`}>
              {t('settings.keyRecovery.importPass')}
            </label>
            <input
              id="key-recovery-import-pass"
              type="password"
              value={keyImportPass}
              onChange={e => setKeyImportPass(e.target.value)}
              autoComplete="new-password"
              className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors border bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]`}
            />
            <button
              type="button"
              onClick={importBundle}
              disabled={keyBusy}
              className={"mt-2 w-full py-2 rounded-lg text-xs font-medium transition-colors bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 disabled:opacity-50"}
            >
              {t('settings.keyRecovery.import')}
            </button>
          </div>
        )}

        <SettingsRow
          icon={<ShieldCheck size={16} />}
          iconBg="bg-amber-100 dark:bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
          title={t('settings.keyRecovery.restore')}
          subtitle={t('settings.keyRecovery.restoreSubtitle')}
          isDark={isDark}
          onClick={restoreDeviceKey}
        />
      </SettingsGroup>

      <SecurityChallengeModal {...challenge} isDark={isDark} t={t} />
    </>
  );
};