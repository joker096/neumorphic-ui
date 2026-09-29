import { useState } from 'react';
import { Key, ShieldCheck } from 'lucide-react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle } from '../../ui/SettingsRow';
import { toast } from 'sonner';
import { ConfirmModal } from '../ConfirmModal';
import { deviceSecurity } from '../../../lib/deviceSecurity';

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
  const [showKeyRestoreConfirm, setShowKeyRestoreConfirm] = useState(false);

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

  const handleKeyRestoreConfirm = async () => {
    setShowKeyRestoreConfirm(false);
    try {
      await deviceSecurity.clearDeviceKeyOverride();
      toast.success(t('settings.keyRecovery.restored'));
    } catch {
      toast.error(t('settings.keyRecovery.failed'));
    }
  };

  return (
    <>
      <SettingsSectionTitle title={t('settings.keyRecovery.title')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          icon={<Key size={16} />}
          iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
          iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
          title={t('settings.keyRecovery.export')}
          subtitle={t('settings.keyRecovery.subtitle')}
          isDark={isDark}
          onClick={() => setShowKeyRecovery(v => !v)}
        />
        {showKeyRecovery && (
          <div className="px-4 py-3 border-t border-[var(--border-color)] dark:border-[var(--border-color)]">
            <p className={`text-xs mb-3 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
              {t('settings.keyRecovery.hint')}
            </p>
            <label htmlFor="key-recovery-export-pass" className={`block text-xs font-medium mb-1 ${isDark ? "text-gray-300" : "text-slate-600"}`}>
              {t('settings.keyRecovery.exportPass')}
            </label>
            <input
              id="key-recovery-export-pass"
              type="password"
              value={keyExportPass}
              onChange={e => setKeyExportPass(e.target.value)}
              placeholder={t('settings.keyRecovery.exportPassHint')}
              autoComplete="new-password"
              className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors border ${isDark ? "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] border-[var(--border-color)] text-slate-800"}`}
            />
            <label htmlFor="key-recovery-export-pass-confirm" className={`block text-xs font-medium mt-2 mb-1 ${isDark ? "text-gray-300" : "text-slate-600"}`}>
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
              className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors border ${isDark ? "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] border-[var(--border-color)] text-slate-800"} ${keyExportPassConfirm && keyExportPassConfirm !== keyExportPass ? "border-red-500" : ""}`}
            />
            <button
              type="button"
              onClick={handleKeyExport}
              disabled={keyBusy}
              className={`mt-2 w-full py-2 rounded-lg text-xs font-medium transition-colors ${isDark ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"} disabled:opacity-50`}
            >
              {t('settings.keyRecovery.generate')}
            </button>
            {keyExportBundle && (
              <div className="mt-2">
                <textarea
                  readOnly
                  value={keyExportBundle}
                  aria-label={t('settings.keyRecovery.export')}
                  className={`w-full h-28 px-2 py-2 rounded-lg text-[11px] font-mono resize-none focus:outline-none border ${isDark ? "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] border-[var(--border-color)] text-slate-700"}`}
                />
                <button
                  type="button"
                  onClick={handleKeyCopy}
                  className={`mt-1 w-full py-2 rounded-lg text-xs font-medium transition-colors ${isDark ? "bg-white/10 text-gray-300 hover:bg-white/20" : "bg-black/5 text-slate-600 hover:bg-black/10"}`}
                >
                  {t('settings.keyRecovery.copy')}
                </button>
              </div>
            )}
            <label htmlFor="key-recovery-import-bundle" className={`block text-xs font-medium mt-3 mb-1 ${isDark ? "text-gray-300" : "text-slate-600"}`}>
              {t('settings.keyRecovery.importBundle')}
            </label>
            <textarea
              id="key-recovery-import-bundle"
              value={keyImportBundle}
              onChange={e => setKeyImportBundle(e.target.value)}
              placeholder={t('settings.keyRecovery.import')}
              className={`w-full h-24 px-2 py-2 rounded-lg text-[11px] font-mono resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border ${isDark ? "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] border-[var(--border-color)] text-slate-800"}`}
            />
            <label htmlFor="key-recovery-import-pass" className={`block text-xs font-medium mt-2 mb-1 ${isDark ? "text-gray-300" : "text-slate-600"}`}>
              {t('settings.keyRecovery.importPass')}
            </label>
            <input
              id="key-recovery-import-pass"
              type="password"
              value={keyImportPass}
              onChange={e => setKeyImportPass(e.target.value)}
              autoComplete="new-password"
              className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors border ${isDark ? "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] border-[var(--border-color)] text-slate-800"}`}
            />
            <button
              type="button"
              onClick={handleKeyImport}
              disabled={keyBusy}
              className={`mt-2 w-full py-2 rounded-lg text-xs font-medium transition-colors ${isDark ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"} disabled:opacity-50`}
            >
              {t('settings.keyRecovery.import')}
            </button>
          </div>
        )}

        <SettingsRow
          icon={<ShieldCheck size={16} />}
          iconBg={isDark ? "bg-amber-500/10" : "bg-amber-100"}
          iconColor={isDark ? "text-amber-400" : "text-amber-600"}
          title={t('settings.keyRecovery.restore')}
          subtitle={t('settings.keyRecovery.restoreSubtitle')}
          isDark={isDark}
          onClick={() => setShowKeyRestoreConfirm(true)}
        />
      </SettingsGroup>

      <ConfirmModal
        isOpen={showKeyRestoreConfirm}
        title={t('settings.keyRecovery.restore')}
        message={t('settings.keyRecovery.confirmRestore')}
        confirmLabel={t('settings.keyRecovery.restore')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={handleKeyRestoreConfirm}
        onCancel={() => setShowKeyRestoreConfirm(false)}
      />
    </>
  );
};