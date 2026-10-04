import { p2pNetwork } from '../p2p/network';
import { encodeCallSignal, nextFrameSeq } from '../p2p/chatFrame';
import type { P2PTransport } from '../p2p/P2PTransport';
import type { CallType } from './types';
import type { CallManagerInternals } from './callManagerInternals';

/** Wire-level peer ids are 64/128-char hex Ed25519 keys; uuid chat ids stay simulated. */
export function isRealPeer(peerId: string): boolean {
  return /^[0-9a-f]{64,128}$/i.test(peerId);
}

export async function realTransportFor(self: CallManagerInternals, peerId: string): Promise<P2PTransport | null> {
  if (!isRealPeer(peerId) || !p2pNetwork.isReady()) return null;
  let transport = p2pNetwork.getTransport(peerId);
  if (!transport) {
    try {
      await p2pNetwork.connect(peerId);
    } catch {
      return null;
    }
    transport = p2pNetwork.getTransport(peerId);
  }
  return transport && p2pNetwork.isConnected(peerId) ? transport : null;
}

export function attachMediaHandlers(self: CallManagerInternals, transport: P2PTransport): void {
  transport.attachMediaHandlers({
    onRemoteTrack: (peerId, stream) => self.handleRemoteTrack(peerId, stream),
    onCallClosed: (peerId) => self.handleRemoteCallSignal(peerId, { type: 'call-end', seq: nextFrameSeq(), callId: '', timestamp: Date.now() }),
    onMediaEnded: () => {},
  });
}

/**
 * Establishes a real WebRTC leg for an outgoing call when the peer id is a
 * wire identity key: connects/attaches the P2P transport, sends local media
 * tracks and rings the peer over the messenger data channel. Best-effort —
 * any failure leaves the simulated handshake in place.
 */
export async function tryStartRealTransport(self: CallManagerInternals, peerId: string, callId: string, callType: CallType): Promise<void> {
  try {
    const transport = await realTransportFor(self, peerId);
    if (!transport) return;
    attachMediaHandlers(self, transport);
    if (self.localStream) await transport.addOutgoingStream(self.localStream);
    const wireType: 'audio' | 'video' = callType === 'screen' ? 'video' : callType;
    await p2pNetwork.sendTo(peerId, encodeCallSignal({ type: 'call-ring', seq: nextFrameSeq(), callId, callType: wireType, timestamp: Date.now() }));
  } catch {
    /* no transport — keep the simulated call path */
  }
}

/** Mirrors `tryStartRealTransport` for an answered incoming call. */
export async function tryAcceptRealTransport(self: CallManagerInternals, peerId: string, callId: string, callType: CallType): Promise<void> {
  try {
    const transport = await realTransportFor(self, peerId);
    if (!transport) return;
    attachMediaHandlers(self, transport);
    if (self.localStream) await transport.addOutgoingStream(self.localStream);
    const wireType: 'audio' | 'video' = callType === 'screen' ? 'video' : callType;
    await p2pNetwork.sendTo(peerId, encodeCallSignal({ type: 'call-accept', seq: nextFrameSeq(), callId, callType: wireType, timestamp: Date.now() }));
  } catch {
    /* no transport — keep the simulated call path */
  }
}
