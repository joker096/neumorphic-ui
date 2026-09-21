import { createWsTunnel, WsTunnel, type TunnelBackend } from '../transport/wsTunnel';
import { SignallingPool } from '../network/signallingPool';

type MgrState = 'disconnected' | 'connecting' | 'connected' | 'blocked' | 'error';
type BlockedRegionEvent = { region: string; message: string };
type CloseInfo = { code: number; reason: string } | null;

/** Server-side rejection close codes / reasons we should NOT treat as a
 * transient network blip: the peer accepted the TCP/TLS/WS handshake and then
 * deliberately closed us (rate limit, origin policy, auth). Reconnecting fast
 * only burns the server's per-IP connection budget (shared VPN egress IPs
 * make this worse), so back off slowly and surface `blocked`. */
const SERVER_REJECT_CODES = new Set([1008, 1009, 4401, 4403]);
const SERVER_REJECT_REASONS = [
  /too many/i,
  /origin not allowed/i,
  /authentication required/i,
  /blocked/i,
  /rate.?limit/i,
];

function isServerReject(info: CloseInfo): boolean {
  if (!info) return false;
  if (SERVER_REJECT_CODES.has(info.code)) return true;
  return SERVER_REJECT_REASONS.some((re) => re.test(info.reason));
}

/** Fixed slow retry for server-side rejections. Keeps a single misbehaving
 * client well under any per-IP per-minute cap while not parking the transport
 * at `blocked` forever. */
const BLOCKED_RETRY_MS = 45000;

export class SignallingManager {
  private pool: SignallingPool;
  private tunnel: WsTunnel | null = null;
  private state: MgrState = 'disconnected';
  private stateChangeCallbacks: Set<(state: MgrState) => void> = new Set();
  private blockedRegionCallbacks: Set<(event: BlockedRegionEvent) => void> = new Set();
  private latencyMs: number = 0;
  private backend: TunnelBackend = 'direct';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private blockedReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastTunnelError: string | null = null;
  private disposed = false;
  private autoReconnect = true;
  private connectInFlight = false;

  constructor(seedUrls: string[], backend?: TunnelBackend, autoReconnect = true) {
    this.pool = new SignallingPool(seedUrls);
    if (backend) this.backend = backend;
    this.autoReconnect = autoReconnect;
  }

  getState(): MgrState { return this.state; }
  getLatency(): number { return this.latencyMs; }
  getPool(): SignallingPool { return this.pool; }
  getBackend(): TunnelBackend { return this.backend; }
  getLastError(): string | null { return this.lastTunnelError; }

  setBackend(backend: TunnelBackend): void {
    this.backend = backend;
  }

  setAutoReconnect(enabled: boolean): void {
    this.autoReconnect = enabled;
  }

  setState(s: MgrState): void {
    this.state = s;
    this.stateChangeCallbacks.forEach(cb => cb(s));
  }

  async connect(): Promise<void> {
    if (this.disposed) return;
    if (this.connectInFlight) return;
    if (this.state === 'connected') return;
    this.connectInFlight = true;
    this.setState('connecting');
    const url = this.pool.getNextAvailable();
    if (!url) {
      this.connectInFlight = false;
      this.setState('blocked');
      this.blockedRegionCallbacks.forEach(cb => cb({
        region: 'unknown',
        message: 'All signalling servers are blocked in your region',
      }));
      return;
    }

    const start = Date.now();
    try {
      this.tunnel = createWsTunnel(url, this.backend);
      await this.tunnel.connect();
      this.latencyMs = Date.now() - start;
      this.pool.markActive(url, this.latencyMs);
      this.setState('connected');
      this.reconnectAttempts = 0;
      this.lastTunnelError = null;

      this.tunnel.onClose((info) => {
        if (isServerReject(info)) {
          this.pool.markFailed(url);
          this.handleBlocked(info);
        } else {
          this.markTransient(url);
        }
      });
      this.tunnel.onError(() => {
        this.markTransient(url);
      });
    } catch {
      this.latencyMs = Date.now() - start;
      this.markTransient(url);
    } finally {
      this.connectInFlight = false;
    }
  }

  private markTransient(url: string): void {
    this.pool.markFailed(url);
    // A closed socket must never leave the manager in 'connected': connect()
    // early-returns on 'connected', which would dead-lock reconnection.
    if (this.state === 'connected' || this.state === 'blocked') this.setState('disconnected');
    this.scheduleReconnect();
  }

  private handleBlocked(info: CloseInfo): void {
    this.lastTunnelError = info?.reason || `Closed by server (code ${info?.code ?? 'unknown'})`;
    this.setState('blocked');
    this.clearReconnectTimers();
    if (this.disposed) return;
    if (!this.isOnline()) return;
    this.blockedReconnectTimer = setTimeout(() => {
      this.blockedReconnectTimer = null;
      this.connect().catch(() => {});
    }, BLOCKED_RETRY_MS);
  }

  private isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  }

  private clearReconnectTimers(): void {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.blockedReconnectTimer) { clearTimeout(this.blockedReconnectTimer); this.blockedReconnectTimer = null; }
  }

  private scheduleReconnect(): void {
    if (this.disposed) return;
    if (!this.autoReconnect) {
      this.setState('error');
      return;
    }
    if (this.reconnectTimer || this.blockedReconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setState('error');
      return;
    }
    if (!this.isOnline()) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => {});
    }, delay);
  }

  disconnect(): void {
    this.disposed = true;
    this.clearReconnectTimers();
    this.lastTunnelError = null;
    this.tunnel?.close();
    this.tunnel = null;
    this.setState('disconnected');
  }

  send(data: any): void { this.tunnel?.send(data); }
  onMessage(callback: (data: any) => void): () => void {
    // wsTunnel dispatches raw string payloads; app handlers (registerMainIdentity,
    // inbound offer-forward) expect parsed objects. Parse once here so both work.
    return this.tunnel?.onMessage((data) => {
      if (typeof data === 'string') {
        try {
          callback(JSON.parse(data));
          return;
        } catch {
          /* non-JSON payload: pass through raw */
        }
      }
      callback(data);
    }) ?? (() => {});
  }

  onStateChange(callback: (state: MgrState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  onBlockedRegion(callback: (event: BlockedRegionEvent) => void): () => void {
    this.blockedRegionCallbacks.add(callback);
    return () => this.blockedRegionCallbacks.delete(callback);
  }
}
