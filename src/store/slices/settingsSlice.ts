const PRIVACY_STORAGE_KEY = 'mess_privacy_settings_v2';

const savedPrivacySettings = (() => {
  try {
    const raw = localStorage.getItem(PRIVACY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
})();

function persistSetting(key: string, value: unknown) {
  try {
    const prev = JSON.parse(localStorage.getItem(PRIVACY_STORAGE_KEY) || '{}');
    localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify({ ...prev, [key]: value }));
  } catch {}
}

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
  isOnline: boolean;
  setOnlineStatus: (status: boolean) => void;
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
  notifications: boolean;
  twoFactor: boolean;
  proxyEnabled: boolean;
  spamFilter: boolean;
  pwaBanner: boolean;
  deadMansSwitch: string;
  mediaAutoLoad: string;
  selfDestructDefault: string;
  obfuscationMode: string;
  obfuscationEnabled: boolean;
  proxyUrl: string;
  torBridge: string;
  relayBackend: string;
  autoReconnect: boolean;
  p2pMesh: boolean;
  visNumber: string;
  visActivity: string;
  uiAnimations: boolean;
  dndEnabled: boolean;
  dndFrom: string;
  dndTo: string;
  priorityContacts: string;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setRadialDnd: (dnd: boolean) => void;
  setRadialProxy: (proxy: boolean) => void;
  setRadialEnergy: (energy: boolean) => void;
  setAppLock: (hash: string, salt: string) => void;
  updateSettings: (settings: Record<string, any>) => void;
  setNotifications: (v: boolean) => void;
  setTwoFactor: (v: boolean) => void;
  setProxyEnabled: (v: boolean) => void;
  setSpamFilter: (v: boolean) => void;
  setPwaBanner: (v: boolean) => void;
  setDeadMansSwitch: (v: string) => void;
  setMediaAutoLoad: (v: string) => void;
  setSelfDestructDefault: (v: string) => void;
  setObfuscationMode: (v: string) => void;
  setObfuscationEnabled: (v: boolean) => void;
  setProxyUrl: (v: string) => void;
  setTorBridge: (v: string) => void;
  setRelayBackend: (v: string) => void;
  setAutoReconnect: (v: boolean) => void;
  setP2pMesh: (v: boolean) => void;
  setVisNumber: (v: string) => void;
  setVisActivity: (v: string) => void;
  setUiAnimations: (v: boolean) => void;
  setDndEnabled: (v: boolean) => void;
  setDndFrom: (v: string) => void;
  setDndTo: (v: string) => void;
  setPriorityContacts: (v: string) => void;
  riskShellActive: boolean;
  setRiskShellActive: (active: boolean) => void;
  shareRecording: boolean;
  setShareRecording: (enabled: boolean) => void;
  adminPausedAt: number | null;
  setAdminPausedAt: (ts: number | null) => void;
}

export const createSettingsSlice = (set: any, get: any): SettingsSlice => ({
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
  isOnline: true,
  forwardAnonymization: savedPrivacySettings.forwardAnonymization ?? false,
  currentLanguage: savedPrivacySettings.currentLanguage ?? 'en',
  soundEnabled: savedPrivacySettings.soundEnabled ?? true,
  soundVolume: savedPrivacySettings.soundVolume ?? 0.7,
  radialDnd: false,
  radialProxy: true,
  radialEnergy: false,
  allowForwarding: savedPrivacySettings.allowForwarding ?? true,
  allowMetadata: savedPrivacySettings.allowMetadata ?? true,
  forwardCountLimit: savedPrivacySettings.forwardCountLimit ?? 3,
  contactReadReceipts: {},
  toggleContactReadReceipt: (chatId, enabled) => set((state: any) => ({
    contactReadReceipts: { ...state.contactReadReceipts, [String(chatId)]: enabled }
  })),
  notifications: savedPrivacySettings.notifications ?? true,
  twoFactor: savedPrivacySettings.twoFactor ?? false,
  proxyEnabled: savedPrivacySettings.proxy ?? false,
  spamFilter: savedPrivacySettings.spamFilter ?? true,
  pwaBanner: savedPrivacySettings.pwaBanner ?? true,
  deadMansSwitch: savedPrivacySettings.deadMansSwitch ?? '6 months',
  mediaAutoLoad: savedPrivacySettings.mediaAutoLoad ?? 'Wi-Fi',
  selfDestructDefault: savedPrivacySettings.selfDestructDefault ?? 'Off',
  obfuscationMode: savedPrivacySettings.obfuscationMode ?? 'aesgcm',
  obfuscationEnabled: savedPrivacySettings.obfuscationEnabled ?? true,
  proxyUrl: savedPrivacySettings.proxyUrl ?? '',
  torBridge: savedPrivacySettings.torBridge ?? 'None',
  relayBackend: savedPrivacySettings.relayBackend ?? 'direct',
  autoReconnect: savedPrivacySettings.autoReconnect ?? true,
  p2pMesh: savedPrivacySettings.p2pMesh ?? true,
  visNumber: savedPrivacySettings.visNumber ?? 'Nobody',
  visActivity: savedPrivacySettings.visActivity ?? 'My contacts',
  uiAnimations: savedPrivacySettings.uiAnimations ?? true,
  dndEnabled: savedPrivacySettings.dndEnabled ?? false,
  dndFrom: savedPrivacySettings.dndFrom ?? '22:00',
  dndTo: savedPrivacySettings.dndTo ?? '08:00',
  priorityContacts: savedPrivacySettings.priorityContacts ?? '',
  setSoundEnabled: (enabled) => {
    set({ soundEnabled: enabled });
    persistSetting('soundEnabled', enabled);
  },
  setSoundVolume: (volume) => {
    set({ soundVolume: volume });
    persistSetting('soundVolume', volume);
  },
  setNotifications: (v) => {
    set({ notifications: v });
    persistSetting('notifications', v);
  },
  setTwoFactor: (v) => {
    set({ twoFactor: v });
    persistSetting('twoFactor', v);
  },
  setProxyEnabled: (v) => {
    set({ proxyEnabled: v });
    persistSetting('proxyEnabled', v);
  },
  setSpamFilter: (v) => {
    set({ spamFilter: v });
    persistSetting('spamFilter', v);
  },
  setPwaBanner: (v) => {
    set({ pwaBanner: v });
    persistSetting('pwaBanner', v);
  },
  setDeadMansSwitch: (v) => {
    set({ deadMansSwitch: v });
    persistSetting('deadMansSwitch', v);
  },
  setMediaAutoLoad: (v) => {
    set({ mediaAutoLoad: v });
    persistSetting('mediaAutoLoad', v);
  },
  setSelfDestructDefault: (v) => {
    set({ selfDestructDefault: v });
    persistSetting('selfDestructDefault', v);
  },
  setObfuscationMode: (v) => {
    set({ obfuscationMode: v });
    persistSetting('obfuscationMode', v);
  },
  setObfuscationEnabled: (v) => {
    set({ obfuscationEnabled: v });
    persistSetting('obfuscationEnabled', v);
  },
  setProxyUrl: (v) => {
    set({ proxyUrl: v });
    persistSetting('proxyUrl', v);
  },
  setTorBridge: (v) => {
    set({ torBridge: v });
    persistSetting('torBridge', v);
  },
  setRelayBackend: (v) => {
    set({ relayBackend: v });
    persistSetting('relayBackend', v);
  },
  setAutoReconnect: (v) => {
    set({ autoReconnect: v });
    persistSetting('autoReconnect', v);
  },
  setP2pMesh: (v) => {
    set({ p2pMesh: v });
    persistSetting('p2pMesh', v);
  },
  setVisNumber: (v) => {
    set({ visNumber: v });
    persistSetting('visNumber', v);
  },
  setVisActivity: (v) => {
    set({ visActivity: v });
    persistSetting('visActivity', v);
  },
  setUiAnimations: (v) => {
    set({ uiAnimations: v });
    persistSetting('uiAnimations', v);
  },
  setDndEnabled: (v) => {
    set({ dndEnabled: v });
    persistSetting('dndEnabled', v);
  },
  setDndFrom: (v) => {
    set({ dndFrom: v });
    persistSetting('dndFrom', v);
  },
  setDndTo: (v) => {
    set({ dndTo: v });
    persistSetting('dndTo', v);
  },
  setPriorityContacts: (v) => {
    set({ priorityContacts: v });
    persistSetting('priorityContacts', v);
  },
  setRadialDnd: (dnd) => set({ radialDnd: dnd }),
  setRadialProxy: (proxy) => set({ radialProxy: proxy }),
  setRadialEnergy: (energy) => set({ radialEnergy: energy }),
  setAppLock: (hash, salt) => set({ appLockHashedPIN: hash, appLockSalt: salt }),
  updateSettings: (settings) => {
    set((state: any) => ({ ...state, ...settings }));
    try {
      const prev = JSON.parse(localStorage.getItem(PRIVACY_STORAGE_KEY) || '{}');
      localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify({ ...prev, ...settings }));
    } catch {}
  },
  setOnlineStatus: (status) => set({ onlineStatus: status, isOnline: status }),
  riskShellActive: false,
  setRiskShellActive: (active) => set({ riskShellActive: active }),
  shareRecording: false,
  setShareRecording: (enabled) => set({ shareRecording: enabled }),
  adminPausedAt: null,
  setAdminPausedAt: (ts) => set({ adminPausedAt: ts }),
});
