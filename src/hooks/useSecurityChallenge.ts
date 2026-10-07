import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store';
import {
  canSatisfyStepUp,
  stepUpDelayMs,
  stepUpMethods,
  verifyStepUpPin,
  verifyStepUpTotp,
  type StepUpCredentialState,
  type StepUpLevel,
} from '../lib/security/stepUp';

/** A protected action waiting for identity proof. */
export interface StepUpRequest {
  /** Minimum proof required before `onVerified` runs. */
  level: StepUpLevel;
  /** Localized headline, e.g. "Confirm it's you". */
  title: string;
  /** Localized explanation of what is being unlocked, e.g. "Export encryption keys". */
  message: string;
  /** Runs only after the challenge is satisfied. */
  onVerified: () => void | Promise<void>;
}

/**
 * Reusable step-up authentication gate.
 *
 * Callers ask for a challenge instead of deciding whether an action is
 * dangerous:
 *
 * ```tsx
 * const stepUp = useSecurityChallenge();
 * const guarded = (level: StepUpLevel, message: string, run: () => void) =>
 *   stepUp.require({ level, title: t('lock.stepUpTitle'), message, onVerified: run })
 *   || toast.error(t('lock.setupPinFirst'));
 * ```
 *
 * `require` returns `false` when the current credential state cannot satisfy
 * the challenge (no PIN and no enrolled authenticator) — the caller must then
 * abort and tell the user to set a PIN first. That is the fail-closed path:
 * an unlocked session alone never authorizes a destructive action.
 */
export const useSecurityChallenge = () => {
  const pinHash = useAppStore(s => s.appLockHashedPIN);
  const pinSalt = useAppStore(s => s.appLockSalt);
  const biometricEnabled = useAppStore(s => s.appLockBiometricEnabled);
  const biometricCredentialId = useAppStore(s => s.appLockBiometricCredentialId);
  const twoFactor = useAppStore(s => s.twoFactor);
  const totpSecret = useAppStore(s => s.totpSecret);

  const credentials = useMemo<StepUpCredentialState>(() => ({
    pinHash: pinHash ?? null,
    pinSalt: pinSalt ?? null,
    biometricEnabled,
    biometricCredentialId: biometricCredentialId ?? null,
    twoFactor,
    totpSecret: totpSecret ?? null,
  }), [pinHash, pinSalt, biometricEnabled, biometricCredentialId, twoFactor, totpSecret]);

  const [request, setRequest] = useState<StepUpRequest | null>(null);
  const [pin, setPin] = useState('');
  const [totp, setTotp] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [biometricError, setBiometricError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);

  // Consecutive-failure counter mirrored in a ref: the PBKDF2 verification is
  // async, and the backoff must be computed from the latest value rather than
  // from a state snapshot captured before the await.
  const attemptsRef = useRef(0);

  // Kept in a ref so the async verify path always reads the request it started
  // for, even if the modal is closed while PBKDF2 is running.
  const requestRef = useRef<StepUpRequest | null>(null);
  requestRef.current = request;

  const level = request?.level ?? 'pin';
  const methods = useMemo(() => stepUpMethods(credentials, level), [credentials, level]);

  useEffect(() => {
    if (blockedUntil <= Date.now()) return;
    setRemaining(Math.ceil((blockedUntil - Date.now()) / 1000));
    const timer = setInterval(() => {
      const left = Math.ceil((blockedUntil - Date.now()) / 1000);
      setRemaining(Math.max(0, left));
      if (left <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [blockedUntil]);

  const close = useCallback(() => {
    setRequest(null);
    setPin('');
    setTotp('');
    setError(false);
    setBiometricError(false);
  }, []);

  const resetInputs = useCallback(() => {
    setPin('');
    setTotp('');
    setError(false);
    setBiometricError(false);
  }, []);

  const require = useCallback((next: StepUpRequest) => {
    // Fail closed: no available method means the action must not run.
    if (!canSatisfyStepUp(credentials, next.level)) return false;
    // NOTE: attempts/backoff are deliberately NOT reset here. Re-opening the
    // challenge must not hand the user a fresh brute-force budget — otherwise
    // cancel + reopen downgrades the delay ladder to zero forever.
    setPin('');
    setTotp('');
    setError(false);
    setBiometricError(false);
    setRequest(next);
    return true;
  }, [credentials]);

  const failAttempt = useCallback(() => {
    const next = attemptsRef.current + 1;
    attemptsRef.current = next;
    setAttempts(next);
    const delay = stepUpDelayMs(next);
    if (delay > 0) setBlockedUntil(Date.now() + delay);
    setError(true);
    setPin('');
    setTotp('');
  }, []);

  const succeed = useCallback(async () => {
    const target = requestRef.current;
    if (!target) return;
    close();
    attemptsRef.current = 0;
    setAttempts(0);
    setBlockedUntil(0);
    await target.onVerified();
  }, [close]);

  const submit = useCallback(async () => {
    if (busy) return;
    if (blockedUntil > Date.now()) return;
    // No PIN configured: the only way through is a platform authenticator, and
    // only for a challenge that explicitly allows it. Otherwise refuse.
    if (!methods.pin && requestRef.current?.level !== 'biometric') return;
    setBusy(true);
    setError(false);
    setBiometricError(false);
    try {
      if (methods.pin) {
        const pinOk = await verifyStepUpPin(pin, credentials);
        if (!pinOk) {
          failAttempt();
          return;
        }
      }
      if (methods.totp && totpSecret) {
        const totpOk = await verifyStepUpTotp(totp, totpSecret);
        if (!totpOk) {
          failAttempt();
          return;
        }
      }
      await succeed();
    } finally {
      setBusy(false);
    }
  }, [busy, blockedUntil, credentials, methods.pin, methods.totp, pin, totp, totpSecret, failAttempt, succeed]);

  const submitBiometric = useCallback(async () => {
    if (biometricBusy) return;
    if (!credentials.biometricEnabled || !credentials.biometricCredentialId) return;
    // A platform authenticator never substitutes for the PIN/TOTP a `pin` or
    // `strong` challenge demands — that would make removing the second factor
    // (or the PIN itself) possible with a fingerprint alone.
    if (requestRef.current?.level !== 'biometric') return;
    setBiometricBusy(true);
    setBiometricError(false);
    setError(false);
    try {
      const { verifyBiometric } = await import('../lib/biometric');
      const ok = await verifyBiometric(credentials.biometricCredentialId);
      if (ok) await succeed();
      else setBiometricError(true);
    } catch {
      setBiometricError(true);
    } finally {
      setBiometricBusy(false);
    }
  }, [biometricBusy, credentials.biometricEnabled, credentials.biometricCredentialId, succeed]);

  const needsPin = methods.pin;
  const canSubmit = needsPin && pin.length >= 4 && (!methods.totp || totp.length === 6) && !busy && remaining <= 0;

  return {
    /** Mount props for {@link SecurityChallengeModal}. */
    challenge: {
      isOpen: request !== null,
      level,
      title: request?.title ?? '',
      message: request?.message ?? '',
      pin,
      setPin,
      totp,
      setTotp,
      needsPin,
      needsTotp: methods.totp,
      allowBiometric: level === 'biometric' && methods.biometric,
      error,
      biometricError,
      busy,
      biometricBusy,
      blockedSeconds: remaining,
      canSubmit,
      onSubmit: submit,
      onBiometric: submitBiometric,
      onCancel: close,
    },
    /** Ask for identity proof. Returns false when no method is available. */
    require,
  };
};
