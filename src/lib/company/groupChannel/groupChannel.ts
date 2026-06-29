import type { CompanyEnvelope } from '../types'
import { b64decode, b64encode } from '../../crypto/cryptoCore'

export class GroupChannel {
  private groupKey: CryptoKey | null = null
  private companyId: string | null = null
  private version: number = 1

  setGroupKey(key: CryptoKey, companyId: string, version: number): void {
    this.groupKey = key
    this.companyId = companyId
    this.version = version
  }

  async encrypt(plaintext: string, senderPubKeyB64: string): Promise<CompanyEnvelope> {
    if (!this.groupKey) throw new Error('Group key not set')

    const payload = JSON.stringify({ text: plaintext, sender: senderPubKeyB64 })
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const plaintextBytes = new TextEncoder().encode(payload)

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.groupKey,
      plaintextBytes
    )

    return {
      iv: b64encode(iv),
      ciphertext: b64encode(new Uint8Array(ciphertext)),
      senderPubKey: senderPubKeyB64,
      companyId: this.companyId!,
      groupKeyVersion: this.version,
      timestamp: Date.now(),
    }
  }

  async decrypt(envelope: CompanyEnvelope, keyById?: (version: number) => Promise<CryptoKey | null>): Promise<{ text: string; sender: string } | null> {
    let key = this.groupKey

    if (!key && keyById) {
      key = await keyById(envelope.groupKeyVersion)
    }

    if (!key) return null

    try {
      const plaintextBytes = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: b64decode(envelope.iv) },
        key,
        b64decode(envelope.ciphertext)
      )

      const payload = JSON.parse(new TextDecoder().decode(plaintextBytes))
      return {
        text: payload.text,
        sender: payload.sender,
      }
    } catch {
      return null
    }
  }

  getTopic(companyId: string, officeId?: string): string {
    if (officeId) {
      return `company:${companyId}:office:${officeId}:chat`
    }
    return `company:${companyId}:chat`
  }

  async broadcast(envelope: CompanyEnvelope, sendFn: (topic: string, data: string) => void): Promise<void> {
    const topic = this.getTopic(envelope.companyId, undefined)
    sendFn(topic, JSON.stringify({
      type: 'company-chat',
      ...envelope,
    }))
  }
}