import type { StateCreator } from 'zustand';
import type { AppState } from '../index';

const PRIVACY_STORAGE_KEY = 'mess_privacy_settings_v2';
const PRIVACY_PERSISTED_FIELDS = [
  'stealthMode', 'ghostViewMode', 'readReceipts', 'typingIndicators',
  'deliveryReceipts', 'onlineStatus', 'forwardAnonymization',
  'allowForwarding', 'allowMetadata', 'forwardCountLimit', 'anonymousMode',
  'soundEnabled', 'soundVolume', 'currentLanguage',
] as const;

const savedPrivacySettings = (() => {
  try {
    const raw = localStorage.getItem(PRIVACY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
})();

export interface SettingsSlice {
  appLockHashedPIN: string | null;
  appLockSalt: string | null;
  turnServerUrl: string;
  turnServerUser: string;
  turnServerPass: string;
  anonymousMode: boolean;
  ghostViewMode: boolean;
  readReceipts: boolean;
  typingIndicators: boolean;
  stealthMode: boolean;
  deliveryReceipts: boolean;
  onlineStatus: boolean;
  forwardAnonymization: boolean;
  currentLanguage: string;
  soundEnabled: boolean;
  soundVolume: number;
  radialDnd: boolean;
  radialProxy: boolean;
  radialEnergy: boolean;
  allowForwarding: boolean;
  allowMetadata: boolean;
  forwardCountLimit: number;
  contactReadReceipts: Record<string, boolean>;
  toggleContactReadReceipt: (chatId: string | number, enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setRadialDnd: (dnd: boolean) => void;
  setRadialProxy: (proxy: boolean) => void;
  setRadialEnergy: (energy: boolean) => void;
  setAppLock: (hash: string, salt: string) => void;
  updateSettings: (settings: Partial<AppState>) => void;
  riskShellActive: boolean;
  setRiskShellActive: (active: boolean) => void;
  shareRecording: boolean;
  setShareRecording: (enabled: boolean) => void;
  adminPausedAt: number | null;
  setAdminPausedAt: (ts: number | null) => void;
}

export const createSettingsSlice: StateCreator<AppState, [], [], SettingsSlice> = (set) => ({
  appLockHashedPIN: null,
  appLockSalt: null,
  turnServerUrl: '',
  turnServerUser: '',
  turnServerPass: '',
  anonymousMode: savedPrivacySettings.anonymousMode ?? false,
  ghostViewMode: savedPrivacySettings.ghostViewMode ?? false,
  readReceipts: savedPrivacySettings.readReceipts ?? true,
  typingIndicators: savedPrivacySettings.typingIndicators ?? true,
  stealthMode: savedPrivacySettings.stealthMode ?? false,
  deliveryReceipts: savedPrivacySettings.deliveryReceipts ?? true,
  onlineStatus: savedPrivacySettings.onlineStatus ?? true,
  forwardAnonymization: savedPrivacySettings.forwardAnonymization ?? false,
  currentLanguage: savedPrivacySettings.currentLanguage ?? 'en',
  soundEnabled: savedPrivacySettings.soundEnabled ?? true,
  soundVolume: savedPrivacySettings.soundVolume ?? 0.7,
  radialDnd: false,
  radialProxy: true,
  radialEnergy: false,
  allowForwarding: true,
  allowMetadata: true,
  forwardCountLimit: 3,
  contactReadReceipts: {},
  toggleContactReadReceipt: (chatId, enabled) => set((state) => ({
    contactReadReceipts: { ...state.contactReadReceipts, [String(chatId)]: enabled }
  })),
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setSoundVolume: (volume) => set({ soundVolume: volume }),
  setRadialDnd: (dnd) => set({ radialDnd: dnd }),
  setRadialProxy: (proxy) => set({ radialProxy: proxy }),
  setRadialEnergy: (energy) => set({ radialEnergy: energy }),
  setAppLock: (hash, salt) => set({ appLockHashedPIN: hash, appLockSalt: salt }),
  updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
  riskShellActive: false,
  setRiskShellActive: (active) => set({ riskShellActive: active }),
  shareRecording: false,
  setShareRecording: (enabled) => set({ shareRecording: enabled }),
  adminPausedAt: null,
  setAdminPausedAt: (ts) => set({ adminPausedAt: ts }),
});

export { PRIVACY_PERSISTED_FIELDS, PRIVACY_STORAGE_KEY };
