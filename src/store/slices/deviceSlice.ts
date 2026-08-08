import type { DeviceInfo, SessionData } from '../types';

export interface DeviceSlice {
  devices: DeviceInfo[];
  currentSession: SessionData;
  addDevice: (device: DeviceInfo) => void;
  removeDevice: (id: string) => void;
}

export const createDeviceSlice = (set: any, get: any): DeviceSlice => ({
  devices: [{ id: 'current-device', name: 'This Device', platform: 'web', lastActive: Date.now(), isCurrent: true }],
  currentSession: { deviceId: 'current-device', startTime: Date.now(), isActive: true },
  addDevice: (device) => set((state: any) => ({ devices: [...state.devices, device] })),
  removeDevice: (id) => set((state: any) => ({
    devices: state.devices.filter((d: any) => d.id !== id)
  })),
});
