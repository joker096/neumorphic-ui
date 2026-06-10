import { messageEncryption } from '../crypto/MessageEncryptionService'
import { p2pNetwork } from '../p2p/network'

export interface PipelineConfig {
  localPublicKey: string
  signalingUrl?: string
}

export interface SecureEnvelope {
  version: 1
  ciphertext: string
  nonce: string
  publicKey: string
  messageHash: string
  senderPublicKey: string
  timestamp: number
  chatId: string
}

export class MessagePipeline {
  private initialized = false
  private config: PipelineConfig
  private pendingMessages: Array<{ chatId: string; envelope: SecureEnvelope }> = []

  constructor(config: PipelineConfig) {
    this.config = config
  }

  async init(): Promise<void> {
    if (this.initialized) return

    await p2pNetwork.init({
      signalingUrl: this.config.signalingUrl || 'ws://localhost:8765',
    })

    p2pNetwork.onMessage((msg) => {
      try {
        const envelope: SecureEnvelope = JSON.parse(msg.data)
        this.pendingMessages.push({ chatId: envelope.chatId, envelope })
      } catch {
        console.warn('[MessagePipeline] Invalid message format')
      }
    })

    this.initialized = true
  }

  async connectToPeer(chatId: string, peerPublicKey: string): Promise<void> {
    await messageEncryption.initSession(chatId, peerPublicKey)
    await p2pNetwork.connect(peerPublicKey)
  }

  async sendMessage(chatId: string, plaintext: string): Promise<SecureEnvelope> {
    const envelope = await messageEncryption.encrypt(chatId, plaintext)
    const secureEnvelope: SecureEnvelope = {
      version: 1,
      ...envelope,
      chatId,
    }

    if (p2pNetwork.getPeerCount() > 0) {
      p2pNetwork.broadcast(JSON.stringify(secureEnvelope))
    }

    return secureEnvelope
  }

  async receiveMessages(): Promise<Array<{ chatId: string; plaintext: string }>> {
    const results: Array<{ chatId: string; plaintext: string }> = []
    const remaining: Array<{ chatId: string; envelope: SecureEnvelope }> = []

    for (const pending of this.pendingMessages) {
      if (!messageEncryption.hasSession(pending.chatId)) {
        remaining.push(pending)
        continue
      }

      try {
        const result = await messageEncryption.decrypt(pending.chatId, pending.envelope)
        if (result.isValid) {
          results.push({ chatId: pending.chatId, plaintext: result.plaintext })
        } else {
          remaining.push(pending)
        }
      } catch {
        remaining.push(pending)
      }
    }

    this.pendingMessages = remaining
    return results
  }

  hasPendingMessages(): boolean {
    return this.pendingMessages.length > 0
  }

  async disconnectPeer(chatId: string, peerPublicKey: string): Promise<void> {
    messageEncryption.removeSession(chatId)
    p2pNetwork.disconnect(peerPublicKey)
  }

  getState(): { sessions: number; peers: number; pending: number } {
    return {
      sessions: Object.keys(messageEncryption.getExportableState()).length,
      peers: p2pNetwork.getPeerCount(),
      pending: this.pendingMessages.length,
    }
  }
}

export const messagePipeline = new MessagePipeline({
  localPublicKey: '',
  signalingUrl: 'ws://localhost:8765',
})
