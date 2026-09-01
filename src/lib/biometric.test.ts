import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isWebAuthnSupported,
  isBiometricAvailable,
  registerBiometric,
  verifyBiometric,
} from './biometric';

function stubWebAuthn(credentials: any = {}) {
  Object.defineProperty(window, 'PublicKeyCredential', {
    configurable: true,
    value: {},
  });
  Object.defineProperty(navigator, 'credentials', {
    configurable: true,
    value: {
      create: vi.fn(async () => ({ rawId: new Uint8Array([1, 2, 250, 3]) }) as any),
      get: vi.fn(async () => ({}) as any),
      ...credentials,
    },
  });
}

function stubAuthenticatorAvailable(available: boolean) {
  Object.defineProperty(window, 'PublicKeyCredential', {
    configurable: true,
    value: {
      isUserVerifyingPlatformAuthenticatorAvailable: vi.fn(async () => available),
    },
  });
  Object.defineProperty(navigator, 'credentials', {
    configurable: true,
    value: {},
  });
}

describe('biometric', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete (window as any).PublicKeyCredential;
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: undefined,
    });
  });

  it('isWebAuthnSupported false without PublicKeyCredential', () => {
    expect(isWebAuthnSupported()).toBe(false);
  });

  it('isWebAuthnSupported true when WebAuthn globals present', () => {
    stubWebAuthn();
    expect(isWebAuthnSupported()).toBe(true);
  });

  it('isBiometricAvailable false when unsupported', async () => {
    expect(await isBiometricAvailable()).toBe(false);
  });

  it('isBiometricAvailable reflects platform authenticator availability', async () => {
    stubAuthenticatorAvailable(true);
    expect(await isBiometricAvailable()).toBe(true);
  });

  it('isBiometricAvailable false on auth error', async () => {
    Object.defineProperty(window, 'PublicKeyCredential', {
      configurable: true,
      value: {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn(async () => {
          throw new Error('nope');
        }),
      },
    });
    expect(await isBiometricAvailable()).toBe(false);
  });

  it('registerBiometric throws when WebAuthn unavailable', async () => {
    await expect(registerBiometric('alice')).rejects.toThrow('WebAuthn unavailable');
  });

  it('registerBiometric returns b64url credential id', async () => {
    stubWebAuthn();
    const id = await registerBiometric('alice');
    expect(id).toBe('AQL6Aw'); // b64url of [1,2,250,3]
  });

  it('verifyBiometric resolves true on successful assertion', async () => {
    stubWebAuthn();
    expect(await verifyBiometric('AQL6Aw')).toBe(true);
  });

  it('verifyBiometric resolves false on failure or unsupported', async () => {
    stubWebAuthn({
      get: vi.fn(async () => {
        throw new Error('cancelled');
      }),
    });
    expect(await verifyBiometric('AQL6Aw')).toBe(false);
  });
});
