// Recovery Manager - handles mnemonic phrase generation and restoration

import { buf2hex, hex2buf } from '../crypto/cryptoCore';
import { validateMnemonic as validateMnemonicFn, mnemonicToEntropy, entropyToHex, WORD_LIST } from './MnemonicGenerator';
import { deviceSecurity } from '../deviceSecurity';
import { setSessionMasterKey } from '../../store';

const RECOVERY_HASH_KEY = 'app_recovery_hash';

export const RecoveryManager = {
  async generateRecoveryPhrase(): Promise<string> {
    // Generate a 10-word mnemonic
    const entropy = crypto.getRandomValues(new Uint8Array(16));
    const indices: number[] = [];
    for (let i = 0; i < 10; i++) {
      const idx = (entropy[i * 2] << 4) | (entropy[i * 2 + 1] & 0x0f);
      indices.push(idx % 1024);
    }
    const phrase = indices.map(i => WORD_LIST[i]).join(" ");

    // Store salted PBKDF2 hash of the phrase for verification
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const phraseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(phrase),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
      phraseKey,
      256
    );
    const hashHex = buf2hex(derivedBits);
    localStorage.setItem(RECOVERY_HASH_KEY, `${buf2hex(salt)}:${hashHex}`);
    
    return phrase;
  },

  async restoreFromPhrase(phrase: string): Promise<boolean> {
    const storedHash = localStorage.getItem(RECOVERY_HASH_KEY);
    if (!storedHash || !storedHash.includes(':')) return false;
    const [saltHex, expectedHash] = storedHash.split(':');

    // Validate phrase words
    if (!validateMnemonicFn(phrase)) return false;

    // Convert phrase to entropy then to hex master key
    const entropy = mnemonicToEntropy(phrase);
    if (!entropy) return false;

    const hexKey = entropyToHex(entropy);

    // Verify PBKDF2 hash matches
    const phraseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(phrase),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: hex2buf(saltHex), iterations: 600000, hash: 'SHA-256' },
      phraseKey,
      256
    );
    const hashHex = buf2hex(derivedBits);
    if (hashHex !== expectedHash) return false;

    // Import the recovered key as a CryptoKey
    const recoveredKey = await crypto.subtle.importKey(
      "raw",
      hex2buf(hexKey),
      "AES-GCM",
      true,
      ["encrypt", "decrypt"]
    );

    // Re-encrypt and store the master key with current device-bound key
    await deviceSecurity.storeMasterKeyHex(hexKey);

    // Update the in-memory session master key
    setSessionMasterKey(recoveredKey);

    return true;
  },

  hasRecoveryPhrase(): boolean {
    return !!localStorage.getItem(RECOVERY_HASH_KEY);
  },

  clearRecoveryHash(): void {
    localStorage.removeItem(RECOVERY_HASH_KEY);
  }
};

// Re-export utility functions for use elsewhere
export { validateMnemonicFn as validateMnemonic, mnemonicToEntropy, entropyToHex };
