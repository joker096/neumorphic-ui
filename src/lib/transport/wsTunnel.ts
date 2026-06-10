// WebSocket Tunnel - Tunnel WebSocket connections through an intermediary

export class WsTunnel {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessageCallback?: (data: any) => void;
  private onOpenCallback?: () => void;
  private onCloseCallback?: () => void;

  constructor(url: string) {
    this.url = url;
  }

  connect(url?: string): Promise<void> {
    this.url = url || this.url;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        if (this.onOpenCallback) {
          this.onOpenCallback();
        }
        resolve();
      };

      this.ws.onmessage = (event) => {
        if (this.onMessageCallback) {
          this.onMessageCallback(JSON.parse(event.data));
        }
      };

      this.ws.onclose = () => {
        if (this.onCloseCallback) {
          this.onCloseCallback();
        }
      };

      this.ws.onerror = () => {
        reject(new Error('WebSocket connection failed'));
      };
    });
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  onMessage(callback: (data: any) => void): void {
    this.onMessageCallback = callback;
  }

  onOpen(callback: () => void): void {
    this.onOpenCallback = callback;
  }

  onClose(callback: () => void): void {
    this.onCloseCallback = callback;
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export function createWsTunnel(url: string): WsTunnel {
  return new WsTunnel(url);
}
