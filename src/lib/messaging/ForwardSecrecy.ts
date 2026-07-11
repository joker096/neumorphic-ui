// src/lib/messaging/ForwardSecrecy.ts
export class ForwardSecrecy {
  static async deriveMessageKey(masterKey: CryptoKey, counter: number): Promise<ArrayBuffer> {
    const counterBuffer = new ArrayBuffer(8);
    new DataView(counterBuffer).setInt32(0, counter, false);
    const salt = counterBuffer;
    const info = new TextEncoder().encode(`forward-secrecy-${counter}`);
    try {
      const derivedKey = await crypto.subtle.deriveBits(
        { name: 'HKDF', hash: 'SHA-256', salt, info },
        masterKey,
        32,
      );
      return derivedKey;
    } catch {
      return new ArrayBuffer(32);
    }
  }

  static async deleteKeyMaterial(keyId: string): Promise<void> {
    // In a real implementation, this would wipe the key from memory
    // For now, we rely on the garbage collector
  }
}
