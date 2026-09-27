import { cryptoCore, buf2hex, hex2buf } from './crypto/cryptoCore';
import * as idb from 'idb-keyval';

// Store the hex of the master key after initialization
let _masterKeyHex: string | null = null;
// Effective raw device bound key (fingerprint-derived or imported override)
let _effectiveRaw: Uint8Array | null = null;

const STATIC_SALT_HEX = 'c0ffee00000000000000000000000000';
const OVERRIDE_KEY_ID = '__nexus_device_key_override';
const KEY_ITERATIONS = 600000;

async function importRawKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export const deviceSecurity = {
  async getDeviceFingerprint(): Promise<string> {
    const ua = navigator.userAgent;
    const coreCount = navigator.hardwareConcurrency || 1;
    const platform = navigator.platform || 'unknown';
    const screen = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
    return `${ua}|${coreCount}|${platform}|${screen}`;
  },

  /**
   * Legacy device-bound KDF.
   *
   * SECURITY NOTE: every input here is public (user agent, core count,
   * platform, screen size) and the salt is fixed, so this key is *not* a
   * secret — anyone who can read this origin's IndexedDB can reproduce it and
   * unwrap the master key and the identity seed. It still provides device
   * binding (a copied profile stops decrypting when these values change) and
   * keeps raw store contents unreadable. It must not be described as
   * protection against profile theft or same-origin script execution: see
   * docs/superpowers/threat-model/threat-model.md §3.4.1. Closing that gap
   * needs a user-held secret (app-lock PIN / data passphrase) or a platform
   * keystore, both of which are product decisions.
   */
  async _deriveFingerprintRaw(): Promise<Uint8Array> {
    const fingerprint = await this.getDeviceFingerprint();
    const passKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(fingerprint),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: hex2buf(STATIC_SALT_HEX), iterations: KEY_ITERATIONS, hash: 'SHA-256' },
      passKey,
      256,
    );
    return new Uint8Array(bits);
  },

  async _fingerprintKey(): Promise<CryptoKey> {
    return importRawKey(await this._deriveFingerprintRaw());
  },

  async getDeviceBoundKeyRaw(): Promise<Uint8Array> {
    if (_effectiveRaw) return _effectiveRaw;
    const stored = await idb.get(OVERRIDE_KEY_ID);
    if (stored && stored.cipher && stored.iv) {
      try {
        const fpKey = await this._fingerprintKey();
        const raw = hex2buf(await cryptoCore.decryptData(stored.cipher, stored.iv, fpKey));
        if (raw.length === 32) {
          _effectiveRaw = raw;
          return raw;
        }
      } catch (e) {
        console.warn('Failed to unwrap device key override. Using fingerprint key.', e);
      }
    }
    _effectiveRaw = await this._deriveFingerprintRaw();
    return _effectiveRaw;
  },

  async getDeviceBoundKey(): Promise<CryptoKey> {
    return importRawKey(await this.getDeviceBoundKeyRaw());
  },

  async initSessionMasterKey(): Promise<CryptoKey> {
    const dbk = await this.getDeviceBoundKey();
    let masterKey: CryptoKey;

    // Check if we already have an encrypted master key in IndexedDB
    const stored = await idb.get('__nexus_key_storage');
    if (stored && stored.cipher && stored.iv) {
      try {
        const rawHex = await cryptoCore.decryptData(stored.cipher, stored.iv, dbk);
        masterKey = await crypto.subtle.importKey(
          "raw",
          hex2buf(rawHex),
          "AES-GCM",
          true,
          ["encrypt", "decrypt"]
        );
        _masterKeyHex = rawHex;
        return masterKey;
      } catch (e) {
        console.warn("Failed to unwrap master key using device fingerprint. A fresh session key was created.", e);
      }
    }

    // Generate a new random AES-256-GCM master key
    masterKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const rawMasterKey = await crypto.subtle.exportKey("raw", masterKey);
    const hexMasterKey = buf2hex(rawMasterKey);

    const encryptedMasterKey = await cryptoCore.encryptData(hexMasterKey, dbk);
    await idb.set('__nexus_key_storage', encryptedMasterKey);
    _masterKeyHex = hexMasterKey;

    return masterKey;
  },

  // Import a master key from hex string (used during recovery)
  async importMasterKeyFromHex(hexKey: string): Promise<CryptoKey> {
    const key = await crypto.subtle.importKey(
      "raw",
      hex2buf(hexKey),
      "AES-GCM",
      true,
      ["encrypt", "decrypt"]
    );
    _masterKeyHex = hexKey;
    return key;
  },

  // Re-encrypt and store a master key hex in IndexedDB with current device bound key
  async storeMasterKeyHex(hexKey: string): Promise<void> {
    const dbk = await this.getDeviceBoundKey();
    const encrypted = await cryptoCore.encryptData(hexKey, dbk);
    await idb.set('__nexus_key_storage', encrypted);
    _masterKeyHex = hexKey;
  },

  // Get the stored master key hex
  getStoredMasterKeyHex(): string | null {
    return _masterKeyHex;
  },

  // Export the effective device key wrapped under a user passphrase (migration to another device)
  async exportEncryptedKey(passphrase: string): Promise<string> {
    const raw = await this.getDeviceBoundKeyRaw();
    const { key, saltHex } = await cryptoCore.deriveAESKeyFromPassword(passphrase);
    const { cipher, iv } = await cryptoCore.encryptData(buf2hex(raw), key);
    return JSON.stringify({ v: 1, salt: saltHex, iv, cipher });
  },

  // Import a passphrase-wrapped device key; re-wrap under this device's fingerprint key and persist
  async importEncryptedKey(passphrase: string, bundle: string): Promise<void> {
    let parsed: { v?: unknown; salt?: unknown; iv?: unknown; cipher?: unknown };
    try {
      parsed = JSON.parse(bundle);
    } catch (e) {
      throw new TypeError('importEncryptedKey: invalid bundle', e);
    }
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      parsed.v !== 1 ||
      typeof parsed.salt !== 'string' ||
      typeof parsed.iv !== 'string' ||
      typeof parsed.cipher !== 'string'
    ) {
      throw new TypeError('importEncryptedKey: invalid bundle format');
    }
    const { key } = await cryptoCore.deriveAESKeyFromPassword(passphrase, parsed.salt);
    const rawHex = await cryptoCore.decryptData(parsed.cipher, parsed.iv, key);
    const raw = hex2buf(rawHex);
    if (raw.length !== 32) {
      throw new TypeError('importEncryptedKey: invalid key material');
    }
    const fpKey = await this._fingerprintKey();
    const { cipher, iv } = await cryptoCore.encryptData(buf2hex(raw), fpKey);
    await idb.set(OVERRIDE_KEY_ID, { cipher, iv });
    _effectiveRaw = raw;
  },

  async clearDeviceKeyOverride(): Promise<void> {
    await idb.del(OVERRIDE_KEY_ID);
    _effectiveRaw = null;
  }
};
