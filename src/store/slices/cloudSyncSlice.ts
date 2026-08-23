import type { CloudSyncState } from '../types';
import { loadCloudSyncMeta, saveCloudSyncMeta, saveCloudSyncSnapshot } from '../../lib/cloudSync';

export interface CloudSyncSlice {
  cloudSync: CloudSyncState;
  setCloudSyncEnabled: (enabled: boolean) => void;
  updateCloudSyncStatus: (status: Partial<CloudSyncState>) => void;
  markCloudSyncPendingChange: () => void;
  triggerCloudSync: () => Promise<void>;
}

const persistMeta = (meta: CloudSyncState): void => {
  void saveCloudSyncMeta(meta);
};

export const createCloudSyncSlice = (set: any, get: any): CloudSyncSlice => ({
  cloudSync: { enabled: false, lastSync: null, pendingChanges: 0, status: 'idle' as const, errorMessage: null, provider: 'local' as const },

  setCloudSyncEnabled: (enabled) => {
    const next: CloudSyncState = { ...get().cloudSync, enabled };
    set({ cloudSync: next });
    persistMeta(next);
    if (enabled) void get().triggerCloudSync();
  },

  updateCloudSyncStatus: (status) => {
    const next: CloudSyncState = { ...get().cloudSync, ...status };
    set({ cloudSync: next });
    persistMeta(next);
  },

  markCloudSyncPendingChange: () => {
    const cs = get().cloudSync;
    if (!cs.enabled) return;
    set({ cloudSync: { ...cs, pendingChanges: cs.pendingChanges + 1 } });
  },

  triggerCloudSync: async () => {
    set({ cloudSync: { ...get().cloudSync, status: 'syncing' as const, errorMessage: null } });
    try {
      const s = get();
      await saveCloudSyncSnapshot({
        chats: s.chats,
        contacts: s.contacts,
        channels: s.channels,
        callHistory: s.callHistory,
      });
      const next: CloudSyncState = {
        ...get().cloudSync,
        status: 'success' as const,
        lastSync: Date.now(),
        pendingChanges: 0,
        errorMessage: null,
      };
      set({ cloudSync: next });
      persistMeta(next);
    } catch (error: any) {
      const next: CloudSyncState = { ...get().cloudSync, status: 'error' as const, errorMessage: error?.message || 'Sync failed' };
      set({ cloudSync: next });
      persistMeta(next);
    }
  },
});

export { loadCloudSyncMeta };
