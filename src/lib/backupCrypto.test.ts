// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  BackupDecryptError,
  decryptBackupData,
  encryptBackupData,
  isEncryptedBackup,
} from './backupCrypto';

const sampleData = {
  version: 1,
  app: 'neumorphic-ui',
  createdAt: '2026-01-01T00:00:00.000Z',
  chats: [{ id: 'c1', title: 'Test chat', messages: [] }],
  contacts: [],
  channels: [],
  callHistory: [],
};

describe('backupCrypto', () => {
  it('roundtrips encrypted backup', async () => {
    const encrypted = await encryptBackupData(sampleData, 'correct horse');
    expect(isEncryptedBackup(encrypted)).toBe(true);
    const decrypted = await decryptBackupData(encrypted.buffer as ArrayBuffer, 'correct horse');
    expect(decrypted).toEqual(sampleData);
  });

  it('fails with wrong password', async () => {
    const encrypted = await encryptBackupData(sampleData, 'right password');
    await expect(decryptBackupData(encrypted.buffer as ArrayBuffer, 'wrong password'))
      .rejects.toThrow(BackupDecryptError);
  });

  it('rejects plaintext JSON', async () => {
    const json = JSON.stringify(sampleData);
    expect(isEncryptedBackup(new TextEncoder().encode(json))).toBe(false);
    await expect(decryptBackupData(new TextEncoder().encode(json).buffer as ArrayBuffer, 'x'))
      .rejects.toThrow(BackupDecryptError);
  });

  it('produces different ciphertexts for the same password', async () => {
    const a = await encryptBackupData(sampleData, 'same password');
    const b = await encryptBackupData(sampleData, 'same password');
    expect(a.length).toBeGreaterThan(0);
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });
});
