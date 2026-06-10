import { DoubleRatchet, type DoubleRatchetState } from './doubleRatchet'
import { generateX25519KeyPair, x25519DH, b64encode, b64decode } from '../cryptoCore'

interface RatchetSession {
  ratchet: DoubleRatchet
  peerPublicKey: Uint8Array
  ourPublicKey: Uint8Array
  ourSecretKey: Uint8Array
  createdAt: number
}

interface EncryptedMessage {
  ciphertext: string
  nonce: string
  publicKey: string
  messageHash: string
  senderPublicKey: string
  timestamp: number
}

interface DecryptedMessage {
  plaintext: string
  isValid: boolean
}

export class MessageEncryptionService {
  private sessions: Map<string, RatchetSession> = new Map()
  private ourKeyPair = generateX25519KeyPair()

  getPublicKey(): string {
    return b64encode(this.ourKeyPair.publicKey)
  }

  getPrivateKey(): string {
    return b64encode(this.ourKeyPair.secretKey)
  }

  async initSession(chatId: string, peerPublicKeyB64: string): Promise<void> {
    if (this.sessions.has(chatId)) return
    const peerPub = b64decode(peerPublicKeyB64)
    const { ratchet, publicKey } = await DoubleRatchet.initialize()
    await ratchet.ratchet(peerPub)
    this.sessions.set(chatId, {
      ratchet,
      peerPublicKey: peerPub,
      ourPublicKey: this.ourKeyPair.publicKey,
      ourSecretKey: this.ourKeyPair.secretKey,
      createdAt: Date.now(),
    })
  }

  async encrypt(chatId: string, plaintext: string): Promise<EncryptedMessage> {
    const session = this.sessions.get(chatId)
    if (!session) throw new Error(`No session for chat ${chatId}. Call initSession first.`)
    const result = await session.ratchet.encrypt(plaintext)
    return {
      ...result,
      senderPublicKey: b64encode(session.ourPublicKey),
      timestamp: Date.now(),
    }
  }

  async decrypt(chatId: string, msg: EncryptedMessage): Promise<DecryptedMessage> {
    const session = this.sessions.get(chatId)
    if (!session) throw new Error(`No session for chat ${chatId}. Call initSession first.`)

    const peerPub = b64decode(msg.senderPublicKey)
    const currentRemote = session.peerPublicKey

    if (!pubkeysEqual(peerPub, currentRemote)) {
      await session.ratchet.ratchet(peerPub)
      session.peerPublicKey = peerPub
    }

    const result = await session.ratchet.decrypt(msg.ciphertext, msg.nonce, msg.publicKey)
    if (!result.isValid) {
      const skipped = await session.ratchet.trySkippedDecrypt(msg.ciphertext, msg.nonce, msg.publicKey)
      return skipped
    }
    return result
  }

  removeSession(chatId: string): void {
    this.sessions.delete(chatId)
  }

  hasSession(chatId: string): boolean {
    return this.sessions.has(chatId)
  }

  importKeyPair(publicKeyB64: string, secretKeyB64: string): void {
    this.ourKeyPair = {
      publicKey: b64decode(publicKeyB64),
      secretKey: b64decode(secretKeyB64),
    }
  }

  getExportableState(): Record<string, { peerPublicKey: string; ourPublicKey: string; ourSecretKey: string; createdAt: number }> {
    const state: Record<string, any> = {}
    for (const [chatId, session] of this.sessions) {
      state[chatId] = {
        peerPublicKey: b64encode(session.peerPublicKey),
        ourPublicKey: b64encode(session.ourPublicKey),
        ourSecretKey: b64encode(session.ourSecretKey),
        createdAt: session.createdAt,
      }
    }
    return state
  }

  async importState(state: Record<string, any>): Promise<void> {
    for (const [chatId, data] of Object.entries(state)) {
      const ourKp = generateX25519KeyPair()
      const peerPub = b64decode(data.peerPublicKey)
      const { ratchet } = await DoubleRatchet.initialize()
      this.sessions.set(chatId, {
        ratchet,
        peerPublicKey: peerPub,
        ourPublicKey: ourKp.publicKey,
        ourSecretKey: ourKp.secretKey,
        createdAt: data.createdAt || Date.now(),
      })
    }
  }
}

function pubkeysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export const messageEncryption = new MessageEncryptionService()
