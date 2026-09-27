import type { ActiveCall, IncomingCall } from '../../lib/call/types';

export type CallHistoryType = 'missed' | 'incoming' | 'outgoing' | 'declined';

export interface CallHistoryEntry {
  id: string;
  name: string;
  /**
   * Legacy display string produced by an older build (host-runtime locale).
   * Kept for entries already persisted in IDB / backups; new rows carry `at`
   * and the call log formats that with the selected UI language.
   */
  time?: string;
  /** Epoch ms of the call — rendered through `formatTime(value, lang)`. */
  at?: number;
  type: CallHistoryType;
  duration?: string;
  recordingId?: string;
}

export interface CallSlice {
  activeCall: ActiveCall | null;
  setActiveCall: (call: ActiveCall | null) => void;
  callMinimized: boolean;
  setCallMinimized: (minimized: boolean) => void;
  incomingCall: IncomingCall | null;
  setIncomingCall: (call: IncomingCall | null) => void;
  callHistory: CallHistoryEntry[];
  setCallHistory: (updater: CallHistoryEntry[] | ((prev: CallHistoryEntry[]) => CallHistoryEntry[])) => void;
  addCallToHistory: (entry: { name: string; type: CallHistoryType; duration?: string; recordingId?: string }) => void;
  clearCallHistory: () => void;
  recordings: any[];
  setRecordings: (list: any[]) => void;
  recordingsSearchQuery: string;
  recordingsSortBy: string;
  recordingsSortOrder: string;
  addRecording: (recording: any) => void;
  deleteRecording: (id: string) => void;
  toggleFavorite: (id: string) => void;
}

export const createCallSlice = (set: any, get: any): CallSlice => ({
  activeCall: null,
  setActiveCall: (call) => set({ activeCall: call, callMinimized: false }),
  callMinimized: false,
  setCallMinimized: (minimized) => set({ callMinimized: minimized }),
  incomingCall: null,
  setIncomingCall: (call) => set({ incomingCall: call }),
  callHistory: [],
  setCallHistory: (updater) => set((state: any) => ({
    callHistory: typeof updater === 'function' ? updater(state.callHistory) : updater
  })),
  addCallToHistory: (entry) => set((state: any) => ({
    callHistory: [{ id: String(Date.now()), at: Date.now(), ...entry }, ...state.callHistory]
  })),
  clearCallHistory: () => set({ callHistory: [] }),
  recordings: [],
  setRecordings: (list) => set({ recordings: list }),
  recordingsSearchQuery: '',
  recordingsSortBy: 'date',
  recordingsSortOrder: 'desc',
  addRecording: (recording) => set((state: any) => ({ recordings: [recording, ...state.recordings] })),
  deleteRecording: (id) => set((state: any) => ({ recordings: state.recordings.filter((r: any) => r.id !== id) })),
  toggleFavorite: (id) => set((state: any) => ({
    recordings: state.recordings.map((r: any) => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r)
  })),
});
