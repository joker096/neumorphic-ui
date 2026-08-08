export interface SyncSlice {
  syncStatus: 'idle' | 'requesting' | 'syncing' | 'live' | 'error';
  syncLastTimestamp: string;
  totpSecret: string;
  pairingQrData: string;
  setSyncStatus: (status: 'idle' | 'requesting' | 'syncing' | 'live' | 'error') => void;
  setSyncLastTimestamp: (ts: string) => void;
  setTotpSecret: (secret: string) => void;
  setPairingQrData: (data: string) => void;
}

export const createSyncSlice = (set: any, get: any): SyncSlice => ({
  syncStatus: 'idle',
  syncLastTimestamp: '',
  totpSecret: '',
  pairingQrData: '',
  setSyncStatus: (status) => set({ syncStatus: status }),
  setSyncLastTimestamp: (ts) => set({ syncLastTimestamp: ts }),
  setTotpSecret: (secret) => set({ totpSecret: secret }),
  setPairingQrData: (data) => set({ pairingQrData: data }),
});
