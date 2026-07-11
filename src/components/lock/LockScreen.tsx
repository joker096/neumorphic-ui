/**
 * Lock screen component for App.tsx
 */
import React, { FormEvent, useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useAppStore } from "../../store";
import { useI18n } from "../../lib/i18n";
import { STORAGE_KEYS } from "../../constants/storage";

export type LockScreenProps = {
  appLockHashedPIN: string | null;
  isUnlocked: boolean;
  setIsUnlocked: (v: boolean) => void;
  pinInput: string;
  setPinInput: (v: string) => void;
  pinError: boolean;
  setPinError: (v: boolean) => void;
  lockAttempts: number;
  setLockAttempts: (v: number) => void;
  lockBlockedUntil: number;
  setLockBlockedUntil: (v: number) => void;
  lockBlockTimer: number;
  setLockBlockTimer: (v: number) => void;
  isDark?: boolean;
  theme?: "light" | "dark";
};

const getBlockDuration = (attempts: number): number => {
  if (attempts <= 2) return 0;
  if (attempts === 3) return 30000;
  if (attempts === 4) return 60000;
  if (attempts === 5) return 120000;
  if (attempts === 6) return 300000;
  if (attempts === 7) return 900000;
  return Infinity;
};

const cryptoCore = {
  hashAppLockPIN: async (pin: string, salt: string) => {
    try {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(pin),
        "PBKDF2",
        false,
        ["deriveBits"],
      );
      const saltBuffer = new TextEncoder().encode(salt);
      const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: saltBuffer, iterations: 10000, hash: "SHA-256" },
        key,
        256,
      );
      return { hash: btoa(String.fromCharCode(...new Uint8Array(bits))) };
    } catch {
      return { hash: "" };
    }
  },
};

export function LockScreen({
  appLockHashedPIN,
  isUnlocked,
  setIsUnlocked,
  pinInput,
  setPinInput,
  pinError,
  setPinError,
  lockAttempts,
  setLockAttempts,
  lockBlockedUntil,
  setLockBlockedUntil,
  lockBlockTimer,
  setLockBlockTimer,
  isDark = false,
  theme = 'dark',
}: LockScreenProps) {
  const { t } = useI18n();

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
  }, [lockBlockedUntil, setLockBlockTimer]);

  const handleUnlock = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!appLockHashedPIN) return;
    const salt = localStorage.getItem(STORAGE_KEYS.LOCK_SALT);
    if (!salt) return;

    if (lockBlockedUntil > Date.now()) {
      setPinError(true);
      return;
    }

    try {
      const hashed = await cryptoCore.hashAppLockPIN(pinInput, salt);
      if (hashed.hash === appLockHashedPIN) {
        setIsUnlocked(true);
        setPinError(false);
        setLockAttempts(0);
        setLockBlockedUntil(0);
        localStorage.setItem(STORAGE_KEYS.LOCK_ATTEMPTS, "0");
        localStorage.setItem(STORAGE_KEYS.LOCK_BLOCKED_UNTIL, "0");
      } else {
        const newAttempts = lockAttempts + 1;
        setLockAttempts(newAttempts);
        localStorage.setItem(STORAGE_KEYS.LOCK_ATTEMPTS, String(newAttempts));
        const duration = getBlockDuration(newAttempts);
        if (duration > 0 && duration !== Infinity) {
          const blockedUntil = Date.now() + duration;
          setLockBlockedUntil(blockedUntil);
          localStorage.setItem(STORAGE_KEYS.LOCK_BLOCKED_UNTIL, String(blockedUntil));
        } else if (duration === Infinity) {
          setLockBlockedUntil(Infinity);
          localStorage.setItem(STORAGE_KEYS.LOCK_BLOCKED_UNTIL, "permanent");
        }
        setPinError(true);
        setPinInput("");
      }
    } catch {
      setPinError(true);
      setPinInput("");
    }
  };

  const appLockSalt = localStorage.getItem(STORAGE_KEYS.LOCK_SALT);

  if (!appLockHashedPIN || !appLockSalt || isUnlocked) return null;

  return (
    <div className={`w-full h-[100dvh] flex flex-col items-center justify-center font-sans ${isDark ? "bg-[#0d1017] text-white" : "bg-[#eaeff4] text-slate-800"}`}>
      <div className={`p-8 rounded-3xl flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl ${isDark ? "bg-[#11141c] border border-white/10" : "bg-white border border-black/5"}`}>
        <Lock size={48} className={`mb-6 ${isDark ? "text-orange-500" : "text-orange-600"}`} />
        <h2 className="text-2xl font-bold mb-2 text-center">{t("lock.title")}</h2>
        <p className={`text-sm mb-6 text-center ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          {t("lock.description")}
        </p>
        {lockBlockedUntil === Infinity ? (
          <div className="text-center mb-4">
            <p className="text-red-500 font-bold text-sm">Too many attempts</p>
            <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>App is permanently locked. Recovery required.</p>
          </div>
        ) : lockBlockTimer > 0 ? (
          <div className="text-center mb-4">
            <p className="text-red-500 font-bold text-sm">Locked</p>
            <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>Try again in {lockBlockTimer} seconds</p>
          </div>
        ) : (
          <form onSubmit={handleUnlock} className="w-full">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              autoFocus
              className={`w-full text-center tracking-[0.5em] text-2xl font-mono py-4 rounded-xl border mb-4 focus:outline-none transition-colors ${
                isDark
                  ? "bg-[#16181d] border-white/10 focus:border-orange-500/50"
                  : "bg-[#f4f7f9] border-black/10 focus:border-orange-500/50"
              } ${pinError ? "border-red-500 text-red-500" : ""}`}
              placeholder="****"
            />
            {pinError && (
              <p className={`text-xs text-center mb-3 ${isDark ? "text-red-400" : "text-red-500"}`}>
                Wrong PIN. {lockAttempts >= 2 ? `${3 - Math.min(lockAttempts, 3)} attempt(s) remaining` : `${3 - lockAttempts} attempt(s) remaining`}
              </p>
            )}
            <button
              type="submit"
              className={`w-full py-4 rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] active:scale-95 ${
                isDark
                  ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg"
                  : "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
              }`}
            >
              {t("lock.unlock")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
