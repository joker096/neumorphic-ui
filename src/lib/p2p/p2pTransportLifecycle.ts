import type { P2PTransportInternals } from './p2pTransportInternals'

export function disconnectTransport(self: P2PTransportInternals): void {
  self.stopped = true
  self.dataChannel?.close()
  self.dataChannel = null
  self.callControlChannel?.close()
  self.callControlChannel = null
  self.peerConnection?.close()
  self.peerConnection = null
  self.signalingWs?.close()
  self.signalingWs = null
  self.peerPublicKey = null
  self.hmacKey = null
  self.sessionAesKey = null
  self.seenEncryptedPayloads.clear()
  self.receiveChain = Promise.resolve()
  self.outgoingSequence = 0
  self.incomingSequence = 0
  self.outgoingControlSequence = 0
  self.incomingControlSequence = 0
  self.metadataSeq = 0
  self.seenMetadataSeqs.clear()
  self.localDhPrivateKey = null
  self.pendingCandidates = []
  self.localCandidates = []
  self.resolvePairingGather = null
  self.reconnectAttempts = 0
  self.outgoingStreams = [];
  self.pendingOutgoingTracks = [];
  self.localHandlesTracks = false;
  self.lastDhPubHex = null;
}
