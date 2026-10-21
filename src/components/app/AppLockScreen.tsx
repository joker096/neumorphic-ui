import React from 'react';
import { Lock, Fingerprint, LockOpen } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { HINT_TEXT_CLASS, CENTERED_HEADING_CLASS } from '../ui/textClasses';
type AppLockScreenProps = {
  pinInput: string;
  setPinInput: (v: string) => void;
  pinError: boolean;
  totpInput?: string;
  setTotpInput?: (v: string) => void;
  totpError?: boolean;
  twoFactorRequired?: boolean;
  biometricError: boolean;
  biometricBusy: boolean;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  lockAttempts: number;
  lockBlockTimer: number;
  lockBlockedUntil: number | undefined;
  unlockBusy?: boolean;
  handleUnlock: (e?: React.FormEvent) => Promise<void>;
  handleUnlockBiometric: () => Promise<void>;
};

const INPUT_CLASS =
  'w-full text-center tracking-[0.5em] text-2xl font-mono py-4 rounded-xl border mb-4 ' +
  'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] ' +
  'placeholder:text-[var(--text-tertiary)] transition-colors ' +
  'focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50';

const ERROR_CLASS = 'text-xs text-center mb-3 text-[var(--danger)]';

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  pinInput,
  setPinInput,
  pinError,
  totpInput = '',
  setTotpInput = () => {},
  totpError = false,
  twoFactorRequired = false,
  biometricError,
  biometricBusy,
  biometricEnabled,
  biometricAvailable,
  lockAttempts,
  lockBlockTimer,
  lockBlockedUntil,
  unlockBusy = false,
  handleUnlock,
  handleUnlockBiometric,
}) => {
  const { t } = useI18n();
  const isBlockedPermanently = lockBlockedUntil === Infinity;
  const isBlockedTemporarily = lockBlockTimer > 0;

  return (
    <div className="w-full h-[100dvh] flex flex-col items-center justify-center font-sans pt-[env(safe-area-inset-top,0px)] bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="p-6 sm:p-8 rounded-3xl flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
        <Lock size={48} className="mb-6 text-[var(--accent)]" />
        <h2 className="text-xl sm:text-2xl font-bold mb-2 text-center">{t('lock.title')}</h2>
        <p className="text-sm mb-6 text-center text-[var(--text-secondary)]">
          {t('lock.description')}
        </p>

        {isBlockedPermanently ? (
          <div className={CENTERED_HEADING_CLASS}>
            <p className="text-[var(--danger)] font-bold text-sm">{t('lock.tooManyAttempts')}</p>
            <p className={HINT_TEXT_CLASS}>
              {t('lock.permanentlyLocked')}
            </p>
          </div>
        ) : isBlockedTemporarily ? (
          <div className={CENTERED_HEADING_CLASS}>
            <p className="text-[var(--danger)] font-bold text-sm">{t('lock.locked')}</p>
            <p className={HINT_TEXT_CLASS}>
              {t('lock.tryAgainIn', { seconds: lockBlockTimer })}
            </p>
          </div>
        ) : (
          <form onSubmit={handleUnlock} className="w-full">
            <label htmlFor="app-lock-pin-input" className="sr-only">{t('lock.enterPin') || 'PIN'}</label>
            <input
              id="app-lock-pin-input"
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              autoFocus
              autoComplete="current-password"
              inputMode="numeric"
              aria-invalid={pinError}
              aria-describedby={pinError ? 'app-lock-pin-error' : undefined}
              className={`${INPUT_CLASS} ${pinError ? "border-[var(--danger)] text-[var(--danger)]" : ""}`}
              placeholder="****"
            />
            {pinError && (
              <p id="app-lock-pin-error" role="alert" className={ERROR_CLASS}>
                {t('lock.wrongPin', { remaining: lockAttempts >= 2 ? 3 - Math.min(lockAttempts, 3) : 3 - lockAttempts })}
              </p>
            )}
            {twoFactorRequired && (
              <>
                <label htmlFor="app-lock-totp-input" className="sr-only">{t('lock.totpLabel')}</label>
                <input
                  id="app-lock-totp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={totpInput}
                  onChange={(e) => setTotpInput(e.target.value.replace(/[^0-9]/g, ''))}
                  aria-invalid={totpError}
                  aria-describedby={totpError ? 'app-lock-totp-error' : undefined}
                  placeholder={t('lock.totpLabel')}
                  className={`${INPUT_CLASS} ${totpError ? "border-[var(--danger)] text-[var(--danger)]" : ""}`}
                />
                {totpError && (
                  <p id="app-lock-totp-error" role="alert" className={ERROR_CLASS}>
                    {t('lock.totpWrong')}
                  </p>
                )}
              </>
            )}
            <button
              type="submit"
              disabled={unlockBusy}
              aria-label={t('lock.unlock')}
              title={t('lock.unlock')}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--accent)] text-[var(--ink-on-saturate)] shadow-[var(--shadow-btn-primary)] hover:brightness-110"
            >
              <LockOpen size={20} />
              <span>{unlockBusy ? '…' : t('lock.unlock')}</span>
            </button>
            {biometricEnabled && biometricAvailable && (
              <>
                <button
                  type="button"
                  onClick={handleUnlockBiometric}
                  disabled={biometricBusy}
                  aria-label={t('lock.biometric')}
                  className="mt-3 w-full h-11 rounded-xl font-medium flex items-center justify-center gap-2 border transition-transform active:scale-95 disabled:opacity-60 border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--msg-bg-panel-hover)]"
                >
                  <Fingerprint size={20} />
                  <span>{biometricBusy ? '…' : t('lock.biometric')}</span>
                </button>
                {biometricError && (
                  <p role="alert" className={`mt-2 ${ERROR_CLASS} mb-0`}>
                    {t('lock.biometricFailed')}
                  </p>
                )}
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
