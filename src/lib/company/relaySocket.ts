/**
 * Shared relay subscription with a bounded reconnect policy (§4.2).
 *
 * Both relay consumers — the embeddable widget / Team Inbox (`RelayClient`) and
 * the company roster sync (`CompanyRosterSync`) — run the same
 * `register` → `subscribe` → `publish` protocol over the signaling relay. Before
 * this helper each one opened a socket exactly once: if the relay was briefly
 * unreachable (operator restart, flaky mobile network) the surface stayed silent
 * until the tab was reloaded, and a half-open TCP connection never surfaced as an
 * error at all. This module owns the three missing pieces:
 *
 * - **connect timeout** — a socket that never reaches OPEN is closed and counted
 *   as a failed attempt (a stalled handshake is the most common invisible hang);
 * - **bounded retry** — at most {@link RELAY_RETRY_DELAYS_MS.length} reconnects
 *   with exponential-ish backoff, then the client degrades to a no-op instead of
 *   hammering the relay forever;
 * - **stability reset** — a connection that stayed open for
 *   {@link RELAY_STABLE_RESET_MS} returns the budget to full, so a long-lived
 *   session is not left one drop away from permanent silence. A flapping socket
 *   (opens and dies immediately) therefore cannot reset its own budget.
 *
 * `publish` stays fire-and-forget like the previous inline implementations: a
 * frame sent while disconnected is dropped, callers gossip state on the next
 * tick rather than replaying history.
 */

import { withToken } from '../network/relayToken';

/** A socket that has not reached OPEN within this budget is considered dead. */
export const RELAY_CONNECT_TIMEOUT_MS = 10_000;

/** Reconnect backoff; exhausted after the last entry (no infinite retry loop). */
export const RELAY_RETRY_DELAYS_MS: readonly number[] = [1_000, 4_000, 9_000];

/** Uptime after which the reconnect budget is restored. */
export const RELAY_STABLE_RESET_MS = 60_000;

/**
 * Live state of a relay socket. Surfaced to the UI (§4.2) so a dropped relay
 * degrades *visibly* — without it the widget and Team Inbox silently swallowed
 * frames while telling the user everything was fine.
 */
export type RelayStatus = 'connecting' | 'online' | 'offline';

export interface RelaySocketOptions {
  /** Relay endpoint (without the token query param). */
  base: string;
  /** Relay JWT; an empty token degrades to a server-rejected connection. */
  token: string;
  /** Sent on every (re)open — keep it idempotent so retries resubscribe. */
  onOpen: (send: (frame: object) => void) => void;
  /** Parsed inbound frame (already JSON-decoded). */
  onMessage: (msg: any) => void;
  /** Fired only on transitions (never with the current value repeated). */
  onStatus?: (status: RelayStatus) => void;
}

export interface RelaySocket {
  /** Send a frame when the socket is OPEN; `false` when it was dropped. */
  publish: (frame: object) => boolean;
  /** Stop the socket and cancel any pending retry. */
  close: () => void;
  /** Current state, for callers that only poll (e.g. `publish` guards). */
  status: () => RelayStatus;
}

export function openRelaySocket(opts: RelaySocketOptions): RelaySocket {
  let ws: WebSocket | null = null;
  let closed = false;
  let attempts = 0;
  let openedAt = 0;
  let connectTimer: ReturnType<typeof setTimeout> | null = null;
  let stableTimer: ReturnType<typeof setTimeout> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let status: RelayStatus = 'connecting';

  const setStatus = (next: RelayStatus): void => {
    if (status === next) return;
    status = next;
    opts.onStatus?.(next);
  };

  const clearTimers = (): void => {
    if (connectTimer) clearTimeout(connectTimer);
    if (stableTimer) clearTimeout(stableTimer);
    if (retryTimer) clearTimeout(retryTimer);
    connectTimer = null;
    stableTimer = null;
    retryTimer = null;
  };

  const scheduleRetry = (): void => {
    if (closed) return;
    const delay = RELAY_RETRY_DELAYS_MS[attempts];
    if (delay === undefined) return; // budget exhausted → degrade to a no-op
    attempts += 1;
    retryTimer = setTimeout(open, delay);
  };

  const send = (frame: object): void => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify(frame));
    } catch {
      /* socket died mid-send; onclose drives the retry */
    }
  };

  const open = (): void => {
    if (closed) return;
    let socket: WebSocket;
    try {
      socket = new WebSocket(withToken(opts.base, opts.token));
    } catch {
      setStatus('offline');
      scheduleRetry();
      return;
    }
    ws = socket;
    setStatus('connecting');
    // One terminal event per attempt: whichever of {open, close, connect timeout}
    // happens first wins, so a late `onclose` after the timeout cannot queue a
    // second retry for the same attempt. `opened` is tracked separately — a
    // connection that opened *and later dropped* must still be retried.
    let opened = false;
    let finished = false;

    const finishAttempt = (): void => {
      if (finished) return;
      finished = true;
      if (ws === socket) ws = null;
      // A dropped socket is "offline" whether or not a retry still fits the
      // budget — the caller must not present queued frames as delivered.
      setStatus('offline');
      scheduleRetry();
    };

    connectTimer = setTimeout(() => {
      try {
        socket.close();
      } catch {
        /* ignore */
      }
      // Retry from the timeout itself rather than trusting the browser to emit
      // `close` for a socket that never left CONNECTING.
      finishAttempt();
    }, RELAY_CONNECT_TIMEOUT_MS);

    socket.onopen = () => {
      if (finished) return;
      if (connectTimer) clearTimeout(connectTimer);
      connectTimer = null;
      opened = true;
      openedAt = Date.now();
      setStatus('online');
      stableTimer = setTimeout(() => {
        attempts = 0;
        stableTimer = null;
      }, RELAY_STABLE_RESET_MS);
      opts.onOpen(send);
    };

    socket.onmessage = (ev: MessageEvent) => {
      let msg: any;
      try {
        msg = JSON.parse(ev.data as string);
      } catch {
        return;
      }
      opts.onMessage(msg);
    };

    socket.onerror = () => {
      /* browsers follow an error with close; the timeout covers the rest */
    };

    socket.onclose = () => {
      if (connectTimer) clearTimeout(connectTimer);
      if (stableTimer) clearTimeout(stableTimer);
      connectTimer = null;
      stableTimer = null;
      if (opened && openedAt > 0 && Date.now() - openedAt >= RELAY_STABLE_RESET_MS) attempts = 0;
      openedAt = 0;
      finishAttempt();
    };
  };

  open();

  return {
    publish: (frame: object) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      send(frame);
      return true;
    },
    close: () => {
      closed = true;
      clearTimers();
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
      ws = null;
    },
    status: () => status,
  };
}
