import { useState, FormEvent, useEffect } from "react";
import { cryptoCore } from "../lib/crypto/cryptoCore";
import { STORAGE_KEYS } from "../constants";
import { useAppStore } from "../store";
import { getLockBlockDuration } from "../config/lockBackoff";

export const useAppLock = () => {
  const appLockHashedPIN = useAppStore(s => s.appLockHashedPIN);
  const appLockSalt = useAppStore(s => s.appLockSalt);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [lockAttempts, setLockAttempts] = useState(() => {
    try { return parseInt(localStorage.getItem(STORAGE_KEYS.LOCK_ATTEMPTS) || '0', 10) } catch { return 0 }
  });
  const [lockBlockedUntil, setLockBlockedUntil] = useState(() => {
    try { return parseInt(localStorage.getItem(STORAGE_KEYS.LOCK_BLOCKED_UNTIL) || '0', 10) } catch { return 0 }
  });
  const [lockBlockTimer, setLockBlockTimer] = useState(0);

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

  const handleUnlock = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!appLockHashedPIN || !appLockSalt) return;

    if (lockBlockedUntil > Date.now()) {
      setPinError(true);
      return;
    }

    const hashed = await cryptoCore.hashAppLockPIN(pinInput, appLockSalt);
    if (hashed.hash === appLockHashedPIN) {
      setIsUnlocked(true);
      setPinError(false);
      setLockAttempts(0);
      setLockBlockedUntil(0);
      localStorage.setItem(STORAGE_KEYS.LOCK_ATTEMPTS, '0');
      localStorage.setItem(STORAGE_KEYS.LOCK_BLOCKED_UNTIL, '0');
    } else {
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
    }
  };

  return {
    isUnlocked,
    pinInput,
    setPinInput,
    pinError,
    lockAttempts,
    lockBlockedUntil,
    lockBlockTimer,
    handleUnlock,
    isLocked: !!appLockHashedPIN && !isUnlocked
  };
};
