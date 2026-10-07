/**
 * Generic serverless relay pub/sub client (same wire protocol as
 * CompanyRosterSync): `register` → `subscribe` → `publish`. Used by the
 * embeddable widget (guest → company channel) and by Team Inbox (company
 * receiving guest messages on a site channel).
 *
 * Topic convention: `company:<id>:channel:<id>`. Degrades to no-op when the
 * relay is unavailable (no WebSocket, no seed URL, or the reconnect budget is
 * exhausted) — see `relaySocket.ts` for the connect-timeout / retry policy.
 */

import { SIGNALING_SEED_URLS } from '../../config/signalling';
import { getRelayToken } from '../network/relayToken';
import { openRelaySocket, type RelaySocket, type RelayStatus } from './relaySocket';

export type RelayMessageHandler = (payload: any) => void;

export class RelayClient {
  private socket: RelaySocket | null = null;
  private readonly topic: string;
  private handler: RelayMessageHandler | null = null;
  private stopped = false;
  private status: RelayStatus = 'connecting';
  private statusHandler: ((status: RelayStatus) => void) | null = null;

  constructor(topic: string) {
    this.topic = topic;
  }

  onMessage(cb: RelayMessageHandler): void {
    this.handler = cb;
  }

  /**
   * Observe connection state. Fires immediately with the current value so the
   * caller never renders a stale "connected" UI after the relay dropped.
   */
  onStatus(cb: (status: RelayStatus) => void): void {
    this.statusHandler = cb;
    cb(this.status);
  }

  /** True only while a frame would actually reach the relay. */
  isOnline(): boolean {
    return this.status === 'online';
  }

  start(token?: string): void {
    if (typeof WebSocket === 'undefined') {
      this.setStatus('offline');
      return;
    }
    const base = SIGNALING_SEED_URLS[0];
    if (!base) {
      this.setStatus('offline');
      return;
    }
    if (token) {
      this.connect(base, token);
    } else {
      getRelayToken('embed').then((t) => this.connect(base, t)).catch(() => this.connect(base, ''));
    }
  }

  private setStatus(next: RelayStatus): void {
    if (this.status === next) return;
    this.status = next;
    this.statusHandler?.(next);
  }

  private connect(base: string, token: string): void {
    if (this.stopped) return;
    this.socket = openRelaySocket({
      base,
      token,
      onStatus: (s) => this.setStatus(s),
      onOpen: (send) => {
        send({ type: 'register', publicKey: 'embed' });
        send({ type: 'subscribe', topic: this.topic });
      },
      onMessage: (msg) => {
        if (msg.type === 'registered') {
          // The relay acks the registration with a fresh topic list — resubscribe.
          this.socket?.publish({ type: 'subscribe', topic: this.topic });
          return;
        }
        if (msg.type === 'publish' && msg.topic === this.topic && msg.data) {
          this.handler?.(msg.data);
        }
      },
    });
  }

  /** `false` when the frame was dropped (relay unreachable) — never pretend. */
  publish(payload: any): boolean {
    return this.socket?.publish({ type: 'publish', topic: this.topic, data: payload }) ?? false;
  }

  stop(): void {
    this.stopped = true;
    this.socket?.close();
    this.socket = null;
  }
}
