// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../config/signalling', () => ({
  SIGNALING_SEED_URLS: ['wss://relay.test'],
}));
const getRelayTokenMock = vi.fn<(id?: string) => Promise<string>>(async () => '');
vi.mock('../network/relayToken', () => ({
  getRelayToken: (id: string) => getRelayTokenMock(id),
  withToken: (base: string, token: string) =>
    (token ? `${base}?token=${token}` : base),
}));

import { CompanyRosterSync } from './relayRoster';
import type { RosterMember } from './relayRoster';

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static OPEN = 1;
  url: string;
  readyState = 1;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((ev: any) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  closed = false;
  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }
  send(m: string) { this.sent.push(m); }
  close() { this.closed = true; }
}

beforeEach(() => {
  FakeWebSocket.instances = [];
  getRelayTokenMock.mockReset();
  getRelayTokenMock.mockResolvedValue('tok1');
  (globalThis as any).WebSocket = FakeWebSocket as any;
});

function lastWs(): FakeWebSocket {
  return FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
}

describe('CompanyRosterSync', () => {
  it('registers and subscribes on open with supplied token', () => {
    const sync = new CompanyRosterSync('org1', 'pk-man', {});
    sync.start('tok');
    const ws = lastWs();
    ws.onopen!();
    expect(ws.sent).toContain(JSON.stringify({ type: 'register', publicKey: 'pk-man' }));
    expect(ws.sent).toContain(JSON.stringify({ type: 'subscribe', topic: 'company:org1' }));
    expect(ws.url).toContain('token=tok');
  });

  it('fetches a relay token when none supplied', async () => {
    const sync = new CompanyRosterSync('org1', 'pk-man', {});
    sync.start();
    await Promise.resolve();
    await Promise.resolve();
    expect(getRelayTokenMock).toHaveBeenCalledWith('pk-man');
    const ws = lastWs();
    expect(ws.url).toContain('token=tok1');
  });

  it('fires onRoster on publish message with members array', () => {
    const members: RosterMember[] = [
      { userId: 'u1', displayName: 'Ada', role: 'admin', publicKey: 'pk', online: true },
    ];
    let got: RosterMember[] | null = null;
    const sync = new CompanyRosterSync('org1', 'pk-man', { onRoster: (m) => { got = m; } });
    sync.start('tok');
    lastWs().onmessage!({
      data: JSON.stringify({ type: 'publish', topic: 'company:org1', data: { members } }),
    });
    expect(got).toEqual(members);
  });

  it('fires onPresence on presence message', () => {
    let got: { id: string; on: boolean } | null = null;
    const sync = new CompanyRosterSync('org1', 'pk-man', {
      onPresence: (uid, on) => { got = { id: uid, on }; },
    });
    sync.start('tok');
    lastWs().onmessage!({
      data: JSON.stringify({ type: 'presence', topic: 'company:org1', data: { userId: 'u1', online: true } }),
    });
    expect(got).toEqual({ id: 'u1', on: true });
  });

  it('fires onNotification on notify message', () => {
    let got: any = null;
    const sync = new CompanyRosterSync('org1', 'pk-man', { onNotification: (n) => { got = n; } });
    sync.start('tok');
    lastWs().onmessage!({
      data: JSON.stringify({ type: 'notify', topic: 'company:org1', from: 'u1', data: { title: 'Hi', body: 'Hello' } }),
    });
    expect(got).toEqual({ title: 'Hi', body: 'Hello', from: 'u1' });
  });

  it('ignores publish for a different topic', () => {
    let got: RosterMember[] | null = null;
    const sync = new CompanyRosterSync('org1', 'pk-man', { onRoster: (m) => { got = m; } });
    sync.start('tok');
    lastWs().onmessage!({
      data: JSON.stringify({ type: 'publish', topic: 'company:other', data: { members: [] } }),
    });
    expect(got).toBeNull();
  });

  it('ignores malformed json messages', () => {
    let got = 0;
    const sync = new CompanyRosterSync('org1', 'pk-man', { onRoster: () => { got++; } });
    sync.start('tok');
    lastWs().onmessage!({ data: 'not-json' });
    expect(got).toBe(0);
  });

  it('publishRoster sends the roster payload', () => {
    const members: RosterMember[] = [{ userId: 'u1', displayName: 'Ada', role: 'admin', publicKey: 'pk', online: false }];
    const sync = new CompanyRosterSync('org1', 'pk-man', {});
    sync.start('tok');
    const ws = lastWs();
    ws.onopen!();
    sync.publishRoster(members);
    expect(ws.sent).toContain(JSON.stringify({ type: 'publish', topic: 'company:org1', data: { members } }));
  });

  it('publishPresence sends presence for self', () => {
    const sync = new CompanyRosterSync('org1', 'pk-man', {});
    sync.start('tok');
    const ws = lastWs();
    ws.onopen!();
    sync.publishPresence(true);
    expect(ws.sent).toContain(JSON.stringify({ type: 'presence', topic: 'company:org1', data: { userId: 'pk-man', online: true } }));
  });

  it('notify sends a notification payload', () => {
    const sync = new CompanyRosterSync('org1', 'pk-man', {});
    sync.start('tok');
    const ws = lastWs();
    ws.onopen!();
    sync.notify('Hi', 'Body');
    expect(ws.sent).toContain(JSON.stringify({ type: 'notify', topic: 'company:org1', data: { title: 'Hi', body: 'Body' } }));
  });

  it('stop closes the socket and prevents reconnect', () => {
    const sync = new CompanyRosterSync('org1', 'pk-man', {});
    sync.start('tok');
    const ws = lastWs();
    sync.stop();
    expect(ws.closed).toBe(true);
    // start after stop must not create a new socket
    expect(FakeWebSocket.instances).toHaveLength(1);
  });
});
