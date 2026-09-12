import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Undo, ArrowRight, LogIn, Shield, Check } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { RecoveryManager } from "../../lib/recovery/RecoveryManager";
import { cryptoCore, buf2hex } from "../../lib/crypto/cryptoCore";
import { STORAGE_KEYS } from "../../constants/storage";
import { useAppStore } from "../../store";
import { getLockBlockDuration } from "../../config/lockBackoff";

type Step = "enter-phrase" | "restoring" | "set-pin" | "complete";

interface LoginScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

export function LoginScreen({ onComplete, onBack }: LoginScreenProps) {
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
    setStep("restoring");
    setIsProcessing(true);
    setError("");
    try {
      const success = await RecoveryManager.restoreFromPhrase(phrase.trim());
      if (success) {
        setStep("set-pin");
      } else {
        setStep("enter-phrase");
        setError(t("auth.login.invalidPhrase", "Invalid recovery phrase. Please check and try again."));
      }
    } catch (e) {
      setStep("enter-phrase");
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
    <div className="relative w-full h-[100dvh] flex flex-col items-center justify-center font-sans bg-[var(--bg-primary)] text-[var(--text-primary)] p-4">
      {onBack && step !== "restoring" && (
        <button
          type="button"
          onClick={onBack}
          aria-label={t("common.back", "Back")}
          className="absolute top-4 left-4 w-9 h-9 min-w-11 min-h-11 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      <div className="w-full max-w-md mx-auto">
        {step === "enter-phrase" && (
          <div className="flex flex-col">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center mb-6 mx-auto shadow-lg">
              <Shield size={32} />
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
              <p role="alert" className="text-xs text-red-400 mb-3 text-center">{error}</p>
            )}
            <button
              onClick={handleRestore}
              disabled={isProcessing || phrase.split(/\s+/).filter(w => w.length > 0).length < 12}
              aria-label={t("auth.login.restore", "Restore Identity")}
              title={t("auth.login.restore", "Restore Identity")}
              className="w-full min-h-11 min-w-11 flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-transform active:scale-95 bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Undo size={20} />
              <span>{t("auth.login.restore", "Restore Identity")}</span>
            </button>
          </div>
        )}

        {step === "restoring" && (
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6"></div>
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
                    autoComplete="off"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder={t("auth.login.pinPlaceholder", "Enter PIN (4-6 digits)")}
                    aria-invalid={pinError || undefined}
                    aria-describedby={pinError ? "auth-login-pin-error" : undefined}
                    autoFocus
                    className={`w-full text-center tracking-[0.5em] text-2xl font-mono py-4 rounded-xl border mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors bg-[var(--bg-secondary)] border-[var(--border-color)] ${pinError ? "border-red-500 text-red-500" : ""}`}
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={6}
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                    placeholder={t("auth.login.confirmPinPlaceholder", "Confirm PIN")}
                    aria-invalid={pinError || undefined}
                    aria-describedby={pinError ? "auth-login-pin-error" : undefined}
                    className={`w-full text-center tracking-[0.5em] text-2xl font-mono py-4 rounded-xl border mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors bg-[var(--bg-secondary)] border-[var(--border-color)] ${pinError ? "border-red-500 text-red-500" : ""}`}
                  />
                </div>
                {pinError && (
                  <p id="auth-login-pin-error" role="alert" className="text-xs text-red-400 mb-3 text-center">{t("auth.login.pinError", "PINs must match and be 4-6 digits.")}</p>
                )}
                {error && (
                  <p role="alert" className="text-xs text-red-400 mb-3 text-center">{error}</p>
                )}
                <button
                  onClick={handleSetPin}
                  disabled={isProcessing || pin.length < 4}
                  aria-label={t("auth.login.continue", "Continue")}
                  title={t("auth.login.continue", "Continue")}
                  className="w-full min-h-11 min-w-11 flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-transform active:scale-95 bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowRight size={20} />
                  <span>{t("auth.login.continue", "Continue")}</span>
                </button>
                <button
                  onClick={() => {
                    clearSensitiveData();
                    setStep("complete");
                  }}
                  aria-label={t("auth.login.skipPin", "Skip PIN Setup")}
                  title={t("auth.login.skipPin", "Skip PIN Setup")}
                  className="w-full min-h-11 min-w-11 flex items-center justify-center gap-2 py-3 mt-3 rounded-xl font-medium text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <ArrowRight size={18} />
                  <span>{t("auth.login.skipPin", "Skip PIN Setup")}</span>
                </button>
              </>
            )}
          </div>
        )}

        {step === "complete" && (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
              <Check size={32} strokeWidth={2.5} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("auth.login.restoreSuccess", "Identity Restored")}</h2>
            <p className="text-[var(--text-secondary)] mb-8">
              {t("auth.login.ready", "Your identity has been restored. You can now start messaging securely.")}
            </p>
            <button
              onClick={handleComplete}
              aria-label={t("auth.login.enterApp", "Enter App")}
              title={t("auth.login.enterApp", "Enter App")}
              className="w-full min-h-11 min-w-11 flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-transform active:scale-95 bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg"
            >
              <LogIn size={20} />
              <span>{t("auth.login.enterApp", "Enter App")}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
