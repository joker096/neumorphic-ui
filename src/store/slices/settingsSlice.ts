import { isEncrypted } from '../../lib/securePersist';
import { savedPrivacySettings } from './settings/settingsPersist';
import { createSecurityActions } from './settings/settingsSecurityActions';
import { createPrivacyActions } from './settings/settingsPrivacyActions';
import { createAppearanceActions } from './settings/settingsAppearanceActions';
import { createChatActions } from './settings/settingsChatActions';
import { createNetworkActions } from './settings/settingsNetworkActions';
import { createMediaActions } from './settings/settingsMediaActions';
import { createMessagingActions } from './settings/settingsMessagingActions';
import { createUpdateActions } from './settings/settingsUpdate';

export { persistEncryptedSetting, hydrateSecurePrivacyFields } from './settings/settingsPersist';

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
  /**
   * Per-chat timer overrides, keyed by stringified chat id.
   *
   * Session-only on purpose: nothing here is written to `localStorage`, so a
   * reload falls back to `selfDestructDefault`. Storing `"Off"` is meaningful —
   * it disables the timer for that chat *despite* a global default, so the
   * entry must not be dropped when the value is falsy.
   */
  chatSelfDestruct: Record<string, string>;
  setChatSelfDestruct: (chatId: string | number, timer: string | undefined) => void;
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
  chatSelfDestruct: {},
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
  saveAudioRecordings: savedPrivacySettings.saveAudioRecordings ?? true,
  saveVideoRecordings: savedPrivacySettings.saveVideoRecordings ?? true,
  autoRecordCalls: savedPrivacySettings.autoRecordCalls ?? true,
  recordingsRetentionDays: savedPrivacySettings.recordingsRetentionDays ?? 0,
  ...createSecurityActions(set, get),
  ...createPrivacyActions(set),
  ...createMessagingActions(set),
  ...createAppearanceActions(set),
  ...createChatActions(set),
  ...createNetworkActions(set),
  ...createMediaActions(set),
  ...createUpdateActions(set),
});