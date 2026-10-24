import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cryptoCore } from '../src/lib/cryptoCore';

describe('Crypto & Storage Security', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    const localStorageMock = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => { mockStorage[key] = value.toString(); },
      clear: () => { mockStorage = {}; },
      length: 0,
      key: (index: number) => Object.keys(mockStorage)[index] || null,
      removeItem: (key: string) => { delete mockStorage[key]; }
    };
    vi.stubGlobal('localStorage', localStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should encrypt and decrypt localStorage state correctly using AES-256-GCM', async () => {
    const originalState = JSON.stringify({ user: 'admin', theme: 'dark' });
    const password = 'secure-password-123';
    
    // Key Derivation
    const { key, saltHex } = await cryptoCore.deriveAESKeyFromPassword(password, undefined, 1000); // 1000 iterations for faster tests
    
    // Encryption
    const { cipher, iv } = await cryptoCore.encryptData(originalState, key);
    
    // Transition to state
    localStorage.setItem('appData', cipher);
    localStorage.setItem('appDataIv', iv);
    localStorage.setItem('appDataSalt', saltHex);
    
    // Verification it's in local storage
    expect(localStorage.getItem('appData')).toBe(cipher);
    expect(localStorage.getItem('appData')).not.toBe(originalState);
    
    // Decryption
    const storedCipher = localStorage.getItem('appData')!;
    const storedIv = localStorage.getItem('appDataIv')!;
    const storedSalt = localStorage.getItem('appDataSalt')!;
    
    const { key: derivedKey } = await cryptoCore.deriveAESKeyFromPassword(password, storedSalt, 1000);
    const decryptedState = await cryptoCore.decryptData(storedCipher, storedIv, derivedKey);
    
    expect(decryptedState).toBe(originalState);
  });

  it('should throw an appropriate security error on AES-256-GCM decryption if an invalid password is provided', async () => {
    const originalState = JSON.stringify({ secret: 'top-secret' });
    const validPassword = 'correct-pin-123';
    const invalidPassword = 'wrong-pin-456';
    
    const { key, saltHex } = await cryptoCore.deriveAESKeyFromPassword(validPassword, undefined, 1000);
    const { cipher, iv } = await cryptoCore.encryptData(originalState, key);
    
    // Attempt decryption with wrong pin
    const { key: wrongKey } = await cryptoCore.deriveAESKeyFromPassword(invalidPassword, saltHex, 1000);
    
    await expect(cryptoCore.decryptData(cipher, iv, wrongKey)).rejects.toThrow();
  });

  it('should verify PBKDF2-SHA256 key derivation process handles PIN validation', async () => {
    const validPin = '1234';
    const invalidPin = '0000';
    
    const { hash: targetHash, saltHex } = await cryptoCore.hashAppLockPIN(validPin, undefined, 1000);
    
    // Ensure the valid pin hashes to the target
    const { hash: checkValidHash } = await cryptoCore.hashAppLockPIN(validPin, saltHex, 1000);
    expect(checkValidHash).toBe(targetHash);
    
    // Ensure invalid pin hashes differently
    const { hash: checkInvalidHash } = await cryptoCore.hashAppLockPIN(invalidPin, saltHex, 1000);
    expect(checkInvalidHash).not.toBe(targetHash);
  });
});
