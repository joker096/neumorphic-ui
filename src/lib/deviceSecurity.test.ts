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

const { idbGet, idbSet } = vi.hoisted(() => ({
  idbGet: vi.fn(),
  idbSet: vi.fn(),
}));

vi.mock('idb-keyval', () => ({
  get: idbGet,
  set: idbSet,
  del: vi.fn(),
}));

const mockSubtle = {
  generateKey: vi.fn().mockResolvedValue(mockCryptoKey),
  importKey: vi.fn().mockResolvedValue(mockCryptoKey),
  exportKey: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]).buffer),
};
vi.stubGlobal('crypto', { subtle: mockSubtle });

describe('deviceSecurity', () => {
  let deviceSecurity: {
    getDeviceFingerprint(): Promise<string>;
    getDeviceBoundKey(): Promise<CryptoKey>;
    initSessionMasterKey(): Promise<CryptoKey>;
    importMasterKeyFromHex(hexKey: string): Promise<CryptoKey>;
    storeMasterKeyHex(hexKey: string): Promise<void>;
    getStoredMasterKeyHex(): string | null;
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDeriveAESKeyFromPassword.mockResolvedValue({ key: mockCryptoKey });
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

  it('getDeviceBoundKey() calls deriveAESKeyFromPassword with fingerprint and static salt', async () => {
    await deviceSecurity.getDeviceBoundKey();

    expect(mockDeriveAESKeyFromPassword).toHaveBeenCalledWith(
      'Mozilla/5.0 Test|8|Win64|1920x1080',
      'c0ffee00000000000000000000000000',
      600000,
    );
    expect(mockDeriveAESKeyFromPassword).toHaveBeenCalledTimes(1);
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

    expect(mockDeriveAESKeyFromPassword).toHaveBeenCalled();
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
});
