import type { ActiveCall } from '../../lib/call/types';
import type { CallFolder } from '../types';

export interface CallSlice {
  activeCall: ActiveCall | null;
  setActiveCall: (call: ActiveCall | null) => void;
  callHistory: Array<{ id: string; name: string; time: string; type: 'missed' | 'incoming' | 'outgoing'; duration?: string }>;
  addCallToHistory: (entry: { name: string; type: 'missed' | 'incoming' | 'outgoing'; duration?: string }) => void;
  clearCallHistory: () => void;
  callFolders: CallFolder[];
  addCallFolder: (folder: Omit<CallFolder, 'id'>) => void;
  removeCallFolder: (id: string) => void;
  setCallFolderFilter: (id: string, filter: CallFolder['filter']) => void;
  recordings: any[];
  recordingsSearchQuery: string;
  recordingsSortBy: string;
  recordingsSortOrder: string;
  addRecording: (recording: any) => void;
  deleteRecording: (id: string) => void;
  toggleFavorite: (id: string) => void;
}

export const createCallSlice = (set: any, get: any): CallSlice => ({
  activeCall: null,
  setActiveCall: (call) => set({ activeCall: call }),
  callHistory: [],
  addCallToHistory: (entry) => set((state: any) => ({
    callHistory: [{ id: String(Date.now()), time: new Date().toLocaleTimeString(), ...entry }, ...state.callHistory]
  })),
  clearCallHistory: () => set({ callHistory: [] }),
  callFolders: [
    { id: 'all', name: 'All', filter: 'all' },
    { id: 'recent', name: 'Recent', filter: 'all' },
    { id: 'missed', name: 'Missed', filter: 'missed' },
  ],
  addCallFolder: (folder) => set((state: any) => ({
    callFolders: [...state.callFolders, { ...folder, id: `folder_${Date.now()}` }]
  })),
  removeCallFolder: (id) => set((state: any) => ({
    callFolders: state.callFolders.filter((f: CallFolder) => f.id !== id)
  })),
  setCallFolderFilter: (id, filter) => set((state: any) => ({
    callFolders: state.callFolders.map((f: CallFolder) => f.id === id ? { ...f, filter } : f)
  })),
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
