// Signaling - WebSocket signaling for P2P connections

export interface SignalingMessage {
  type: string;
  payload: any;
  timestamp: number;
}

export class SignalingClient {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessageCallback?: (msg: SignalingMessage) => void;

  constructor(url: string) {
    this.url = url;
  }

  connect(url?: string): Promise<void> {
    this.url = url || this.url;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        resolve();
      };

      this.ws.onmessage = (event) => {
        if (this.onMessageCallback) {
          this.onMessageCallback(JSON.parse(event.data));
        }
      };

      this.ws.onerror = () => {
        reject(new Error('Signaling connection failed'));
      };
    });
  }

  send(message: SignalingMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  onMessage(callback: (msg: SignalingMessage) => void): void {
    this.onMessageCallback = callback;
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const signaling = new SignalingClient('ws://localhost:3000');
