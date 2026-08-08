import { useState, useEffect, useCallback } from "react";
import { useI18n } from "../../lib/i18n";
import { RecoveryManager } from "../../lib/recovery/RecoveryManager";
import { cryptoCore, buf2hex } from "../../lib/crypto/cryptoCore";
import { STORAGE_KEYS } from "../../constants/storage";
import { useAppStore } from "../../store";
import { getLockBlockDuration } from "../../config/lockBackoff";

type Step = "enter-phrase" | "restoring" | "set-pin" | "complete";

interface LoginScreenProps {
  onComplete: () => void;
}

export function LoginScreen({ onComplete }: LoginScreenProps) {
  const { t } = useI18n();
  const setAppLock = useAppStore(s => s.setAppLock);
  const [step, setStep] = useState<Step>("enter-phrase");
  const [phrase, setPhrase] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState(false);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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

  const clearSensitiveData = useCallback(() => {
    setPhrase("");
    setPin("");
    setPinConfirm("");
    setPinError(false);
    setError("");
  }, []);

  const handleRestore = async () => {
    setIsProcessing(true);
    setError("");
    try {
      const success = await RecoveryManager.restoreFromPhrase(phrase.trim());
      if (success) {
        setStep("set-pin");
      } else {
        setError(t("auth.login.invalidPhrase", "Invalid recovery phrase. Please check and try again."));
      }
    } catch (e) {
      setError(t("auth.login.restoreError", "An error occurred during restoration. Please try again."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetPin = async () => {
    if (pin.length < 4) {
      setPinError(true);
      return;
    }
    if (pin !== pinConfirm) {
      setPinError(true);
      setError(t("auth.login.pinMismatch", "PINs don't match."));
      return;
    }
    setIsProcessing(true);
    setError("");
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const hashed = await cryptoCore.hashAppLockPIN(pin, buf2hex(salt));
      setAppLock(hashed.hash, hashed.saltHex);
      clearSensitiveData();
      setStep("complete");
    } catch (e) {
      setError(t("auth.login.pinError", "Failed to set PIN. Please try again."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    clearSensitiveData();
    onComplete();
  };

  const isLocked = lockBlockedUntil > Date.now();

  return (
    <div className="w-full h-[100dvh] flex flex-col items-center justify-center font-sans bg-[var(--bg-primary)] text-[var(--text-primary)] p-4">
      <div className="w-full max-w-md mx-auto">
        {step === "enter-phrase" && (
          <div className="flex flex-col">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center mb-6 mx-auto shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-center">{t("auth.login.restoreTitle", "Restore Identity")}</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6 text-center">
              {t("auth.login.restoreSubtitle", "Enter your recovery phrase to restore your identity on this device.")}
            </p>
            <textarea
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={t("auth.login.phrasePlaceholder", "word1 word2 word3 ...")}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full h-32 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
            />
            {error && (
              <p className="text-xs text-red-400 mb-3 text-center">{error}</p>
            )}
            <button
              onClick={handleRestore}
              disabled={isProcessing || phrase.split(/\s+/).filter(w => w.length > 0).length < 12}
              className="w-full py-4 rounded-xl font-bold text-lg transition-transform active:scale-95 bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? t("auth.login.restoring", "Restoring...") : t("auth.login.restore", "Restore Identity")}
            </button>
          </div>
        )}

        {step === "restoring" && (
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-lg">{t("auth.login.restoring", "Restoring...")}</p>
          </div>
        )}

        {step === "set-pin" && (
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold mb-2 text-center">{t("auth.login.setPin", "Set App Lock PIN")}</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6 text-center">
              {t("auth.login.pinDescription", "Optional but recommended. Adds a layer of protection when someone opens your device.")}
            </p>
            {isLocked && lockBlockTimer > 0 ? (
              <div className="text-center mb-4">
                <p className="text-red-500 font-bold text-sm">{t('lock.locked', 'Locked')}</p>
                <p className="text-xs mt-1 text-[var(--text-secondary)]">{t('lock.tryAgainIn', { seconds: lockBlockTimer })}</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder={t("auth.login.pinPlaceholder", "Enter PIN (4-6 digits)")}
                    autoFocus
                    className={`w-full text-center tracking-[0.5em] text-2xl font-mono py-4 rounded-xl border mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors bg-[var(--bg-secondary)] border-[var(--border-color)] ${pinError ? "border-red-500 text-red-500" : ""}`}
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                    placeholder={t("auth.login.confirmPinPlaceholder", "Confirm PIN")}
                    className={`w-full text-center tracking-[0.5em] text-2xl font-mono py-4 rounded-xl border mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors bg-[var(--bg-secondary)] border-[var(--border-color)] ${pinError ? "border-red-500 text-red-500" : ""}`}
                  />
                </div>
                {pinError && (
                  <p className="text-xs text-red-400 mb-3 text-center">{t("auth.login.pinError", "PINs must match and be 4-6 digits.")}</p>
                )}
                <button
                  onClick={handleSetPin}
                  disabled={isProcessing || pin.length < 4}
                  className="w-full py-4 rounded-xl font-bold text-lg transition-transform active:scale-95 bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("auth.login.continue", "Continue")}
                </button>
                <button
                  onClick={() => {
                    clearSensitiveData();
                    setStep("complete");
                  }}
                  className="w-full py-3 mt-3 rounded-xl font-medium text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {t("auth.login.skipPin", "Skip PIN Setup")}
                </button>
              </>
            )}
          </div>
        )}

        {step === "complete" && (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("auth.login.restoreSuccess", "Identity Restored")}</h2>
            <p className="text-[var(--text-secondary)] mb-8">
              {t("auth.login.ready", "Your identity has been restored. You can now start messaging securely.")}
            </p>
            <button
              onClick={handleComplete}
              className="w-full py-4 rounded-xl font-bold text-lg transition-transform active:scale-95 bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg"
            >
              {t("auth.login.enterApp", "Enter App")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
