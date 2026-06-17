import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { cryptoCore } from '../lib/crypto/cryptoCore';
import * as idb from 'idb-keyval';
import { deviceSecurity } from '../lib/deviceSecurity';
import type { Contact } from '../types/contact';

let sessionMasterKey: CryptoKey | null = null;

export const setSessionMasterKey = (key: CryptoKey | null): void => {
  sessionMasterKey = key;
};

export const initAppStorage = async () => {
   sessionMasterKey = await deviceSecurity.initSessionMasterKey();
   // Only after this the components using Zustand should render
};

// Encrypted idb storage for zustand
const writeQueue = new Map<string, string>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const processQueue = async () => {
  if (!sessionMasterKey) return;
  const entries = Array.from(writeQueue.entries());
  writeQueue.clear();
  
  for (const [name, value] of entries) {
    try {
      const encrypted = await cryptoCore.encryptData(value, sessionMasterKey);
      await idb.set(name, encrypted);
    } catch (e) {
      console.error('Failed to encrypt/write data', e);
    }
  }
};

const encryptedIdbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (writeQueue.has(name)) {
      return writeQueue.get(name) || null;
    }
    const data = await idb.get(name);
    if (!data) return null;
    if (typeof data !== 'object' || !data.cipher || !data.iv) return null; 
    
    if (!sessionMasterKey) {
      return null; 
    }
    
    try {
      return await cryptoCore.decryptData(data.cipher, data.iv, sessionMasterKey);
    } catch (e) {
      console.error('Failed to decrypt storage', e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (!sessionMasterKey) return;
    writeQueue.set(name, value);
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      processQueue();
    }, 1000); // 1 second debounce
  },
  removeItem: async (name: string): Promise<void> => {
    writeQueue.delete(name);
    await idb.del(name);
  },
};

export interface P2PChannel {
   id: string;
   name: string;
   ownerPublicKey: string;
   channelId: string;
   subscriberCount: number;
   postCount: number;
   isPrivate: boolean;
   isPublic: boolean;
   createdAt: number;
   description?: string;
   rules?: string[];
   settings?: {
      canPost?: boolean;
      canComment?: boolean;
      commentsRequireApproval?: boolean;
      canReact?: boolean;
      allowDownloads?: boolean;
      pinMessages?: boolean;
      showSubscribers?: boolean;
      allowForwarding?: boolean;
      allowReactions?: boolean;
      allowComments?: boolean;
      allowEditing?: boolean;
      allowDeletion?: boolean;
      allowDeletionByOwner?: boolean;
      allowDeletionByAdmin?: boolean;
      allowDeletionByModerator?: boolean;
      allowDeletionByBot?: boolean;
      allowDeletionByUser?: boolean;
      allowDeletionBySystem?: boolean;
   };
signedAt?: number;
    signedBy?: string;
    signingKey?: string;
    privateKey?: string;
    postKey?: string; // per-post key for E2EE comments
    discussionGroupId?: string;
  }

export interface BotConfig {
  id: string;
  name: string;
  token: string;
  publicKey: string;
  ownerId: string;
  commands: any[];
  permissions: any;
  isRunning: boolean;
}

export interface DeviceInfo {
  id: string;
  name: string;
  platform: string;
  lastActive: number;
  isCurrent: boolean;
}

export interface SessionData {
  deviceId: string;
  startTime: number;
  isActive: boolean;
}

export interface PollOption {
  text: string;
  votes: string[];
}

export interface PollMessage {
  id: number;
  text: string;
  options: PollOption[];
  multiple: boolean;
  isQuiz?: boolean;
  correctOption?: number;
  isAnonymous?: boolean;
  votes: Record<string, string[]>;
  createdBy: string;
}

export interface CloudSyncState {
  enabled: boolean;
  lastSync: number | null;
  pendingChanges: number;
  status: 'idle' | 'syncing' | 'error' | 'success';
  errorMessage: string | null;
  provider: 'local' | 'firebase' | 'supabase' | 'custom';
}

export interface LocationShare {
  id: string;
  chatId: string | number;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  expiresAt: number;
  isLive: boolean;
}

export interface PhotoEditState {
  imageData: string;
  crop: { x: number; y: number; width: number; height: number } | null;
  drawings: Array<{ type: 'line' | 'rect' | 'text'; points: number[]; color: string; size: number }>;
  textElements: Array<{ x: number; y: number; text: string; color: string; size: number }>;
}

export interface ScheduledMessage {
  id: string;
  chatId: string | number;
  text: string;
  scheduledAt: number;
}

export interface ScheduledMessageQueue {
  messages: ScheduledMessage[];
  addMessage: (msg: ScheduledMessage) => void;
  removeMessage: (id: string) => void;
}

interface AppState {
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
  forwardAnonymization: boolean;
  currentLanguage: string;

  // Sound
  soundEnabled: boolean;
  soundVolume: number;

  // Radial Hub states (persist across navigation)
  radialDnd: boolean;
  radialProxy: boolean;
  radialEnergy: boolean;

  // Forward privacy controls
  allowForwarding: boolean;
  allowMetadata: boolean;
  forwardCountLimit: number;

  // Read receipt controls per-contact
  contactReadReceipts: Record<string, boolean>;
  toggleContactReadReceipt: (chatId: string | number, enabled: boolean) => void;

  // Multi-device sync
  devices: DeviceInfo[];
  currentSession: SessionData;
  addDevice: (device: DeviceInfo) => void;
  removeDevice: (id: string) => void;

  // Polls
  polls: PollMessage[];
  addPoll: (poll: PollMessage) => void;
  removePoll: (id: number) => void;
  voteOnPoll: (pollId: number, optionIndex: number, userId: string) => void;

  // Cloud sync
  cloudSync: CloudSyncState;
  setCloudSyncEnabled: (enabled: boolean) => void;
  updateCloudSyncStatus: (status: Partial<CloudSyncState>) => void;
  triggerCloudSync: () => Promise<void>;

  // Location sharing
  locationShares: LocationShare[];
  addLocationShare: (share: LocationShare) => void;
  removeLocationShare: (id: string) => void;
  updateLocationShare: (id: string, updates: Partial<LocationShare>) => void;
  startLiveLocation: (chatId: string | number, durationMinutes: number) => void;
  stopLiveLocation: (chatId: string | number) => void;

  // Photo editor
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

  // Favorites
  favoriteContacts: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  
  channels: P2PChannel[];
  setChannels: (updater: P2PChannel[] | ((prev: P2PChannel[]) => P2PChannel[])) => void;

  bots: BotConfig[];
  setBots: (updater: BotConfig[] | ((prev: BotConfig[]) => BotConfig[])) => void;

  scheduledQueue: ScheduledMessageQueue;

  archivedChats: (string | number)[];
  toggleArchive: (id: string | number) => void;

  activeCall: { number: string; startTime: number; isMuted: boolean; isSpeaker: boolean; isVideo?: boolean; isRecording?: boolean } | null;
  setActiveCall: (call: AppState['activeCall']) => void;

  // Call recordings
  recordings: any[];
  recordingsSearchQuery: string;
  recordingsSortBy: string;
  recordingsSortOrder: string;
  addRecording: (recording: any) => void;
  deleteRecording: (id: string) => void;
  toggleFavorite: (id: string) => void;

  // Pinned messages
  pinnedMessageList: Array<{ id: number; chatId: string | number; pinBy: string; pinnedAt: number }>;
  addPinnedMessage: (pin: { id: number; chatId: string | number; pinBy: string }) => void;
  removePinnedMessage: (id: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
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
      forwardAnonymization: false,
      currentLanguage: 'en',
      
      soundEnabled: true,
      soundVolume: 0.7,
      radialDnd: false,
      radialProxy: true,
      radialEnergy: false,

      // Forward privacy controls
      allowForwarding: true,
      allowMetadata: true,
      forwardCountLimit: 3,
      
      // Read receipt controls per-contact
      contactReadReceipts: {},
      toggleContactReadReceipt: (chatId, enabled) => set((state) => ({
        contactReadReceipts: { ...state.contactReadReceipts, [String(chatId)]: enabled }
      })),
      
      // Multi-device sync
      devices: [
        { id: 'current-device', name: 'This Device', platform: 'web', lastActive: Date.now(), isCurrent: true }
      ],
      currentSession: { deviceId: 'current-device', startTime: Date.now(), isActive: true },
      addDevice: (device) => set((state) => ({ devices: [...state.devices, device] })),
      removeDevice: (id) => set((state) => ({
        devices: state.devices.filter(d => d.id !== id)
      })),
      
      // Polls
      polls: [],
      addPoll: (poll) => set((state) => ({ polls: [...state.polls, poll] })),
      removePoll: (id) => set((state) => ({ polls: state.polls.filter(p => p.id !== id) })),
      voteOnPoll: (pollId, optionIndex, userId) => set((state) => ({
        polls: state.polls.map(p => {
          if (p.id !== pollId) return p;
          const updatedOptions = p.options.map((opt, idx) => {
            if (idx === optionIndex) {
              return { ...opt, votes: [...opt.votes, userId] };
            }
            return opt;
          });
          return { ...p, options: updatedOptions };
        })
      })),
      
      // Cloud sync
      cloudSync: {
        enabled: false,
        lastSync: null,
        pendingChanges: 0,
        status: 'idle',
        errorMessage: null,
        provider: 'local'
      },
      setCloudSyncEnabled: (enabled) => set((state) => ({ cloudSync: { ...state.cloudSync, enabled } })),
      updateCloudSyncStatus: (status) => set((state) => ({ cloudSync: { ...state.cloudSync, ...status } })),
      triggerCloudSync: async () => {
        set((state) => ({ cloudSync: { ...state.cloudSync, status: 'syncing', errorMessage: null } }));
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          set((state) => ({
            cloudSync: {
              ...state.cloudSync,
              status: 'success',
              lastSync: Date.now(),
              pendingChanges: 0
            }
          }));
        } catch (error: any) {
          set((state) => ({
            cloudSync: {
              ...state.cloudSync,
              status: 'error',
              errorMessage: error.message || 'Sync failed'
            }
          }));
        }
      },

      // Location sharing
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
            id: `loc_${Date.now()}`,
            chatId,
            userId: 'current-user',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
            expiresAt: Date.now() + durationMinutes * 60 * 1000,
            isLive: true
          };
          set((state) => ({ locationShares: [...state.locationShares, share] }));
          
          const watchId = navigator.geolocation.watchPosition((pos) => {
            set((state) => ({
              locationShares: state.locationShares.map(s => 
                s.id === share.id ? { 
                  ...s, 
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy,
                  timestamp: Date.now()
                } : s
              )
            }));
          });
          
          setTimeout(() => {
            navigator.geolocation.clearWatch(watchId);
            set((state) => ({
              locationShares: state.locationShares.map(s => 
                s.id === share.id ? { ...s, isLive: false } : s
              )
            }));
          }, durationMinutes * 60 * 1000);
        });
      },
      stopLiveLocation: (chatId) => set((state) => ({
        locationShares: state.locationShares.map(s => 
          s.chatId === chatId && s.isLive ? { ...s, isLive: false } : s
        )
      })),

      // Photo editor
      photoEditState: null,
      setPhotoEditState: (state) => set({ photoEditState: state }),
      updatePhotoEditCrop: (crop) => set((state) => ({
        photoEditState: state.photoEditState ? { ...state.photoEditState, crop } : null
      })),
      addPhotoEditDrawing: (drawing) => set((state) => ({
        photoEditState: state.photoEditState 
          ? { ...state.photoEditState, drawings: [...state.photoEditState.drawings, drawing] }
          : null
      })),
      addPhotoEditText: (text) => set((state) => ({
        photoEditState: state.photoEditState 
          ? { ...state.photoEditState, textElements: [...state.photoEditState.textElements, text] }
          : null
      })),
      resetPhotoEditor: () => set({ photoEditState: null }),

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setSoundVolume: (volume) => set({ soundVolume: volume }),
      setRadialDnd: (dnd) => set({ radialDnd: dnd }),
      setRadialProxy: (proxy) => set({ radialProxy: proxy }),
      setRadialEnergy: (energy) => set({ radialEnergy: energy }),

      setAppLock: (hash, salt) => set({ appLockHashedPIN: hash, appLockSalt: salt }),
      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
      
      forwardMessage: (message: any, targetChatId: string) => {
        set((storeState) => {
          const anonymized = storeState.forwardAnonymization ? {
            ...message,
            forwardedFrom: undefined,
            originalAuthor: undefined,
            metadata: undefined,
            forwardedAt: Date.now()
          } : message;
          
          const updatedChats = storeState.chats.map((chat: any) => {
            if (chat.id === targetChatId && Array.isArray(chat.history)) {
              return {
                ...chat,
                history: [...chat.history, anonymized]
              };
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

      // Favorites
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
      toggleArchive: (id) => set((state) => ({ archivedChats: state.archivedChats.includes(id) ? state.archivedChats.filter(i => i !== id) : [...state.archivedChats, id] })),

      activeCall: null,
      setActiveCall: (call) => set({ activeCall: call }),

      // Call recordings
      recordings: [],
      recordingsSearchQuery: '',
      recordingsSortBy: 'date',
      recordingsSortOrder: 'desc',
      addRecording: (recording) => set((state: any) => ({ recordings: [recording, ...state.recordings] })),
      deleteRecording: (id) => set((state: any) => ({ recordings: state.recordings.filter((r: any) => r.id !== id) })),
      toggleFavorite: (id) => set((state: any) => ({
        recordings: state.recordings.map((r: any) => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r)
      })),

      // Pinned messages
      pinnedMessageList: [],
      addPinnedMessage: (pin) => set((state) => ({ pinnedMessageList: [...state.pinnedMessageList, { ...pin, pinnedAt: state.pinnedMessageList.length }] })),
      removePinnedMessage: (id) => set((state) => ({ pinnedMessageList: state.pinnedMessageList.filter(p => p.id !== id) })),
    }),
    {
      name: 'nexus-messenger-storage',
      storage: createJSONStorage(() => encryptedIdbStorage),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Clear cached messages older than 7 days to prevent bloat
          setTimeout(() => {
            const now = Date.now();
            const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
            let hasChanges = false;
            
            const cleanedChats = state.chats.map((chat: any) => {
              if (!chat.history || chat.history.length === 0) return chat;
              const originalLength = chat.history.length;
              const newHistory = chat.history.filter((msg: any) => {
                // If the msg.id points to a JS timestamp, check expiration
                if (typeof msg.id === 'number' && msg.id > 1000000000000) {
                  return now - msg.id <= SEVEN_DAYS;
                }
                return true;
              });
              if (newHistory.length !== originalLength) {
                hasChanges = true;
              }
              return { ...chat, history: newHistory };
            });

            if (hasChanges) {
              state.setChats(cleanedChats);
              console.log('Cleared expired/stale messages from the encrypted cache.');
            }
          }, 2000);
        }
      }
    }
  )
);
