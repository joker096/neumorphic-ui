import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { P2PTransport } from './P2PTransport';
import { HMACAuth } from './HMACAuth';

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

beforeEach(() => {
  vi.restoreAllMocks();
  mockWs = null;
  mockPc = null;
  mockDataChannels.length = 0;
  mockWebSockets.length = 0;
  onMessage = vi.fn();
  onConnected = vi.fn();
  onDisconnected = vi.fn();

  vi.spyOn(HMACAuth, 'generateKey').mockResolvedValue('mock-hmac-key');
  vi.spyOn(HMACAuth, 'sign').mockResolvedValue('mock-sig');
  vi.spyOn(HMACAuth, 'verify').mockResolvedValue(true);

  vi.stubGlobal('WebSocket', MockWebSocket);
  vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);
  vi.stubGlobal('RTCSessionDescription', MockRTCSessionDescription);
  vi.stubGlobal('RTCIceCandidate', MockRTCIceCandidate);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function makeTransport(opts: Partial<{
  signalingUrl: string;
  localPublicKey: string;
  iceServers: RTCIceServer[];
  obfuscator: any;
}> = {}) {
  return new P2PTransport({
    signalingUrl: opts.signalingUrl ?? 'ws://localhost:8080',
    localPublicKey: opts.localPublicKey ?? 'local-pub-key',
    iceServers: opts.iceServers,
    onMessage: onMessage as any,
    onConnected,
    onDisconnected,
    obfuscator: opts.obfuscator,
  } as any);
}

async function connectTransport(transport: P2PTransport): Promise<void> {
  const p = transport.connect();
  mockWs.onopen();
  mockWs.onmessage({ data: JSON.stringify({ type: 'registered' }) });
  await p;
}

async function connectAndCall(transport: P2PTransport, peerKey = 'peer-pub-key'): Promise<void> {
  await connectTransport(transport);
  await transport.call(peerKey);
}

function getDataChannel(label: string) {
  return mockDataChannels.find((dc: any) => dc.label === label);
}

function createMockStream(tracks: any[] = []) {
  return { getTracks: vi.fn(() => tracks) };
}

describe('P2PTransport', () => {
  describe('constructor', () => {
    it('stores config and uses default STUN server', () => {
      const transport = makeTransport();
      expect((transport as any).signalingUrl).toBe('ws://localhost:8080');
      expect((transport as any).localPublicKey).toBe('local-pub-key');
      expect((transport as any).onMessage).toBe(onMessage);
      expect((transport as any).onConnected).toBe(onConnected);
      expect((transport as any).onDisconnected).toBe(onDisconnected);
      expect((transport as any).iceServers).toEqual([
        { urls: 'stun:turn.neumorphic.local:3478' },
      ]);
      expect((transport as any).obfuscator).toBeNull();
      expect((transport as any).isRelayOnly).toBe(false);
    });

    it('uses custom ICE servers when provided', () => {
      const customIce = [
        { urls: 'stun:custom-stun.example.com:3478' },
        { urls: 'turn:turn.example.com:3478', username: 'user', credential: 'pass' },
      ];
      const transport = makeTransport({ iceServers: customIce });
      expect((transport as any).iceServers).toBe(customIce);
    });

    it('stores obfuscator when provided', () => {
      const obfuscator = { obfuscate: vi.fn(), deobfuscate: vi.fn() };
      const transport = makeTransport({ obfuscator });
      expect((transport as any).obfuscator).toBe(obfuscator);
    });
  });

  describe('connect()', () => {
    it('opens WebSocket, sends register message, resolves on registered', async () => {
      const transport = makeTransport();

      const p = transport.connect();
      expect(mockWs).not.toBeNull();
      expect(mockWs.onopen).toBeInstanceOf(Function);
      expect(mockWs.onmessage).toBeInstanceOf(Function);
      expect(mockWs.onerror).toBeInstanceOf(Function);
      expect(mockWs.onclose).toBeInstanceOf(Function);

      mockWs.onopen();
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'register', publicKey: 'local-pub-key' }),
      );

      mockWs.onmessage({ data: JSON.stringify({ type: 'registered' }) });
      await expect(p).resolves.toBeUndefined();
    });

    it('rejects on WebSocket error', async () => {
      const transport = makeTransport();
      const p = transport.connect();

      mockWs.onerror();
      await expect(p).rejects.toThrow('WebSocket connection failed');
    });

    it('rejects on error message from server', async () => {
      const transport = makeTransport();
      const p = transport.connect();

      mockWs.onopen();
      mockWs.onmessage({
        data: JSON.stringify({ type: 'error', message: 'Authentication failed' }),
      });
      await expect(p).rejects.toThrow('Authentication failed');
    });

    it('returns immediately if signalingWs is already open', async () => {
      const transport = makeTransport();
      (transport as any).signalingWs = { readyState: 1 };

      await transport.connect();
      expect(mockWs).toBeNull();
    });
  });

  describe('call()', () => {
    it('resolves when not connected (mesh mode allows calls)', async () => {
      const transport = makeTransport();
      await expect(transport.call('peer-key')).resolves.toBeUndefined();
    });

    it('creates RTCPeerConnection with configured ICE servers', async () => {
      const customIce = [
        { urls: 'stun:stun.example.com:19302' },
      ];
      const transport = makeTransport({ iceServers: customIce });
      await connectTransport(transport);

      await transport.call('peer-key');

      expect(mockPc).not.toBeNull();
      expect(mockPc.pcConfig).toEqual({
        iceServers: customIce,
        iceTransportPolicy: 'all',
      });
    });

    it('creates messenger and call-control data channels', async () => {
      const transport = makeTransport();
      await connectTransport(transport);

      await transport.call('peer-key');

      const msgDc = getDataChannel('messenger');
      const ccDc = getDataChannel('call-control');

      expect(msgDc).toBeDefined();
      expect(ccDc).toBeDefined();
      expect(msgDc.opts).toEqual({ ordered: true });
      expect(ccDc.opts).toEqual({ ordered: true });
    });

    it('sends offer via signaling WebSocket', async () => {
      const transport = makeTransport();
      await connectTransport(transport);

      await transport.call('peer-key');

      expect(mockPc.createOffer).toHaveBeenCalled();
      expect(mockPc.setLocalDescription).toHaveBeenCalledWith(
        { type: 'offer', sdp: 'mock-sdp' },
      );
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"offer"'),
      );
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"target":"peer-key"'),
      );
    });

    it('performs ephemeral ECDH: offer carries dhPub, not hmacKey', async () => {
      const transport = makeTransport();
      await connectTransport(transport);

      await transport.call('peer-key');

      expect(HMACAuth.generateKey).not.toHaveBeenCalled();
      const offerCall = mockWs.send.mock.calls.find((c: any) =>
        c[0].includes('"type":"offer"'),
      );
      expect(offerCall).toBeDefined();
      expect(offerCall![0]).toContain('"dhPub"');
      expect(offerCall![0]).not.toContain('hmacKey');
    });
  });

  describe('ephemeral ECDH key agreement', () => {
    it('derives an identical HMAC key on both peers and never transmits it', async () => {
      const caller = makeTransport({ localPublicKey: 'caller-id' });
      const callee = makeTransport({ localPublicKey: 'callee-id' });

      const cp = caller.connect();
      const callerWs = mockWebSockets[0];
      callerWs.onopen();
      callerWs.onmessage({ data: JSON.stringify({ type: 'registered' }) });
      await cp;

      const kp = callee.connect();
      const calleeWs = mockWebSockets[1];
      calleeWs.onopen();
      calleeWs.onmessage({ data: JSON.stringify({ type: 'registered' }) });
      await kp;

      // Relay signaling messages between the two peers, recording them.
      const sent: string[] = [];
      callerWs.send = (data: string) => { sent.push(data); calleeWs.onmessage?.({ data }); };
      calleeWs.send = (data: string) => { sent.push(data); callerWs.onmessage?.({ data }); };

      await caller.call('callee-id');

      await vi.waitFor(() => {
        expect((caller as any).hmacKey).not.toBeNull();
        expect((callee as any).hmacKey).not.toBeNull();
      });

      const callerKey = (caller as any).hmacKey as string;
      const calleeKey = (callee as any).hmacKey as string;
      expect(callerKey).toBe(calleeKey);
      expect(callerKey).toMatch(/^[0-9a-f]{128}$/);

      const offerMsg = JSON.parse(sent.find((s) => s.includes('"type":"offer"'))!);
      const answerMsg = JSON.parse(sent.find((s) => s.includes('"type":"answer"'))!);
      expect(offerMsg.hmacKey).toBeUndefined();
      expect(answerMsg.hmacKey).toBeUndefined();
      expect(offerMsg.dhPub).toMatch(/^[0-9a-f]{64}$/);
      expect(answerMsg.dhPub).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('send()', () => {
it('sends data via data channel when hmacKey is not set', async () => {
       const transport = makeTransport();
       const dc = { readyState: 'open', send: vi.fn(), close: vi.fn() };
       (transport as any).dataChannel = dc;
       (transport as any).hmacKey = null;

       await transport.send('hello-world');

       expect(dc.send).toHaveBeenCalledWith('hello-world');
     });

     it('uses HMAC signature when hmacKey is set', async () => {
       const transport = makeTransport();
       const dc = { readyState: 'open', send: vi.fn(), close: vi.fn() };
       (transport as any).dataChannel = dc;
       (transport as any).hmacKey = 'some-key';

       await transport.send('hello');

      await vi.waitFor(() => {
        expect(HMACAuth.sign).toHaveBeenCalledWith('some-key', 'hello');
        expect(dc.send).toHaveBeenCalledWith('mock-sig|hello');
      });
    });

it('obfuscates data before sending when obfuscator is set', async () => {
       const obfuscator = { obfuscate: vi.fn().mockResolvedValue('obfuscated-payload') };
       const transport = makeTransport({ obfuscator });
       const dc = { readyState: 'open', send: vi.fn(), close: vi.fn() };
       (transport as any).dataChannel = dc;
       (transport as any).hmacKey = null;

       await transport.send('secret-data');

       expect(obfuscator.obfuscate).toHaveBeenCalledWith('secret-data');
       expect(dc.send).toHaveBeenCalledWith('obfuscated-payload');
     });

     it('warns and does not send when data channel is not open', async () => {
       const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
       const transport = makeTransport();
       (transport as any).dataChannel = null;

       await transport.send('data');

       expect(warnSpy).toHaveBeenCalledWith('[P2PTransport] Data channel not open');
       warnSpy.mockRestore();
     });
  });

  describe('sendCallControl()', () => {
    it('sends data via call-control channel', () => {
      const transport = makeTransport();
      const ccDc = { readyState: 'open', send: vi.fn(), close: vi.fn() };
      (transport as any).callControlChannel = ccDc;

      transport.sendCallControl({ type: 'mute-toggled', kind: 'audio' });

      expect(ccDc.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'mute-toggled', kind: 'audio' }),
      );
    });

    it('does nothing if call-control channel is not open', () => {
      const transport = makeTransport();
      (transport as any).callControlChannel = null;

      expect(() => transport.sendCallControl({ test: true })).not.toThrow();
    });
  });

  describe('disconnect()', () => {
    it('closes all connections and resets state', async () => {
      const transport = makeTransport();
      await connectAndCall(transport);

      const msgDc = getDataChannel('messenger');
      const ccDc = getDataChannel('call-control');

      transport.disconnect();

      expect(msgDc.close).toHaveBeenCalled();
      expect(ccDc.close).toHaveBeenCalled();
      expect(mockPc.close).toHaveBeenCalled();
      expect(mockWs.close).toHaveBeenCalled();
      expect((transport as any).dataChannel).toBeNull();
      expect((transport as any).callControlChannel).toBeNull();
      expect((transport as any).peerConnection).toBeNull();
      expect((transport as any).signalingWs).toBeNull();
      expect((transport as any).peerPublicKey).toBeNull();
      expect((transport as any).hmacKey).toBeNull();
      expect((transport as any).pendingCandidates).toEqual([]);
      expect((transport as any).reconnectAttempts).toBe(0);
      expect((transport as any).outgoingStreams).toEqual([]);
      expect((transport as any).pendingOutgoingTracks).toEqual([]);
    });
  });

  describe('setRelayOnly()', () => {
    it('sets relay mode, affecting ICE transport policy on next call', async () => {
      const transport = makeTransport();
      await connectTransport(transport);

      transport.setRelayOnly(true);

      await transport.call('peer-key');

      expect(mockPc.pcConfig.iceTransportPolicy).toBe('relay');
    });

    it('defaults to all when relay mode is disabled', async () => {
      const transport = makeTransport();
      await connectTransport(transport);

      transport.setRelayOnly(false);

      await transport.call('peer-key');

      expect(mockPc.pcConfig.iceTransportPolicy).toBe('all');
    });
  });

  describe('setIceServers()', () => {
    it('updates ICE servers for subsequent call', async () => {
      const transport = makeTransport();
      await connectTransport(transport);

      const newServers = [{ urls: 'turn:new-turn.example.com:3478', username: 'u', credential: 'p' }];
      transport.setIceServers(newServers);

      await transport.call('peer-key');

      expect(mockPc.pcConfig.iceServers).toBe(newServers);
    });
  });

  describe('setObfuscator()', () => {
    it('sets the obfuscator instance', () => {
      const transport = makeTransport();
      expect((transport as any).obfuscator).toBeNull();

      const obfuscator = { obfuscate: vi.fn(), deobfuscate: vi.fn() } as any;
      transport.setObfuscator(obfuscator);

      expect((transport as any).obfuscator).toBe(obfuscator);
    });
  });

  describe('sendMetadataSignal()', () => {
    it('sends metadata via signaling WebSocket', async () => {
      const transport = makeTransport();
      await connectTransport(transport);
      (transport as any).peerPublicKey = 'peer-key';

      transport.sendMetadataSignal('typing-indicator', { isTyping: true });

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'typing-indicator',
          target: 'peer-key',
          data: { isTyping: true },
        }),
      );
    });

    it('does nothing when signaling is not connected', () => {
      const transport = makeTransport();
      transport.sendMetadataSignal('typing-indicator', {});
      expect(mockWs).toBeNull();
    });
  });

  describe('onMetadataSignal / handleMetadataSignal', () => {
    it('registers a callback that is invoked by handleMetadataSignal', () => {
      const transport = makeTransport();
      const handler = vi.fn();
      transport.onMetadataSignal(handler);

      transport.handleMetadataSignal('online-status', { status: 'online' });

      expect(handler).toHaveBeenCalledWith('online-status', { status: 'online' });
    });

    it('supports multiple handlers', () => {
      const transport = makeTransport();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      transport.onMetadataSignal(handler1);
      transport.onMetadataSignal(handler2);

      transport.handleMetadataSignal('read-receipt', { messageId: '123' });

      expect(handler1).toHaveBeenCalledWith('read-receipt', { messageId: '123' });
      expect(handler2).toHaveBeenCalledWith('read-receipt', { messageId: '123' });
    });
  });

  describe('attachMediaHandlers()', () => {
    it('stores media handlers for later use', () => {
      const transport = makeTransport();
      const handlers = {
        onRemoteTrack: vi.fn(),
        onCallClosed: vi.fn(),
        onMediaEnded: vi.fn(),
      };

      transport.attachMediaHandlers(handlers);

      expect((transport as any).mediaHandlers).toBe(handlers);
    });
  });

  describe('addOutgoingStream()', () => {
    it('adds stream to internal outgoingStreams list', async () => {
      const transport = makeTransport();
      const stream = createMockStream();

      await transport.addOutgoingStream(stream as any);

      expect((transport as any).outgoingStreams).toContain(stream);
    });

    it('adds tracks to peerConnection when already connected', async () => {
      const transport = makeTransport();
      await connectAndCall(transport);

      const mockTrack = { kind: 'audio' } as MediaStreamTrack;
      const stream = createMockStream([mockTrack]);

      await transport.addOutgoingStream(stream as any);

      expect(mockPc.addTrack).toHaveBeenCalledWith(mockTrack, stream);
    });

    it('defers adding tracks to pending when peerConnection is not set', async () => {
      const transport = makeTransport();
      (transport as any).peerConnection = null;

      const mockTrack = { kind: 'video' } as MediaStreamTrack;
      const stream = createMockStream([mockTrack]);

      await transport.addOutgoingStream(stream as any);

      expect((transport as any).pendingOutgoingTracks).toContain(mockTrack);
    });
  });

  describe('removeOutgoingStream()', () => {
    it('removes stream from internal outgoingStreams list', async () => {
      const transport = makeTransport();
      const stream = createMockStream();
      (transport as any).outgoingStreams = [stream];

      await transport.removeOutgoingStream(stream as any);

      expect((transport as any).outgoingStreams).not.toContain(stream);
    });

    it('removes tracks from peerConnection when sender is found', async () => {
      const transport = makeTransport();
      await connectAndCall(transport);

      const mockTrack = { kind: 'audio' } as MediaStreamTrack;
      const mockSender = { track: mockTrack };
      mockPc.getSenders.mockReturnValue([mockSender]);

      const stream = createMockStream([mockTrack]);

      await transport.removeOutgoingStream(stream as any);

      expect(mockPc.removeTrack).toHaveBeenCalledWith(mockSender);
    });

    it('does nothing when peerConnection is not set', async () => {
      const transport = makeTransport();
      const stream = createMockStream();

      await transport.removeOutgoingStream(stream as any);

      expect(mockPc).toBeNull();
    });
  });
});
