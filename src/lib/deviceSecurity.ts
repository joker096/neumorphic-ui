import { cryptoCore, buf2hex, hex2buf } from './crypto/cryptoCore';
import * as idb from 'idb-keyval';

// Store the hex of the master key after initialization
let _masterKeyHex: string | null = null;

export const deviceSecurity = {
  async getDeviceFingerprint(): Promise<string> {
    const ua = navigator.userAgent;
    const coreCount = navigator.hardwareConcurrency || 1;
    const platform = navigator.platform || 'unknown';
    const screen = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
    return `${ua}|${coreCount}|${platform}|${screen}`;
  },

  async getDeviceBoundKey(): Promise<CryptoKey> {
    const fingerprint = await this.getDeviceFingerprint();
    const staticSaltHex = 'c0ffee00000000000000000000000000';
    const { key } = await cryptoCore.deriveAESKeyFromPassword(fingerprint, staticSaltHex, 600000);
    return key;
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
        console.error("Failed to unwrap master key using device fingerprint.", e);
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
  }
};
