import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MeshRouter } from './MeshRouter';

vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-123' });

describe('MeshRouter', () => {
  let router: MeshRouter;
  let broadcastSpy: any;

  beforeEach(() => {
    vi.useFakeTimers();
    broadcastSpy = vi.fn();
    router = new MeshRouter('peer-a');
  });

  afterEach(() => {
    router.stop();
    vi.useRealTimers();
  });

  describe('basic lifecycle', () => {
    it('starts with empty state', () => {
      expect(router.getDirectPeers()).toEqual([]);
      expect(router.getReachablePeers()).toEqual([]);
      expect(router.getPeerCount()).toBe(0);
      expect(router.getRoutingTable()).toEqual([]);
    });

    it('start() begins advertising on interval', () => {
      router.start(broadcastSpy);
      expect(broadcastSpy).toHaveBeenCalledTimes(1);
      const advert = JSON.parse(broadcastSpy.mock.calls[0][0]);
      expect(advert.type).toBe('mesh-route-advert');
      expect(advert.from).toBe('peer-a');
      expect(advert.knownPeers).toEqual([]);
    });

    it('advertises periodically', () => {
      router.start(broadcastSpy);
      broadcastSpy.mockClear();
      vi.advanceTimersByTime(30000);
      expect(broadcastSpy).toHaveBeenCalledTimes(1);
    });

    it('stop() clears advert interval and broadcast', () => {
      router.start(broadcastSpy);
      router.stop();
      broadcastSpy.mockClear();
      vi.advanceTimersByTime(60000);
      expect(broadcastSpy).not.toHaveBeenCalled();
    });
  });

  describe('direct peer management', () => {
    beforeEach(() => {
      router.start(broadcastSpy);
    });

    it('adds a direct peer', () => {
      router.addDirectPeer('peer-b');
      expect(router.getDirectPeers()).toEqual(['peer-b']);
      expect(router.getPeerCount()).toBe(1);
      expect(router.isDirectlyConnected('peer-b')).toBe(true);
      expect(router.canRouteTo('peer-b')).toBe(true);
    });

    it('adds multiple direct peers', () => {
      router.addDirectPeer('peer-b');
      router.addDirectPeer('peer-c');
      expect(router.getDirectPeers()).toEqual(['peer-b', 'peer-c']);
      expect(router.getPeerCount()).toBe(2);
    });

    it('returns peers via getPeers()', () => {
      const router = new MeshRouter('peer-a');
      router.addDirectPeer('peer-b');
      router.addDirectPeer('peer-c');
      const peers = router.getPeers();
      expect(peers).toEqual(['peer-b', 'peer-c']);
    });

    it('removes a direct peer and prunes routes through it', () => {
      router.addDirectPeer('peer-b');
      router.handleRouteAdvert({
        type: 'mesh-route-advert',
        from: 'peer-b',
        knownPeers: ['peer-c', 'peer-d'],
        timestamp: Date.now(),
      });
      expect(router.canRouteTo('peer-c')).toBe(true);
      router.removeDirectPeer('peer-b');
      expect(router.getDirectPeers()).toEqual([]);
      expect(router.canRouteTo('peer-c')).toBe(false);
    });
  });

  describe('route discovery', () => {
    beforeEach(() => {
      router.start(broadcastSpy);
      router.addDirectPeer('peer-b');
    });

    it('discovers routes via route adverts', () => {
      router.handleRouteAdvert({
        type: 'mesh-route-advert',
        from: 'peer-b',
        knownPeers: ['peer-c', 'peer-d'],
        timestamp: Date.now(),
      });
      expect(router.canRouteTo('peer-c')).toBe(true);
      expect(router.canRouteTo('peer-d')).toBe(true);
      expect(router.getRoute('peer-c')).toBe('peer-b');
      expect(router.getRoute('peer-d')).toBe('peer-b');
    });

    it('ignores self in route adverts', () => {
      router.handleRouteAdvert({
        type: 'mesh-route-advert',
        from: 'peer-b',
        knownPeers: ['peer-a', 'peer-c'],
        timestamp: Date.now(),
      });
      expect(router.canRouteTo('peer-c')).toBe(true);
      expect(router.canRouteTo('peer-a')).toBe(false);
    });

    it('ignores adverts from non-direct peers', () => {
      router.handleRouteAdvert({
        type: 'mesh-route-advert',
        from: 'peer-x',
        knownPeers: ['peer-y'],
        timestamp: Date.now(),
      });
      expect(router.canRouteTo('peer-y')).toBe(false);
    });

    it('ignores own adverts', () => {
      const before = router.getRoutingTable().length;
      router.handleRouteAdvert({
        type: 'mesh-route-advert',
        from: 'peer-a',
        knownPeers: ['peer-b'],
        timestamp: Date.now(),
      });
      expect(router.getRoutingTable().length).toBe(before);
    });

    it('expires stale routes', () => {
      router.handleRouteAdvert({
        type: 'mesh-route-advert',
        from: 'peer-b',
        knownPeers: ['peer-c'],
        timestamp: Date.now(),
      });
      expect(router.canRouteTo('peer-c')).toBe(true);
      const route = (router as any).routes.get('peer-c');
      if (route) {
        route.lastSeen = 0;
      }
      expect(router.getRoute('peer-c')).toBeNull();
    });
  });

  describe('message forwarding', () => {
    beforeEach(() => {
      router.start(broadcastSpy);
      router.addDirectPeer('peer-b');
      router.handleRouteAdvert({
        type: 'mesh-route-advert',
        from: 'peer-b',
        knownPeers: ['peer-c', 'peer-d'],
        timestamp: Date.now(),
      });
    });

    it('delivers message to self', () => {
      const cb = vi.fn();
      router.onForward(cb);
      const msg = MeshRouter.createForwardMessage('peer-b', 'peer-a', 'peer-b', 'hello');
      const sendDirect = vi.fn();
      router.handleForward(msg, sendDirect);
      expect(cb).toHaveBeenCalledWith(msg);
      expect(sendDirect).not.toHaveBeenCalled();
    });

    it('forwards message to next hop', () => {
      const cb = vi.fn();
      router.onForward(cb);
      const msg = MeshRouter.createForwardMessage('peer-b', 'peer-c', 'peer-b', 'hello');
      expect(msg.ttl).toBe(7);
      const sendDirect = vi.fn();
      router.handleForward(msg, sendDirect);
      expect(sendDirect).toHaveBeenCalledTimes(1);
      const forwarded = JSON.parse(sendDirect.mock.calls[0][1]);
      expect(forwarded.to).toBe('peer-c');
      expect(forwarded.ttl).toBe(6);
      expect(forwarded.path).toContain('peer-a');
      expect(cb).not.toHaveBeenCalled();
    });

    it('drops message when TTL expires', () => {
      const cb = vi.fn();
      router.onForward(cb);
      const msg = MeshRouter.createForwardMessage('peer-b', 'peer-c', 'peer-b', 'hello');
      msg.ttl = 0;
      const sendDirect = vi.fn();
      router.handleForward(msg, sendDirect);
      expect(sendDirect).not.toHaveBeenCalled();
      expect(cb).not.toHaveBeenCalled();
    });

    it('warns when no route exists', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const msg = MeshRouter.createForwardMessage('peer-b', 'peer-unknown', 'peer-b', 'hello');
      const sendDirect = vi.fn();
      router.handleForward(msg, sendDirect);
      expect(warnSpy).toHaveBeenCalled();
      expect(sendDirect).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('callbacks', () => {
    beforeEach(() => {
      router.start(broadcastSpy);
    });

    it('onForward registers and unregisters', () => {
      const cb = vi.fn();
      const unsub = router.onForward(cb);
      const msg = MeshRouter.createForwardMessage('peer-b', 'peer-a', 'peer-b', 'test');
      const sendDirect = vi.fn();
      router.handleForward(msg, sendDirect);
      expect(cb).toHaveBeenCalled();
      cb.mockClear();
      unsub();
      router.handleForward(msg, sendDirect);
      expect(cb).not.toHaveBeenCalled();
    });

    it('onRouteChange fires on direct peer changes', () => {
      const cb = vi.fn();
      router.onRouteChange(cb);
      router.addDirectPeer('peer-b');
      expect(cb).toHaveBeenCalledTimes(1);
      router.removeDirectPeer('peer-b');
      expect(cb).toHaveBeenCalledTimes(2);
    });

    it('onRouteChange fires on route discovery', () => {
      router.addDirectPeer('peer-b');
      const cb = vi.fn();
      router.onRouteChange(cb);
      router.handleRouteAdvert({
        type: 'mesh-route-advert',
        from: 'peer-b',
        knownPeers: ['peer-c'],
        timestamp: Date.now(),
      });
      expect(cb).toHaveBeenCalled();
    });
  });

  describe('getReachablePeers', () => {
    it('returns unique set of direct and routed peers', () => {
      router.addDirectPeer('peer-b');
      router.handleRouteAdvert({
        type: 'mesh-route-advert',
        from: 'peer-b',
        knownPeers: ['peer-c', 'peer-d'],
        timestamp: Date.now(),
      });
      const reachable = router.getReachablePeers();
      expect(reachable).toContain('peer-b');
      expect(reachable).toContain('peer-c');
      expect(reachable).toContain('peer-d');
      expect(reachable.length).toBe(3);
    });
  });

  describe('createForwardMessage', () => {
    it('creates a valid forward message with defaults', () => {
      const msg = MeshRouter.createForwardMessage('peer-a', 'peer-b', 'peer-a', 'payload-data');
      expect(msg.type).toBe('mesh-forward');
      expect(msg.from).toBe('peer-a');
      expect(msg.to).toBe('peer-b');
      expect(msg.payload).toBe('payload-data');
      expect(msg.ttl).toBe(7);
      expect(msg.path).toEqual(['peer-a']);
      expect(msg.messageId).toBeTruthy();
    });
  });
});
