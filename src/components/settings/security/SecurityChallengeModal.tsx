import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, ShieldCheck } from 'lucide-react';
import { useFocusTrap, useBodyScrollLock } from '../../../lib/a11y';
import { Button } from '../../ui/Button';
import { modalBackdrop, modalOverlay, modalSurface, currentTheme, type ModalTheme } from '../../ui/modalShared';
import { useEscapeKey } from '../../../hooks/useEscapeKey';

/** Everything the modal needs, produced by {@link useSecurityChallenge}. */
export interface SecurityChallengeModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  pin: string;
  setPin: (value: string) => void;
  totp: string;
  setTotp: (value: string) => void;
  /** Whether a PIN field must be filled (false when only biometrics can pass). */
  needsPin: boolean;
  /** Whether a TOTP field is required on top of the PIN (`strong` level). */
  needsTotp: boolean;
  /** Whether the platform authenticator can be offered as an alternative. */
  allowBiometric: boolean;
  error: boolean;
  biometricError: boolean;
  busy: boolean;
  biometricBusy: boolean;
  /** Seconds left on the brute-force backoff (0 = accepting attempts). */
  blockedSeconds: number;
  canSubmit: boolean;
  onSubmit: () => void;
  onBiometric: () => void;
  onCancel: () => void;
  isDark?: boolean;
  /** Localized labels. */
  t: (key: string, fallback?: string) => string;
}

const PIN_ID = 'security-challenge-pin';
const TOTP_ID = 'security-challenge-totp';

/**
 * Modal for the step-up challenge created by {@link useSecurityChallenge}.
 *
 * Presents a localized reason plus the identity proof the caller demanded
 * (PIN, PIN + 2FA code, or platform authenticator). Verification happens in
 * the hook; this component only renders state and never approves an action
 * itself.
 */
export const SecurityChallengeModal = ({
  isOpen,
  title,
  message,
  pin,
  setPin,
  totp,
  setTotp,
  needsPin,
  needsTotp,
  allowBiometric,
  error,
  biometricError,
  busy,
  biometricBusy,
  blockedSeconds,
  canSubmit,
  onSubmit,
  onBiometric,
  onCancel,
  isDark,
  t,
}: SecurityChallengeModalProps) => {
  const titleId = 'security-challenge-title';
  const messageId = 'security-challenge-message';
  const pinRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, isOpen);
  useEscapeKey(onCancel, isOpen);
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => pinRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const resolvedTheme: ModalTheme = isDark === undefined ? currentTheme() : isDark ? 'dark' : 'light';
  const blocked = blockedSeconds > 0;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="security-challenge"
          data-theme={resolvedTheme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={modalOverlay}
        >
          <div className={modalBackdrop} onClick={onCancel} aria-hidden="true" />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={messageId}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
            className={modalSurface(true, 'max-w-[360px]')}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-3">
              <span className="w-12 h-12 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
                <ShieldCheck size={24} />
              </span>
            </div>
            <h3 id={titleId} className="text-base font-bold mb-1 text-center text-[var(--text-primary)]">{title}</h3>
            {message && (
              <p id={messageId} className="text-xs mb-4 text-center leading-relaxed text-[var(--text-secondary)]">
                {message}
              </p>
            )}

            {needsPin && (
              <>
                <label htmlFor={PIN_ID} className="sr-only">{t('settings.enterPin')}</label>
                <input
                  id={PIN_ID}
                  ref={pinRef}
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  maxLength={10}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) onSubmit(); }}
                  placeholder={t('settings.enterPin')}
                  disabled={busy || blocked}
                  aria-invalid={error}
                  className="w-full px-4 h-[var(--control-height-lg)] rounded-full text-sm text-center tracking-[0.3em] bg-transparent border border-[var(--border-color)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:opacity-50 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                />
              </>
            )}

            {needsTotp && (
              <div className="mt-3">
                <label htmlFor={TOTP_ID} className="sr-only">{t('lock.totpLabel')}</label>
                <input
                  id={TOTP_ID}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={totp}
                  onChange={(e) => setTotp(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) onSubmit(); }}
                  placeholder={t('lock.totpLabel')}
                  disabled={busy || blocked}
                  aria-invalid={error}
                  className="w-full px-4 h-[var(--control-height-lg)] rounded-full text-sm text-center tracking-[0.4em] font-mono bg-transparent border border-[var(--border-color)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:opacity-50 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                />
              </div>
            )}

            <div aria-live="polite" role="status" className="mt-2 min-h-[16px] text-center text-xs">
              {blocked && (
                <span className="text-red-500">
                  {t('lock.tooManyAttempts')} ({blockedSeconds}s)
                </span>
              )}
              {!blocked && error && <span className="text-red-500">{t('settings.pinIncorrect')}</span>}
              {!blocked && biometricError && <span className="text-red-500">{t('lock.biometricFailed')}</span>}
            </div>

            <div className="mt-3 flex flex-col gap-3">
              {allowBiometric && (
                <Button
                  variant="secondary"
                  size="md"
                  className="min-h-11 w-full"
                  icon={<Fingerprint />}
                  disabled={biometricBusy || blocked}
                  onClick={onBiometric}
                  aria-label={t('lock.biometric')}
                >
                  <span>{t('lock.biometric')}</span>
                </Button>
              )}
              {needsPin && (
                <Button
                  variant="primary"
                  size="md"
                  className="min-h-11 w-full"
                  disabled={!canSubmit}
                  onClick={onSubmit}
                  aria-label={t('settings.verify')}
                >
                  <span>{busy ? '…' : t('settings.verify')}</span>
                </Button>
              )}
              <Button
                variant="secondary"
                size="md"
                className="min-h-11 w-full"
                onClick={onCancel}
                aria-label={t('common.cancel')}
              >
                <span>{t('common.cancel')}</span>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
