import { createWsTunnel, WsTunnel } from '../transport/wsTunnel';
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

  constructor(seedUrls: string[]) {
    this.pool = new SignallingPool(seedUrls);
  }

  getState(): MgrState { return this.state; }
  getLatency(): number { return this.latencyMs; }
  getPool(): SignallingPool { return this.pool; }

  setState(s: MgrState): void {
    this.state = s;
    this.stateChangeCallbacks.forEach(cb => cb(s));
  }

  async connect(): Promise<void> {
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
      this.tunnel = createWsTunnel(url, 'direct');
      await this.tunnel.connect();
      this.latencyMs = Date.now() - start;
      this.pool.markActive(url, this.latencyMs);
      this.setState('connected');

      this.tunnel.onClose(() => {
        this.setState('disconnected');
        this.pool.markFailed(url);
        this.connect();
      });
      this.tunnel.onError(() => {
        this.pool.markFailed(url);
        this.connect();
      });
    } catch {
      this.latencyMs = Date.now() - start;
      this.pool.markFailed(url);
      await this.connect();
    }
  }

  disconnect(): void {
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
