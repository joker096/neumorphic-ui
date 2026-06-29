export type CompanyRole = 'admin' | 'member'

export interface CompanyUser {
  userId: string
  companyId: string
  displayName: string
  publicKey: Uint8Array
  signatureKey: Uint8Array
  devices: DeviceRecord[]
  joinedAt: number
  role: CompanyRole
}

export interface DeviceRecord {
  deviceId: string
  name: string
  publicKey: Uint8Array
  masterKeyRef: string
  isCurrent: boolean
  lastActive: number
}

export interface WrappedKey {
  memberPublicKey: string
  ciphertext: string
  nonce: string
}

export interface GroupKeyMaterial {
  version: number
  key: CryptoKey
  wrappedFor: WrappedKey[]
  createdAt: number
  rotatedBy?: string
  reason?: 'join' | 'leave' | 'compromise' | 'scheduled'
}

export interface CompanyEnvelope {
  iv: string
  ciphertext: string
  senderPubKey: string
  companyId: string
  groupKeyVersion: number
  timestamp: number
}

export interface InviteQRPayload {
  org: string
  code: string
  name: string
  adminKey: string
  expiresAt?: number
}

export interface JoinRequest {
  type: 'company-join-request'
  companyId: string
  inviteCode: string
  devicePublicKey: string
  signature: string
  displayName: string
}

export interface JoinAck {
  type: 'company-join-ack'
  groupKey: string
  groupKeyVersion: number
  members: string[]
  wrappedBy: string
}

export interface KeyRotateMessage {
  type: 'company-key-rotate'
  version: number
  wrappedFor: WrappedKey[]
  rotatedBy: string
  reason: 'join' | 'leave' | 'compromise' | 'scheduled'
  timestamp: number
}

export interface LeaveNotice {
  type: 'company-leave'
  userId: string
  deviceId: string
  timestamp: number
}

export interface KeyRequest {
  type: 'company-key-request'
  deviceId: string
  publicKey: string
}

export interface CompanyMember {
  userId: string
  displayName: string
  role: CompanyRole
  publicKey: string
  joinedAt: number
  lastActive: number
  online: boolean
  office?: string
}

export interface CompanyChannel {
  id: string
  companyId: string
  officeId?: string
  name: string
  description?: string
  unread: number
  memberCount: number
  createdAt: number
}

export interface CompanyMessage {
  id: string
  channelId: string
  senderId: string
  senderName: string
  text: string
  timestamp: number
  status: 'sent' | 'delivered' | 'read'
  replyTo?: { id: string; senderName: string; text: string }
  reactions?: Record<string, string[]>
}

export interface CompanyState {
  currentUser: CompanyUser | null
  companyId: string | null
  members: Map<string, CompanyMember>
  companyChannels: CompanyChannel[]
  activeChannelId: string | null
  messages: Map<string, CompanyEnvelope[]>
  devices: DeviceRecord[]
  currentDeviceId: string | null
  activeGroupKey: GroupKeyMaterial | null
  oldGroupKeys: GroupKeyMaterial[]
  isCompanyViewOpen: boolean
  pendingInvite: InviteQRPayload | null
}

export type CompanyTopic = 
  | `company:${string}:join`
  | `company:${string}:join-ack`
  | `company:${string}:key-rotate`
  | `company:${string}:leave`
  | `company:${string}:chat`
  | `company:${string}:key-request`
  | `company:${string}:office:${string}:chat`

export interface CompanyTopicMatch {
  companyId: string
  officeId?: string
  type: 'join' | 'join-ack' | 'key-rotate' | 'leave' | 'chat' | 'key-request'
}