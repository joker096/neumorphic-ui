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
}

export const createConnectionSlice = (set: any, get: any): ConnectionSlice => ({
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
});
