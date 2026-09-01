/**
 * Mock data types
 */
export interface MockCall {
  id: number;
  name: string;
  time: string;
  type: 'incoming' | 'outgoing' | 'missed';
  duration?: string;
}

export interface MockChat {
  id: number;
  name: string;
  message: string;
  time: string;
  unread: number;
  online: boolean;
  color: string;
  isBot?: boolean;
  type?: 'group';
  createdAt?: number;
  memberIds?: string[];
  members?: Array<{ id: string; name: string; color: string; role: 'owner' | 'admin' | 'member' }>;
  group?: { inviteToken: string; slowModeSeconds: number; ownerId: string };
  history: Array<{
    id: number;
    sender: 'them' | 'me';
    text?: string;
    type?: 'image' | 'audio' | 'video' | 'file' | 'document';
    fileName?: string;
    url?: string;
    duration?: string;
    thumb?: string;
    time?: string;
    date?: string;
    status?: 'sent' | 'delivered' | 'read';
    keyboard?: Array<{ text: string; action: string }[]>;
    audioUrl?: string;
  }>;
}

export interface MockChannel {
  id: number;
  name: string;
  isChannel: true;
  message: string;
  time: string;
  unread: number;
  color: string;
  history: Array<{
    id: number;
    sender: 'them' | 'me';
    text?: string;
    type?: 'image' | 'audio' | 'video' | 'file' | 'document';
    fileName?: string;
    url?: string;
    duration?: string;
    thumb?: string;
    time?: string;
    date?: string;
    status?: 'sent' | 'delivered' | 'read';
    keyboard?: Array<{ text: string; action: string }[]>;
    audioUrl?: string;
  }>;
  subscribers?: number;
  username?: string;
  verified?: boolean;
  description?: string;
}

export interface OnlineContact {
  id: number;
  name: string;
  color: string;
}

/**
 * Company types
 */
export interface CompanyMember {
  userId: string;
  displayName: string;
  role: 'admin' | 'manager' | 'member';
  publicKey: string;
  joinedAt: number;
  lastActive: number;
  online: boolean;
  office?: string;
}

export interface CompanyChannel {
  id: string;
  companyId: string;
  officeId?: string;
  name: string;
  description: string;
  unread: number;
  memberCount: number;
  createdAt: number;
}

export interface CompanyMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
  reactions?: Record<string, string[]>;
  replyTo?: { id: string; senderName: string; text: string };
}

export interface CompanyDepartment {
  id: string;
  name: string;
  description?: string;
  color?: string;
  memberIds: string[];
  createdAt: number;
}

export interface CompanyContact {
  id: string;
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  departmentId?: string | null;
  notes?: string;
  createdAt: number;
}
