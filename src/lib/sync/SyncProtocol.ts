import * as idb from 'idb-keyval';

interface SyncableState {
  chats: any[];
  channels: any[];
  contacts: any[];
  settings: Record<string, any>;
  timestamp: number;
}

interface SyncDelta {
  key: string;
  value: any;
  timestamp: number;
  deviceId: string;
}

const SYNC_STORE = 'mess-anger-sync-state';
const DELTA_STORE = 'mess-anger-sync-deltas';

export class SyncProtocol {
  private deviceId: string | null = null;
  private pendingDeltas: SyncDelta[] = [];
  private onSyncHandlers: Set<(deltas: SyncDelta[]) => void> = new Set();

  init(deviceId: string) {
    this.deviceId = deviceId;
    this.loadPending().catch(() => {});
  }

  private async loadPending() {
    try {
      const stored = await idb.get(DELTA_STORE);
      if (Array.isArray(stored)) this.pendingDeltas = stored;
    } catch { /* ignore */ }
  }

  private async persistPending() {
    try {
      await idb.set(DELTA_STORE, this.pendingDeltas.slice(-100));
    } catch { /* ignore */ }
  }

  trackChange(key: string, value: any) {
    if (!this.deviceId) return;
    const delta: SyncDelta = {
      key, value, timestamp: Date.now(), deviceId: this.deviceId,
    };
    this.pendingDeltas.push(delta);
    this.persistPending();
    this.onSyncHandlers.forEach(h => h([delta]));
  }

  async getSnapshot(): Promise<SyncableState> {
    try {
      const stored = await idb.get(SYNC_STORE);
      return stored || { chats: [], channels: [], contacts: [], settings: {}, timestamp: 0 };
    } catch {
      return { chats: [], channels: [], contacts: [], settings: {}, timestamp: 0 };
    }
  }

  async applyDelta(delta: SyncDelta): Promise<boolean> {
    if (delta.deviceId === this.deviceId) return false; // own delta, skip
    try {
      const snapshot = await this.getSnapshot();
      if (delta.timestamp <= snapshot.timestamp) return false; // stale
      (snapshot as any)[delta.key] = delta.value;
      snapshot.timestamp = delta.timestamp;
      await idb.set(SYNC_STORE, snapshot);
      return true;
    } catch { return false; }
  }

  getPendingDeltas(): SyncDelta[] {
    return [...this.pendingDeltas];
  }

  async clearPending(untilTimestamp: number) {
    this.pendingDeltas = this.pendingDeltas.filter(d => d.timestamp > untilTimestamp);
    await this.persistPending();
  }

  onSync(handler: (deltas: SyncDelta[]) => void) {
    this.onSyncHandlers.add(handler);
    return () => this.onSyncHandlers.delete(handler);
  }

  serializeDelta(delta: SyncDelta): string {
    return JSON.stringify(delta);
  }

  deserializeDelta(data: string): SyncDelta | null {
    try { return JSON.parse(data); } catch { return null; }
  }

  resolveConflicts(local: any[], remote: any[], key: string): any[] {
    const merged = new Map();
    for (const item of [...local, ...remote]) {
      const id = item.id ?? item[key];
      if (!merged.has(id) || (item.timestamp || 0) > (merged.get(id)?.timestamp || 0)) {
        merged.set(id, item);
      }
    }
    return Array.from(merged.values());
  }
}
