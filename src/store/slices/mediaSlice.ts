import type { StateCreator } from 'zustand';
import type { AppState } from '../index';

export interface MediaSlice {
  cloudSync: {
    enabled: boolean;
    lastSync: number | null;
    pendingChanges: number;
    status: 'idle' | 'syncing' | 'error' | 'success';
    errorMessage: string | null;
    provider: 'local' | 'firebase' | 'supabase' | 'custom';
  };
  setCloudSyncEnabled: (enabled: boolean) => void;
  updateCloudSyncStatus: (status: Partial<AppState['cloudSync']>) => void;
  triggerCloudSync: () => Promise<void>;
  recordings: any[];
  recordingsSearchQuery: string;
  recordingsSortBy: string;
  recordingsSortOrder: string;
  addRecording: (recording: any) => void;
  deleteRecording: (id: string) => void;
  toggleFavorite: (id: string) => void;
}

export const createMediaSlice: StateCreator<AppState, [], [], MediaSlice> = (set) => ({
  cloudSync: { enabled: false, lastSync: null, pendingChanges: 0, status: 'idle' as const, errorMessage: null, provider: 'local' as const },
  setCloudSyncEnabled: (enabled) => set((state) => ({ cloudSync: { ...state.cloudSync, enabled } })),
  updateCloudSyncStatus: (status) => set((state) => ({ cloudSync: { ...state.cloudSync, ...status } })),
  triggerCloudSync: async () => {
    set((state) => ({ cloudSync: { ...state.cloudSync, status: 'syncing' as const, errorMessage: null } }));
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      set((state) => ({ cloudSync: { ...state.cloudSync, status: 'success' as const, lastSync: Date.now(), pendingChanges: 0 } }));
    } catch (error: any) {
      set((state) => ({ cloudSync: { ...state.cloudSync, status: 'error' as const, errorMessage: error.message || 'Sync failed' } }));
    }
  },
  recordings: [],
  recordingsSearchQuery: '',
  recordingsSortBy: 'date',
  recordingsSortOrder: 'desc',
  addRecording: (recording) => set((state: any) => ({ recordings: [recording, ...state.recordings] })),
  deleteRecording: (id) => set((state: any) => ({ recordings: state.recordings.filter((r: any) => r.id !== id) })),
  toggleFavorite: (id) => set((state: any) => ({
    recordings: state.recordings.map((r: any) => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r)
  })),
});
