import { HMACAuth } from './HMACAuth'
import { decryptPayload, encryptPayload } from './p2pSessionKeys'
import type { P2PTransportInternals } from './p2pTransportInternals'

/** Hard ceiling for a single messenger frame payload (64 KiB). */
const MAX_PAYLOAD_BYTES = 65536

export function setupCallControlChannel(self: P2PTransportInternals): void {
  if (!self.callControlChannel) return;
  self.callControlChannel.onmessage = (event) => {
    try {
      void processCallControlMessage(self, event.data as string)
    } catch {
      // ignore
    }
  };
}

export async function processCallControlMessage(
  self: P2PTransportInternals,
  raw: string,
): Promise<void> {
  let data = raw
  if (self.hmacKey) {
    const pipeIdx = data.indexOf('|')
    if (pipeIdx === -1) {
      console.warn('[P2PTransport] Missing HMAC signature (call-control)')
      return
    }
    const sigHex = data.slice(0, pipeIdx)
    const payload = data.slice(pipeIdx + 1)
    const valid = await HMACAuth.verify(self.hmacKey, payload, sigHex)
    if (!valid) {
      console.warn('[P2PTransport] Invalid HMAC signature (call-control)')
      return
    }
    data = payload
  }

  const sequenceSeparator = data.indexOf('|')
  if (sequenceSeparator <= 0) {
    console.warn('[P2PTransport] Rejecting legacy call-control frame without sequence (strict mode)')
    return
  }
  if (sequenceSeparator > 0) {
    const sequence = Number(data.slice(0, sequenceSeparator))
    if (Number.isSafeInteger(sequence) && sequence > 0) {
      if (sequence <= self.incomingControlSequence) return
      data = data.slice(sequenceSeparator + 1)
      const senderSeparator = data.indexOf('|')
      if (senderSeparator > 0) {
        const senderPublicKey = data.slice(0, senderSeparator)
        if (self.peerPublicKey && senderPublicKey !== self.peerPublicKey) return
        data = data.slice(senderSeparator + 1)
      }
      self.incomingControlSequence = sequence
    }
  }

  if (self.sessionAesKey) {
    if (self.seenEncryptedPayloads.has(data)) return
    self.seenEncryptedPayloads.add(data)
    if (self.seenEncryptedPayloads.size > 2048) {
      const oldest = self.seenEncryptedPayloads.values().next().value
      if (oldest) self.seenEncryptedPayloads.delete(oldest)
    }
  }

  if (self.obfuscationEnabled && self.sessionAesKey) {
    const plain = await decryptPayload(self, data)
    if (plain === null) return
    data = plain
  }

  const msg = JSON.parse(data)
  handleCallControlMessage(self, msg)
}

function handleCallControlMessage(self: P2PTransportInternals, msg: any): void {
  if (!self.mediaHandlers || !self.peerPublicKey) return;
  switch (msg.type) {
    case 'mute-toggled':
      self.mediaHandlers.onMediaEnded(self.peerPublicKey, msg.kind);
      break;
    case 'screen-share':
      break;
    default:
      break;
  }
}

export function setupDataChannel(self: P2PTransportInternals): void {
  if (!self.dataChannel) return

  self.dataChannel.onopen = () => {
    if (self.peerPublicKey) {
      self.onConnected(self.peerPublicKey)
    }
  }

  self.dataChannel.onclose = () => {
    if (self.peerPublicKey) {
      self.onDisconnected(self.peerPublicKey)
    }
  }

  const processMessage = async (event: MessageEvent) => {
    let data = event.data as string

    if (self.hmacKey) {
      const pipeIdx = data.indexOf('|')
      if (pipeIdx === -1) {
        console.warn('[P2PTransport] Missing HMAC signature')
        return
      }
      const sigHex = data.slice(0, pipeIdx)
      const payload = data.slice(pipeIdx + 1)
      const valid = await HMACAuth.verify(self.hmacKey, payload, sigHex)
      if (!valid) {
        console.warn('[P2PTransport] Invalid HMAC signature')
        return
      }
      data = payload
    }

    const sequenceSeparator = data.indexOf('|')
    if (sequenceSeparator > 0) {
      const sequence = Number(data.slice(0, sequenceSeparator))
      if (Number.isSafeInteger(sequence) && sequence > 0) {
        if (sequence <= self.incomingSequence) return
        data = data.slice(sequenceSeparator + 1)
        const senderSeparator = data.indexOf('|')
        if (senderSeparator > 0) {
          const senderPublicKey = data.slice(0, senderSeparator)
          if (self.peerPublicKey && senderPublicKey !== self.peerPublicKey) return
          data = data.slice(senderSeparator + 1)
        }
        self.incomingSequence = sequence
      }
    }

    // AES-GCM payloads use a fresh IV per send, so an identical authenticated
    // payload is a replay of an already accepted frame.
    if (self.sessionAesKey) {
      if (self.seenEncryptedPayloads.has(data)) return
      self.seenEncryptedPayloads.add(data)
      if (self.seenEncryptedPayloads.size > 2048) {
        const oldest = self.seenEncryptedPayloads.values().next().value
        if (oldest) self.seenEncryptedPayloads.delete(oldest)
      }
    }

    if (self.obfuscationEnabled && self.sessionAesKey) {
      const plain = await decryptPayload(self, data)
      if (plain === null) return
      data = plain
    }

    self.onMessage(data)
  }

  self.dataChannel.onmessage = (event) => {
    self.receiveChain = self.receiveChain
      .then(() => processMessage(event))
      .catch((error) => console.warn('[P2PTransport] Receive processing failed', error))
  }

  self.dataChannel.onerror = (err) => {
    console.error('[P2PTransport] Data channel error:', err)
  }
}

export async function sendMessage(self: P2PTransportInternals, data: string): Promise<void> {
  if (!self.dataChannel || self.dataChannel.readyState !== 'open') {
    throw new Error('P2P data channel is not open')
  }

  const dataBytes = new TextEncoder().encode(data).length
  if (dataBytes > MAX_PAYLOAD_BYTES) {
    throw new Error(`[P2PTransport] Payload exceeds 64KiB limit (${dataBytes} bytes)`)
  }

  let payload = data;
  if (self.obfuscationEnabled && self.sessionAesKey) {
    payload = await encryptPayload(self, data);
  }

  const sequence = ++self.outgoingSequence
  const authenticatedPayload = `${sequence}|${self.localPublicKey}|${payload}`
  if (self.hmacKey) {
    const sig = await HMACAuth.sign(self.hmacKey, authenticatedPayload)
    self.dataChannel.send(`${sig}|${authenticatedPayload}`)
  } else {
    self.dataChannel.send(authenticatedPayload)
  }
}

export async function sendCallControlMessage(
  self: P2PTransportInternals,
  data: any,
): Promise<void> {
  if (!self.callControlChannel || self.callControlChannel.readyState !== 'open') return
  let payload = JSON.stringify(data);
  if (self.obfuscationEnabled && self.sessionAesKey) {
    payload = await encryptPayload(self, payload);
  }
  const sequence = ++self.outgoingControlSequence
  const authenticatedPayload = `${sequence}|${self.localPublicKey}|${payload}`
  if (self.hmacKey) {
    const sig = await HMACAuth.sign(self.hmacKey, authenticatedPayload)
    self.callControlChannel.send(`${sig}|${authenticatedPayload}`)
  } else {
    self.callControlChannel.send(authenticatedPayload)
  }
}
