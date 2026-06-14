import { BroadcastChannelSync } from './BroadcastChannelSync';
import { SyncProtocol } from './SyncProtocol';

type StoreSetter = (state: any) => void;

export class SyncManager {
  private broadcast: BroadcastChannelSync;
  private protocol: SyncProtocol;
  private storeSet: StoreSetter | null = null;
  private cleanupFns: (() => void)[] = [];

  constructor(deviceId: string) {
    this.broadcast = new BroadcastChannelSync(deviceId);
    this.protocol = new SyncProtocol();
    this.protocol.init(deviceId);
  }

  connect(storeSet: StoreSetter) {
    this.storeSet = storeSet;
    this.broadcast.connect();

    this.cleanupFns.push(
      this.broadcast.onMessage((msg) => {
        if (msg.type === 'state-change' && msg.payload) {
          this.handleRemoteUpdate(msg.payload);
        }
      })
    );

    this.cleanupFns.push(
      this.protocol.onSync((deltas) => {
        deltas.forEach(delta => this.broadcast.broadcast('state-change', delta));
      })
    );
  }

  disconnect() {
    this.broadcast.disconnect();
    this.cleanupFns.forEach(fn => fn());
    this.cleanupFns = [];
  }

  trackChange(key: string, value: any) {
    this.protocol.trackChange(key, value);
  }

  private handleRemoteUpdate(delta: { key: string; value: any; timestamp: number }) {
    if (!this.storeSet) return;
    this.protocol.applyDelta(delta).then(applied => {
      if (applied) {
        this.storeSet({ [delta.key]: delta.value });
      }
    });
  }

  getBroadcastChannel() { return this.broadcast; }
  getProtocol() { return this.protocol; }
}
