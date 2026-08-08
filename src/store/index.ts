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
export interface AppState extends SettingsSlice, ChatSlice, CallSlice, PollSlice, CloudSyncSlice, LocationSlice, DeviceSlice, CompanySlice, ConnectionSlice, SyncSlice, ProfileSlice {}

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
}));
