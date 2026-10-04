import { encryptPersistValue, decryptPersistValue, isEncrypted } from '../../../lib/securePersist';

export const PRIVACY_STORAGE_KEY = 'mess_privacy_settings_v2';

/** Keys whose values must be encrypted before persisting to localStorage. */
export const ENCRYPTED_KEYS = new Set(['totpSecret', 'turnServerUrl', 'turnServerUser', 'turnServerPass']);

/** Keys currently read by this slice. Any other key is legacy and stripped. */
const PERSISTED_KEYS = new Set([
  'appLockBiometricEnabled',
  'appLockBiometricCredentialId',
  'appLockAutoLockOnBackground',
  'appLockIdleSeconds',
  'appLockHashedPIN',
  'appLockSalt',
  'turnServerUrl',
  'turnServerUser',
  'turnServerPass',
  'draftsEnabled',
  'offlineMode',
  'ghostViewMode',
  'readReceipts',
  'typingIndicators',
  'stealthMode',
  'deliveryReceipts',
  'onlineStatus',
  'forwardAnonymization',
  'soundEnabled',
  'soundVolume',
  'notifications',
  'twoFactor',
  'totpSecret',
  'spamFilter',
  'mediaAutoLoad',
  'selfDestructDefault',
  'obfuscationEnabled',
  'relayBackend',
  'autoReconnect',
  'uiAnimations',
  'themeMode',
  'accentColor',
  'chatBackground',
  'customChatBackground',
  'density',
  'messageRadius',
  'animationIntensity',
  'dndEnabled',
  'dndFrom',
  'dndTo',
  'priorityContacts',
  'saveAudioRecordings',
  'saveVideoRecordings',
  'autoRecordCalls',
  'recordingsRetentionDays',
]);

export const savedPrivacySettings = (() => {
  try {
    const raw = localStorage.getItem(PRIVACY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    let migrated = false;
    for (const key of Object.keys(parsed)) {
      if (!PERSISTED_KEYS.has(key)) {
        delete parsed[key];
        migrated = true;
      }
    }
    if (migrated) {
      try {
        localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(parsed));
      } catch { /* storage unavailable — in-memory migration only */ }
    }
    return parsed;
  } catch { /* ignore */ }
  return {};
})();

/**
 * Atomic encrypted persistence: encrypt BEFORE the first write; a failure
 * cancels the save (fail-closed) — the plaintext value never touches storage.
 */
export function persistEncryptedSetting(key: string, value: string) {
  void encryptPersistValue(value)
    .then((enc) => {
      try {
        const prev = JSON.parse(localStorage.getItem(PRIVACY_STORAGE_KEY) || '{}');
        prev[key] = enc;
        localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(prev));
      } catch { /* storage unavailable — state-only */ }
    })
    .catch(() => { /* session key unavailable — save aborted, nothing persisted */ });
}

export function persistSetting(key: string, value: unknown) {
  try {
    if (ENCRYPTED_KEYS.has(key) && typeof value === 'string' && value) {
      persistEncryptedSetting(key, value);
      return;
    }
    const prev = JSON.parse(localStorage.getItem(PRIVACY_STORAGE_KEY) || '{}');
    prev[key] = value;
    localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(prev));
  } catch {}
}

/** Set of keys `updateSettings` is allowed to change (mitigates S3). */
export const UPDATE_ALLOWLIST = new Set([
  'soundEnabled', 'ghostViewMode', 'stealthMode',
  'deliveryReceipts', 'readReceipts', 'typingIndicators',
  'onlineStatus', 'forwardAnonymization',
  'turnServerUrl', 'turnServerUser', 'turnServerPass',
]);

/**
 * Post-key-init hydration: decrypts any sensitive settings that were
 * persisted while the session key was unavailable (or written before this
 * module existed). Called by initAppStorage after setSessionPersistKey.
 */
export async function hydrateSecurePrivacyFields(get: () => any, setLocal: (partial: any) => void): Promise<void> {
  const updates: Record<string, string> = {};
  for (const key of ENCRYPTED_KEYS) {
    const value = savedPrivacySettings[key];
    if (isEncrypted(value)) {
      try {
        updates[key] = await decryptPersistValue(value);
      } catch { /* leave as-is */ }
    }
  }
  if (Object.keys(updates).length > 0) {
    setLocal({ ...updates });
  }
}