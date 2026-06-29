import * as idb from 'idb-keyval'
import type { GroupKeyMaterial, WrappedKey } from '../types'
import { x25519DH, buf2hex, b64encode, b64decode } from '../../../lib/crypto/cryptoCore'

export const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000

export class GroupKeyManager {
  private currentKey: GroupKeyMaterial | null = null
  private oldKeys: GroupKeyMaterial[] = []
  private companyId: string | null = null

  setCompanyId(id: string): void {
    this.companyId = id
  }

  async createGroupKey(): Promise<GroupKeyMaterial> {
    const keyBytes = crypto.getRandomValues(new Uint8Array(32))
    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt'])

    this.currentKey = {
      version: 1,
      key,
      wrappedFor: [],
      createdAt: Date.now(),
    }

    await this.saveCurrentKey()
    return this.currentKey
  }

  async wrapForMember(key: CryptoKey, memberPubKeyB64: string): Promise<WrappedKey> {
    const memberPubKey = b64decode(memberPubKeyB64)
    const sharedSecret = x25519DH(memberPubKey, crypto.getRandomValues(new Uint8Array(32)))

    const wrapKey = await crypto.subtle.importKey('raw', sharedSecret.slice(0, 32), 'AES-GCM', false, ['encrypt'])
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const keyBytes = new Uint8Array(32)
    const keyBuffer = await crypto.subtle.exportKey('raw', key)
    keyBytes.set(new Uint8Array(keyBuffer))

    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrapKey, keyBytes)

    return {
      memberPublicKey: memberPubKeyB64,
      ciphertext: b64encode(new Uint8Array(ciphertext)),
      nonce: b64encode(iv),
    }
  }

  async unwrapKey(wrapped: WrappedKey, myPrivKey: Uint8Array): Promise<CryptoKey> {
    const memberPubKey = b64decode(wrapped.memberPublicKey)
    const sharedSecret = x25519DH(myPrivKey, memberPubKey)

    const unwrapKey = await crypto.subtle.importKey('raw', sharedSecret.slice(0, 32), 'AES-GCM', false, ['decrypt'])
    const ciphertext = b64decode(wrapped.ciphertext)
    const nonce = b64decode(wrapped.nonce)

    const keyBytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, unwrapKey, ciphertext)
    return await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt'])
  }

  async rotateKey(reason: 'join' | 'leave' | 'compromise' | 'scheduled', rotatedBy?: string): Promise<GroupKeyMaterial> {
    if (!this.currentKey) {
      throw new Error('No current group key to rotate')
    }

    const keyBytes = crypto.getRandomValues(new Uint8Array(32))
    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt'])

    const newKey: GroupKeyMaterial = {
      version: this.currentKey.version + 1,
      key,
      wrappedFor: [],
      createdAt: Date.now(),
      rotatedBy,
      reason,
    }

    if (this.currentKey) {
      this.oldKeys.push({ ...this.currentKey, createdAt: this.currentKey.createdAt })
    }

    this.currentKey = newKey
    await this.saveCurrentKey()
    await this.saveOldKeys()

    this.pruneOldKeys()

    return newKey
  }

  getCurrentKey(): GroupKeyMaterial | null {
    return this.currentKey
  }

  getOldKeys(): GroupKeyMaterial[] {
    return [...this.oldKeys]
  }

  async getKeyByVersion(version: number): Promise<CryptoKey | null> {
    if (this.currentKey?.version === version) {
      return this.currentKey.key
    }

    const oldKey = this.oldKeys.find(k => k.version === version)
    return oldKey?.key || null
  }

  async saveCurrentKey(): Promise<void> {
    if (!this.currentKey || !this.companyId) return

    const keyB64 = b64encode(new Uint8Array(await crypto.subtle.exportKey('raw', this.currentKey.key)))
    const wrappedB64 = this.currentKey.wrappedFor.map(w => ({
      memberPublicKey: w.memberPublicKey,
      ciphertext: w.ciphertext,
      nonce: w.nonce,
    }))

    await idb.set(`mess_company_gk_v${this.currentKey.version}`, {
      companyId: this.companyId,
      version: this.currentKey.version,
      key: keyB64,
      wrappedFor: wrappedB64,
      createdAt: this.currentKey.createdAt,
      rotatedBy: this.currentKey.rotatedBy,
      reason: this.currentKey.reason,
    })
  }

  async loadCurrentKey(version: number): Promise<GroupKeyMaterial | null> {
    if (!this.companyId) return null

    const data = await idb.get(`mess_company_gk_v${version}`)
    if (!data || data.companyId !== this.companyId) return null

    const key = await crypto.subtle.importKey('raw', b64decode(data.key), 'AES-GCM', false, ['encrypt', 'decrypt'])

    this.currentKey = {
      version: data.version,
      key,
      wrappedFor: data.wrappedFor || [],
      createdAt: data.createdAt,
      rotatedBy: data.rotatedBy,
      reason: data.reason,
    }

    return this.currentKey
  }

  private async saveOldKeys(): Promise<void> {
    if (!this.companyId) return

    for (const oldKey of this.oldKeys) {
      await idb.set(`mess_company_gk_old_${oldKey.version}`, {
        companyId: this.companyId,
        version: oldKey.version,
        createdAt: oldKey.createdAt,
      })
    }
  }

  private pruneOldKeys(): void {
    const now = Date.now()
    this.oldKeys = this.oldKeys
      .filter(k => now - k.createdAt < GRACE_PERIOD_MS * 2)
      .sort((a, b) => b.createdAt - a.createdAt)

    if (this.oldKeys.length > 2) {
      this.oldKeys = this.oldKeys.slice(0, 2)
    }
  }

  async loadStoredKeys(): Promise<void> {
    if (!this.companyId) return

    const keys = await idb.keys()
    for (const key of keys) {
      if (typeof key === 'string' && key.startsWith(`mess_company_gk_v`)) {
        const data = await idb.get(key)
        if (data && data.companyId === this.companyId) {
          this.currentKey = {
            version: data.version,
            key: await crypto.subtle.importKey('raw', b64decode(data.key), 'AES-GCM', false, ['encrypt', 'decrypt']),
            wrappedFor: data.wrappedFor || [],
            createdAt: data.createdAt,
          }
        }
      }
    }
  }
}