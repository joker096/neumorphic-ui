import { useState, useEffect } from 'react';
import { Shield, Key, Lock, Unlock, Timer, ShieldCheck, Fingerprint, LockKeyhole, Monitor, Trash2, Smartphone, Clock } from 'lucide-react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, ToggleSwitch, SettingsToggleRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { toast } from 'sonner';
import { ConfirmModal } from './ConfirmModal';
import { cryptoCore } from '../../lib/crypto/cryptoCore';
import { deviceSecurity } from '../../lib/deviceSecurity';
import { useAppStore } from '../../store';
import { isBiometricAvailable, registerBiometric } from '../../lib/biometric';
import { generateSecret, verifyTotp, otpauthUri, totpCode } from '../../lib/twoFactor';

interface SecuritySectionProps {
  isDark?: boolean;
  onBack: () => void;
  t: (key: string, fallback?: string) => string;
}

export const SecuritySection = ({ isDark = false, onBack, t }: SecuritySectionProps) => {
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinBusy, setPinBusy] = useState(false);
  const [pinMode, setPinMode] = useState<'set' | 'remove'>('set');
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const setAppLock = useAppStore(s => s.setAppLock);
  const appLockHashedPIN = useAppStore(s => s.appLockHashedPIN);
  const hasPin = appLockHashedPIN !== null;
  const biometricEnabled = useAppStore(s => s.appLockBiometricEnabled);
  const setAppLockBiometric = useAppStore(s => s.setAppLockBiometric);
  const autoLockOnBackground = useAppStore(s => s.appLockAutoLockOnBackground);
  const idleSeconds = useAppStore(s => s.appLockIdleSeconds);
  const setAppLockAutoLock = useAppStore(s => s.setAppLockAutoLock);
  const lockApp = useAppStore(s => s.lockApp);
  const hasMethod = hasPin || biometricEnabled;
  const twoFactor = useAppStore(s => s.twoFactor);
  const setTwoFactor = useAppStore(s => s.setTwoFactor);
  const setTotpSecret = useAppStore(s => s.setTotpSecret);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [totpDraftSecret, setTotpDraftSecret] = useState('');
  const [totpInput, setTotpInput] = useState('');
  const [totpBusy, setTotpBusy] = useState(false);
  const [totpCodeNow, setTotpCodeNow] = useState('');
  const [showKeyRecovery, setShowKeyRecovery] = useState(false);
  const [keyExportPass, setKeyExportPass] = useState('');
  const [keyExportPassConfirm, setKeyExportPassConfirm] = useState('');
  const [keyExportBundle, setKeyExportBundle] = useState('');
  const [keyImportBundle, setKeyImportBundle] = useState('');
  const [keyImportPass, setKeyImportPass] = useState('');
  const [keyBusy, setKeyBusy] = useState(false);
  const [showKeyRestoreConfirm, setShowKeyRestoreConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    let mounted = true;
    isBiometricAvailable().then((ok) => { if (mounted) setBiometricSupported(ok); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!showTotpSetup || !totpDraftSecret) {
      setTotpCodeNow('');
      return;
    }
    let mounted = true;
    let timer: ReturnType<typeof setInterval>;
    const refresh = () => {
      totpCode(totpDraftSecret).then((code) => { if (mounted) setTotpCodeNow(code); }).catch(() => {});
    };
    refresh();
    timer = setInterval(refresh, 1000);
    return () => { mounted = false; clearInterval(timer); };
  }, [showTotpSetup, totpDraftSecret]);

  const openTotpSetup = () => {
    setTotpDraftSecret(generateSecret());
    setTotpInput('');
    setShowTotpSetup(true);
  };

  const confirmTotpSetup = async () => {
    if (totpBusy) return;
    if (totpInput.length !== 6) {
      toast.error(t('settings.totpInvalid'));
      return;
    }
    setTotpBusy(true);
    try {
      const ok = await verifyTotp(totpDraftSecret, totpInput);
      if (!ok) {
        toast.error(t('settings.totpInvalid'));
        setTotpInput('');
        return;
      }
      setTotpSecret(totpDraftSecret);
      setTwoFactor(true);
      setShowTotpSetup(false);
      setTotpInput('');
      toast.success(t('settings.totpEnabled'));
    } finally {
      setTotpBusy(false);
    }
  };

  const disableTwoFactor = () => {
    setTwoFactor(false);
    setTotpSecret(null);
    toast.success(t('settings.totpDisabled'));
  };

  const handleToggleBiometric = async () => {
    if (biometricBusy) return;
    if (!biometricSupported) {
      toast.error(t('settings.biometricUnavailable'));
      return;
    }
    if (!biometricEnabled) {
      setBiometricBusy(true);
      try {
        const userName = useAppStore.getState().userProfile?.name || 'user';
        const credentialId = await registerBiometric(userName);
        setAppLockBiometric(true, credentialId);
        toast.success(t('settings.biometricEnrolled'));
      } catch {
        toast.error(t('settings.biometricEnrollFailed'));
      } finally {
        setBiometricBusy(false);
      }
    } else {
      setAppLockBiometric(false, null);
      toast.success(t('settings.biometricDisabled'));
    }
  };

  const handlePinSet = async () => {
    if (pinBusy) return;
    if (pinValue.length < 4) {
      toast.error(t('settings.pinTooShort'));
      return;
    }
    setPinBusy(true);
    try {
      const result = await cryptoCore.hashAppLockPIN(pinValue);
      setAppLock(result.hash, result.saltHex);
      setShowPinInput(false);
      setPinValue('');
      toast.success(t('settings.pinSet'));
    } finally {
      setPinBusy(false);
    }
  };

  const handlePinRemove = async () => {
    if (pinBusy) return;
    if (pinValue.length < 4) return;
    const currentSalt = useAppStore.getState().appLockSalt || '';
    const storedHash = useAppStore.getState().appLockHashedPIN;
    if (!storedHash) {
      toast.error(t('settings.pinIncorrect'));
      return;
    }
    setPinBusy(true);
    try {
      const ok = await cryptoCore.verifyAppLockPIN(pinValue, currentSalt, storedHash);
      if (!ok) {
        toast.error(t('settings.pinIncorrect'));
        return;
      }
      setAppLock('', '');
      setShowPinInput(false);
      setPinValue('');
      toast.success(t('settings.pinRemoved'));
    } finally {
      setPinBusy(false);
    }
  };

  const startPinAction = (mode: 'set' | 'remove') => {
    setPinMode(mode);
    setPinValue('');
    setShowPinInput(true);
  };

  const confirmPinAction = () => {
    if (pinMode === 'set') handlePinSet();
    else handlePinRemove();
  };

  const handleWipeData = () => {
    setShowWipeConfirm(true);
  };

  const handleConfirmWipe = async () => {
    setShowWipeConfirm(false);
    try {
      await cryptoCore.secureWipe();
      toast.success(t('settings.dataWiped'));
    } catch {
      toast.error(t('settings.wipeFailed'));
    }
  };

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

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await cryptoCore.secureWipe();
      toast.success(t('settings.accountDeleted'));
    } catch {
      toast.error(t('settings.wipeFailed'));
    }
  };

  return (
    <SubView title={t('settings.security')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.appLock')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          icon={hasPin ? <Lock size={16} /> : <Unlock size={16} />}
          iconBg={hasPin ? (isDark ? "bg-emerald-500/10" : "bg-emerald-100") : (isDark ? "bg-gray-500/10" : "bg-gray-100")}
          iconColor={hasPin ? (isDark ? "text-emerald-400" : "text-emerald-600") : (isDark ? "text-gray-400" : "text-gray-500")}
          title={t('settings.pinLock')}
          subtitle={hasPin ? t('settings.pinEnabled') : t('settings.pinDisabled')}
          isDark={isDark}
          rightElement={
            <ToggleSwitch
              isOn={hasPin}
              onToggle={() => {
                if (hasPin) startPinAction('remove');
                else startPinAction('set');
              }}
              isDark={isDark}
              onIcon={<Lock size={14} />}
              offIcon={<Unlock size={14} />}
              ariaLabel={t('settings.pinLock')}
            />
          }
          onClick={() => {
            if (hasPin) startPinAction('remove');
            else startPinAction('set');
          }}
        />
        {showPinInput && (
          <div className="px-4 py-3 border-t border-[var(--border-color)] dark:border-[var(--border-color)]">
            <label htmlFor="security-pin-input" className="sr-only">{t('settings.enterPin')}</label>
            <input
              id="security-pin-input"
              type="password"
              maxLength={10}
              placeholder={t('settings.enterPin')}
              value={pinValue}
              onChange={e => setPinValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmPinAction()}
              autoComplete={pinMode === 'set' ? 'new-password' : 'current-password'}
              inputMode="numeric"
              className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors border ${isDark ? "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] border-[var(--border-color)] text-slate-800"}`}
              autoFocus
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={confirmPinAction}
                disabled={pinBusy}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${isDark ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
              >
                {pinBusy ? '…' : (pinMode === 'set' ? t('settings.confirmPin') : t('settings.removePin'))}
              </button>
              <button
                type="button"
                onClick={() => { setShowPinInput(false); setPinValue(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${isDark ? "bg-white/10 text-gray-300 hover:bg-white/20" : "bg-black/5 text-slate-600 hover:bg-black/10"}`}
              >
                {t('common.cancel')}
              </button>
            </div>
            <div aria-live="polite" role="status" className="sr-only">
              {pinValue.length > 0 && pinValue.length < 4 ? t('settings.pinTooShort') : ''}
            </div>
          </div>
        )}

        <SettingsRow
          icon={<Fingerprint size={16} />}
          iconBg={isDark ? "bg-cyan-500/10" : "bg-cyan-100"}
          iconColor={isDark ? "text-cyan-400" : "text-cyan-600"}
          title={t('settings.biometricUnlock')}
          subtitle={biometricSupported
            ? (biometricEnabled ? t('settings.biometricEnabled') : t('settings.biometricDisabledSetting'))
            : t('settings.biometricUnavailable')}
          isDark={isDark}
          rightElement={
            <ToggleSwitch
              isOn={biometricEnabled}
              onToggle={handleToggleBiometric}
              isDark={isDark}
               onIcon={<Fingerprint size={14} />}
               offIcon={<Fingerprint size={14} />}
               ariaLabel={t('settings.biometricUnlock')}
             />
          }
        />

        <SettingsRow
          icon={<LockKeyhole size={16} />}
          iconBg={isDark ? "bg-amber-500/10" : "bg-amber-100"}
          iconColor={isDark ? "text-amber-400" : "text-amber-600"}
          title={t('settings.lockNow')}
          subtitle={t('settings.lockNowSubtitle')}
          isDark={isDark}
          onClick={() => {
            if (!hasMethod) {
              toast.error(t('settings.lockNowNeedsMethod'));
              return;
            }
            lockApp();
            toast.success(t('settings.appLockedNow'));
          }}
        />

        <SettingsToggleRow
          title={t('settings.autoLockBackground')}
          subtitle={t('settings.autoLockBackgroundSubtitle')}
          isOn={autoLockOnBackground}
          onToggle={() => setAppLockAutoLock(!autoLockOnBackground, idleSeconds)}
          isDark={isDark}
        />

        <SettingsRow
          icon={<Timer size={16} />}
          iconBg={isDark ? "bg-violet-500/10" : "bg-violet-100"}
          iconColor={isDark ? "text-violet-400" : "text-violet-600"}
          title={t('settings.idleLock')}
          subtitle={t('settings.idleLockSubtitle')}
          isDark={isDark}
          rightElement={
            <select
              value={String(idleSeconds)}
              onChange={(e) => setAppLockAutoLock(autoLockOnBackground, parseInt(e.target.value, 10))}
              aria-label={t('settings.idleLock')}
              className={`px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50 border ${isDark ? "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]" : "bg-white border-slate-200 text-slate-800"}`}
            >
              <option value="0">{t('settings.idleOff')}</option>
              <option value="30">30s</option>
              <option value="60">1m</option>
              <option value="300">5m</option>
              <option value="900">15m</option>
              <option value="1800">30m</option>
            </select>
          }
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.twoFactor')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsToggleRow
          title={t('settings.twoFactorAuth')}
          subtitle={t('settings.twoFactorSubtitle')}
          isOn={twoFactor}
          onToggle={() => {
            if (twoFactor) disableTwoFactor();
            else openTotpSetup();
          }}
          isDark={isDark}
          toggleOnIcon={<ShieldCheck size={14} />}
          toggleOffIcon={<ShieldCheck size={14} />}
        />
        {showTotpSetup && (
          <div className="px-4 py-3 border-t border-[var(--border-color)] dark:border-[var(--border-color)]">
            <p className={`text-xs mb-3 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
              {t('settings.totpInstruction')}
            </p>
            <label htmlFor="security-totp-secret" className={`block text-xs font-medium mb-1 ${isDark ? "text-gray-300" : "text-slate-600"}`}>
              {t('settings.totpSecretLabel')}
            </label>
            <div
              id="security-totp-secret"
              className={`w-full px-3 py-2 rounded-lg text-[11px] font-mono break-all border ${isDark ? "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] border-[var(--border-color)] text-slate-700"}`}
            >
              {totpDraftSecret}
            </div>
            <p className={`text-[11px] font-mono break-all mt-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
              {otpauthUri(totpDraftSecret, useAppStore.getState().userProfile?.name || 'user')}
            </p>
            {totpCodeNow && (
              <p className={`text-xs mt-2 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                {t('settings.totpCurrentCode')}: <span className="font-mono font-semibold">{totpCodeNow}</span>
              </p>
            )}
            <label htmlFor="security-totp-input" className={`block text-xs font-medium mt-3 mb-1 ${isDark ? "text-gray-300" : "text-slate-600"}`}>
              {t('settings.totpSecretLabel')}
            </label>
            <input
              id="security-totp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              value={totpInput}
              onChange={e => setTotpInput(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && confirmTotpSetup()}
              placeholder={t('settings.totpPlaceholder')}
              className={`w-full px-3 py-2 rounded-lg text-sm text-center tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors border ${isDark ? "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] border-[var(--border-color)] text-slate-800"}`}
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={confirmTotpSetup}
                disabled={totpBusy}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${isDark ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
              >
                {t('settings.verify')}
              </button>
              <button
                type="button"
                onClick={() => { setShowTotpSetup(false); setTotpInput(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${isDark ? "bg-white/10 text-gray-300 hover:bg-white/20" : "bg-black/5 text-slate-600 hover:bg-black/10"}`}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </SettingsGroup>

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

      <SettingsSectionTitle title={t('settings.sessionsDevices')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          icon={<Monitor size={16} />}
          iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
          iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
          title={t('settings.thisDevice')}
          subtitle={t('settings.thisDeviceSubtitle')}
          isDark={isDark}
        />
        <SettingsRow
          icon={<Smartphone size={16} />}
          iconBg={isDark ? "bg-gray-500/10" : "bg-gray-100"}
          iconColor={isDark ? "text-gray-400" : "text-gray-500"}
          title={t('settings.activeSessions')}
          subtitle={t('settings.noOtherSessions')}
          isDark={isDark}
        />
        <SettingsRow
          icon={<Clock size={16} />}
          iconBg={isDark ? "bg-gray-500/10" : "bg-gray-100"}
          iconColor={isDark ? "text-gray-400" : "text-gray-500"}
          title={t('settings.loginHistory')}
          subtitle={t('settings.loginHistoryUnavailable')}
          isDark={isDark}
        />
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.dangerZone')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<Shield size={16} />}
          iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
          iconColor={isDark ? "text-red-400" : "text-red-600"}
          title={t('settings.wipeAllData')}
          subtitle={t('settings.wipeSubtitle')}
          isDark={isDark}
          onClick={handleWipeData}
        />
        <SettingsRow
          icon={<Trash2 size={16} />}
          iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
          iconColor={isDark ? "text-red-400" : "text-red-600"}
          title={t('settings.deleteAccount')}
          subtitle={t('settings.deleteAccountSubtitle')}
          isDark={isDark}
          onClick={() => setShowDeleteConfirm(true)}
        />
      </SettingsGroup>

      <ConfirmModal
        isOpen={showWipeConfirm}
        title={t('settings.wipeAllData')}
        message={t('settings.confirmWipe')}
        confirmLabel={t('settings.wipeAllData')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={handleConfirmWipe}
        onCancel={() => setShowWipeConfirm(false)}
      />

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

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={t('settings.deleteAccount')}
        message={t('settings.confirmDeleteAccount')}
        confirmLabel={t('settings.deleteAccount')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </SubView>
  );
};




