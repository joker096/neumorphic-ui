// src/lib/p2p/SecureStorage.ts
import { AtRestEncryption } from '../network/AtRestEncryption'

export interface SecureStorageItem {
  key: string
  encryptedValue: string
  timestamp: number
}

export class SecureStorage {
  static async set(key: string, value: any): Promise<void> {
    try {
      if (AtRestEncryption.isInitialized) {
        const encrypted = await AtRestEncryption.encryptObject(value)
        localStorage.setItem(key, encrypted)
      } else {
        localStorage.setItem(key, JSON.stringify({ plain: true, data: value }))
      }
    } catch (error) {
      console.error('[SecureStorage] Failed to encrypt data:', error)
    }
  }

  static async get(key: string): Promise<any> {
    try {
      const encrypted = localStorage.getItem(key)
      if (!encrypted) return null
      return await AtRestEncryption.decryptObject(encrypted)
    } catch (error) {
      console.error('[SecureStorage] Failed to decrypt data:', error)
      return null
    }
  }

  static async remove(key: string): Promise<void> {
    localStorage.removeItem(key)
  }

  static async clear(): Promise<void> {
    // Clear all keys that start with our prefix
    const prefix = 'messenger_'
    const keysToDelete: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keysToDelete.push(key)
      }
    }
    for (const key of keysToDelete) {
      localStorage.removeItem(key)
    }
  }

  static async has(key: string): Promise<boolean> {
    return localStorage.getItem(key) !== null
  }
}
