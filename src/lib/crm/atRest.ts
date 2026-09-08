import type { EncryptedPayload } from '../crypto/types';

export function isEncryptedPayload(v: unknown): v is EncryptedPayload {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).cipher === 'string' &&
    typeof (v as Record<string, unknown>).iv === 'string'
  );
}

async function loadDeviceCrypto(): Promise<{ key: CryptoKey; cryptoCore: typeof import('../crypto/cryptoCore').cryptoCore }> {
  const [{ deviceSecurity }, { cryptoCore }] = await Promise.all([
    import('../deviceSecurity'),
    import('../crypto/cryptoCore'),
  ]);
  return { key: await deviceSecurity.getDeviceBoundKey(), cryptoCore };
}

export async function encryptCrmData(plain: string): Promise<EncryptedPayload> {
  const { key, cryptoCore } = await loadDeviceCrypto();
  return cryptoCore.encryptData(plain, key);
}

export async function decryptCrmData(payload: EncryptedPayload): Promise<string> {
  const { key, cryptoCore } = await loadDeviceCrypto();
  return cryptoCore.decryptData(payload.cipher, payload.iv, key);
}
