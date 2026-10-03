export interface LanPairingPayload {
  peerId: string
  role: 'offer' | 'answer'
  dhPub: string
  identityPub?: string
  dhSig?: string
  sdp: RTCSessionDescriptionInit
}

export function parsePairingPayload(
  payloadStr: string,
  expectedRole: 'offer' | 'answer',
  magic: string,
): LanPairingPayload {
  if (typeof payloadStr !== 'string' || !payloadStr.startsWith(magic)) {
    throw new Error('[P2PTransport] invalid pairing payload: missing magic header')
  }
  let payload: any
  try {
    payload = JSON.parse(payloadStr.slice(magic.length))
  } catch {
    throw new Error('[P2PTransport] invalid pairing payload: not JSON')
  }
  if (payload.role !== expectedRole) {
    throw new Error(`[P2PTransport] invalid pairing payload: expected role "${expectedRole}"`)
  }
  if (
    typeof payload.peerId !== 'string' ||
    typeof payload.dhPub !== 'string' ||
    !payload.sdp ||
    typeof payload.sdp.type !== 'string'
  ) {
    throw new Error('[P2PTransport] malformed pairing payload')
  }
  return payload as LanPairingPayload
}
