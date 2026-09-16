import { encryptPersistValue, decryptPersistValue, isEncrypted } from '../../lib/securePersist';

const PRIVACY_STORAGE_KEY = 'mess_privacy_settings_v2';

/** Keys whose values must be encrypted before persisting to localStorage. */
const ENCRYPTED_KEYS = new Set(['totpSecret', 'turnServerUrl', 'turnServerUser', 'turnServerPass']);

const savedPrivacySettings = (() => {
  try {
    const raw = localStorage.getItem(PRIVACY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
})();

/**
 * Atomic encrypted persistence: encrypt BEFORE the first write; a failure
 * cancels the save (fail-closed) — the plaintext value never touches storage.
 */
export function persistEncryptedSetting(key: string, value: string) {
  void encryptPersistValue(value)
    .then((enc) => {
      try {
        const prev = JSON.parse(localStorage.getItem(PRIVACY_STORAGE_KEY) || '{}');
        prev[key] = enc;
        localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(prev));
      } catch { /* storage unavailable — state-only */ }
    })
    .catch(() => { /* session key unavailable — save aborted, nothing persisted */ });
}

function persistSetting(key: string, value: unknown) {
  try {
    if (ENCRYPTED_KEYS.has(key) && typeof value === 'string' && value) {
      persistEncryptedSetting(key, value);
      return;
    }
    const prev = JSON.parse(localStorage.getItem(PRIVACY_STORAGE_KEY) || '{}');
    prev[key] = value;
    localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(prev));
  } catch {}
}

/** Set of keys `updateSettings` is allowed to change (mitigates S3). */
const UPDATE_ALLOWLIST = new Set([
  'currentLanguage', 'soundEnabled', 'ghostViewMode', 'stealthMode',
  'anonymousMode', 'deliveryReceipts', 'readReceipts', 'typingIndicators',
  'onlineStatus', 'allowForwarding', 'allowMetadata', 'forwardCountLimit',
  'turnServerUrl', 'turnServerUser', 'turnServerPass',
]);

/**
 * Post-key-init hydration: decrypts any sensitive settings that were
 * persisted while the session key was unavailable (or written before this
 * module existed). Called by initAppStorage after setSessionPersistKey.
 */
export async function hydrateSecurePrivacyFields(get: () => any, setLocal: (partial: any) => void): Promise<void> {
  const updates: Record<string, string> = {};
  for (const key of ENCRYPTED_KEYS) {
    const value = savedPrivacySettings[key];
    if (isEncrypted(value)) {
      try {
        updates[key] = await decryptPersistValue(value);
      } catch { /* leave as-is */ }
    }
  }
  if (Object.keys(updates).length > 0) {
    setLocal({ ...updates });
  }
}

export interface SettingsSlice {
  appLockHashedPIN: string | null;
  appLockSalt: string | null;
  appLockBiometricEnabled: boolean;
  appLockBiometricCredentialId: string | null;
  appLockAutoLockOnBackground: boolean;
  appLockIdleSeconds: number;
  appLocked: boolean;
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
  draftsEnabled: boolean;
  setDraftsEnabled: (enabled: boolean) => void;
  offlineMode: boolean;
  setOfflineMode: (enabled: boolean) => void;
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
  totpSecret: string | null;
  setTotpSecret: (secret: string | null) => void;
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
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  chatBackground: string;
  setChatBackground: (bg: string) => void;
  customChatBackground: string;
  setCustomChatBackground: (dataUrl: string) => void;
  density: 'comfortable' | 'compact';
  setDensity: (d: 'comfortable' | 'compact') => void;
  messageRadius: number;
  setMessageRadius: (r: number) => void;
  animationIntensity: 'off' | 'low' | 'high';
  setAnimationIntensity: (i: 'off' | 'low' | 'high') => void;
  profilePhotoVisibility: string;
  setProfilePhotoVisibility: (v: string) => void;
  callsVisibility: string;
  setCallsVisibility: (v: string) => void;
  messagesFrom: string;
  setMessagesFrom: (v: string) => void;
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
  setAppLockBiometric: (enabled: boolean, credentialId: string | null) => void;
  setAppLockAutoLock: (onBackground: boolean, idleSeconds: number) => void;
  setAppLocked: (locked: boolean) => void;
  lockApp: () => void;
  unlockApp: () => void;
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
  saveAudioRecordings: boolean;
  saveVideoRecordings: boolean;
  autoRecordCalls: boolean;
  recordingsRetentionDays: number;
  setSaveAudioRecordings: (enabled: boolean) => void;
  setSaveVideoRecordings: (enabled: boolean) => void;
  setAutoRecordCalls: (enabled: boolean) => void;
  setRecordingsRetentionDays: (days: number) => void;
  adminPausedAt: number | null;
  setAdminPausedAt: (ts: number | null) => void;
}

export const createSettingsSlice = (set: any, get: any): SettingsSlice => ({
  appLockHashedPIN: null,
  appLockSalt: null,
  appLockBiometricEnabled: savedPrivacySettings.appLockBiometricEnabled ?? false,
  appLockBiometricCredentialId: savedPrivacySettings.appLockBiometricCredentialId ?? null,
  appLockAutoLockOnBackground: savedPrivacySettings.appLockAutoLockOnBackground ?? true,
  appLockIdleSeconds: savedPrivacySettings.appLockIdleSeconds ?? 0,
  appLocked: !!(savedPrivacySettings.appLockHashedPIN || savedPrivacySettings.appLockBiometricEnabled),
  turnServerUrl: isEncrypted(savedPrivacySettings.turnServerUrl) ? '' : (savedPrivacySettings.turnServerUrl ?? ''),
  turnServerUser: isEncrypted(savedPrivacySettings.turnServerUser) ? '' : (savedPrivacySettings.turnServerUser ?? ''),
  turnServerPass: isEncrypted(savedPrivacySettings.turnServerPass) ? '' : (savedPrivacySettings.turnServerPass ?? ''),
  anonymousMode: savedPrivacySettings.anonymousMode ?? false,
  draftsEnabled: savedPrivacySettings.draftsEnabled ?? true,
  offlineMode: savedPrivacySettings.offlineMode ?? true,
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
  totpSecret: isEncrypted(savedPrivacySettings.totpSecret) ? null : (savedPrivacySettings.totpSecret ?? null),
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
  themeMode: savedPrivacySettings.themeMode ?? 'system',
  accentColor: savedPrivacySettings.accentColor ?? '#10b981',
  chatBackground: savedPrivacySettings.chatBackground ?? 'default',
  customChatBackground: savedPrivacySettings.customChatBackground ?? '',
  density: savedPrivacySettings.density ?? 'comfortable',
  messageRadius: savedPrivacySettings.messageRadius ?? 16,
  animationIntensity: savedPrivacySettings.animationIntensity ?? 'high',
  profilePhotoVisibility: savedPrivacySettings.profilePhotoVisibility ?? 'everyone',
  callsVisibility: savedPrivacySettings.callsVisibility ?? 'everyone',
  messagesFrom: savedPrivacySettings.messagesFrom ?? 'everyone',
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
  setTotpSecret: (secret) => {
    set({ totpSecret: secret });
    persistSetting('totpSecret', secret);
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
  setThemeMode: (mode) => {
    set({ themeMode: mode });
    persistSetting('themeMode', mode);
  },
  setAccentColor: (color) => {
    set({ accentColor: color });
    persistSetting('accentColor', color);
  },
  setChatBackground: (bg) => {
    set({ chatBackground: bg });
    persistSetting('chatBackground', bg);
  },
  setCustomChatBackground: (dataUrl) => {
    set({ customChatBackground: dataUrl });
    persistSetting('customChatBackground', dataUrl);
  },
  setDensity: (d) => {
    set({ density: d });
    persistSetting('density', d);
  },
  setMessageRadius: (r) => {
    set({ messageRadius: r });
    persistSetting('messageRadius', r);
  },
  setAnimationIntensity: (i) => {
    set({ animationIntensity: i });
    persistSetting('animationIntensity', i);
  },
  setProfilePhotoVisibility: (v) => {
    set({ profilePhotoVisibility: v });
    persistSetting('profilePhotoVisibility', v);
  },
  setCallsVisibility: (v) => {
    set({ callsVisibility: v });
    persistSetting('callsVisibility', v);
  },
  setMessagesFrom: (v) => {
    set({ messagesFrom: v });
    persistSetting('messagesFrom', v);
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
  setAppLock: (hash, salt) => {
    set({ appLockHashedPIN: hash, appLockSalt: salt });
    persistSetting('appLockHashedPIN', hash);
    persistSetting('appLockSalt', salt);
    if (!hash && !get().appLockBiometricEnabled) set({ appLocked: false });
  },
  setAppLockBiometric: (enabled, credentialId) => {
    set({ appLockBiometricEnabled: enabled, appLockBiometricCredentialId: credentialId });
    persistSetting('appLockBiometricEnabled', enabled);
    persistSetting('appLockBiometricCredentialId', credentialId);
    if (!enabled && !get().appLockHashedPIN) set({ appLocked: false });
  },
  setAppLockAutoLock: (onBackground, idleSeconds) => {
    set({ appLockAutoLockOnBackground: onBackground, appLockIdleSeconds: idleSeconds });
    persistSetting('appLockAutoLockOnBackground', onBackground);
    persistSetting('appLockIdleSeconds', idleSeconds);
  },
  setAppLocked: (locked) => set({ appLocked: locked }),
  lockApp: () => set({ appLocked: true }),
  unlockApp: () => set({ appLocked: false }),
  updateSettings: (settings) => {
    const allowed: Record<string, unknown> = {};
    for (const key of Object.keys(settings)) {
      if (UPDATE_ALLOWLIST.has(key)) allowed[key] = settings[key];
    }
    set((state: any) => ({ ...state, ...allowed }));
    try {
      const prev = JSON.parse(localStorage.getItem(PRIVACY_STORAGE_KEY) || '{}');
      const next = { ...prev, ...allowed };
      const toEncrypt = Object.entries(next).filter(
        ([k, v]) => ENCRYPTED_KEYS.has(k) && typeof v === 'string' && v,
      );
      if (toEncrypt.length > 0) {
        // Atomic: encrypt BEFORE the first write; a failure cancels the whole
        // save (fail-closed) — plaintext secrets never touch localStorage.
        (async () => {
          const enc: Record<string, string> = {};
          for (const [k, v] of toEncrypt) {
            try {
              enc[k] = await encryptPersistValue(v as string);
            } catch {
              return;
            }
          }
          const current = JSON.parse(localStorage.getItem(PRIVACY_STORAGE_KEY) || '{}');
          localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify({ ...current, ...allowed, ...enc }));
        })().catch(() => {});
        return;
      }
      localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  },
  setOnlineStatus: (status) => set({ onlineStatus: status, isOnline: status }),
  riskShellActive: false,
  setRiskShellActive: (active) => set({ riskShellActive: active }),
  shareRecording: false,
  setShareRecording: (enabled) => set({ shareRecording: enabled }),
  setDraftsEnabled: (enabled) => { set({ draftsEnabled: enabled }); persistSetting('draftsEnabled', enabled); },
  setOfflineMode: (enabled) => { set({ offlineMode: enabled }); persistSetting('offlineMode', enabled); },
    saveAudioRecordings: savedPrivacySettings.saveAudioRecordings ?? true,
  saveVideoRecordings: savedPrivacySettings.saveVideoRecordings ?? true,
  autoRecordCalls: savedPrivacySettings.autoRecordCalls ?? true,
  recordingsRetentionDays: savedPrivacySettings.recordingsRetentionDays ?? 0,
  setSaveAudioRecordings: (enabled) => {
    set({ saveAudioRecordings: enabled });
    persistSetting('saveAudioRecordings', enabled);
  },
  setSaveVideoRecordings: (enabled) => {
    set({ saveVideoRecordings: enabled });
    persistSetting('saveVideoRecordings', enabled);
  },
  setAutoRecordCalls: (enabled) => {
    set({ autoRecordCalls: enabled });
    persistSetting('autoRecordCalls', enabled);
  },
  setRecordingsRetentionDays: (days) => {
    set({ recordingsRetentionDays: days });
    persistSetting('recordingsRetentionDays', days);
  },
  adminPausedAt: null,
  setAdminPausedAt: (ts) => set({ adminPausedAt: ts }),
});
