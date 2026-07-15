import { create } from 'zustand';
import { deviceSecurity } from '../lib/deviceSecurity';
import { logError } from '../lib/errorHandling';
import type { ActiveCall } from '../lib/call/types';
import type { CompanyChannel, CompanyMessage, CompanyMember } from '../constants';
import type { InviteQRPayload } from '../lib/company/types';
import type { Contact, UserProfile } from '../types/contact';
import { DEFAULT_BOT_PERMISSIONS } from './defaults';
import type {
  BotPermissions, BotConfig, DeviceInfo, SessionData, PollOption, PollMessage,
  CloudSyncState, LocationShare, PhotoEditState, CallFolder, ScheduledMessage,
  ConnectionState, P2PChannel,
} from './types';

// Re-export types for consumers
export type { BotPermissions, BotConfig, DeviceInfo, SessionData, PollOption, PollMessage, CloudSyncState, LocationShare, PhotoEditState, CallFolder, ScheduledMessage, ConnectionState, P2PChannel } from './types';

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
// Re-exported from ./defaults
export { DEFAULT_BOT_PERMISSIONS };

// --- Store interface ---
export interface AppState {
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
  devices: DeviceInfo[];
  currentSession: SessionData;
  addDevice: (device: DeviceInfo) => void;
  removeDevice: (id: string) => void;
  polls: PollMessage[];
  addPoll: (poll: PollMessage) => void;
  removePoll: (id: number) => void;
  voteOnPoll: (pollId: number, optionIndex: number, userId: string) => void;
  cloudSync: CloudSyncState;
  setCloudSyncEnabled: (enabled: boolean) => void;
  updateCloudSyncStatus: (status: Partial<CloudSyncState>) => void;
  triggerCloudSync: () => Promise<void>;
  locationShares: LocationShare[];
  addLocationShare: (share: LocationShare) => void;
  removeLocationShare: (id: string) => void;
  updateLocationShare: (id: string, updates: Partial<LocationShare>) => void;
  startLiveLocation: (chatId: string | number, durationMinutes: number) => void;
  stopLiveLocation: (chatId: string | number) => void;
  photoEditState: PhotoEditState | null;
  setPhotoEditState: (state: PhotoEditState | null) => void;
  updatePhotoEditCrop: (crop: PhotoEditState['crop']) => void;
  addPhotoEditDrawing: (drawing: PhotoEditState['drawings'][0]) => void;
  addPhotoEditText: (text: PhotoEditState['textElements'][0]) => void;
  resetPhotoEditor: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setRadialDnd: (dnd: boolean) => void;
  setRadialProxy: (proxy: boolean) => void;
  setRadialEnergy: (energy: boolean) => void;
  setAppLock: (hash: string, salt: string) => void;
  updateSettings: (settings: Partial<AppState>) => void;
  chats: any[];
  setChats: (updater: any[] | ((prev: any[]) => any[])) => void;
  forwardMessage: (message: any, targetChatId: string) => void;
  contacts: Contact[];
  setContacts: (updater: Contact[] | ((prev: Contact[]) => Contact[])) => void;
  favoriteContacts: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  channels: P2PChannel[];
  setChannels: (updater: P2PChannel[] | ((prev: P2PChannel[]) => P2PChannel[])) => void;
  bots: BotConfig[];
  setBots: (updater: BotConfig[] | ((prev: BotConfig[]) => BotConfig[])) => void;
  scheduledQueue: { messages: ScheduledMessage[]; addMessage: (msg: ScheduledMessage) => void; removeMessage: (id: string) => void };
  archivedChats: (string | number)[];
  toggleArchive: (id: string | number) => void;
  pinChat: (chatId: string | number) => void;
  activeCall: ActiveCall | null;
  setActiveCall: (call: ActiveCall | null) => void;
  recordings: any[];
  recordingsSearchQuery: string;
  recordingsSortBy: string;
  recordingsSortOrder: string;
  addRecording: (recording: any) => void;
  deleteRecording: (id: string) => void;
  toggleFavorite: (id: string) => void;
  pinnedMessageList: Array<{ id: number; chatId: string | number; pinBy: string; pinnedAt: number }>;
  addPinnedMessage: (pin: { id: number; chatId: string | number; pinBy: string }) => void;
  removePinnedMessage: (id: number) => void;
  callHistory: Array<{ id: string; name: string; time: string; type: 'missed' | 'incoming' | 'outgoing'; duration?: string }>;
  addCallToHistory: (entry: { name: string; type: 'missed' | 'incoming' | 'outgoing'; duration?: string }) => void;
  clearCallHistory: () => void;
  callFolders: CallFolder[];
  addCallFolder: (folder: Omit<CallFolder, 'id'>) => void;
  removeCallFolder: (id: string) => void;
  setCallFolderFilter: (id: string, filter: CallFolder['filter']) => void;
  riskShellActive: boolean;
  setRiskShellActive: (active: boolean) => void;
  shareRecording: boolean;
  setShareRecording: (enabled: boolean) => void;
  adminPausedAt: number | null;
  setAdminPausedAt: (ts: number | null) => void;
  connectionStatus: ConnectionState['connectionStatus'];
  transportBackend: string;
  selectedBackend: string;
  latencyMs: number;
  blockedBackends: string[];
  regionBlocked: boolean;
  setConnectionStatus: (status: ConnectionState['connectionStatus']) => void;
  setTransportBackend: (backend: string) => void;
  setLatency: (ms: number) => void;
  setBlockedBackends: (backends: string[]) => void;
  setRegionBlocked: (blocked: boolean) => void;
  syncStatus: 'idle' | 'requesting' | 'syncing' | 'live' | 'error';
  syncLastTimestamp: string;
  totpSecret: string;
  pairingQrData: string;
  setSyncStatus: (status: AppState['syncStatus']) => void;
  setSyncLastTimestamp: (ts: string) => void;
  setTotpSecret: (secret: string) => void;
  setPairingQrData: (data: string) => void;
  userProfile: UserProfile;
  setUserProfile: (profile: Partial<UserProfile>) => void;
  companyId: string | null;
  companyChannels: CompanyChannel[];
  companyMessages: CompanyMessage[];
  companyMembers: CompanyMember[];
  companySettings: { name: string; logo?: string; phone?: string; email?: string; address?: string; website?: string; taxId?: string } | null;
  setCompanyName: (name: string) => void;
  setCompanySettings: (settings: { name: string; logo?: string; phone?: string; email?: string; address?: string; website?: string; taxId?: string } | null) => void;
  updateCompanyField: (field: string, value: any) => void;
  loadCompanySettings: () => Promise<void>;
  saveCompanySettings: () => Promise<void>;
  hideWhenOfficeOnly: boolean;
  pendingInvite: InviteQRPayload | null;
  setCompanyId: (id: string | null) => void;
  setCompanyChannels: (channels: CompanyChannel[]) => void;
  addCompanyMessage: (msg: CompanyMessage) => void;
  setCompanyMembers: (members: CompanyMember[]) => void;
  setHideWhenOfficeOnly: (hide: boolean) => void;
  initCompanyFromInvite: (payload: InviteQRPayload) => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  appLockHashedPIN: null,
  appLockSalt: null,
  turnServerUrl: '',
  turnServerUser: '',
  turnServerPass: '',
  anonymousMode: false,
  ghostViewMode: false,
  readReceipts: true,
  typingIndicators: true,
  stealthMode: false,
  deliveryReceipts: true,
  onlineStatus: true,
  isOnline: true,
  forwardAnonymization: false,
  currentLanguage: 'en',
  soundEnabled: true,
  soundVolume: 0.7,
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
  devices: [{ id: 'current-device', name: 'This Device', platform: 'web', lastActive: Date.now(), isCurrent: true }],
  currentSession: { deviceId: 'current-device', startTime: Date.now(), isActive: true },
  addDevice: (device) => set((state) => ({ devices: [...state.devices, device] })),
  removeDevice: (id) => set((state) => ({
    devices: state.devices.filter(d => d.id !== id)
  })),
  polls: [],
  addPoll: (poll) => set((state) => ({ polls: [...state.polls, poll] })),
  removePoll: (id) => set((state) => ({ polls: state.polls.filter(p => p.id !== id) })),
  voteOnPoll: (pollId, optionIndex, userId) => set((state) => ({
    polls: state.polls.map(p => {
      if (p.id !== pollId) return p;
      const updatedOptions = p.options.map((opt, idx) => {
        if (idx === optionIndex) return { ...opt, votes: [...opt.votes, userId] };
        return opt;
      });
      return { ...p, options: updatedOptions };
    })
  })),
  cloudSync: { enabled: false, lastSync: null, pendingChanges: 0, status: 'idle' as const, errorMessage: null, provider: 'local' as const },
  setCloudSyncEnabled: (enabled) => set((state) => ({ cloudSync: { ...state.cloudSync, enabled } })),
  updateCloudSyncStatus: (status) => set((state) => ({ cloudSync: { ...state.cloudSync, ...status } })),
  triggerCloudSync: async () => {
    set((state) => ({ cloudSync: { ...state.cloudSync, status: 'syncing' as const, errorMessage: null } }));
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      set((state) => ({ cloudSync: { ...state.cloudSync, status: 'success' as const, lastSync: Date.now(), pendingChanges: 0 } }));
    } catch (error: any) {
      set((state) => ({ cloudSync: { ...state.cloudSync, status: 'error' as const, errorMessage: error.message || 'Sync failed' } }));
    }
  },
  locationShares: [],
  addLocationShare: (share) => set((state) => ({ locationShares: [...state.locationShares, share] })),
  removeLocationShare: (id) => set((state) => ({ locationShares: state.locationShares.filter(s => s.id !== id) })),
  updateLocationShare: (id, updates) => set((state) => ({
    locationShares: state.locationShares.map(s => s.id === id ? { ...s, ...updates } : s)
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
      set((state) => ({ locationShares: [...state.locationShares, share] }));
      const watchId = navigator.geolocation.watchPosition((pos) => {
        set((state) => ({
          locationShares: state.locationShares.map(s =>
            s.id === share.id ? {
              ...s, latitude: pos.coords.latitude, longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy, timestamp: Date.now()
            } : s
          )
        }));
      });
      setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
        set((state) => ({
          locationShares: state.locationShares.map(s =>
            s.id === share.id && s.isLive ? { ...s, isLive: false } : s
          )
        }));
      }, durationMinutes * 60 * 1000);
    });
  },
  stopLiveLocation: (chatId) => set((state) => ({
    locationShares: state.locationShares.map(s => s.chatId === chatId && s.isLive ? { ...s, isLive: false } : s)
  })),
  photoEditState: null,
  setPhotoEditState: (state) => set({ photoEditState: state }),
  updatePhotoEditCrop: (crop) => set((state) => ({
    photoEditState: state.photoEditState ? { ...state.photoEditState, crop } : null
  })),
  addPhotoEditDrawing: (drawing) => set((state) => ({
    photoEditState: state.photoEditState ? { ...state.photoEditState, drawings: [...state.photoEditState.drawings, drawing] } : null
  })),
  addPhotoEditText: (text) => set((state) => ({
    photoEditState: state.photoEditState ? { ...state.photoEditState, textElements: [...state.photoEditState.textElements, text] } : null
  })),
  resetPhotoEditor: () => set({ photoEditState: null }),
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setSoundVolume: (volume) => set({ soundVolume: volume }),
  setRadialDnd: (dnd) => set({ radialDnd: dnd }),
  setRadialProxy: (proxy) => set({ radialProxy: proxy }),
  setRadialEnergy: (energy) => set({ radialEnergy: energy }),
  setAppLock: (hash, salt) => set({ appLockHashedPIN: hash, appLockSalt: salt }),
  updateSettings: (settings) => {
    set((state) => ({ ...state, ...settings }));
    try {
      const prev = JSON.parse(localStorage.getItem('mess_privacy_settings_v2') || '{}');
      localStorage.setItem('mess_privacy_settings_v2', JSON.stringify({ ...prev, ...settings }));
    } catch {}
  },
  forwardMessage: (message: any, targetChatId: string) => {
    set((storeState: any) => {
      const anonymized = storeState.forwardAnonymization ? {
        ...message, forwardedAt: Date.now()
      } : message;
      const updatedChats = storeState.chats.map((chat: any) => {
        if (chat.id === targetChatId && Array.isArray(chat.history)) {
          return { ...chat, history: [...chat.history, anonymized] };
        }
        return chat;
      });
      return { chats: updatedChats };
    });
  },
  chats: [],
  setChats: (updater) => set((state) => ({
    chats: typeof updater === 'function' ? updater(state.chats) : updater
  })),
  contacts: [],
  setContacts: (updater) => set((state) => ({
    contacts: typeof updater === 'function' ? updater(state.contacts) : updater
  })),
  favoriteContacts: [],
  addFavorite: (id) => set((state) => ({
    favoriteContacts: state.favoriteContacts.includes(id) ? state.favoriteContacts : [...state.favoriteContacts, id]
  })),
  removeFavorite: (id) => set((state) => ({
    favoriteContacts: state.favoriteContacts.filter(i => i !== id)
  })),
  channels: [],
  setChannels: (updater) => set((state) => ({
    channels: typeof updater === 'function' ? updater(state.channels) : updater
  })),
  bots: [],
  setBots: (updater) => set((state) => ({
    bots: typeof updater === 'function' ? updater(state.bots) : updater
  })),
  scheduledQueue: {
    messages: [],
    addMessage: (msg) => set((state) => ({ scheduledQueue: { ...state.scheduledQueue, messages: [...state.scheduledQueue.messages, msg] } })),
    removeMessage: (id) => set((state) => ({ scheduledQueue: { ...state.scheduledQueue, messages: state.scheduledQueue.messages.filter(m => m.id !== id) } }))
  },
  archivedChats: [],
  toggleArchive: (id) => set((state) => ({
    archivedChats: state.archivedChats.includes(id) ? state.archivedChats.filter(i => i !== id) : [...state.archivedChats, id]
  })),
  pinChat: (chatId) => set((state) => {
    const pinnedCount = state.chats.filter((c: any) => c.pinned).length;
    const chat = state.chats.find((c: any) => c.id === chatId);
    if (!chat) return state;
    if (chat.pinned) return { chats: state.chats.map((c: any) => c.id === chatId ? { ...c, pinned: false } : c) };
    if (pinnedCount >= 3) return state;
    return { chats: state.chats.map((c: any) => c.id === chatId ? { ...c, pinned: true } : c) };
  }),
  activeCall: null,
  setActiveCall: (call) => set({ activeCall: call }),
  callHistory: [],
  addCallToHistory: (entry) => set((state) => ({
    callHistory: [{ id: String(Date.now()), time: new Date().toLocaleTimeString(), ...entry }, ...state.callHistory]
  })),
  clearCallHistory: () => set({ callHistory: [] }),
  callFolders: [
    { id: 'all', name: 'All', filter: 'all' },
    { id: 'recent', name: 'Recent', filter: 'all' },
    { id: 'missed', name: 'Missed', filter: 'missed' },
  ],
  addCallFolder: (folder) => set((state) => ({
    callFolders: [...state.callFolders, { ...folder, id: `folder_${Date.now()}` }]
  })),
  removeCallFolder: (id) => set((state) => ({
    callFolders: state.callFolders.filter(f => f.id !== id)
  })),
  setCallFolderFilter: (id, filter) => set((state) => ({
    callFolders: state.callFolders.map(f => f.id === id ? { ...f, filter } : f)
  })),
  recordings: [],
  recordingsSearchQuery: '',
  recordingsSortBy: 'date',
  recordingsSortOrder: 'desc',
  addRecording: (recording) => set((state: any) => ({ recordings: [recording, ...state.recordings] })),
  deleteRecording: (id) => set((state: any) => ({ recordings: state.recordings.filter((r: any) => r.id !== id) })),
  toggleFavorite: (id) => set((state: any) => ({
    recordings: state.recordings.map((r: any) => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r)
  })),
  pinnedMessageList: [],
  addPinnedMessage: (pin) => set((state) => ({ pinnedMessageList: [...state.pinnedMessageList, { ...pin, pinnedAt: state.pinnedMessageList.length }] })),
  removePinnedMessage: (id) => set((state) => ({ pinnedMessageList: state.pinnedMessageList.filter(p => p.id !== id) })),
  riskShellActive: false,
  setRiskShellActive: (active) => set({ riskShellActive: active }),
  shareRecording: false,
  setShareRecording: (enabled) => set({ shareRecording: enabled }),
  adminPausedAt: null,
  setAdminPausedAt: (ts) => set({ adminPausedAt: ts }),
  connectionStatus: 'disconnected',
  transportBackend: 'direct',
  selectedBackend: '',
  latencyMs: 0,
  blockedBackends: [],
  regionBlocked: false,
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setTransportBackend: (backend) => set({ transportBackend: backend }),
  setLatency: (ms) => set({ latencyMs: ms }),
  setBlockedBackends: (backends) => set({ blockedBackends: backends }),
  setRegionBlocked: (blocked) => set({ regionBlocked: blocked }),
  syncStatus: 'idle' as const,
  syncLastTimestamp: '',
  totpSecret: '',
  pairingQrData: '',
  setSyncStatus: (status) => set({ syncStatus: status }),
  setSyncLastTimestamp: (ts) => set({ syncLastTimestamp: ts }),
  setTotpSecret: (secret) => set({ totpSecret: secret }),
  setPairingQrData: (data) => set({ pairingQrData: data }),
  userProfile: { name: 'User', bio: '', avatar: '', fields: [] },
  setUserProfile: (profile) => set((s: any) => ({
    userProfile: { ...s.userProfile, ...profile }
  })),
  companyId: null,
  companyChannels: [],
  companyMessages: [],
  companyMembers: [],
  companySettings: null,
  setCompanyName: (name) => set((s: any) => ({
    companySettings: s.companySettings ? { ...s.companySettings, name } : { name } as { name: string; logo?: string }
  })),
  setCompanySettings: (settings) => set({ companySettings: settings }),
  hideWhenOfficeOnly: false,
  pendingInvite: null,
  setCompanyId: (id) => set({ companyId: id }),
  setCompanyChannels: (channels) => set({ companyChannels: channels }),
  addCompanyMessage: (msg) => set((state) => ({ companyMessages: [...state.companyMessages, msg] })),
  setCompanyMembers: (members) => set({ companyMembers: members }),
  updateCompanyField: (field, value) => set((s: any) => ({
    companySettings: { ...(s.companySettings || { name: '' }), [field]: value }
  })),
  loadCompanySettings: async () => {
    const { getCompanySettings } = await import('../lib/idb');
    const stored = await getCompanySettings();
    if (stored) {
      set({ companySettings: stored as any });
    } else {
      const { MOCK_COMPANY_SETTINGS } = await import('../constants/companyMockData');
      set({ companySettings: { ...MOCK_COMPANY_SETTINGS } });
    }
  },
  saveCompanySettings: async () => {
    const { saveCompanySettings: persistSettings } = await import('../lib/idb');
    const current = useAppStore.getState().companySettings;
    if (current) {
      await persistSettings(current as unknown as Record<string, string>);
    }
  },
  setOnlineStatus: (status) => set({ onlineStatus: status, isOnline: status }),
  setHideWhenOfficeOnly: (hide) => set({ hideWhenOfficeOnly: hide }),
  initCompanyFromInvite: async (payload) => {
    const { initializeJoinFlow } = await import('../lib/company/onboarding/joinFlow');
    await initializeJoinFlow(payload, '');
    set({ pendingInvite: payload });
  },
}));
