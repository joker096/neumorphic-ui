import type { StateCreator } from 'zustand';
import type { AppState } from '../index';
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
}

export const createCallSlice: StateCreator<AppState, [], [], CallSlice> = (set) => ({
  activeCall: null,
  setActiveCall: (call) => set({ activeCall: call }),
  callHistory: [],
  addCallToHistory: (entry) => set((state) => ({
    callHistory: [{ id: String(Date.now()), time: new Date().toLocaleTimeString(), ...entry }, ...state.callHistory]
  })),
  clearCallHistory: () => set({ callHistory: [] }),
  callFolders: [
    { id: 'all', name: 'All', filter: 'all' },
    { id: 'recent', name: 'Recent', filter: 'all' },
    { id: 'missed', name: 'Missed', filter: 'missed' },
  ],
  addCallFolder: (folder) => set((state) => ({
    callFolders: [...state.callFolders, { ...folder, id: `folder_${Date.now()}` }]
  })),
  removeCallFolder: (id) => set((state) => ({
    callFolders: state.callFolders.filter(f => f.id !== id)
  })),
  setCallFolderFilter: (id, filter) => set((state) => ({
    callFolders: state.callFolders.map(f => f.id === id ? { ...f, filter } : f)
  })),
});
