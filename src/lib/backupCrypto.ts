const MAGIC = [0x4d, 0x42, 0x45, 0x4b];
const FORMAT_VERSION = 1;
const PBKDF2_ITERATIONS = 210_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const HEADER_LENGTH = MAGIC.length + 1 + SALT_LENGTH + IV_LENGTH;

export class BackupDecryptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupDecryptError';
  }
}

async function deriveBackupKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export function isEncryptedBackup(data: ArrayBuffer | Uint8Array): boolean {
  const head = data instanceof Uint8Array ? data : new Uint8Array(data);
  return head.length >= HEADER_LENGTH && MAGIC.every((byte, i) => head[i] === byte);
}

export async function encryptBackupData(data: unknown, password: string): Promise<Uint8Array> {
  if (!password) throw new BackupDecryptError('No password provided');
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveBackupKey(password, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  const out = new Uint8Array(HEADER_LENGTH + ciphertext.byteLength);
  out.set(Uint8Array.from(MAGIC), 0);
  out[4] = FORMAT_VERSION;
  out.set(salt, 5);
  out.set(iv, 5 + SALT_LENGTH);
  out.set(new Uint8Array(ciphertext), HEADER_LENGTH);
  return out;
}

export async function decryptBackupData(data: ArrayBuffer, password: string): Promise<unknown> {
  const buf = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (!isEncryptedBackup(buf)) throw new BackupDecryptError('Invalid backup file');
  const salt = buf.slice(5, 5 + SALT_LENGTH);
  const iv = buf.slice(5 + SALT_LENGTH, 5 + SALT_LENGTH + IV_LENGTH);
  const ciphertext = buf.slice(HEADER_LENGTH);
  let key: CryptoKey;
  try {
    key = await deriveBackupKey(password, salt);
  } catch {
    throw new BackupDecryptError('Decryption failed');
  }
  try {
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return JSON.parse(new TextDecoder().decode(plaintext));
  } catch {
    throw new BackupDecryptError('Decryption failed');
  }
}
