import { useState, useEffect } from 'react';
import { Lock, Unlock, Fingerprint, LockKeyhole, Timer } from 'lucide-react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, ToggleSwitch, SettingsToggleRow } from '../../ui/SettingsRow';
import { toast } from 'sonner';
import { cryptoCore } from '../../../lib/crypto/cryptoCore';
import { useAppStore } from '../../../store';
import { isBiometricAvailable, registerBiometric } from '../../../lib/biometric';
import { useSecurityChallenge } from '../../../hooks/useSecurityChallenge';
import { SecurityChallengeModal } from './SecurityChallengeModal';

interface AppLockPanelProps {
  isDark?: boolean;
  t: (key: string, fallback?: string) => string;
}

export const AppLockPanel = ({ isDark = false, t }: AppLockPanelProps) => {
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinBusy, setPinBusy] = useState(false);
  const [pinMode, setPinMode] = useState<'set' | 'remove'>('set');
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
  const { challenge, require } = useSecurityChallenge();

  useEffect(() => {
    let mounted = true;
    isBiometricAvailable().then((ok) => { if (mounted) setBiometricSupported(ok); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

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
        // Enrolment already demands OS presence (userVerification: 'required'),
        // so a fresh proof is not needed here.
        const credentialId = await registerBiometric(userName);
        setAppLockBiometric(true, credentialId);
        toast.success(t('settings.biometricEnrolled'));
      } catch {
        toast.error(t('settings.biometricEnrollFailed'));
      } finally {
        setBiometricBusy(false);
      }
      return;
    }
    // Turning biometric unlock OFF must not be a one-tap action: anyone with an
    // unlocked session could strip the strongest lock the user has.
    const started = require({
      level: 'biometric',
      title: t('lock.stepUpTitle', "Confirm it's you"),
      message: t('lock.stepUpDisableBiometric'),
      onVerified: () => {
        setAppLockBiometric(false, null);
        toast.success(t('settings.biometricDisabled'));
      },
    });
    if (!started) toast.error(t('lock.setupPinFirst'));
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

  return (
    <>
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
      <SecurityChallengeModal {...challenge} isDark={isDark} t={t} />
    </>
  );
};