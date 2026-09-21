import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../store', () => ({
  useAppStore: {
    getState: () => ({
      obfuscationEnabled: false,
      turnServerUrl: '',
      turnServerUser: '',
      turnServerPass: '',
    }),
  },
}));

const transportCtor = vi.fn();
const connectMock = vi.fn().mockResolvedValue(undefined);
const callMock = vi.fn().mockResolvedValue(undefined);
const acceptOfferMock = vi.fn().mockResolvedValue(undefined);
const disconnectMock = vi.fn();
const sendMock = vi.fn().mockResolvedValue(undefined);
const setRelayOnlyMock = vi.fn();

vi.mock('./P2PTransport', () => ({
  P2PTransport: class {
    static lastOpts: any = null;
    constructor(opts: any) {
      transportCtor(opts);
      (this.constructor as any).lastOpts = opts;
      this.onMetadataSignal = vi.fn();
    }
    connect = connectMock;
    call = callMock;
    acceptOffer = acceptOfferMock;
    disconnect = disconnectMock;
    send = sendMock;
    setRelayOnly = setRelayOnlyMock;
    attachMediaHandlers = vi.fn();
    onMetadataSignal = vi.fn();
  },
}));

vi.mock('../identity/masterKey', () => ({
  getMasterKeySet: vi.fn().mockResolvedValue(null),
}));

import { MeshDHT } from './MeshDHT';
import { P2PNetwork } from './network';

beforeEach(() => {
  MeshDHT.clear();
  vi.clearAllMocks();
  transportCtor.mockClear();
  sendMock.mockClear();
  connectMock.mockClear();
  callMock.mockClear();
});

afterEach(() => {
  MeshDHT.clear();
});

function optsOf(ctor: typeof transportCtor): any {
  return ctor.mock.calls[0]?.[0];
}

describe('P2PNetwork discovery', () => {
  it('broadcastRaw fans the raw frame out to every connected direct peer', async () => {
    const net = new P2PNetwork({ peerId: 'net-self', peerPublicKey: 'net-self' });
    await net.init();

    await net.connect('peer-a');
    await net.connect('peer-b');
    // Mark both transports connected (the onConnected callback flips the flag).
    const firstCtor = optsOf(transportCtor);
    firstCtor.onConnected('peer-a');
    const secondCtor = transportCtor.mock.calls[1]?.[0];
    secondCtor.onConnected('peer-b');

    await (net as any).broadcastRaw('{"type":"mesh-route-advert","from":"net-self"}');

    const payloadA = JSON.parse(sendMock.mock.calls[0][0]);
    const payloadB = JSON.parse(sendMock.mock.calls[1][0]);
    expect(payloadA).toMatchObject({ senderId: 'net-self', data: '{"type":"mesh-route-advert","from":"net-self"}' });
    expect(payloadB).toMatchObject({ senderId: 'net-self' });
  });

  it('consumes mesh-route-advert frames in the router instead of chat handlers', async () => {
    const net = new P2PNetwork({ peerId: 'net-self', peerPublicKey: 'net-self' });
    await net.init();

    await net.connect('peer-a');
    const ctor = optsOf(transportCtor);
    const chatSpy = vi.fn();
    (net as any).messageHandlers.add(chatSpy);

    // The advert must come from a direct peer (handleRouteAdvert requirement).
    (net as any).router.addDirectPeer('peer-a');
    ctor.onMessage(
      JSON.stringify({ type: 'mesh-route-advert', from: 'peer-a', knownPeers: ['peer-x'], timestamp: 1 }),
    );

    const routes = (net as any).router.getShortestPath('peer-x');
    expect(routes).not.toBeNull();
    expect(chatSpy).not.toHaveBeenCalled();
  });

  it('consumes mesh-forward frames for ourselves and never delivers them as chat', async () => {
    const net = new P2PNetwork({ peerId: 'net-self', peerPublicKey: 'net-self' });
    await net.init();
    await net.connect('peer-a');

    const ctor = optsOf(transportCtor);
    const chatSpy = vi.fn();
    (net as any).messageHandlers.add(chatSpy);

    ctor.onMessage(
      JSON.stringify({
        type: 'mesh-forward',
        from: 'peer-a',
        to: 'net-self',
        senderId: 'original-sender',
        payload: 'hello-forward',
        messageId: 'fwd-1',
      }),
    );

    expect(chatSpy).toHaveBeenCalledTimes(1);
    expect(chatSpy.mock.calls[0][0]).toMatchObject({ senderId: 'original-sender', data: 'hello-forward' });
  });

  it('never dials itself when the DHT notifies about our own node', async () => {
    const net = new P2PNetwork({ peerId: 'net-self', peerPublicKey: 'net-self' });
    await net.init();

    // init() registers our own node in the DHT — the onNewPeer self-skip guard
    // must prevent a transport from being created for our own peerId.
    expect(transportCtor).not.toHaveBeenCalled();
  });
});

describe('P2PNetwork inbound dial-back (M021)', () => {
  const inboundFrame = { sdp: { type: 'offer', sdp: 'inbound-sdp' }, dhPub: 'ab'.repeat(32), seq: 1 };

  it('answers a caller offer over a fresh transport and registers it', async () => {
    const net = new P2PNetwork({ peerId: 'net-self', peerPublicKey: 'net-self' });
    await net.init();

    await net.acceptInboundOffer('peer-caller', inboundFrame);

    expect(transportCtor).toHaveBeenCalledTimes(1);
    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(acceptOfferMock).toHaveBeenCalledTimes(1);
    expect(acceptOfferMock.mock.calls[0][0]).toBe('peer-caller');
    expect(acceptOfferMock.mock.calls[0][1]).toMatchObject({ dhPub: 'ab'.repeat(32) });

    // The transport is registered (peers entry survives) and dedupe guard
    // sees it as owned — a second inbound offer creates no new transport.
    (net as any).transports.set('peer-caller', {});
    await net.acceptInboundOffer('peer-caller', { ...inboundFrame, seq: 2 });
    expect(transportCtor).toHaveBeenCalledTimes(1);
  });

  it('dedupes concurrent inbound offers for the same peer', async () => {
    const net = new P2PNetwork({ peerId: 'net-self', peerPublicKey: 'net-self' });
    await net.init();

    await Promise.all([
      net.acceptInboundOffer('peer-caller', inboundFrame),
      net.acceptInboundOffer('peer-caller', { ...inboundFrame, seq: 2 }),
    ]);

    expect(transportCtor).toHaveBeenCalledTimes(1);
    expect(acceptOfferMock).toHaveBeenCalledTimes(1);
  });

  it('silently drops inbound offers at the peer cap', async () => {
    const net = new P2PNetwork({ peerId: 'net-self', peerPublicKey: 'net-self', maxPeers: 2 });
    await net.init();

    await net.connect('peer-a');
    await net.connect('peer-b');

    const before = transportCtor.mock.calls.length;
    await net.acceptInboundOffer('peer-caller', inboundFrame);

    expect(transportCtor.mock.calls.length).toBe(before);
    expect(acceptOfferMock).not.toHaveBeenCalled();
  });

  it('cleans peer bookkeeping when the inbound transport fails', async () => {
    const net = new P2PNetwork({ peerId: 'net-self', peerPublicKey: 'net-self' });
    await net.init();

    connectMock.mockRejectedValueOnce(new Error('register failed'));

    // acceptInboundOffer swallows the error (best-effort inbound path).
    await expect(net.acceptInboundOffer('peer-caller', inboundFrame)).resolves.toBeUndefined();

    expect((net as any).peers.has('peer-caller')).toBe(false);
    expect((net as any).dialingInbound.has('peer-caller')).toBe(false);
  });
});