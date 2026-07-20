import type { ActiveCall } from '../lib/call/types';
import type { CompanyChannel, CompanyMessage, CompanyMember } from '../constants';
import type { InviteQRPayload } from '../lib/company/types';

// --- P2P Channel ---
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
   postKey?: string;
   discussionGroupId?: string;
}

// --- Bot ---
export interface BotPermissions {
  readMessages: boolean;
  sendMessages: boolean;
  editMessages: boolean;
  deleteMessages: boolean;
  inlineKeyboard: boolean;
  readUserData: boolean;
  accessGroups: boolean;
  accessFiles: boolean;
}

export interface BotConfig {
  id: string;
  name: string;
  token: string;
  publicKey: string;
  ownerId: string;
  commands: any[];
  permissions: BotPermissions;
  isRunning: boolean;
}

// --- Device / Session ---
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

// --- Polls ---
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

// --- Cloud Sync ---
export interface CloudSyncState {
  enabled: boolean;
  lastSync: number | null;
  pendingChanges: number;
  status: 'idle' | 'syncing' | 'error' | 'success';
  errorMessage: string | null;
  provider: 'local' | 'firebase' | 'supabase' | 'custom';
}

// --- Location ---
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

// --- Call Folders ---
export interface CallFolder {
  id: string;
  name: string;
  filter?: 'all' | 'incoming' | 'outgoing' | 'missed';
}

// --- Scheduled Messages ---
export interface ScheduledMessage {
  id: string;
  chatId: string | number;
  text: string;
  scheduledAt: number;
}

// --- Connection ---
export interface ConnectionState {
  transportBackend: string;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'blocked' | 'error';
  selectedBackend: string;
  latencyMs: number;
  blockedBackends: string[];
  regionBlocked: boolean;
}
