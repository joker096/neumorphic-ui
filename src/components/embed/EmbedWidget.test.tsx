// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createEmbedToken } from '../../lib/embed/token';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: () => {},
  }),
  I18nProvider: ({ children }: { children: any }) => children,
  I18nContext: { Provider: ({ children }: { children: any }) => children },
}));

vi.mock('../../lib/embed/embedCrypto', () => ({
  makeGuestIdentity: () => ({ publicKey: new Uint8Array([1]), secretKey: new Uint8Array([2]) }),
  sealToChannel: vi.fn(async () => ({ senderPubKey: 'g', cipher: 'c', iv: 'i' })),
  openFromChannel: vi.fn(async () => 'reply from company'),
}));

let lastClient: any = null;
vi.mock('../../lib/company/relayClient', () => {
  class FakeRelayClient {
    topic: string;
    _cb: any = null;
    published: any[] = [];
    constructor(topic: string) {
      this.topic = topic;
      lastClient = this;
    }
    onMessage(cb: any) {
      this._cb = cb;
    }
    start() {}
    publish(p: any) {
      this.published.push(p);
    }
    stop() {}
  }
  return { RelayClient: FakeRelayClient };
});

import { EmbedWidget } from './EmbedWidget';

const token = createEmbedToken({
  companyId: 'c1',
  channelId: 'ch1',
  channelPubKeyB64: 'PUB',
  label: 'Sales',
});

describe('EmbedWidget', () => {
  beforeEach(() => {
    lastClient = null;
    vi.clearAllMocks();
  });

  it('renders bubble, opens, sends and receives', async () => {
    render(<EmbedWidget token={token} />);
    const bubble = screen.getByLabelText('embed.openChat');
    expect(bubble).toBeTruthy();

    await act(async () => {
      fireEvent.click(bubble);
    });

    const input = await screen.findByPlaceholderText('embed.typeMessage');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'hi' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    expect(await screen.findByText('hi')).toBeTruthy();
    expect(lastClient.published.length).toBe(1);

    await act(async () => {
      lastClient._cb({ senderPubKey: 'g', cipher: 'c', iv: 'i' });
    });
    expect(await screen.findByText('reply from company')).toBeTruthy();
  });
});
