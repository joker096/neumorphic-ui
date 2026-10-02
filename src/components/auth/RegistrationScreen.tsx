import { useState, useEffect, useCallback } from "react";
import { useI18n } from "../../lib/i18n";
import { RecoveryManager } from "../../lib/recovery/RecoveryManager";
import { cryptoCore, buf2hex } from "../../lib/crypto/cryptoCore";
import { STORAGE_KEYS } from "../../constants/storage";
import { useAppStore } from "../../store";
import { WelcomeStep, GeneratingStep, ShowPhraseStep, ConfirmPhraseStep, SetPinStep, CompleteStep } from "./registration/RegistrationSteps";

type Step = "welcome" | "generating" | "show-phrase" | "confirm-phrase" | "set-pin" | "complete";

interface RegistrationScreenProps {
  onComplete: () => void;
}

export function RegistrationScreen({ onComplete }: RegistrationScreenProps) {
  const { t } = useI18n();
  const setAppLock = useAppStore(s => s.setAppLock);
  const [step, setStep] = useState<Step>("welcome");
  const [phrase, setPhrase] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
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
    setConfirmInput("");
    setPin("");
    setPinConfirm("");
    setPinError(false);
    setError("");
  }, []);

  const handleGenerate = async () => {
    setStep("generating");
    setIsProcessing(true);
    setError("");
    try {
      const result = await RecoveryManager.generateRecoveryPhrase();
      setPhrase(result.phrase);
      setStep("show-phrase");
    } catch (e) {
      setStep("welcome");
      setError(t("auth.registration.generateError", "Failed to generate identity. Please try again."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShowPhraseContinue = () => {
    setStep("confirm-phrase");
  };

  const handleConfirmPhrase = async () => {
    const normalizedInput = confirmInput.trim().toLowerCase();
    const normalizedPhrase = phrase.trim().toLowerCase();
    if (normalizedInput === normalizedPhrase) {
      setStep("set-pin");
    } else {
      setError(t("auth.registration.phraseMismatch", "The phrase doesn't match. Please check and try again."));
      setConfirmInput("");
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
      setError(t("auth.registration.pinError", "Failed to set PIN. Please try again."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    clearSensitiveData();
    onComplete();
  };

  const phraseWords = phrase ? phrase.split(" ") : [];
  const isLocked = lockBlockedUntil > Date.now();

  return (
    <div className="w-full h-[100dvh] flex flex-col items-center justify-center font-sans bg-[var(--bg-primary)] text-[var(--text-primary)] pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-4 pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))]">
      <div className="w-full max-w-md mx-auto">
        {step === "welcome" && (
          <WelcomeStep t={t} error={error} isProcessing={isProcessing} onGenerate={handleGenerate} />
        )}
        {step === "generating" && <GeneratingStep t={t} />}
        {step === "show-phrase" && (
          <ShowPhraseStep t={t} phrase={phrase} phraseWords={phraseWords} onContinue={handleShowPhraseContinue} />
        )}
        {step === "confirm-phrase" && (
          <ConfirmPhraseStep t={t} confirmInput={confirmInput} onConfirmInput={setConfirmInput} error={error} onConfirm={handleConfirmPhrase} />
        )}
        {step === "set-pin" && (
          <SetPinStep
            t={t}
            isLocked={isLocked}
            lockBlockTimer={lockBlockTimer}
            pin={pin}
            onPinChange={setPin}
            pinConfirm={pinConfirm}
            onPinConfirmChange={setPinConfirm}
            pinError={pinError}
            error={error}
            isProcessing={isProcessing}
            onSetPin={handleSetPin}
            onSkip={() => { clearSensitiveData(); setStep("complete"); }}
          />
        )}
        {step === "complete" && <CompleteStep t={t} onComplete={handleComplete} />}
      </div>
    </div>
  );
}
