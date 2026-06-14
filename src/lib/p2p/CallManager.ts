export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export interface CallInfo {
  peerId: string;
  peerName: string;
  direction: 'outgoing' | 'incoming';
  state: CallState;
  startTime: number;
  isMuted: boolean;
  isSpeaker: boolean;
  isVideo: boolean;
}

type CallEventHandler = (call: CallInfo) => void;

export class CallManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private sendSignaling: ((msg: object) => void) | null = null;
  private handlers: CallEventHandler[] = [];
  private iceServers: RTCIceServer[];
  private currentCall: CallInfo | null = null;

  constructor(iceServers?: RTCIceServer[]) {
    this.iceServers = iceServers ?? [
      { urls: 'stun:stun.l.google.com:19302' },
    ];
  }

  setSignalingSender(sendFn: (msg: object) => void) {
    this.sendSignaling = sendFn;
  }

  onEvent(handler: CallEventHandler) {
    this.handlers.push(handler);
    return () => { this.handlers = this.handlers.filter(h => h !== handler); };
  }

  private emit(info: CallInfo) {
    this.currentCall = info;
    this.handlers.forEach(h => h(info));
  }

  get call(): CallInfo | null { return this.currentCall; }

  async startCall(peerId: string, peerName: string, isVideo: boolean) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });

      this.pc = new RTCPeerConnection({ iceServers: this.iceServers });
      this.localStream.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));

      this.pc.ontrack = (e) => {
        this.remoteStream = e.streams[0];
        this.emit({
          peerId, peerName, direction: 'outgoing', state: 'connected',
          startTime: Date.now(), isMuted: false, isSpeaker: false, isVideo,
        });
      };

      this.pc.onicecandidate = (e) => {
        if (e.candidate && this.sendSignaling) {
          this.sendSignaling({ type: 'ice-candidate', target: peerId, candidate: e.candidate.toJSON() });
        }
      };

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      if (this.sendSignaling) {
        this.sendSignaling({ type: 'offer', target: peerId, sdp: offer });
      }

      this.emit({
        peerId, peerName, direction: 'outgoing', state: 'calling',
        startTime: Date.now(), isMuted: false, isSpeaker: false, isVideo,
      });
    } catch (err) {
      console.error('[CallManager] startCall failed:', err);
      this.endCall();
    }
  }

  async handleOffer(from: string, fromName: string, sdp: RTCSessionDescriptionInit, isVideo: boolean) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });

      this.pc = new RTCPeerConnection({ iceServers: this.iceServers });
      this.localStream.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));

      this.pc.ontrack = (e) => {
        this.remoteStream = e.streams[0];
        this.emit({
          peerId: from, peerName: fromName, direction: 'incoming', state: 'connected',
          startTime: Date.now(), isMuted: false, isSpeaker: false, isVideo,
        });
      };

      this.pc.onicecandidate = (e) => {
        if (e.candidate && this.sendSignaling) {
          this.sendSignaling({ type: 'ice-candidate', target: from, candidate: e.candidate.toJSON() });
        }
      };

      await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      if (this.sendSignaling) {
        this.sendSignaling({ type: 'answer', target: from, sdp: answer });
      }

      this.emit({
        peerId: from, peerName: fromName, direction: 'incoming', state: 'ringing',
        startTime: Date.now(), isMuted: false, isSpeaker: false, isVideo,
      });
    } catch (err) {
      console.error('[CallManager] handleOffer failed:', err);
      this.endCall();
    }
  }

  async handleAnswer(sdp: RTCSessionDescriptionInit) {
    if (!this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (this.pc && this.pc.remoteDescription) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        if (this.currentCall) {
          this.emit({ ...this.currentCall, isMuted: !audioTrack.enabled });
        }
      }
    }
  }

  toggleSpeaker() {
    if (this.currentCall) {
      this.emit({ ...this.currentCall, isSpeaker: !this.currentCall.isSpeaker });
    }
  }

  getRemoteStream(): MediaStream | null { return this.remoteStream; }
  getLocalStream(): MediaStream | null { return this.localStream; }

  endCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.remoteStream = null;
    if (this.currentCall && this.currentCall.state !== 'ended') {
      this.emit({ ...this.currentCall, state: 'ended' });
    }
    this.currentCall = null;
  }
}
