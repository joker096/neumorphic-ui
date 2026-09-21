export type TunnelBackend = 'direct' | 'cfworker' | 'domainfront' | 'peertunnel';
import { getRelayToken, withToken } from '../network/relayToken';
type TunnelStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

const HEARTBEAT_INTERVAL_MS = 30000;
const HEARTBEAT_TIMEOUT_MS = 45000;

interface TunnelConfig {
  url: string;
  backend: TunnelBackend;
  frontDomain?: string;
}

export class WsTunnel {
  private ws: WebSocket | null = null;
  private url: string;
  private backend: TunnelBackend;
  private frontDomain: string;
  private status: TunnelStatus = 'disconnected';
  private onMessageCallbacks: Set<(data: any) => void> = new Set();
  private onOpenCallback?: () => void;
  private onCloseCallback?: (info: { code: number; reason: string } | null) => void;
  private onErrorCallback?: (err: Error) => void;
  private originalUrl: string;
  private aborted = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastPongAt: number = 0;
  private lastClose: { code: number; reason: string } | null = null;

  constructor(config: TunnelConfig) {
    this.originalUrl = config.url;
    this.url = config.url;
    this.backend = config.backend;
    this.frontDomain = config.frontDomain || '';
    if (this.backend === 'cfworker') {
      this.url = this.formatRelayUrl(config.url);
    }
  }

  formatRelayUrl(baseUrl: string): string {
    // Seeds are absolute (`wss://host/ws`) and bare hosts are still accepted;
    // only the latter need the protocol + path reconstructed.
    if (!/^(?:https?|wss?):\/\//i.test(baseUrl)) {
      const pathMatch = this.originalUrl.match(/\/\/[^/]+(\/.*)/);
      const path = pathMatch ? pathMatch[1] : '';
      baseUrl = `wss://${baseUrl}${path}`;
    }
    const wsUrl = baseUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
    return `${wsUrl}?transport=${this.backend}&_=${Date.now()}`;
  }

  getBackend(): TunnelBackend { return this.backend; }
  getStatus(): TunnelStatus { return this.status; }
  setUrl(url: string): void { this.url = url; }

  /**
   * The server-issued close code/reason from the last `onclose` event (if any).
   * Handshake-phase failures (TCP / TLS / HTTP upgrade) surface as close 1006
   * with an empty reason in browsers; application-level rejections reach the
   * client as a real close frame (e.g. 1008 "Too many connections" / "Origin
   * not allowed" / "Authentication required").
   */
  getLastClose(): { code: number; reason: string } | null { return this.lastClose; }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastPongAt = Date.now();
    this.heartbeatTimer = setInterval(() => {
      if (this.status !== 'connected' || !this.ws) return;
      const elapsed = Date.now() - this.lastPongAt;
      if (elapsed > HEARTBEAT_TIMEOUT_MS) {
        this.ws.close();
        return;
      }
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  connect(url?: string): Promise<void> {
    this.url = url || this.url;
    this.status = 'connecting';
    this.aborted = false;
    const timeoutMs = 10000;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.aborted = true;
        if (this.ws) {
          if (this.ws.readyState === WebSocket.OPEN) this.ws.close();
          this.ws = null;
        }
        this.status = 'error';
        reject(new Error(`WebSocket connect timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      const open = (finalUrl: string) => {
        if (this.aborted) return;
        try {
          this.ws = new WebSocket(finalUrl);
        } catch (err) {
          clearTimeout(timer);
          this.status = 'error';
          reject(err);
          return;
        }
        const done = (fn: () => void) => () => { clearTimeout(timer); fn(); };
        this.ws.onopen = done(() => {
          if (this.aborted) return;
          this.status = 'connected';
          this.startHeartbeat();
          if (this.onOpenCallback) this.onOpenCallback();
          resolve();
        });
        this.ws.onmessage = (event) => {
          if (typeof event.data === 'string' && event.data.startsWith('{')) {
            try {
              const parsed = JSON.parse(event.data) as { type?: string };
              if (parsed?.type === 'pong') {
                this.lastPongAt = Date.now();
                return;
              }
            } catch {
              /* fall through and dispatch raw payload */
            }
          }
          this.onMessageCallbacks.forEach((cb) => cb(event.data));
        };
        this.ws.onclose = (event) => {
          clearTimeout(timer);
          if (this.aborted) return;
          this.lastClose = {
            code: event?.code ?? 1006,
            reason: event?.reason || '',
          };
          this.stopHeartbeat();
          this.status = 'disconnected';
          if (this.onCloseCallback) this.onCloseCallback(this.lastClose);
        };
        this.ws.onerror = done(() => {
          if (this.aborted) return;
          this.stopHeartbeat();
          this.status = 'error';
          const err = new Error(`WebSocket connection failed for backend: ${this.backend}`);
          if (this.onErrorCallback) this.onErrorCallback(err);
          reject(err);
        });
      };
      // The relay requires a JWT in ?token=; fetch one (cached) and append it.
      getRelayToken().then((t) => open(withToken(this.url, t))).catch(() => open(this.url));
    });
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }

  onMessage(callback: (data: any) => void): () => void {
    this.onMessageCallbacks.add(callback);
    return () => this.onMessageCallbacks.delete(callback);
  }
  onOpen(callback: () => void): void { this.onOpenCallback = callback; }
  onClose(callback: (info: { code: number; reason: string } | null) => void): void { this.onCloseCallback = callback; }
  onError(callback: (err: Error) => void): void { this.onErrorCallback = callback; }

  close(): void {
    this.stopHeartbeat();
    if (this.aborted) return;
    this.aborted = true;
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) this.ws.close();
      this.ws = null;
    }
    this.status = 'disconnected';
  }
}

export function createWsTunnel(url: string, backend: TunnelBackend = 'direct', frontDomain?: string): WsTunnel {
  return new WsTunnel({ url, backend, frontDomain });
}
