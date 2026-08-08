import type { LocationShare } from '../types';

export interface LocationSlice {
  locationShares: LocationShare[];
  addLocationShare: (share: LocationShare) => void;
  removeLocationShare: (id: string) => void;
  updateLocationShare: (id: string, updates: Partial<LocationShare>) => void;
  startLiveLocation: (chatId: string | number, durationMinutes: number) => void;
  stopLiveLocation: (chatId: string | number) => void;
}

export const createLocationSlice = (set: any, get: any): LocationSlice => ({
  locationShares: [],
  addLocationShare: (share) => set((state: any) => ({ locationShares: [...state.locationShares, share] })),
  removeLocationShare: (id) => set((state: any) => ({ locationShares: state.locationShares.filter((s: any) => s.id !== id) })),
  updateLocationShare: (id, updates) => set((state: any) => ({
    locationShares: state.locationShares.map((s: any) => s.id === id ? { ...s, ...updates } : s)
  })),
  startLiveLocation: (chatId, durationMinutes) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const share: LocationShare = {
        id: `loc_${Date.now()}`, chatId, userId: 'current-user',
        latitude: position.coords.latitude, longitude: position.coords.longitude,
        accuracy: position.coords.accuracy, timestamp: Date.now(),
        expiresAt: Date.now() + durationMinutes * 60 * 1000, isLive: true
      };
      set((state: any) => ({ locationShares: [...state.locationShares, share] }));
      const watchId = navigator.geolocation.watchPosition((pos) => {
        set((state: any) => ({
          locationShares: state.locationShares.map((s: any) =>
            s.id === share.id ? {
              ...s, latitude: pos.coords.latitude, longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy, timestamp: Date.now()
            } : s
          )
        }));
      });
      setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
        set((state: any) => ({
          locationShares: state.locationShares.map((s: any) =>
            s.id === share.id && s.isLive ? { ...s, isLive: false } : s
          )
        }));
      }, durationMinutes * 60 * 1000);
    });
  },
  stopLiveLocation: (chatId) => set((state: any) => ({
    locationShares: state.locationShares.map((s: any) => s.chatId === chatId && s.isLive ? { ...s, isLive: false } : s)
  })),
});
