import { deviceSecurity } from '../deviceSecurity';
import { cryptoCore } from '../crypto/cryptoCore';
import type { EncryptedPayload } from '../crypto/types';

export function isEncryptedPayload(v: unknown): v is EncryptedPayload {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).cipher === 'string' &&
    typeof (v as Record<string, unknown>).iv === 'string'
  );
}

export async function encryptCrmData(plain: string): Promise<EncryptedPayload> {
  const key = await deviceSecurity.getDeviceBoundKey();
  return cryptoCore.encryptData(plain, key);
}

export async function decryptCrmData(payload: EncryptedPayload): Promise<string> {
  const key = await deviceSecurity.getDeviceBoundKey();
  return cryptoCore.decryptData(payload.cipher, payload.iv, key);
}
