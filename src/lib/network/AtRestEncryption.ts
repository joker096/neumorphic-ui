// src/lib/network/AtRestEncryption.ts
import { cryptoCore } from '../crypto/cryptoCore'
import type { EncryptedPayload } from '../crypto/types'

export class AtRestEncryption {
  private static masterKey: CryptoKey | null = null
  private static saltHex: string | null = null

  static get isInitialized(): boolean {
    return this.masterKey !== null
  }

  static async init(password: string): Promise<void> {
    const result = await cryptoCore.deriveAESKeyFromPassword(password)
    this.masterKey = result.key
    this.saltHex = result.saltHex
  }

  static async encryptData(data: string): Promise<EncryptedPayload> {
    if (!this.masterKey) {
      throw new Error('At-rest encryption not initialized')
    }
    return cryptoCore.encryptData(data, this.masterKey)
  }

  static async decryptData(cipher: string, iv: string): Promise<string> {
    if (!this.masterKey) {
      throw new Error('At-rest encryption not initialized')
    }
    return cryptoCore.decryptData(cipher, iv, this.masterKey)
  }

  static async encryptObject(obj: any): Promise<string> {
    if (!this.masterKey) {
      throw new Error('At-rest encryption not initialized')
    }
    const jsonString = JSON.stringify(obj)
    const encrypted = await this.encryptData(jsonString)
    return JSON.stringify(encrypted)
  }

  static async decryptObject(encryptedJson: string): Promise<any> {
    const parsed = JSON.parse(encryptedJson)
    if (parsed.plain && parsed.data !== undefined) {
      return parsed.data
    }
    const { cipher, iv } = parsed
    const decrypted = await this.decryptData(cipher, iv)
    return JSON.parse(decrypted)
  }

  static reset(): void {
    this.masterKey = null
    this.saltHex = null
  }
}
