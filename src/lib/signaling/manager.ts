import { createWsTunnel, WsTunnel, type TunnelBackend } from '../transport/wsTunnel';
import { SignallingPool } from '../network/signallingPool';

type MgrState = 'disconnected' | 'connecting' | 'connected' | 'blocked' | 'error';
type BlockedRegionEvent = { region: string; message: string };

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
  private disposed = false;
  private autoReconnect = true;

  constructor(seedUrls: string[], backend?: TunnelBackend, autoReconnect = true) {
    this.pool = new SignallingPool(seedUrls);
    if (backend) this.backend = backend;
    this.autoReconnect = autoReconnect;
  }

  getState(): MgrState { return this.state; }
  getLatency(): number { return this.latencyMs; }
  getPool(): SignallingPool { return this.pool; }
  getBackend(): TunnelBackend { return this.backend; }

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
    this.setState('connecting');
    const url = this.pool.getNextAvailable();
    if (!url) {
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

      this.tunnel.onClose(() => {
        this.pool.markFailed(url);
        this.scheduleReconnect();
      });
      this.tunnel.onError(() => {
        this.pool.markFailed(url);
        this.scheduleReconnect();
      });
    } catch {
      this.latencyMs = Date.now() - start;
      this.pool.markFailed(url);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.disposed) return;
    if (!this.autoReconnect) {
      this.setState('error');
      return;
    }
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setState('error');
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    this.reconnectTimer = setTimeout(() => {
      if (!this.disposed) this.connect();
    }, delay);
  }

  disconnect(): void {
    this.disposed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.tunnel?.close();
    this.tunnel = null;
    this.setState('disconnected');
  }

  send(data: any): void { this.tunnel?.send(data); }
  onMessage(callback: (data: any) => void): void { this.tunnel?.onMessage(callback); }

  onStateChange(callback: (state: MgrState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  onBlockedRegion(callback: (event: BlockedRegionEvent) => void): () => void {
    this.blockedRegionCallbacks.add(callback);
    return () => this.blockedRegionCallbacks.delete(callback);
  }
}
