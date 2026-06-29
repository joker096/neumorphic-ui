export type TunnelBackend = 'direct' | 'cfworker' | 'domainfront' | 'peertunnel';
type TunnelStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

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
  private onMessageCallback?: (data: any) => void;
  private onOpenCallback?: () => void;
  private onCloseCallback?: () => void;
  private onErrorCallback?: (err: Error) => void;
  private originalUrl: string;

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
    if (!/^https?:\/\//i.test(baseUrl)) {
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

  connect(url?: string): Promise<void> {
    this.url = url || this.url;
    this.status = 'connecting';
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
      } catch (err) {
        this.status = 'error';
        reject(err);
        return;
      }
      this.ws.onopen = () => {
        this.status = 'connected';
        if (this.onOpenCallback) this.onOpenCallback();
        resolve();
      };
      this.ws.onmessage = (event) => {
        if (this.onMessageCallback) this.onMessageCallback(event.data);
      };
      this.ws.onclose = () => {
        this.status = 'disconnected';
        if (this.onCloseCallback) this.onCloseCallback();
      };
      this.ws.onerror = () => {
        this.status = 'error';
        const err = new Error(`WebSocket connection failed for backend: ${this.backend}`);
        if (this.onErrorCallback) this.onErrorCallback(err);
        reject(err);
      };
    });
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }

  onMessage(callback: (data: any) => void): void { this.onMessageCallback = callback; }
  onOpen(callback: () => void): void { this.onOpenCallback = callback; }
  onClose(callback: () => void): void { this.onCloseCallback = callback; }
  onError(callback: (err: Error) => void): void { this.onErrorCallback = callback; }

  close(): void {
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.status = 'disconnected';
  }
}

export function createWsTunnel(url: string, backend: TunnelBackend = 'direct', frontDomain?: string): WsTunnel {
  return new WsTunnel({ url, backend, frontDomain });
}
