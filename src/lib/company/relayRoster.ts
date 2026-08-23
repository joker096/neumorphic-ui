/**
 * Serverless company roster / presence / notification sync over the existing
 * relay (no database, no backend). Each device subscribes to a `company:<id>`
 * topic and gossips its local member list; peers merge by `userId` to learn
 * each other's membership and online status. Notifications are broadcast via
 * the same topic.
 *
 * NOTE: requires the relay to support the `subscribe` / `publish` / `presence`
 * / `notify` message types (added to server/signaling-server.ts) AND a relay
 * JWT (the relay enforces `?token=`). Without a token the connection is
 * rejected and the sync degrades to no-op — the rest of the app is unaffected.
 */

import { SIGNALING_SEED_URLS } from '../../config/signalling';
import { getRelayToken, withToken } from '../network/relayToken';

export interface RosterMember {
  userId: string;
  displayName: string;
  role: 'admin' | 'manager' | 'member';
  publicKey: string;
  online: boolean;
}

export interface RosterNotification {
  title: string;
  body: string;
  from?: string;
}

export interface CompanyRosterHandlers {
  onRoster?: (members: RosterMember[]) => void;
  onPresence?: (userId: string, online: boolean) => void;
  onNotification?: (n: RosterNotification) => void;
}

export class CompanyRosterSync {
  private ws: WebSocket | null = null;
  private readonly topic: string;
  private readonly myPublicKey: string;
  private readonly handlers: CompanyRosterHandlers;
  private stopped = false;

  constructor(companyId: string, myPublicKey: string, handlers: CompanyRosterHandlers) {
    this.topic = `company:${companyId}`;
    this.myPublicKey = myPublicKey;
    this.handlers = handlers;
  }

  start(token?: string): void {
    if (typeof WebSocket === 'undefined') return;
    const base = SIGNALING_SEED_URLS[0];
    if (!base) return;
    if (token) {
      this.connect(base, token);
    } else {
      // No token supplied: ask the relay for a short-lived connection token.
      // Degrades to a no-op (connection rejected by server) if the endpoint is
      // missing on the deployed relay — same behaviour as before this change.
      getRelayToken(this.myPublicKey).then((t) => this.connect(base, t)).catch(() => this.connect(base, ''));
    }
  }

  private connect(base: string, token: string): void {
    if (this.stopped) return;
    const url = withToken(base, token);
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'register', publicKey: this.myPublicKey }));
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
      if ((msg.type === 'publish' || msg.type === 'presence' || msg.type === 'notify') && msg.topic === this.topic) {
        this.dispatch(msg);
      }
    };

    ws.onerror = () => {
      /* degrade silently */
    };
    ws.onclose = () => {
      /* degrade silently */
    };
  }

  private dispatch(msg: any): void {
    const data = msg.data;
    if (!data) return;
    if (msg.type === 'notify') {
      this.handlers.onNotification?.({ title: data.title || 'Company', body: data.body || '', from: msg.from });
      return;
    }
    if (msg.type === 'presence' && data.userId) {
      this.handlers.onPresence?.(data.userId, !!data.online);
      return;
    }
    if (msg.type === 'publish') {
      if (Array.isArray(data.members)) {
        this.handlers.onRoster?.(data.members as RosterMember[]);
      } else if (data.userId) {
        this.handlers.onPresence?.(data.userId, !!data.online);
      }
    }
  }

  publishRoster(members: RosterMember[]): void {
    this.send({ type: 'publish', topic: this.topic, data: { members } });
  }

  publishPresence(online: boolean): void {
    this.send({ type: 'presence', topic: this.topic, data: { userId: this.myPublicKey, online } });
  }

  notify(title: string, body: string): void {
    this.send({ type: 'notify', topic: this.topic, data: { title, body } });
  }

  private send(obj: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(obj));
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
