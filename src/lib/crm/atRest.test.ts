import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isEncryptedPayload, encryptCrmData, decryptCrmData } from './atRest';

const { getDeviceBoundKey, encryptData, decryptData } = vi.hoisted(() => ({
  getDeviceBoundKey: vi.fn(),
  encryptData: vi.fn(),
  decryptData: vi.fn(),
}));

vi.mock('../deviceSecurity', () => ({ deviceSecurity: { getDeviceBoundKey } }));
vi.mock('../crypto/cryptoCore', () => ({ cryptoCore: { encryptData, decryptData } }));

describe('atRest', () => {
  beforeEach(() => {
    getDeviceBoundKey.mockReset();
    encryptData.mockReset();
    decryptData.mockReset();
    getDeviceBoundKey.mockResolvedValue('device-key');
  });

  describe('isEncryptedPayload', () => {
    it('accepts a payload with string cipher and iv', () => {
      expect(isEncryptedPayload({ cipher: 'c', iv: 'i' })).toBe(true);
    });

    it('rejects null, primitives and malformed payloads', () => {
      expect(isEncryptedPayload(null)).toBe(false);
      expect(isEncryptedPayload(undefined)).toBe(false);
      expect(isEncryptedPayload('cipher')).toBe(false);
      expect(isEncryptedPayload({ cipher: 'c' })).toBe(false);
      expect(isEncryptedPayload({ iv: 'i' })).toBe(false);
      expect(isEncryptedPayload({ cipher: 1, iv: 'i' })).toBe(false);
      expect(isEncryptedPayload({ cipher: 'c', iv: 2 })).toBe(false);
    });
  });

  describe('encryptCrmData', () => {
    it('encrypts using the device-bound key', async () => {
      encryptData.mockResolvedValue({ cipher: 'enc', iv: 'iv1' });
      const payload = await encryptCrmData('plain-data');
      expect(getDeviceBoundKey).toHaveBeenCalledOnce();
      expect(encryptData).toHaveBeenCalledWith('plain-data', 'device-key');
      expect(payload).toEqual({ cipher: 'enc', iv: 'iv1' });
    });
  });

  describe('decryptCrmData', () => {
    it('decrypts using the device-bound key', async () => {
      decryptData.mockResolvedValue('plain-data');
      const plain = await decryptCrmData({ cipher: 'enc', iv: 'iv1' });
      expect(getDeviceBoundKey).toHaveBeenCalledOnce();
      expect(decryptData).toHaveBeenCalledWith('enc', 'iv1', 'device-key');
      expect(plain).toBe('plain-data');
    });
  });
});
