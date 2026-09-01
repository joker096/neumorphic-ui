/**
 * Generic serverless relay pub/sub client (same wire protocol as
 * CompanyRosterSync): `register` → `subscribe` → `publish`. Used by the
 * embeddable widget (guest → company channel) and by Team Inbox (company
 * receiving guest messages on a site channel).
 *
 * Topic convention: `company:<id>:channel:<id>`. Degrades to no-op when the
 * relay is unavailable (connection rejected / WebSocket missing).
 */

import { SIGNALING_SEED_URLS } from '../../config/signalling';
import { getRelayToken, withToken } from '../network/relayToken';

export type RelayMessageHandler = (payload: any) => void;

export class RelayClient {
  private ws: WebSocket | null = null;
  private readonly topic: string;
  private handler: RelayMessageHandler | null = null;
  private stopped = false;

  constructor(topic: string) {
    this.topic = topic;
  }

  onMessage(cb: RelayMessageHandler): void {
    this.handler = cb;
  }

  start(token?: string): void {
    if (typeof WebSocket === 'undefined') return;
    const base = SIGNALING_SEED_URLS[0];
    if (!base) return;
    if (token) {
      this.connect(base, token);
    } else {
      getRelayToken('embed').then((t) => this.connect(base, t)).catch(() => this.connect(base, ''));
    }
  }

  private connect(base: string, token: string): void {
    if (this.stopped) return;
    let ws: WebSocket;
    try {
      ws = new WebSocket(withToken(base, token));
    } catch {
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'register', publicKey: 'embed' }));
      ws.send(JSON.stringify({ type: 'subscribe', topic: this.topic }));
    };

    ws.onmessage = (ev) => {
      let msg: any;
      try {
        msg = JSON.parse(ev.data as string);
      } catch {
        return;
      }
      if (msg.type === 'registered') {
        ws.send(JSON.stringify({ type: 'subscribe', topic: this.topic }));
        return;
      }
      if (msg.type === 'publish' && msg.topic === this.topic && msg.data) {
        this.handler?.(msg.data);
      }
    };

    ws.onerror = () => {
      /* degrade silently */
    };
    ws.onclose = () => {
      /* degrade silently */
    };
  }

  publish(payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: 'publish', topic: this.topic, data: payload }));
      } catch {
        /* ignore */
      }
    }
  }

  stop(): void {
    this.stopped = true;
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.ws = null;
  }
}
