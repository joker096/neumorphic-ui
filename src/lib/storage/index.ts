// Storage Encryption - Encrypt data stored in IndexedDB

export interface StorageEncryptionConfig {
  key: CryptoKey;
  algorithm: string;
}

export async function initStorageEncryption(passphrase: string): Promise<StorageEncryptionConfig> {
  // Derive a key from the passphrase
  const enc = new TextEncoder();
  const passKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 600000,
      hash: 'SHA-256',
    },
    passKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return {
    key,
    algorithm: 'AES-GCM',
  };
}

export async function encryptStorageData(data: any, config: StorageEncryptionConfig): Promise<{ encrypted: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = JSON.stringify(data);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    config.key,
    new TextEncoder().encode(plaintext)
  );

  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

export async function decryptStorageData(encrypted: string, iv: string, config: StorageEncryptionConfig): Promise<any> {
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: Uint8Array.from(atob(iv), (c) => c.charCodeAt(0)) },
      config.key,
      Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0)).buffer
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    throw new Error('Failed to decrypt storage data');
  }
}
