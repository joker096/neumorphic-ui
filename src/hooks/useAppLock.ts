import { useState, FormEvent, useEffect } from "react";
import { STORAGE_KEYS } from "../constants";
import { useAppStore } from "../store";
import { getLockBlockDuration } from "../config/lockBackoff";
import { isBiometricAvailable, verifyBiometric } from "../lib/biometric";
import { verifyTotp } from "../lib/twoFactor";

export const useAppLock = () => {
  const appLockHashedPIN = useAppStore(s => s.appLockHashedPIN);
  const appLockSalt = useAppStore(s => s.appLockSalt);
  const appLockBiometricEnabled = useAppStore(s => s.appLockBiometricEnabled);
  const appLockBiometricCredentialId = useAppStore(s => s.appLockBiometricCredentialId);
  const appLockAutoLockOnBackground = useAppStore(s => s.appLockAutoLockOnBackground);
  const appLockIdleSeconds = useAppStore(s => s.appLockIdleSeconds);
  const appLocked = useAppStore(s => s.appLocked);
  const setAppLocked = useAppStore(s => s.setAppLocked);
  const lockApp = useAppStore(s => s.lockApp);
  const twoFactor = useAppStore(s => s.twoFactor);
  const totpSecret = useAppStore(s => s.totpSecret);

  const hasPin = !!appLockHashedPIN;
  const hasMethod = hasPin || appLockBiometricEnabled;

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [totpInput, setTotpInput] = useState('');
  const [totpError, setTotpError] = useState(false);
  const [lockAttempts, setLockAttempts] = useState(() => {
    try { return parseInt(localStorage.getItem(STORAGE_KEYS.LOCK_ATTEMPTS) || '0', 10) } catch { return 0 }
  });
  const [lockBlockedUntil, setLockBlockedUntil] = useState(() => {
    try { return parseInt(localStorage.getItem(STORAGE_KEYS.LOCK_BLOCKED_UNTIL) || '0', 10) } catch { return 0 }
  });
  const [lockBlockTimer, setLockBlockTimer] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricError, setBiometricError] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [unlockBusy, setUnlockBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    isBiometricAvailable().then((ok) => { if (mounted) setBiometricAvailable(ok); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (lockBlockedUntil > Date.now()) {
      setLockBlockTimer(Math.ceil((lockBlockedUntil - Date.now()) / 1000));
      timer = setInterval(() => {
        const remaining = Math.ceil((lockBlockedUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockBlockTimer(0);
          clearInterval(timer);
        } else {
          setLockBlockTimer(remaining);
        }
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [lockBlockedUntil]);

  // Auto-lock when the tab is hidden (backgrounded / switched apps).
  useEffect(() => {
    if (!hasMethod || !appLockAutoLockOnBackground) return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') lockApp();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [hasMethod, appLockAutoLockOnBackground, lockApp]);

  // Auto-lock after a period of inactivity.
  useEffect(() => {
    if (!hasMethod || appLockIdleSeconds <= 0) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => lockApp(), appLockIdleSeconds * 1000);
    };
    const events = ['pointerdown', 'keydown', 'touchstart', 'wheel'];
    events.forEach((ev) => window.addEventListener(ev, reset, true));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset, true));
    };
  }, [hasMethod, appLockIdleSeconds, lockApp]);

  const unlockSuccess = () => {
    setAppLocked(false);
    setPinError(false);
    setBiometricError(false);
    setTotpError(false);
    setLockAttempts(0);
    setLockBlockedUntil(0);
    localStorage.setItem(STORAGE_KEYS.LOCK_ATTEMPTS, '0');
    localStorage.setItem(STORAGE_KEYS.LOCK_BLOCKED_UNTIL, '0');
    setPinInput('');
    setTotpInput('');
  };

  const failAttempt = () => {
    const newAttempts = lockAttempts + 1;
    setLockAttempts(newAttempts);
    localStorage.setItem(STORAGE_KEYS.LOCK_ATTEMPTS, String(newAttempts));
    const duration = getLockBlockDuration(newAttempts);
    if (duration > 0 && duration !== Infinity) {
      const blockedUntil = Date.now() + duration;
      setLockBlockedUntil(blockedUntil);
      localStorage.setItem(STORAGE_KEYS.LOCK_BLOCKED_UNTIL, String(blockedUntil));
    } else if (duration === Infinity) {
      setLockBlockedUntil(Infinity);
      localStorage.setItem(STORAGE_KEYS.LOCK_BLOCKED_UNTIL, 'permanent');
    }
    setPinError(true);
    setPinInput('');
    setTotpInput('');
  };

  const twoFactorRequired = twoFactor && !!totpSecret;

  const handleUnlock = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!appLockHashedPIN || !appLockSalt) return;
    if (unlockBusy) return;

    if (lockBlockedUntil > Date.now()) {
      setPinError(true);
      return;
    }

    setUnlockBusy(true);
    try {
      const { cryptoCore } = await import("../lib/crypto/cryptoCore");
      const ok = await cryptoCore.verifyAppLockPIN(pinInput, appLockSalt, appLockHashedPIN);
      if (!ok) {
        failAttempt();
        return;
      }
      if (twoFactorRequired) {
        const ok = await verifyTotp(totpSecret as string, totpInput);
        if (!ok) {
          setTotpError(true);
          failAttempt();
          setPinInput('');
          return;
        }
      }
      unlockSuccess();
    } finally {
      setUnlockBusy(false);
    }
  };

  const handleUnlockBiometric = async () => {
    if (!appLockBiometricEnabled || !appLockBiometricCredentialId) return;
    setBiometricBusy(true);
    setBiometricError(false);
    try {
      const ok = await verifyBiometric(appLockBiometricCredentialId);
      if (ok) unlockSuccess();
      else setBiometricError(true);
    } catch {
      setBiometricError(true);
    } finally {
      setBiometricBusy(false);
    }
  };

  return {
    isUnlocked: !appLocked,
    pinInput,
    setPinInput,
    pinError,
    totpInput,
    setTotpInput,
    totpError,
    twoFactorRequired,
    biometricError,
    biometricBusy,
    biometricAvailable,
    unlockBusy,
    lockAttempts,
    lockBlockedUntil,
    lockBlockTimer,
    handleUnlock,
    handleUnlockBiometric,
    isLocked: !!hasMethod && appLocked,
    lockNow: lockApp,
  };
};
