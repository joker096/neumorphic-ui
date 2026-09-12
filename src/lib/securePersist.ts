/**
 * Encrypted localStorage helper for sensitive settings values.
 * Each sensitive value is encrypted with the session master key
 * (AES-256-GCM) before persisting, and stored in the settings blob with a
 * "ENC:v1:" prefix so the reader can distinguish it from legacy plaintext.
 *
 * Reads degrade to plaintext when the crypto key is not initialised yet
 * (early hydration) or for values written before this module existed.
 */

import { buf2hex, hex2buf } from './crypto/cryptoCore';

let _sessionKey: CryptoKey | null = null;

/** Must be called once during initAppStorage, after deviceSecurity is ready. */
export function setSessionPersistKey(key: CryptoKey | null): void {
  _sessionKey = key;
}

export const ENC_PREFIX = 'ENC:v1:';

export function isEncrypted(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(ENC_PREFIX);
}

/** Encrypt a single value. Throws when the session key is not initialised. */
export async function encryptPersistValue(plaintext: string): Promise<string> {
  if (!_sessionKey) throw new Error('securePersist: key not initialised');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    _sessionKey,
    new TextEncoder().encode(plaintext),
  );
  return ENC_PREFIX + buf2hex(iv) + '.' + buf2hex(new Uint8Array(buf));
}

/** Decrypt a value previously returned by `encryptPersistValue`. */
export async function decryptPersistValue(bundle: string): Promise<string> {
  if (!_sessionKey) throw new Error('securePersist: key not initialised');
  const payload = bundle.slice(ENC_PREFIX.length);
  const dot = payload.indexOf('.');
  if (dot === -1) throw new Error('securePersist: invalid bundle');
  const ivHex = payload.slice(0, dot);
  const cipherHex = payload.slice(dot + 1);
  const buf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: hex2buf(ivHex) },
    _sessionKey,
    hex2buf(cipherHex),
  );
  return new TextDecoder().decode(buf);
}