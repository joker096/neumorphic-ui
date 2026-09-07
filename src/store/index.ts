import { create } from 'zustand';
import { deviceSecurity } from '../lib/deviceSecurity';
import { logError } from '../lib/errorHandling';
import type { ActiveCall } from '../lib/call/types';
import type { CompanyChannel, CompanyMessage, CompanyMember } from '../constants';
import type { InviteQRPayload } from '../lib/company/types';
import type { Contact, UserProfile } from '../types/contact';
import { generateCompanyId, createCompanyUser, saveMembers } from '../lib/company/companyUser';
import * as idb from '../lib/idb';
import { DEFAULT_BOT_PERMISSIONS } from './defaults';
import type {
  BotPermissions, BotConfig, DeviceInfo, SessionData, PollOption, PollMessage,
  CloudSyncState, LocationShare, CallFolder, ScheduledMessage,
  ConnectionState, P2PChannel,
} from './types';
import type { SettingsSlice } from './slices/settingsSlice';
import type { ChatSlice } from './slices/chatSlice';
import type { CallSlice } from './slices/callSlice';
import type { PollSlice } from './slices/pollsSlice';
import type { CloudSyncSlice } from './slices/cloudSyncSlice';
import type { LocationSlice } from './slices/locationsSlice';
import type { DeviceSlice } from './slices/deviceSlice';
import type { CompanySlice } from './slices/companySlice';
import type { ConnectionSlice } from './slices/connectionSlice';
import type { SyncSlice } from './slices/syncSlice';
import type { ProfileSlice } from './slices/profileSlice';
import type { CrmSlice } from './slices/crmSlice';
import type { ContactAvatarSlice } from './slices/contactAvatarSlice';
import type { PremiumSlice } from './slices/premiumSlice';
import type { NotificationSlice } from './slices/notificationSlice';
import type { WalletSlice } from './slices/walletSlice';
import { createSettingsSlice } from './slices/settingsSlice';
import { createChatSlice } from './slices/chatSlice';
import { createCallSlice } from './slices/callSlice';
import { createPollSlice } from './slices/pollsSlice';
import { createCloudSyncSlice } from './slices/cloudSyncSlice';
import { createLocationSlice } from './slices/locationsSlice';
import { createDeviceSlice } from './slices/deviceSlice';
import { createCompanySlice } from './slices/companySlice';
import { createConnectionSlice } from './slices/connectionSlice';
import { createSyncSlice } from './slices/syncSlice';
import { createProfileSlice } from './slices/profileSlice';
import { createCrmSlice, saveCrmPersisted } from './slices/crmSlice';
import { createContactAvatarSlice } from './slices/contactAvatarSlice';
import { createPremiumSlice } from './slices/premiumSlice';
import { createNotificationSlice } from './slices/notificationSlice';
import { createWalletSlice } from './slices/walletSlice';

// Re-export types for consumers
export type {
  BotPermissions, BotConfig, DeviceInfo, SessionData, PollOption, PollMessage,
  CloudSyncState, LocationShare, CallFolder, ScheduledMessage,
  ConnectionState, P2PChannel,
} from './types';

// --- Session master key ---
let sessionMasterKey: CryptoKey | null = null;

export const setSessionMasterKey = (key: CryptoKey | null): void => {
  sessionMasterKey = key;
};

export const initAppStorage = async () => {
  try {
    sessionMasterKey = await deviceSecurity.initSessionMasterKey();
  } catch (e) {
    logError(e, 'initAppStorage');
    throw e;
  }
};

// --- Default bot permissions ---
export { DEFAULT_BOT_PERMISSIONS };

// --- Store interface ---
export interface AppState extends SettingsSlice, ChatSlice, CallSlice, PollSlice, CloudSyncSlice, LocationSlice, DeviceSlice, CompanySlice, ConnectionSlice, SyncSlice, ProfileSlice, CrmSlice, ContactAvatarSlice, PremiumSlice, NotificationSlice, WalletSlice {}

export const useAppStore = create<AppState>()((set, get) => ({
  ...createSettingsSlice(set, get),
  ...createChatSlice(set, get),
  ...createCallSlice(set, get),
  ...createPollSlice(set, get),
  ...createCloudSyncSlice(set, get),
  ...createLocationSlice(set, get),
  ...createDeviceSlice(set, get),
  ...createCompanySlice(set, get),
  ...createConnectionSlice(set, get),
  ...createSyncSlice(set, get),
  ...createProfileSlice(set, get),
  ...createCrmSlice(set, get),
  ...createContactAvatarSlice(set, get),
  ...createPremiumSlice(set, get),
  ...createNotificationSlice(set, get),
  ...createWalletSlice(set, get),
}));

export { selectWalletBalance } from './slices/walletSlice';

// --- Data hydration gate ---
// Set to true after IDB hydration completes so the persist subscription
// doesn't overwrite stored data with empty initial state.
let dataHydrated = false;
export const markDataHydrated = (): void => { dataHydrated = true; };

// Persist CRM data so user-created contacts/departments survive reloads
// (demo seed is only used until the first change is saved).
let crmPersistRef: { c: unknown; d: unknown; r: unknown; dl: unknown; t: unknown } | null = null;
useAppStore.subscribe((s) => {
  if (!s.crmLoaded) return;
  const cur = { c: s.crmContacts, d: s.crmDepartments, r: s.crmCustomRoles, dl: s.crmDeals, t: s.crmTasks };
  if (
    !crmPersistRef
    || cur.c !== crmPersistRef.c
    || cur.d !== crmPersistRef.d
    || cur.r !== crmPersistRef.r
    || cur.dl !== crmPersistRef.dl
    || cur.t !== crmPersistRef.t
  ) {
    crmPersistRef = cur;
    saveCrmPersisted(s).catch(() => {});
  }
});

// Persist chats / contacts / channels / call history to IndexedDB
let dataPersistRef: { chats: unknown; contacts: unknown; channels: unknown; calls: unknown; wallet: unknown } | null = null;
useAppStore.subscribe((s) => {
  if (!dataHydrated) return;
  const cur = { chats: s.chats, contacts: s.contacts, channels: s.channels, calls: s.callHistory, wallet: s.transactions };
  if (
    !dataPersistRef
    || cur.chats !== dataPersistRef.chats
    || cur.contacts !== dataPersistRef.contacts
    || cur.channels !== dataPersistRef.channels
    || cur.calls !== dataPersistRef.calls
    || cur.wallet !== dataPersistRef.wallet
  ) {
    dataPersistRef = cur;
    idb.set('chats_all', s.chats).catch(() => {});
    idb.set('contacts_all', s.contacts).catch(() => {});
    idb.set('channels_all', s.channels).catch(() => {});
    idb.set('call_history_all', s.callHistory).catch(() => {});
    idb.set('wallet_all', s.transactions).catch(() => {});
    if (s.cloudSync.enabled) useAppStore.getState().markCloudSyncPendingChange();
  }
});
