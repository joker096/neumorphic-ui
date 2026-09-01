import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockCryptoKey, mockDeriveAESKeyFromPassword, mockEncryptData, mockDecryptData, mockBuf2hex, mockHex2buf } = vi.hoisted(() => {
  const key = { type: 'secret', algorithm: { name: 'AES-GCM' } };
  return {
    mockCryptoKey: key,
    mockDeriveAESKeyFromPassword: vi.fn().mockResolvedValue({ key }),
    mockEncryptData: vi.fn().mockResolvedValue({ cipher: 'mock-cipher', iv: 'mock-iv' }),
    mockDecryptData: vi.fn().mockResolvedValue('mock-decrypted-hex'),
    mockBuf2hex: vi.fn().mockReturnValue('mock-generated-hex'),
    mockHex2buf: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4])),
  };
});

vi.mock('./crypto/cryptoCore', () => ({
  cryptoCore: {
    deriveAESKeyFromPassword: mockDeriveAESKeyFromPassword,
    encryptData: mockEncryptData,
    decryptData: mockDecryptData,
  },
  buf2hex: mockBuf2hex,
  hex2buf: mockHex2buf,
}));

const { idbGet, idbSet, idbDel } = vi.hoisted(() => ({
  idbGet: vi.fn(),
  idbSet: vi.fn(),
  idbDel: vi.fn(),
}));

vi.mock('idb-keyval', () => ({
  get: idbGet,
  set: idbSet,
  del: idbDel,
}));

const mockSubtle = {
  generateKey: vi.fn().mockResolvedValue(mockCryptoKey),
  importKey: vi.fn().mockResolvedValue(mockCryptoKey),
  exportKey: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]).buffer),
  deriveBits: vi.fn().mockResolvedValue(new Uint8Array(32).buffer),
};
vi.stubGlobal('crypto', { subtle: mockSubtle });

describe('deviceSecurity', () => {
  let deviceSecurity: {
    getDeviceFingerprint(): Promise<string>;
    getDeviceBoundKey(): Promise<CryptoKey>;
    getDeviceBoundKeyRaw(): Promise<Uint8Array>;
    initSessionMasterKey(): Promise<CryptoKey>;
    importMasterKeyFromHex(hexKey: string): Promise<CryptoKey>;
    storeMasterKeyHex(hexKey: string): Promise<void>;
    getStoredMasterKeyHex(): string | null;
    exportEncryptedKey(passphrase: string): Promise<string>;
    importEncryptedKey(passphrase: string, bundle: string): Promise<void>;
    clearDeviceKeyOverride(): Promise<void>;
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDeriveAESKeyFromPassword.mockResolvedValue({ key: mockCryptoKey, saltHex: 'mock-salt' });
    mockEncryptData.mockResolvedValue({ cipher: 'mock-cipher', iv: 'mock-iv' });
    mockDecryptData.mockResolvedValue('mock-decrypted-hex');
    mockBuf2hex.mockReturnValue('mock-generated-hex');
    mockHex2buf.mockReturnValue(new Uint8Array([1, 2, 3, 4]));
    vi.resetModules();
    const mod = await import('./deviceSecurity');
    deviceSecurity = mod.deviceSecurity;

    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 Test',
      hardwareConcurrency: 8,
      platform: 'Win64',
    });
    Object.defineProperty(window.screen, 'width', { value: 1920, configurable: true });
    Object.defineProperty(window.screen, 'height', { value: 1080, configurable: true });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getDeviceFingerprint() returns a string containing userAgent, concurrency, platform, screen', async () => {
    const fingerprint = await deviceSecurity.getDeviceFingerprint();
    expect(fingerprint).toBe('Mozilla/5.0 Test|8|Win64|1920x1080');
  });

  it('getDeviceFingerprint() handles missing properties', async () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 Test',
      platform: '',
    });
    Object.defineProperty(window.screen, 'width', { value: 0, configurable: true });
    Object.defineProperty(window.screen, 'height', { value: 0, configurable: true });

    const fingerprint = await deviceSecurity.getDeviceFingerprint();
    expect(fingerprint).toBe('Mozilla/5.0 Test|1|unknown|0x0');
  });

  it('getDeviceBoundKey() derives AES-GCM key from fingerprint via PBKDF2 deriveBits', async () => {
    await deviceSecurity.getDeviceBoundKey();

    expect(mockSubtle.importKey).toHaveBeenCalledWith(
      'raw',
      new TextEncoder().encode('Mozilla/5.0 Test|8|Win64|1920x1080'),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    expect(mockSubtle.deriveBits).toHaveBeenCalledWith(
      { name: 'PBKDF2', salt: new Uint8Array([1, 2, 3, 4]), iterations: 600000, hash: 'SHA-256' },
      expect.anything(),
      256,
    );
  });

  it('getDeviceBoundKeyRaw() caches the effective raw key across calls', async () => {
    idbGet.mockResolvedValue(undefined);

    const first = await deviceSecurity.getDeviceBoundKeyRaw();
    const second = await deviceSecurity.getDeviceBoundKeyRaw();

    expect(first).toHaveLength(32);
    expect(second).toBe(first);
    expect(mockSubtle.deriveBits).toHaveBeenCalledTimes(1);
  });

  it('getDeviceBoundKeyRaw() prefers IDB override when it decrypts to a valid 32-byte key', async () => {
    const overrideRaw = new Uint8Array(32).fill(0x5a);
    mockHex2buf.mockImplementation((hex: string) =>
      hex === 'c0ffee00000000000000000000000000' ? new Uint8Array(32) : overrideRaw,
    );
    idbGet.mockResolvedValue({ cipher: 'override-cipher', iv: 'override-iv' });

    const raw = await deviceSecurity.getDeviceBoundKeyRaw();

    expect(idbGet).toHaveBeenCalledWith('__nexus_device_key_override');
    expect(mockDecryptData).toHaveBeenCalledWith('override-cipher', 'override-iv', mockCryptoKey);
    expect(raw).toEqual(overrideRaw);
  });

  it('getDeviceBoundKeyRaw() falls back to fingerprint key when override decrypt fails', async () => {
    idbGet.mockResolvedValue({ cipher: 'override-cipher', iv: 'override-iv' });
    mockDecryptData.mockRejectedValue(new Error('decrypt failed'));

    const raw = await deviceSecurity.getDeviceBoundKeyRaw();

    expect(raw).toHaveLength(32);
    expect(console.warn).toHaveBeenCalled();
  });

  it('initSessionMasterKey() returns existing key when stored key decrypts successfully', async () => {
    idbGet.mockResolvedValue({ cipher: 'stored-cipher', iv: 'stored-iv' });

    const result = await deviceSecurity.initSessionMasterKey();

    expect(result).toBe(mockCryptoKey);
    expect(mockDecryptData).toHaveBeenCalledWith('stored-cipher', 'stored-iv', mockCryptoKey);
    expect(mockHex2buf).toHaveBeenCalledWith('mock-decrypted-hex');
    expect(mockSubtle.importKey).toHaveBeenCalledWith('raw', new Uint8Array([1, 2, 3, 4]), 'AES-GCM', true, ['encrypt', 'decrypt']);
    expect(deviceSecurity.getStoredMasterKeyHex()).toBe('mock-decrypted-hex');
    expect(mockSubtle.generateKey).not.toHaveBeenCalled();
  });

  it('initSessionMasterKey() generates new key when no stored key exists', async () => {
    idbGet.mockResolvedValue(undefined);

    const result = await deviceSecurity.initSessionMasterKey();

    expect(result).toBe(mockCryptoKey);
    expect(mockSubtle.generateKey).toHaveBeenCalledWith({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    expect(mockSubtle.exportKey).toHaveBeenCalledWith('raw', mockCryptoKey);
    expect(mockBuf2hex).toHaveBeenCalledWith(new Uint8Array([1, 2, 3, 4]).buffer);
    expect(mockEncryptData).toHaveBeenCalledWith('mock-generated-hex', mockCryptoKey);
    expect(idbSet).toHaveBeenCalledWith('__nexus_key_storage', { cipher: 'mock-cipher', iv: 'mock-iv' });
    expect(deviceSecurity.getStoredMasterKeyHex()).toBe('mock-generated-hex');
  });

  it('initSessionMasterKey() generates fresh key when stored key decrypt fails', async () => {
    idbGet.mockResolvedValue({ cipher: 'stored-cipher', iv: 'stored-iv' });
    mockDecryptData.mockRejectedValue(new Error('decrypt failed'));

    const result = await deviceSecurity.initSessionMasterKey();

    expect(result).toBe(mockCryptoKey);
    expect(mockDecryptData).toHaveBeenCalledWith('stored-cipher', 'stored-iv', mockCryptoKey);
    expect(mockSubtle.generateKey).toHaveBeenCalled();
    expect(mockEncryptData).toHaveBeenCalled();
    expect(idbSet).toHaveBeenCalled();
    expect(deviceSecurity.getStoredMasterKeyHex()).toBe('mock-generated-hex');
  });

  it('importMasterKeyFromHex() imports hex key as AES-GCM CryptoKey', async () => {
    const hexKey = 'aabbccdd00112233445566778899aabb';

    const result = await deviceSecurity.importMasterKeyFromHex(hexKey);

    expect(result).toBe(mockCryptoKey);
    expect(mockHex2buf).toHaveBeenCalledWith(hexKey);
    expect(mockSubtle.importKey).toHaveBeenCalledWith('raw', new Uint8Array([1, 2, 3, 4]), 'AES-GCM', true, ['encrypt', 'decrypt']);
    expect(deviceSecurity.getStoredMasterKeyHex()).toBe(hexKey);
  });

  it('storeMasterKeyHex() encrypts key with device bound key and stores in IDB', async () => {
    const hexKey = 'hex-key-to-store';

    await deviceSecurity.storeMasterKeyHex(hexKey);

    expect(mockSubtle.deriveBits).toHaveBeenCalled();
    expect(mockEncryptData).toHaveBeenCalledWith(hexKey, mockCryptoKey);
    expect(idbSet).toHaveBeenCalledWith('__nexus_key_storage', { cipher: 'mock-cipher', iv: 'mock-iv' });
    expect(deviceSecurity.getStoredMasterKeyHex()).toBe(hexKey);
  });

  it('getStoredMasterKeyHex() returns cached hex after init', async () => {
    idbGet.mockResolvedValue({ cipher: 'stored-cipher', iv: 'stored-iv' });

    await deviceSecurity.initSessionMasterKey();

    expect(deviceSecurity.getStoredMasterKeyHex()).toBe('mock-decrypted-hex');
  });

  it('getStoredMasterKeyHex() returns null before any init', () => {
    expect(deviceSecurity.getStoredMasterKeyHex()).toBeNull();
  });

  it('exportEncryptedKey() wraps effective raw key under passphrase and returns v1 bundle', async () => {
    idbGet.mockResolvedValue(undefined);

    const bundle = JSON.parse(await deviceSecurity.exportEncryptedKey('my-passphrase'));

    expect(mockDeriveAESKeyFromPassword).toHaveBeenCalledWith('my-passphrase');
    expect(mockEncryptData).toHaveBeenCalledWith('mock-generated-hex', mockCryptoKey);
    expect(bundle).toEqual({ v: 1, salt: 'mock-salt', iv: 'mock-iv', cipher: 'mock-cipher' });
  });

  it('importEncryptedKey() stores override encrypted under fingerprint key and updates effective raw', async () => {
    const importedRaw = new Uint8Array(32).fill(0x42);
    mockHex2buf.mockImplementation((hex: string) =>
      hex === 'mock-decrypted-hex' ? importedRaw : new Uint8Array(32),
    );
    const bundle = JSON.stringify({ v: 1, salt: 'bundle-salt', iv: 'bundle-iv', cipher: 'bundle-cipher' });

    await deviceSecurity.importEncryptedKey('my-passphrase', bundle);

    expect(mockDeriveAESKeyFromPassword).toHaveBeenCalledWith('my-passphrase', 'bundle-salt');
    expect(mockDecryptData).toHaveBeenCalledWith('bundle-cipher', 'bundle-iv', mockCryptoKey);
    expect(mockEncryptData).toHaveBeenCalledWith('mock-generated-hex', mockCryptoKey);
    expect(idbSet).toHaveBeenCalledWith('__nexus_device_key_override', { cipher: 'mock-cipher', iv: 'mock-iv' });

    idbGet.mockResolvedValue({ cipher: 'stale', iv: 'stale' });
    const raw = await deviceSecurity.getDeviceBoundKeyRaw();
    expect(raw).toEqual(importedRaw);
    expect(idbGet).not.toHaveBeenCalled();
  });

  it('importEncryptedKey() rejects malformed bundles', async () => {
    const validBundle = () =>
      JSON.stringify({ v: 1, salt: 'aabb', iv: 'codd', cipher: 'eeff' });

    await expect(deviceSecurity.importEncryptedKey('p', 'not-json')).rejects.toThrow();
    await expect(deviceSecurity.importEncryptedKey('p', JSON.stringify('scalar'))).rejects.toThrow();
    await expect(deviceSecurity.importEncryptedKey('p', JSON.stringify({ v: 2, salt: 'aabb', iv: 'codd', cipher: 'eeff' }))).rejects.toThrow();
    await expect(deviceSecurity.importEncryptedKey('p', JSON.stringify({ v: 1, salt: 1, iv: 'codd', cipher: 'eeff' }))).rejects.toThrow();

    mockDecryptData.mockResolvedValue('short-hex');
    mockHex2buf.mockImplementation((hex: string) => (hex === 'short-hex' ? new Uint8Array(8) : new Uint8Array(32)));
    await expect(deviceSecurity.importEncryptedKey('p', validBundle())).rejects.toThrow();

    expect(idbSet).not.toHaveBeenCalled();
  });

  it('clearDeviceKeyOverride() deletes stored override and resets effective raw', async () => {
    mockHex2buf.mockReturnValue(new Uint8Array(32));
    const bundle = JSON.stringify({ v: 1, salt: 'aabb', iv: 'codd', cipher: 'eeff' });
    await deviceSecurity.importEncryptedKey('p', bundle);

    await deviceSecurity.clearDeviceKeyOverride();

    expect(idbDel).toHaveBeenCalledWith('__nexus_device_key_override');
    idbGet.mockResolvedValue(undefined);
    const raw = await deviceSecurity.getDeviceBoundKeyRaw();
    expect(raw).toHaveLength(32);
    expect(mockSubtle.deriveBits).toHaveBeenCalledTimes(2);
  });
});
