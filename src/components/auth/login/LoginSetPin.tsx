import { ArrowRight } from "lucide-react";
import { AUTH_ERROR_CLASS, AUTH_LINK_BTN_CLASS, AUTH_PRIMARY_BTN_DISABLED_CLASS, AUTH_SUBTITLE_CLASS, AUTH_TITLE_CLASS } from '../authShared';

type T = (key: string, options?: any) => string;

interface LoginSetPinProps {
  isLocked: boolean;
  lockBlockTimer: number;
  pin: string;
  pinConfirm: string;
  pinError: boolean;
  error: string;
  isProcessing: boolean;
  t: T;
  onPinChange: (value: string) => void;
  onPinConfirmChange: (value: string) => void;
  onSetPin: () => void;
  onSkip: () => void;
}
export function LoginSetPin({
  isLocked, lockBlockTimer, pin, pinConfirm, pinError, error, isProcessing, t,
  onPinChange, onPinConfirmChange, onSetPin, onSkip,
}: LoginSetPinProps) {
  return (
    <div className="flex flex-col">
      <h2 className={`${AUTH_TITLE_CLASS}`}>{t("auth.login.setPin", "Set App Lock PIN")}</h2>
      <p className={`${AUTH_SUBTITLE_CLASS}`}>
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
              aria-label={t("auth.login.pinPlaceholder", "Enter PIN (4-6 digits)")}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={pin}
              onChange={(e) => onPinChange(e.target.value.replace(/\D/g, ''))}
              placeholder={t("auth.login.pinPlaceholder", "Enter PIN (4-6 digits)")}
              aria-invalid={pinError || undefined}
              aria-describedby={pinError ? "auth-login-pin-error" : undefined}
              autoFocus
              className={`w-full text-center tracking-[0.5em] text-2xl font-mono py-4 rounded-xl border mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors bg-[var(--bg-secondary)] border-[var(--border-color)] ${pinError ? "border-red-500 text-red-500" : ""}`}
            />
            <input
              aria-label={t("auth.login.confirmPinPlaceholder", "Confirm PIN")}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={pinConfirm}
              onChange={(e) => onPinConfirmChange(e.target.value.replace(/\D/g, ''))}
              placeholder={t("auth.login.confirmPinPlaceholder", "Confirm PIN")}
              aria-invalid={pinError || undefined}
              aria-describedby={pinError ? "auth-login-pin-error" : undefined}
              className={`w-full text-center tracking-[0.5em] text-2xl font-mono py-4 rounded-xl border mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors bg-[var(--bg-secondary)] border-[var(--border-color)] ${pinError ? "border-red-500 text-red-500" : ""}`}
            />
          </div>
          {pinError && (
            <p id="auth-login-pin-error" role="alert" className={`${AUTH_ERROR_CLASS}`}>{t("auth.login.pinError", "PINs must match and be 4-6 digits.")}</p>
          )}
          {error && (
            <p role="alert" className={`${AUTH_ERROR_CLASS}`}>{error}</p>
          )}
          <button
            onClick={onSetPin}
            disabled={isProcessing || pin.length < 4}
            aria-label={t("auth.login.continue", "Continue")}
            title={t("auth.login.continue", "Continue")}
            className={`${AUTH_PRIMARY_BTN_DISABLED_CLASS}`}
          >
            <ArrowRight size={20} />
            <span>{t("auth.login.continue", "Continue")}</span>
          </button>
          <button
            onClick={onSkip}
            aria-label={t("auth.login.skipPin", "Skip PIN Setup")}
            title={t("auth.login.skipPin", "Skip PIN Setup")}
            className={`${AUTH_LINK_BTN_CLASS}`}
          >
            <ArrowRight size={18} />
            <span>{t("auth.login.skipPin", "Skip PIN Setup")}</span>
          </button>
        </>
      )}
    </div>
  );
}
