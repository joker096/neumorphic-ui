// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
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
    _statusCb: any = null;
    published: any[] = [];
    status: any = 'online';
    constructor(topic: string) {
      this.topic = topic;
      lastClient = this;
    }
    onMessage(cb: any) {
      this._cb = cb;
    }
    onStatus(cb: any) {
      this._statusCb = cb;
      cb(this.status);
    }
    isOnline() {
      return this.status === 'online';
    }
    start() {}
    publish(p: any) {
      if (this.status !== 'online') return false;
      this.published.push(p);
      return true;
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
    localStorage.clear();
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

  it('keeps the draft and shows a note when the relay is unreachable (no fake sent bubble)', async () => {
    render(<EmbedWidget token={token} />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText('embed.openChat'));
    });
    const input = await screen.findByPlaceholderText('embed.typeMessage');

    // Relay dropped after the panel opened.
    await act(async () => {
      lastClient.status = 'offline';
      lastClient._statusCb('offline');
    });
    await act(async () => {
      fireEvent.change(input, { target: { value: 'hi' } });
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    expect(screen.queryByText('hi')).toBeNull(); // no fake own bubble
    expect(screen.getByText('embed.offline')).toBeTruthy();
    expect((input as HTMLInputElement).value).toBe('hi'); // draft kept for a retry
    expect(lastClient.published.length).toBe(0);
  });

  it('shows the connecting note until the relay is online', async () => {
    render(<EmbedWidget token={token} />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText('embed.openChat'));
    });
    await screen.findByPlaceholderText('embed.typeMessage');
    // The fake client reports its current status synchronously on subscribe.
    lastClient.status = 'connecting';
    await act(async () => {
      lastClient._statusCb('connecting');
    });
    expect(screen.getByText('embed.connecting')).toBeTruthy();
  });

  it('send button has min-h-11 touch zone', async () => {
    render(<EmbedWidget token={token} />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText('embed.openChat'));
    });

    const input = await screen.findByPlaceholderText('embed.typeMessage');
    const sendBtn = within(input.parentElement as HTMLElement).getByRole('button');
    expect(sendBtn.className).toContain('ew-send');
  });

  it('shows contact form on open and skips on skip click', async () => {
    render(<EmbedWidget token={token} />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText('embed.openChat'));
    });

    expect(await screen.findByText('embed.contactTitle')).toBeTruthy();
    const skipBtn = screen.getByText('embed.contactSkip');
    await act(async () => {
      fireEvent.click(skipBtn);
    });

    // After skip, contact form should be gone
    expect(screen.queryByText('embed.contactTitle')).toBeNull();
  });

  it('sends contact envelope when form submitted', async () => {
    render(<EmbedWidget token={token} />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText('embed.openChat'));
    });

    const nameInput = await screen.findByPlaceholderText('embed.contactName');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Alice' } });
    });

    // Click the "Start chat" button in the contact form
    const startBtn = screen.getByText('embed.contactStart');
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // sealToChannel should have been called (contact envelope)
    const { sealToChannel } = await import('../../lib/embed/embedCrypto');
    expect(sealToChannel).toHaveBeenCalled();
    expect(lastClient.published.length).toBe(1);

    // Contact form should be gone after submission
    expect(screen.queryByText('embed.contactTitle')).toBeNull();
  });

  it('send button is disabled when draft is empty', async () => {
    render(<EmbedWidget token={token} />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText('embed.openChat'));
    });

    const input = await screen.findByPlaceholderText('embed.typeMessage');
    const sendBtn = within(input.parentElement as HTMLElement).getByRole('button');
    expect(sendBtn).toBeDisabled();

    await act(async () => {
      fireEvent.change(input, { target: { value: 'hello' } });
    });
    expect(sendBtn).not.toBeDisabled();
  });

  it('Escape key closes the panel', async () => {
    render(<EmbedWidget token={token} />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText('embed.openChat'));
    });
    expect(await screen.findByPlaceholderText('embed.typeMessage')).toBeTruthy();

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(screen.queryByPlaceholderText('embed.typeMessage')).toBeNull();
  });

  it('FAB aria-label toggles between open and close', async () => {
    render(<EmbedWidget token={token} />);
    const fab = screen.getByLabelText('embed.openChat');

    await act(async () => {
      fireEvent.click(fab);
    });
    // header close button + FAB both labeled close while open
    expect(screen.getAllByLabelText('embed.close').length).toBe(2);
    expect(document.querySelector('.ew-fab')?.getAttribute('aria-label')).toBe('embed.close');

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(document.querySelector('.ew-fab')?.getAttribute('aria-label')).toBe('embed.openChat');
  });
});
