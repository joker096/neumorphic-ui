import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as nacl from 'tweetnacl';
import { P2PTransport } from './P2PTransport';
import { setupDataChannel } from './p2pDataChannel';
import * as identityPin from './identityPin';
import {
  MSG_MAGIC,
  encodeChatDeliveryAck,
  encodeChatReadReceipt,
  encodeChatText,
  nextFrameSeq,
  parseChatDeliveryAck,
  parseChatReadReceipt,
  parseChatText,
} from './chatFrame';

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue('{}'),
  set: vi.fn().mockResolvedValue(undefined),
}));

let mockWs: any = null;
let mockPc: any = null;
const mockDataChannels: any[] = [];
const mockWebSockets: any[] = [];
let onMessage: ReturnType<typeof vi.fn>;
let onConnected: ReturnType<typeof vi.fn>;
let onDisconnected: ReturnType<typeof vi.fn>;

class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSING = 2;
  static CLOSED = 3;
  readyState = MockWebSocket.OPEN;
  send = vi.fn();
  close = vi.fn();
  addEventListener = vi.fn();
  onopen: any = null;
  onclose: any = null;
  onerror: any = null;
  onmessage: any = null;

  constructor(_url: string) {
    mockWs = this;
    mockWebSockets.push(this);
  }
}

class MockDataChannel {
  label: string;
  readyState = 'open';
  send = vi.fn();
  close = vi.fn();
  addEventListener = vi.fn();
  onopen: any = null;
  onclose: any = null;
  onmessage: any = null;
  onerror: any = null;

  constructor(label: string, public opts?: any) {
    this.label = label;
  }
}

class MockRTCPeerConnection {
  pcConfig: any;
  createDataChannel = vi.fn((label: string, opts?: any) => {
    const dc = new MockDataChannel(label, opts);
    mockDataChannels.push(dc);
    return dc;
  });
  createOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
  createAnswer = vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp' });
  setLocalDescription = vi.fn().mockResolvedValue(undefined);
  setRemoteDescription = vi.fn().mockResolvedValue(undefined);
  addIceCandidate = vi.fn().mockResolvedValue(undefined);
  close = vi.fn();
  getSenders = vi.fn(() => []);
  addTrack = vi.fn();
  removeTrack = vi.fn();
  onicecandidate: any = null;
  ontrack: any = null;
  onconnectionstatechange: any = null;
  oniceconnectionstatechange: any = null;
  connectionState = 'new';
  currentRemoteDescription: any = null;

  constructor(config?: any) {
    this.pcConfig = config;
    mockPc = this;
  }
}

class MockRTCSessionDescription {
  constructor(public sdp: any) {}
}

class MockRTCIceCandidate {
  constructor(public candidate: any) {}
}

beforeEach(async () => {
  vi.restoreAllMocks();
  await identityPin.resetIdentityPins();
  mockWs = null;
  mockPc = null;
  mockDataChannels.length = 0;
  mockWebSockets.length = 0;
  onMessage = vi.fn();
  onConnected = vi.fn();
  onDisconnected = vi.fn();

  vi.stubGlobal('WebSocket', MockWebSocket);
  vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);
  vi.stubGlobal('RTCSessionDescription', MockRTCSessionDescription);
  vi.stubGlobal('RTCIceCandidate', MockRTCIceCandidate);
  // Avoid real network during token fetch; getRelayToken() rejects fast -> ''
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline in tests')));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function makeTransport(opts: Partial<{
  signalingUrl: string;
  localPublicKey: string;
  iceServers: RTCIceServer[];
  obfuscationEnabled?: boolean;
}> = {}) {
  const identity = nacl.sign.keyPair();
  return new P2PTransport({
    signalingUrl: opts.signalingUrl ?? 'ws://localhost:8080',
    localPublicKey: opts.localPublicKey ?? 'local-pub-key',
    iceServers: opts.iceServers,
    onMessage: onMessage as any,
    onConnected,
    onDisconnected,
    obfuscationEnabled: opts.obfuscationEnabled,
    identitySecretKey: identity.secretKey,
    identityPublicKey: identity.publicKey,
  } as any);
}

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

async function connectTransport(transport: P2PTransport): Promise<void> {
  const p = transport.connect();
  await flush();
  mockWs.onopen();
  mockWs.onmessage({ data: JSON.stringify({ type: 'registered' }) });
  await p;
}

/** Relay-wire two transports so their signaling messages reach each other (real ECDH + real HMAC). */
async function pairPeers(caller: P2PTransport, callee: P2PTransport, calleeId: string): Promise<void> {
  const cp = caller.connect();
  await flush();
  mockWebSockets[0].onopen();
  mockWebSockets[0].onmessage({ data: JSON.stringify({ type: 'registered' }) });
  await cp;

  const kp = callee.connect();
  await flush();
  mockWebSockets[1].onopen();
  mockWebSockets[1].onmessage({ data: JSON.stringify({ type: 'registered' }) });
  await kp;

  const callerWs = mockWebSockets[0];
  const calleeWs = mockWebSockets[1];
  callerWs.send = (data: string) => {
    calleeWs.onmessage?.({ data });
  };
  calleeWs.send = (data: string) => {
    callerWs.onmessage?.({ data });
  };

  await caller.call(calleeId);

  await vi.waitFor(() => {
    expect((caller as any).hmacKey).not.toBeNull();
    expect((callee as any).hmacKey).not.toBeNull();
  });
}

/** Wire a receive-side data channel so the transport's messenger receive chain can be exercised. */
function wireReceive(transport: P2PTransport, channel: any): void {
  (transport as any).receiveChain = Promise.resolve();
  (transport as any).dataChannel = channel;
  setupDataChannel(transport);
}

const lastSent = (dc: any): string => {
  const call = dc.send.mock.calls[dc.send.mock.calls.length - 1];
  return call[0] as string;
};

describe('P2P security suite (P8)', () => {
  describe('frame integrity', () => {
    it('rejects a tampered HMAC envelope on the receiving peer', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const caller = makeTransport({ localPublicKey: 'caller-id' });
      const callee = makeTransport({ localPublicKey: 'callee-id' });
      await pairPeers(caller, callee, 'callee-id');

      await caller.send('hello-world-secret');

      const envelope = lastSent((caller as any).dataChannel);
      const pipeIdx = envelope.indexOf('|');
      const sig = envelope.slice(0, pipeIdx);
      const payload = envelope.slice(pipeIdx + 1);
      const tamperedSig = (sig[0] === '0' ? '1' : '0') + sig.slice(1);

      const calleeChannel = new MockDataChannel('messenger');
      wireReceive(callee, calleeChannel);
      calleeChannel.onmessage({ data: `${tamperedSig}|${payload}` });

      await vi.waitFor(() =>
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Invalid HMAC signature')),
      );
      expect(onMessage).not.toHaveBeenCalled();
    });

    it('drops a replayed envelope and an out-of-order sequence', async () => {
      const caller = makeTransport({ localPublicKey: 'caller-id' });
      const callee = makeTransport({ localPublicKey: 'callee-id' });
      await pairPeers(caller, callee, 'callee-id');

      const calleeChannel = new MockDataChannel('messenger');
      wireReceive(callee, calleeChannel);

      await caller.send('first');
      const envelope1 = lastSent((caller as any).dataChannel);
      await caller.send('second');
      const envelope2 = lastSent((caller as any).dataChannel);
      await caller.send('third');
      const envelope3 = lastSent((caller as any).dataChannel);

      // Fresh, increasing sequences are accepted.
      calleeChannel.onmessage({ data: envelope1 });
      calleeChannel.onmessage({ data: envelope3 });
      await vi.waitFor(() => expect(onMessage).toHaveBeenCalledTimes(2));
      expect(onMessage.mock.calls[0][0]).toBe('first');
      expect(onMessage.mock.calls[1][0]).toBe('third');

      // Replay (envelope1 again) and out-of-order (envelope2 after seq 3) are dropped.
      calleeChannel.onmessage({ data: envelope1 });
      calleeChannel.onmessage({ data: envelope2 });
      await vi.waitFor(() => expect(onMessage).toHaveBeenCalledTimes(2));
    });
  });

  describe('payload limits', () => {
    it('rejects an oversized payload (> 64 KiB) before it touches the wire', async () => {
      const transport = makeTransport();
      (transport as any).dataChannel = { readyState: 'open', send: vi.fn(), close: vi.fn() };
      (transport as any).hmacKey = null;
      (transport as any).sessionAesKey = null;

      await expect(transport.send('x'.repeat(65537))).rejects.toThrow(
        'Payload exceeds 64KiB limit',
      );
      await expect(transport.send('y'.repeat(65536))).resolves.toBeUndefined();
    });
  });

  describe('strict frame parsing', () => {
    it('rejects tampered / legacy / malformed frames with null (fail-closed)', () => {
      const base = {
        type: 'chat-text' as const,
        seq: 1,
        messageId: 'm1',
        chatId: 'c1',
        chatName: 'Room',
        senderName: 'Alice',
        text: 'hi',
        silent: false,
        timestamp: 123,
      };

      // Legacy frame without magic.
      expect(parseChatText(JSON.stringify(base))).toBeNull();
      // Wrong magic.
      expect(parseChatText('msg0:' + JSON.stringify(base))).toBeNull();
      // Negative sequence (anti-replay counter cannot go backwards).
      expect(parseChatText(encodeChatText({ ...base, seq: -1 }))).toBeNull();
      // Non-string messageId.
      expect(
        parseChatText(encodeChatText({ ...base, messageId: 42 as any })),
      ).toBeNull();
      // Malformed JSON payload.
      expect(parseChatText(MSG_MAGIC + 'not-json')).toBeNull();
      // ACK without chatId.
      expect(
        parseChatDeliveryAck(
          MSG_MAGIC +
            JSON.stringify({ type: 'chat-ack', seq: 1, messageId: 'm1', timestamp: 1 }),
        ),
      ).toBeNull();
    });
  });

  describe('TOFU peer identity pinning', () => {
    it('rejects a peer whose identity key changed (MITM / key rotation)', async () => {
      await identityPin.resetIdentityPins();

      const identityA = nacl.sign.keyPair();
      const identityB = nacl.sign.keyPair();
      const attacker = nacl.sign.keyPair();
      const dhPub = Buffer.from(nacl.randomBytes(32)).toString('hex');

      const sigA = identityPin.signDh(identityA.secretKey, dhPub);
      const sigB = identityPin.signDh(identityB.secretKey, dhPub);
      const attackerSig = identityPin.signDh(attacker.secretKey, dhPub);

      expect(
        await identityPin.verifyOrPinPeer('peer-id', Buffer.from(identityA.publicKey).toString('hex'), dhPub, sigA),
      ).toBe(true);

      // Same peer, same DH key, but a different identity key -> rejected.
      expect(
        await identityPin.verifyOrPinPeer('peer-id', Buffer.from(identityB.publicKey).toString('hex'), dhPub, sigB),
      ).toBe(false);

      // Forged signature (attacker key signs, identity B claimed) -> rejected.
      expect(
        await identityPin.verifyOrPinPeer('peer-id', Buffer.from(identityB.publicKey).toString('hex'), dhPub, attackerSig),
      ).toBe(false);
    });
  });

  describe('wire ACK/read roundtrip', () => {
    it('delivers chat-ack and chat-read frames intact over a real two-peer channel', async () => {
      const caller = makeTransport({ localPublicKey: 'caller-id' });
      const callee = makeTransport({ localPublicKey: 'callee-id' });
      await pairPeers(caller, callee, 'callee-id');

      const calleeChannel = new MockDataChannel('messenger');
      wireReceive(callee, calleeChannel);

      const ack = {
        type: 'chat-ack' as const,
        seq: nextFrameSeq(),
        messageId: 'm-42',
        chatId: 'chat-7',
        timestamp: 99,
      };
      const read = {
        type: 'chat-read' as const,
        seq: nextFrameSeq(),
        messageId: 'm-42',
        chatId: 'chat-7',
        timestamp: 100,
      };

      await caller.send(encodeChatDeliveryAck(ack));
      calleeChannel.onmessage({ data: lastSent((caller as any).dataChannel) });
      await caller.send(encodeChatReadReceipt(read));
      calleeChannel.onmessage({ data: lastSent((caller as any).dataChannel) });
      await vi.waitFor(() => expect(onMessage).toHaveBeenCalledTimes(2));

      expect(onMessage).toHaveBeenCalledTimes(2);
      const ackFrame = parseChatDeliveryAck(onMessage.mock.calls[0][0]);
      const readFrame = parseChatReadReceipt(onMessage.mock.calls[1][0]);
      expect(ackFrame).toEqual(ack);
      expect(readFrame).toEqual(read);
    });
  });
});