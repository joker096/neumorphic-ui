import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePersonalSiteChatStore } from '../store/personalSiteChat';
import { usePersonalSiteChatInbox } from './usePersonalSiteChatInbox';

const { clientRef, relayPublished } = vi.hoisted(() => ({
  clientRef: { current: null as any },
  relayPublished: vi.fn(),
}));

vi.mock('../lib/company/relayClient', () => ({
  RelayClient: class {
    topic: string;
    cb: any;
    statusCb: any;
    constructor(topic: string) {
      this.topic = topic;
      clientRef.current = this;
    }
    onStatus(cb: any) {
      this.statusCb = cb;
    }
    onMessage(cb: any) {
      this.cb = cb;
    }
    start() {
      this.statusCb?.('online');
    }
    stop() {
      clientRef.current = null;
    }
    publish(sealed: unknown) {
      relayPublished(sealed);
      return true;
    }
    isOnline() {
      return true;
    }
  },
}));

vi.mock('../lib/embed/embedCrypto', () => ({
  openFromChannel: vi.fn(async () => 'hello'),
  sealToGuest: vi.fn(async () => ({ senderPubKey: 'P2', cipher: 'C', iv: 'I' })),
}));

beforeEach(() => {
  relayPublished.mockClear();
  usePersonalSiteChatStore.setState({
    hydrated: true,
    ns: 'ns1',
    siteChats: [],
    channelKeys: { psc_1: { publicKeyB64: 'P', secretKeyB64: 'S' } },
    websiteContacts: [],
    messages: {},
    lastGuestKeys: {},
  });
});

describe('usePersonalSiteChatInbox', () => {
  it('records the visitor key and appends a plain message', async () => {
    const { result } = renderHook(() => usePersonalSiteChatInbox('psc_1'));
    act(() => {
      clientRef.current.cb({ senderPubKey: 'guest-pub', cipher: 'C', iv: 'I' });
    });
    await waitFor(() => {
      const msgs = usePersonalSiteChatStore.getState().messages['psc_1'] ?? [];
      expect(msgs).toHaveLength(1);
      expect(msgs[0].from).toBe('visitor');
      expect(msgs[0].text).toBe('hello');
      expect(usePersonalSiteChatStore.getState().lastGuestKeys['psc_1']).toBe('guest-pub');
    });
    expect(result.current.status).toBe('online');
  });

  it('replies by sealing to the remembered guest key and publishing', async () => {
    usePersonalSiteChatStore.setState({ lastGuestKeys: { psc_1: 'guest-pub' } });
    const { result } = renderHook(() => usePersonalSiteChatInbox('psc_1'));

    let ok = false;
    await act(async () => {
      ok = await result.current.reply('We are here');
    });
    expect(ok).toBe(true);
    expect(relayPublished).toHaveBeenCalledTimes(1);
    expect(relayPublished).toHaveBeenCalledWith({ senderPubKey: 'P2', cipher: 'C', iv: 'I' });
    const msgs = usePersonalSiteChatStore.getState().messages['psc_1'] ?? [];
    expect(msgs).toHaveLength(1);
    expect(msgs[0].from).toBe('me');
    expect(msgs[0].text).toBe('We are here');
  });

  it('refuses to reply when no visitor key has been seen', async () => {
    const { result } = renderHook(() => usePersonalSiteChatInbox('psc_1'));
    let ok = true;
    await act(async () => {
      ok = await result.current.reply('Hi');
    });
    expect(ok).toBe(false);
    expect(relayPublished).not.toHaveBeenCalled();
    expect(usePersonalSiteChatStore.getState().messages['psc_1'] ?? []).toHaveLength(0);
  });
});
