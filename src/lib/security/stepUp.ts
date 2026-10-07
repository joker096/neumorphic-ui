/**
 * Step-up authentication for sensitive actions.
 *
 * A step-up challenge is an identity proof requested *in addition to* an
 * already-unlocked app session, before an action that an attacker with a
 * stolen/unlocked session must not be able to perform: exporting encryption
 * keys, importing a foreign device key, disabling biometric unlock, disabling
 * two-factor auth, erasing data / deleting the account.
 *
 * Levels (mirrors the spec's AuthLevel):
 * - `biometric` — platform authenticator, PIN accepted as fallback.
 * - `pin`       — app-lock PIN required.
 * - `strong`    — app-lock PIN plus the TOTP code when two-factor is enabled.
 *
 * Design rules:
 * - Fail closed. A user with no PIN and no enrolled biometric has no way to
 *   satisfy a challenge, so the protected action must not run; callers surface
 *   `methods.pin === false` and must block (never auto-approve).
 * - No secrets leave this module: the PIN is compared against the stored
 *   PBKDF2 hash and is never persisted or logged.
 * - Errors are deliberately uniform ("PIN is incorrect") so the challenge
 *   does not disclose how much of a guess was right.
 */

/** Minimum identity proof required by the protected action. */
export type StepUpLevel = 'biometric' | 'pin' | 'strong';

export interface StepUpCredentialState {
  /** PBKDF2 hash of the app-lock PIN (`null` when no PIN is configured). */
  pinHash: string | null;
  pinSalt: string | null;
  /** Whether a platform authenticator credential is enrolled. */
  biometricEnabled: boolean;
  biometricCredentialId: string | null;
  /** Two-factor auth flag and its decrypted secret. */
  twoFactor: boolean;
  totpSecret: string | null;
}

export interface StepUpMethods {
  /** PIN can be verified at all (no PIN configured → cannot). */
  pin: boolean;
  /** Platform authenticator can be invoked. */
  biometric: boolean;
  /** A TOTP code must be supplied on top of the PIN (`strong` level). */
  totp: boolean;
}

/**
 * Delay before the next attempt is accepted, per failed attempt number.
 * The first three failures are free so a mistyped PIN is not punished, matching
 * the app-lock screen's three-attempt budget; from there the delay doubles and
 * then clamps.
 */
export const STEP_UP_ATTEMPT_DELAYS_MS: readonly number[] = [0, 0, 0, 0, 30_000, 60_000, 120_000, 300_000];

/**
 * Which verification methods this credential state can satisfy. `totp` is
 * only required for `strong`, and only when two-factor is actually active
 * with a stored secret.
 */
export function stepUpMethods(state: StepUpCredentialState, level: StepUpLevel): StepUpMethods {
  return {
    pin: !!state.pinHash && !!state.pinSalt,
    biometric: state.biometricEnabled && !!state.biometricCredentialId,
    totp: level === 'strong' && state.twoFactor && !!state.totpSecret,
  };
}

/**
 * True when at least one method could satisfy the challenge. False means the
 * action must be blocked (fail closed) — typically a user who never set a PIN.
 */
export function canSatisfyStepUp(state: StepUpCredentialState, level: StepUpLevel): boolean {
  const methods = stepUpMethods(state, level);
  if (methods.pin) return true;
  return level === 'biometric' && methods.biometric;
}

/** Verify the app-lock PIN against the stored hash (PBKDF2, current + legacy iterations). */
export async function verifyStepUpPin(pin: string, state: StepUpCredentialState): Promise<boolean> {
  if (!pin || !state.pinHash || !state.pinSalt) return false;
  const { cryptoCore } = await import('../crypto/cryptoCore');
  return cryptoCore.verifyAppLockPIN(pin, state.pinSalt, state.pinHash);
}

/** Verify a 6-digit TOTP code against the stored secret (±1 step drift). */
export async function verifyStepUpTotp(code: string, secret: string): Promise<boolean> {
  if (!code || !secret) return false;
  const { verifyTotp } = await import('../twoFactor');
  return verifyTotp(secret, code);
}

/** Milliseconds the caller must wait after `attempts` consecutive failures. */
export function stepUpDelayMs(attempts: number): number {
  if (attempts <= 0) return 0;
  return STEP_UP_ATTEMPT_DELAYS_MS[Math.min(attempts, STEP_UP_ATTEMPT_DELAYS_MS.length - 1)];
}
