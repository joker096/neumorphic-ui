import { encryptPersistValue, decryptPersistValue, isEncrypted } from '../../lib/securePersist';

const PRIVACY_STORAGE_KEY = 'mess_privacy_settings_v2';

/** Keys whose values must be encrypted before persisting to localStorage. */
const ENCRYPTED_KEYS = new Set(['totpSecret', 'turnServerUrl', 'turnServerUser', 'turnServerPass']);

/** Keys currently read by this slice. Any other key is legacy and stripped. */
const PERSISTED_KEYS = new Set([
  'appLockBiometricEnabled',
  'appLockBiometricCredentialId',
  'appLockAutoLockOnBackground',
  'appLockIdleSeconds',
  'appLockHashedPIN',
  'appLockSalt',
  'turnServerUrl',
  'turnServerUser',
  'turnServerPass',
  'draftsEnabled',
  'offlineMode',
  'ghostViewMode',
  'readReceipts',
  'typingIndicators',
  'stealthMode',
  'deliveryReceipts',
  'onlineStatus',
  'forwardAnonymization',
  'soundEnabled',
  'soundVolume',
  'notifications',
  'twoFactor',
  'totpSecret',
  'spamFilter',
  'mediaAutoLoad',
  'selfDestructDefault',
  'obfuscationEnabled',
  'relayBackend',
  'autoReconnect',
  'uiAnimations',
  'themeMode',
  'accentColor',
  'chatBackground',
  'customChatBackground',
  'density',
  'messageRadius',
  'animationIntensity',
  'dndEnabled',
  'dndFrom',
  'dndTo',
  'priorityContacts',
  'saveAudioRecordings',
  'saveVideoRecordings',
  'autoRecordCalls',
  'recordingsRetentionDays',
]);

const savedPrivacySettings = (() => {
  try {
    const raw = localStorage.getItem(PRIVACY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    let migrated = false;
    for (const key of Object.keys(parsed)) {
      if (!PERSISTED_KEYS.has(key)) {
        delete parsed[key];
        migrated = true;
      }
    }
    if (migrated) {
      try {
        localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(parsed));
      } catch { /* storage unavailable — in-memory migration only */ }
    }
    return parsed;
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
  'soundEnabled', 'ghostViewMode', 'stealthMode',
  'deliveryReceipts', 'readReceipts', 'typingIndicators',
  'onlineStatus', 'forwardAnonymization',
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
  soundEnabled: boolean;
  soundVolume: number;
  notifications: boolean;
  twoFactor: boolean;
  totpSecret: string | null;
  setTotpSecret: (secret: string | null) => void;
  spamFilter: boolean;
  mediaAutoLoad: string;
  selfDestructDefault: string;
  obfuscationEnabled: boolean;
  relayBackend: string;
  autoReconnect: boolean;
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
  dndEnabled: boolean;
  dndFrom: string;
  dndTo: string;
  priorityContacts: string;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setAppLock: (hash: string, salt: string) => void;
  setAppLockBiometric: (enabled: boolean, credentialId: string | null) => void;
  setAppLockAutoLock: (onBackground: boolean, idleSeconds: number) => void;
  setAppLocked: (locked: boolean) => void;
  lockApp: () => void;
  unlockApp: () => void;
  updateSettings: (settings: Record<string, any>) => void;
  setNotifications: (v: boolean) => void;
  setTwoFactor: (v: boolean) => void;
  setSpamFilter: (v: boolean) => void;
  setMediaAutoLoad: (v: string) => void;
  setSelfDestructDefault: (v: string) => void;
  setObfuscationEnabled: (v: boolean) => void;
  setRelayBackend: (v: string) => void;
  setAutoReconnect: (v: boolean) => void;
  setUiAnimations: (v: boolean) => void;
  setDndEnabled: (v: boolean) => void;
  setDndFrom: (v: string) => void;
  setDndTo: (v: string) => void;
  setPriorityContacts: (v: string) => void;
  saveAudioRecordings: boolean;
  saveVideoRecordings: boolean;
  autoRecordCalls: boolean;
  recordingsRetentionDays: number;
  setSaveAudioRecordings: (enabled: boolean) => void;
  setSaveVideoRecordings: (enabled: boolean) => void;
  setAutoRecordCalls: (enabled: boolean) => void;
  setRecordingsRetentionDays: (days: number) => void;
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
  soundEnabled: savedPrivacySettings.soundEnabled ?? true,
  soundVolume: savedPrivacySettings.soundVolume ?? 0.7,
  notifications: savedPrivacySettings.notifications ?? true,
  twoFactor: savedPrivacySettings.twoFactor ?? false,
  totpSecret: isEncrypted(savedPrivacySettings.totpSecret) ? null : (savedPrivacySettings.totpSecret ?? null),
  spamFilter: savedPrivacySettings.spamFilter ?? true,
  mediaAutoLoad: savedPrivacySettings.mediaAutoLoad ?? 'Wi-Fi',
  selfDestructDefault: savedPrivacySettings.selfDestructDefault ?? 'Off',
  obfuscationEnabled: savedPrivacySettings.obfuscationEnabled ?? true,
  relayBackend: savedPrivacySettings.relayBackend ?? 'direct',
  autoReconnect: savedPrivacySettings.autoReconnect ?? true,
  uiAnimations: savedPrivacySettings.uiAnimations ?? true,
  themeMode: savedPrivacySettings.themeMode ?? 'system',
  accentColor: savedPrivacySettings.accentColor ?? '#4ede63',
  chatBackground: savedPrivacySettings.chatBackground ?? 'default',
  customChatBackground: savedPrivacySettings.customChatBackground ?? '',
  density: savedPrivacySettings.density ?? 'comfortable',
  messageRadius: savedPrivacySettings.messageRadius ?? 16,
  animationIntensity: savedPrivacySettings.animationIntensity ?? 'high',
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
  setSpamFilter: (v) => {
    set({ spamFilter: v });
    persistSetting('spamFilter', v);
  },
  setMediaAutoLoad: (v) => {
    set({ mediaAutoLoad: v });
    persistSetting('mediaAutoLoad', v);
  },
  setSelfDestructDefault: (v) => {
    set({ selfDestructDefault: v });
    persistSetting('selfDestructDefault', v);
  },
  setObfuscationEnabled: (v) => {
    set({ obfuscationEnabled: v });
    persistSetting('obfuscationEnabled', v);
  },
  setRelayBackend: (v) => {
    set({ relayBackend: v });
    persistSetting('relayBackend', v);
  },
  setAutoReconnect: (v) => {
    set({ autoReconnect: v });
    persistSetting('autoReconnect', v);
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
  setOnlineStatus: (status) => {
    set({ onlineStatus: status, isOnline: status });
    persistSetting('onlineStatus', status);
  },
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
});
