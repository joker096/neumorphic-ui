import { useState, FormEvent, useEffect } from "react";
import { cryptoCore } from "../lib/crypto/cryptoCore";
import { STORAGE_KEYS } from "../constants";
import { useAppStore } from "../store";
import { getLockBlockDuration } from "../config/lockBackoff";
import { isBiometricAvailable, verifyBiometric } from "../lib/biometric";

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

  const hasPin = !!appLockHashedPIN;
  const hasMethod = hasPin || appLockBiometricEnabled;

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
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
    setLockAttempts(0);
    setLockBlockedUntil(0);
    localStorage.setItem(STORAGE_KEYS.LOCK_ATTEMPTS, '0');
    localStorage.setItem(STORAGE_KEYS.LOCK_BLOCKED_UNTIL, '0');
    setPinInput('');
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
  };

  const handleUnlock = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!appLockHashedPIN || !appLockSalt) return;

    if (lockBlockedUntil > Date.now()) {
      setPinError(true);
      return;
    }

    const hashed = await cryptoCore.hashAppLockPIN(pinInput, appLockSalt);
    if (hashed.hash === appLockHashedPIN) {
      unlockSuccess();
    } else {
      failAttempt();
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
    biometricError,
    biometricBusy,
    biometricAvailable,
    lockAttempts,
    lockBlockedUntil,
    lockBlockTimer,
    handleUnlock,
    handleUnlockBiometric,
    isLocked: !!hasMethod && appLocked,
    lockNow: lockApp,
  };
};
