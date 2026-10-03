import { buf2hex } from '../crypto/cryptoCore'
import { signDh } from './identityPin'
import { setupCallControlChannel, setupDataChannel } from './p2pDataChannel'
import { sendSignaling } from './p2pSignaling'
import type { P2PTransportInternals } from './p2pTransportInternals'

export function createPeerConnection(self: P2PTransportInternals): void {
  if (self.peerConnection) {
    self.peerConnection.close()
  }

  self.peerConnection = new RTCPeerConnection({
    iceServers: self.iceServers,
    iceTransportPolicy: self.isRelayOnly ? 'relay' : 'all',
  })

  self.peerConnection.onicecandidate = (event) => {
    if (self.pairingMode) {
      // Serverless mode: collect candidates locally; the last (null)
      // candidate marks the end of gathering and lets waitForGather() resolve.
      if (event.candidate) {
        self.localCandidates.push(event.candidate.toJSON())
      } else if (self.pairingMode) {
        self.resolvePairingGather?.()
      }
      return
    }
    if (event.candidate && self.peerPublicKey) {
      sendSignaling(self, {
        type: 'ice-candidate',
        target: self.peerPublicKey,
        candidate: event.candidate.toJSON(),
      })
    }
  }

  self.peerConnection.onconnectionstatechange = () => {
    if (self.peerConnection!.connectionState === 'connected') {
      if (self.peerPublicKey) {
        self.onConnected(self.peerPublicKey)
      }
    } else if (
      self.peerConnection!.connectionState === 'disconnected' ||
      self.peerConnection!.connectionState === 'failed'
    ) {
      if (self.peerPublicKey) {
        self.onDisconnected(self.peerPublicKey)
      }
    }
  }

  // Media added after the initial offer (e.g. attaching a call stream to an
  // already-established messenger session) requires renegotiation.
  self.peerConnection.onnegotiationneeded = async () => {
    const peer = self.peerPublicKey
    if (!peer || !self.lastDhPubHex || !self.peerConnection) return
    if (!self.identitySecretKey || !self.identityPublicKey) return // identity required
    try {
      const offer = await self.peerConnection.createOffer()
      await self.peerConnection.setLocalDescription(offer)
      sendSignaling(self, {
        type: 'offer',
        target: peer,
        sdp: offer,
        dhPub: self.lastDhPubHex,
        identityPub: buf2hex(self.identityPublicKey),
        dhSig: signDh(self.identitySecretKey, self.lastDhPubHex),
      })
    } catch {
      /* renegotiation failed — the session keeps working without the new media */
    }
  }

  self.peerConnection.ondatachannel = (event) => {
    if (event.channel.label === 'call-control') {
      self.callControlChannel = event.channel
      setupCallControlChannel(self)
    } else {
      self.dataChannel = event.channel
      setupDataChannel(self)
    }
  }

  if (!self.localHandlesTracks) {
    self.peerConnection.ontrack = (event) => {
      if (!self.mediaHandlers || !self.peerPublicKey) return;
      const stream = event.streams[0];
      if (!stream) return;
      self.mediaHandlers.onRemoteTrack(self.peerPublicKey, stream);
      const kind = event.track.kind as 'audio' | 'video';
      event.track.addEventListener('ended', () => {
        self.mediaHandlers?.onMediaEnded(self.peerPublicKey!, kind);
      });
    };
    self.localHandlesTracks = true;
  }

  self.pendingOutgoingTracks.forEach((track) => self.peerConnection!.addTrack(track, new MediaStream([track])));
  self.pendingOutgoingTracks = [];
}

export async function addOutgoingStream(
  self: P2PTransportInternals,
  stream: MediaStream,
): Promise<void> {
  self.outgoingStreams.push(stream);
  const tracks = stream.getTracks();
  if (!self.peerConnection) {
    self.pendingOutgoingTracks.push(...tracks);
    return;
  }
  tracks.forEach((track) => self.peerConnection!.addTrack(track, stream));
}

export async function removeOutgoingStream(
  self: P2PTransportInternals,
  stream: MediaStream,
): Promise<void> {
  self.outgoingStreams = self.outgoingStreams.filter((s) => s !== stream);
  if (!self.peerConnection) return;
  const senders = self.peerConnection.getSenders();
  stream.getTracks().forEach((track) => {
    const sender = senders.find((s) => s.track === track);
    if (sender) self.peerConnection!.removeTrack(sender);
  });
}
