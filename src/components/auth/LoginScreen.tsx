import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { RecoveryManager } from "../../lib/recovery/RecoveryManager";
import { cryptoCore, buf2hex } from "../../lib/crypto/cryptoCore";
import { STORAGE_KEYS } from "../../constants/storage";
import { useAppStore } from "../../store";
import { getLockBlockDuration } from "../../config/lockBackoff";
import { applyBackup, decryptBackupFile, parseBackupFile } from "../../lib/backup";
import { isEncryptedBackup } from "../../lib/backupCrypto";
import type { BackupData } from "../../lib/backup";
import { TextInputModal } from "../settings/TextInputModal";
import { LoginEnterPhrase } from "./login/LoginEnterPhrase";
import { LoginImportData } from "./login/LoginImportData";
import { LoginSetPin } from "./login/LoginSetPin";
import { LoginComplete } from "./login/LoginComplete";

type Step = "enter-phrase" | "restoring" | "import-data" | "set-pin" | "complete";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [busyImport, setBusyImport] = useState(false);

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
        setStep("import-data");
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

  const doImport = async (data: BackupData) => {
    setBusyImport(true);
    setError("");
    try {
      await applyBackup(data);
      setStep("set-pin");
    } catch (e) {
      setError(t("auth.login.importFailed", "Import failed. Check the password or file and try again."));
    } finally {
      setBusyImport(false);
    }
  };

  const handleFilePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusyImport(true);
    setError("");
    void file.arrayBuffer()
      .then(async (buf) => {
        if (isEncryptedBackup(buf)) {
          setPendingFile(file);
          setPasswordModalOpen(true);
        } else {
          await doImport(await parseBackupFile(file));
        }
      })
      .catch(() => setError(t("auth.login.importFailed", "Import failed. Check the password or file and try again.")))
      .finally(() => setBusyImport(false));
  };

  const confirmBackupPassword = (value: string) => {
    const file = pendingFile;
    if (!file) return;
    setPasswordModalOpen(false);
    setPendingFile(null);
    if (!value.trim()) return;
    setBusyImport(true);
    void decryptBackupFile(file, value)
      .then((data) => doImport(data))
      .catch(() => setError(t("auth.login.importFailed", "Import failed. Check the password or file and try again.")))
      .finally(() => setBusyImport(false));
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
    <div className="relative w-full h-[100dvh] flex flex-col items-center justify-center font-sans bg-[var(--bg-primary)] text-[var(--text-primary)] pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-4 pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))]">
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
          <LoginEnterPhrase
            phrase={phrase}
            error={error}
            isProcessing={isProcessing}
            t={t}
            onPhraseChange={setPhrase}
            onRestore={handleRestore}
          />
        )}

        {step === "restoring" && (
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-lg">{t("auth.login.restoring", "Restoring...")}</p>
          </div>
        )}

        {step === "import-data" && (
          <LoginImportData
            fileInputRef={fileInputRef}
            busyImport={busyImport}
            error={error}
            t={t}
            onFilePicked={handleFilePicked}
            onStartFresh={() => setStep("set-pin")}
          />
        )}

        {step === "set-pin" && (
          <LoginSetPin
            isLocked={isLocked}
            lockBlockTimer={lockBlockTimer}
            pin={pin}
            pinConfirm={pinConfirm}
            pinError={pinError}
            error={error}
            isProcessing={isProcessing}
            t={t}
            onPinChange={setPin}
            onPinConfirmChange={setPinConfirm}
            onSetPin={handleSetPin}
            onSkip={() => { clearSensitiveData(); setStep("complete"); }}
          />
        )}

        {step === "complete" && (
          <LoginComplete t={t} onComplete={handleComplete} />
        )}
      </div>

      <TextInputModal
        isOpen={passwordModalOpen}
        title={t("auth.login.importPasswordTitle", "Backup password")}
        placeholder={t("auth.login.importPasswordPlaceholder", "Enter backup password...")}
        type="password"
        confirmLabel={t("common.confirm", "Confirm")}
        cancelLabel={t("common.cancel", "Cancel")}
        onConfirm={confirmBackupPassword}
        onCancel={() => { setPasswordModalOpen(false); setPendingFile(null); }}
      />
    </div>
  );
}
