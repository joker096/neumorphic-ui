import type { StateCreator } from 'zustand';
import type { AppState } from '../index';
import type { ConnectionState } from '../types';

export interface ConnectionSlice {
  connectionStatus: ConnectionState['connectionStatus'];
  transportBackend: string;
  selectedBackend: string;
  latencyMs: number;
  blockedBackends: string[];
  regionBlocked: boolean;
  setConnectionStatus: (status: ConnectionState['connectionStatus']) => void;
  setTransportBackend: (backend: string) => void;
  setLatency: (ms: number) => void;
  setBlockedBackends: (backends: string[]) => void;
  setRegionBlocked: (blocked: boolean) => void;
  syncStatus: 'idle' | 'requesting' | 'syncing' | 'live' | 'error';
  syncLastTimestamp: string;
  totpSecret: string;
  pairingQrData: string;
  setSyncStatus: (status: AppState['syncStatus']) => void;
  setSyncLastTimestamp: (ts: string) => void;
  setTotpSecret: (secret: string) => void;
  setPairingQrData: (data: string) => void;
}

export const createConnectionSlice: StateCreator<AppState, [], [], ConnectionSlice> = (set) => ({
  connectionStatus: 'disconnected',
  transportBackend: 'direct',
  selectedBackend: '',
  latencyMs: 0,
  blockedBackends: [],
  regionBlocked: false,
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setTransportBackend: (backend) => set({ transportBackend: backend }),
  setLatency: (ms) => set({ latencyMs: ms }),
  setBlockedBackends: (backends) => set({ blockedBackends: backends }),
  setRegionBlocked: (blocked) => set({ regionBlocked: blocked }),
  syncStatus: 'idle' as const,
  syncLastTimestamp: '',
  totpSecret: '',
  pairingQrData: '',
  setSyncStatus: (status) => set({ syncStatus: status }),
  setSyncLastTimestamp: (ts) => set({ syncLastTimestamp: ts }),
  setTotpSecret: (secret) => set({ totpSecret: secret }),
  setPairingQrData: (data) => set({ pairingQrData: data }),
});
