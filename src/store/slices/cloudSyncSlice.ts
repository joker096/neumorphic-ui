import type { CloudSyncState } from '../types';

export interface CloudSyncSlice {
  cloudSync: CloudSyncState;
  setCloudSyncEnabled: (enabled: boolean) => void;
  updateCloudSyncStatus: (status: Partial<CloudSyncState>) => void;
  triggerCloudSync: () => Promise<void>;
}

export const createCloudSyncSlice = (set: any, get: any): CloudSyncSlice => ({
  cloudSync: { enabled: false, lastSync: null, pendingChanges: 0, status: 'idle' as const, errorMessage: null, provider: 'local' as const },
  setCloudSyncEnabled: (enabled) => set((state: any) => ({ cloudSync: { ...state.cloudSync, enabled } })),
  updateCloudSyncStatus: (status) => set((state: any) => ({ cloudSync: { ...state.cloudSync, ...status } })),
  triggerCloudSync: async () => {
    set((state: any) => ({ cloudSync: { ...state.cloudSync, status: 'syncing' as const, errorMessage: null } }));
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      set((state: any) => ({ cloudSync: { ...state.cloudSync, status: 'success' as const, lastSync: Date.now(), pendingChanges: 0 } }));
    } catch (error: any) {
      set((state: any) => ({ cloudSync: { ...state.cloudSync, status: 'error' as const, errorMessage: error.message || 'Sync failed' } }));
    }
  },
});
