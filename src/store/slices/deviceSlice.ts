import type { StateCreator } from 'zustand';
import type { AppState } from '../index';
import type { DeviceInfo, SessionData } from '../types';

export interface DeviceSlice {
  devices: DeviceInfo[];
  currentSession: SessionData;
  addDevice: (device: DeviceInfo) => void;
  removeDevice: (id: string) => void;
}

export const createDeviceSlice: StateCreator<AppState, [], [], DeviceSlice> = (set) => ({
  devices: [{ id: 'current-device', name: 'This Device', platform: 'web', lastActive: Date.now(), isCurrent: true }],
  currentSession: { deviceId: 'current-device', startTime: Date.now(), isActive: true },
  addDevice: (device) => set((state) => ({ devices: [...state.devices, device] })),
  removeDevice: (id) => set((state) => ({
    devices: state.devices.filter(d => d.id !== id)
  })),
});
