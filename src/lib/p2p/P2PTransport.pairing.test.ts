import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as nacl from 'tweetnacl';
import { P2PTransport, PAIRING_MAGIC } from './P2PTransport';
import { HMACAuth } from './HMACAuth';

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue('{}'),
  set: vi.fn().mockResolvedValue(undefined),
}));

let onMessageA: ReturnType<typeof vi.fn>;
let onMessageB: ReturnType<typeof vi.fn>;
let onConnectedA: ReturnType<typeof vi.fn>;
let onDisconnectedA: ReturnType<typeof vi.fn>;
let onConnectedB: ReturnType<typeof vi.fn>;
let onDisconnectedB: ReturnType<typeof vi.fn>;

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

  constructor(label: string) {
    this.label = label;
  }
}

class MockRTCPeerConnection {
  createDataChannel = vi.fn((label: string) => new MockDataChannel(label));
  createOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-offer-sdp' });
  createAnswer = vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-answer-sdp' });
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
  iceGatheringState = 'complete';

  constructor(public config?: any) {}
}

class MockRTCSessionDescription {
  constructor(public sdp: any) {}
}

class MockRTCIceCandidate {
  constructor(public candidate: any) {}
}

beforeEach(async () => {
  vi.restoreAllMocks();
  onMessageA = vi.fn();
  onMessageB = vi.fn();
  onConnectedA = vi.fn();
  onDisconnectedA = vi.fn();
  onConnectedB = vi.fn();
  onDisconnectedB = vi.fn();

  vi.spyOn(HMACAuth, 'sign').mockResolvedValue('mock-sig');
  vi.spyOn(HMACAuth, 'verify').mockResolvedValue(true);

  vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection);
  vi.stubGlobal('RTCSessionDescription', MockRTCSessionDescription);
  vi.stubGlobal('RTCIceCandidate', MockRTCIceCandidate);

  const { webcrypto } = await import('node:crypto');
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto as unknown as Crypto,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

const stableIdentities = new Map<string, nacl.SignKeyPair>();

function makeTransport(opts: {
  label: string;
  onMessage: ReturnType<typeof vi.fn>;
  onConnected: ReturnType<typeof vi.fn>;
  onDisconnected: ReturnType<typeof vi.fn>;
  identity?: { secretKey: Uint8Array; publicKey: Uint8Array };
}) {
  // Stable identity per label — TOFU pins the first identity per peerId,
  // so repeated pairings between the same peers must reuse the same key.
  const stable = (stableIdentities[opts.label] ??= nacl.sign.keyPair());
  const identity = opts.identity ?? stable;
  return new P2PTransport({
    signalingUrl: '',
    localPublicKey: `peer-${opts.label}`,
    onMessage: opts.onMessage as any,
    onConnected: opts.onConnected,
    onDisconnected: opts.onDisconnected,
    obfuscationEnabled: false,
    identitySecretKey: identity.secretKey,
    identityPublicKey: identity.publicKey,
  } as any);
}

describe('serverless LAN pairing (P2PTransport)', () => {
  it('createPairingOffer returns a mess-lan payload with role offer and dhPub', async () => {
    const a = makeTransport({ label: 'A', onMessage: onMessageA, onConnected: onConnectedA, onDisconnected: onDisconnectedA });
    a.enablePairingMode();

    const offerStr = await a.createPairingOffer();
    expect(offerStr.startsWith(PAIRING_MAGIC)).toBe(true);
    const payload = JSON.parse(offerStr.slice(PAIRING_MAGIC.length));
    expect(payload.role).toBe('offer');
    expect(payload.peerId).toBe('peer-A');
    expect(payload.dhPub).toMatch(/^[0-9a-f]{64}$/);
    expect(payload.sdp.type).toBe('offer');
  });

  it('embeds post-gather ICE candidates (localDescription) into offer/answer SDP, not the stale createOffer snapshot', async () => {
    const origRTC = globalThis.RTCPeerConnection;
    vi.stubGlobal('RTCPeerConnection', function () {
      const inst = new MockRTCPeerConnection();
      inst.setLocalDescription = vi.fn(async (desc: any) => {
        (inst as any).localDescription = { type: desc.type, sdp: `${desc.sdp}\na=candidate:1 1 udp 2130706431 192.168.1.5 50210 typ host` };
      });
      return inst;
    } as any);
    try {
      const a = makeTransport({ label: 'A', onMessage: onMessageA, onConnected: onConnectedA, onDisconnected: onDisconnectedA });
      const b = makeTransport({ label: 'B', onMessage: onMessageB, onConnected: onConnectedB, onDisconnected: onDisconnectedB });
      a.enablePairingMode();
      b.enablePairingMode();

      const offerStr = await a.createPairingOffer();
      const offerPayload = JSON.parse(offerStr.slice(PAIRING_MAGIC.length));
      expect(offerPayload.sdp.sdp).toContain('a=candidate:1');

      const answerStr = await b.acceptPairingOffer(offerStr);
      const answerPayload = JSON.parse(answerStr.slice(PAIRING_MAGIC.length));
      expect(answerPayload.sdp.sdp).toContain('a=candidate:1');
    } finally {
      vi.stubGlobal('RTCPeerConnection', origRTC);
    }
  });

  it('acceptPairingOffer yields an answer then acceptPairingAnswer completes a secure session', async () => {
    const a = makeTransport({ label: 'A', onMessage: onMessageA, onConnected: onConnectedA, onDisconnected: onDisconnectedA });
    const b = makeTransport({ label: 'B', onMessage: onMessageB, onConnected: onConnectedB, onDisconnected: onDisconnectedB });
    a.enablePairingMode();
    b.enablePairingMode();

    const offerStr = await a.createPairingOffer();
    const answerStr = await b.acceptPairingOffer(offerStr);

    expect(answerStr.startsWith(PAIRING_MAGIC)).toBe(true);
    const answerPayload = JSON.parse(answerStr.slice(PAIRING_MAGIC.length));
    expect(answerPayload.role).toBe('answer');
    expect(answerPayload.dhPub).toMatch(/^[0-9a-f]{64}$/);

    await a.acceptPairingAnswer(answerStr);

    expect((a as any).peerPublicKey).toBe('peer-B');
    expect((b as any).peerPublicKey).toBe('peer-A');
    expect(a.hasSessionKeys()).toBe(true);
    expect(b.hasSessionKeys()).toBe(true);
    expect((a as any).hmacKey).toMatch(/[0-9a-f]/);
    expect((b as any).sessionAesKey).toBeTruthy();
    expect((a as any).sessionAesKey.algorithm.name).toBe('AES-GCM');
  });

  it('delivers an encrypted+HMAC message over the wired channel of a paired session', async () => {
    const a = makeTransport({ label: 'A', onMessage: onMessageA, onConnected: onConnectedA, onDisconnected: onDisconnectedA });
    const b = makeTransport({ label: 'B', onMessage: onMessageB, onConnected: onConnectedB, onDisconnected: onDisconnectedB });
    a.enablePairingMode();
    b.enablePairingMode();

    const offerStr = await a.createPairingOffer();
    const answerStr = await b.acceptPairingOffer(offerStr);
    await a.acceptPairingAnswer(answerStr);

    const channelA = (a as any).dataChannel as MockDataChannel;
    expect(channelA).toBeTruthy();
    const channelB = new MockDataChannel('messenger');
    ((b as any).peerConnection as any).ondatachannel?.({ channel: channelB });

    channelA.send = vi.fn((data: string) => {
      setTimeout(() => channelB.onmessage?.({ data }), 0);
    });

    await a.send('hello-lan-peer');
    await flush();

    expect(onMessageB).toHaveBeenCalledWith('hello-lan-peer');
  });

  it('authenticates peers via Ed25519 identity when identity keys are provided (TOFU pinning)', async () => {
    const idA = nacl.sign.keyPair();
    const idB = nacl.sign.keyPair();
    const a = makeTransport({ label: 'C', onMessage: onMessageA, onConnected: onConnectedA, onDisconnected: onDisconnectedA, identity: { secretKey: idA.secretKey, publicKey: idA.publicKey } });
    const b = makeTransport({ label: 'D', onMessage: onMessageB, onConnected: onConnectedB, onDisconnected: onDisconnectedB, identity: { secretKey: idB.secretKey, publicKey: idB.publicKey } });
    a.enablePairingMode();
    b.enablePairingMode();

    const offerStr = await a.createPairingOffer();
    const offerPayload = JSON.parse(offerStr.slice(PAIRING_MAGIC.length));
    expect(offerPayload.identityPub).toBeTruthy();
    expect(offerPayload.dhSig).toBeTruthy();

    const answerStr = await b.acceptPairingOffer(offerStr);
    await a.acceptPairingAnswer(answerStr);

    expect(a.hasSessionKeys()).toBe(true);
    expect(b.hasSessionKeys()).toBe(true);
  });

  it('fails closed on tampered offers', async () => {
    const a = makeTransport({ label: 'A', onMessage: onMessageA, onConnected: onConnectedA, onDisconnected: onDisconnectedA });
    const b = makeTransport({ label: 'B', onMessage: onMessageB, onConnected: onConnectedB, onDisconnected: onDisconnectedB });
    a.enablePairingMode();
    b.enablePairingMode();

    const offerStr = await a.createPairingOffer();
    const tampered = offerStr.replace('"role":"offer"', '"role":"answer"');
    await expect(b.acceptPairingOffer(tampered)).rejects.toThrow(/expected role "offer"/);

    await expect(b.acceptPairingOffer('garbage')).rejects.toThrow(/magic/);
    await expect(b.acceptPairingOffer(PAIRING_MAGIC + '{not json}')).rejects.toThrow(/JSON/);
  });

  it('fails closed on an answer with an unparseable dhPub and rolls back session state', async () => {
    const a = makeTransport({ label: 'A', onMessage: onMessageA, onConnected: onConnectedA, onDisconnected: onDisconnectedA });
    const b = makeTransport({ label: 'B', onMessage: onMessageB, onConnected: onConnectedB, onDisconnected: onDisconnectedB });
    a.enablePairingMode();
    b.enablePairingMode();

    const offerStr = await a.createPairingOffer();
    const answerStr = await b.acceptPairingOffer(offerStr);
    const answerPayload = JSON.parse(answerStr.slice(PAIRING_MAGIC.length));
    answerPayload.dhPub = 'zz';

    await a.acceptPairingAnswer(PAIRING_MAGIC + JSON.stringify(answerPayload)).catch(() => {});

    expect(a.hasSessionKeys()).toBe(false);
    expect((a as any).peerPublicKey).toBeNull();
    expect((a as any).peerConnection).toBeNull();
    expect((a as any).localDhPrivateKey).toBeNull();
  });

  it('rejects callers that do not enable pairing mode', async () => {
    const a = makeTransport({ label: 'A', onMessage: onMessageA, onConnected: onConnectedA, onDisconnected: onDisconnectedA });
    await expect(a.createPairingOffer()).rejects.toThrow(/enablePairingMode/);
    await expect(a.acceptPairingOffer('x')).rejects.toThrow(/enablePairingMode/);
    await expect(a.acceptPairingAnswer('x')).rejects.toThrow(/enablePairingMode/);
  });

  it('createPairingOffer throws when identity keys are missing', async () => {
    const a = new P2PTransport({
      signalingUrl: '',
      localPublicKey: 'peer-X',
      onMessage: onMessageA as any,
      onConnected: onConnectedA,
      onDisconnected: onDisconnectedA,
      obfuscationEnabled: false,
    } as any);
    a.enablePairingMode();

    await expect(a.createPairingOffer()).rejects.toThrow(/identity keys required/);
  });

  it('rejects a pairing offer stripped of its identity signature', async () => {
    const a = makeTransport({ label: 'A', onMessage: onMessageA, onConnected: onConnectedA, onDisconnected: onDisconnectedA });
    const b = makeTransport({ label: 'B', onMessage: onMessageB, onConnected: onConnectedB, onDisconnected: onDisconnectedB });
    a.enablePairingMode();
    b.enablePairingMode();

    const offerStr = await a.createPairingOffer();
    const payload = JSON.parse(offerStr.slice(PAIRING_MAGIC.length));
    delete payload.identityPub;
    delete payload.dhSig;
    const stripped = PAIRING_MAGIC + JSON.stringify(payload);

    await expect(b.acceptPairingOffer(stripped)).rejects.toThrow(/identity signature/);
  });
});