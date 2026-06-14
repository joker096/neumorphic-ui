const CHANNEL_NAME = 'mess-anger-sync';

interface SyncMessage {
  type: 'state-change' | 'device-joined' | 'device-left' | 'ping' | 'pong';
  payload?: any;
  deviceId: string;
  timestamp: number;
}

type SyncHandler = (msg: SyncMessage) => void;

export class BroadcastChannelSync {
  private channel: BroadcastChannel | null = null;
  private handlers: Set<SyncHandler> = new Set();
  private deviceId: string;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
  }

  connect() {
    if (this.channel) return;
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        const msg = event.data as SyncMessage;
        if (msg.deviceId === this.deviceId) return; // ignore own messages
        this.handlers.forEach(h => h(msg));
      };
      this.announce('device-joined');
      this.startPing();
    } catch (err) {
      console.warn('[BroadcastChannelSync] Not available:', err);
    }
  }

  disconnect() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.channel) {
      this.announce('device-left');
      this.channel.close();
      this.channel = null;
    }
  }

  private announce(type: 'device-joined' | 'device-left') {
    this.post({ type, deviceId: this.deviceId, timestamp: Date.now() });
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      this.post({ type: 'ping', deviceId: this.deviceId, timestamp: Date.now() });
    }, 30000);
  }

  private post(msg: SyncMessage) {
    if (this.channel) {
      try { this.channel.postMessage(msg); } catch { /* ignore */ }
    }
  }

  broadcast(type: SyncMessage['type'], payload?: any) {
    this.post({ type, payload, deviceId: this.deviceId, timestamp: Date.now() });
  }

  onMessage(handler: SyncHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  getChannel(): BroadcastChannel | null { return this.channel; }
}
