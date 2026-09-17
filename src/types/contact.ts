export type FieldType = 'phone' | 'email' | 'telegram' | 'whatsapp' | 'signal' | 'signalv2v' | 'custom';
export type PhoneSubtype = 'mobile' | 'work' | 'home' | 'main';
export type ContactTag = 'client' | 'lead' | 'partner' | 'vendor' | 'internal' | 'vip';
/** Origin of a contact — personal, business (CRM/company) or website embed. */
export type ContactSource = 'personal' | 'business' | 'website';

export interface ContactField {
  id: string;
  type: FieldType;
  label: string;
  value: string;
  phoneSubtype?: PhoneSubtype;
}

export interface Contact {
  name: string;
  id: string;
  color: string;
  lastSeen: number;
  isFavorite?: boolean;
  isBlocked?: boolean;
  muted?: boolean;
  localFields?: ContactField[];
  telegram?: string;
  whatsapp?: string;
  signal?: string;
  email?: string;
  company?: string;
  position?: string;
  tags?: ContactTag[];
  lastInteraction?: number;
  notes?: string;
  profileShare?: {
    state?: string;
    updatedAt?: number;
  } | string;
  channelId?: string;
  channelIds?: string[];
  /** Where this contact came from — specifically 'website' marks embed-imported visitors. */
  source?: ContactSource;
  /** Origin domain of the website that submitted this visitor (e.g. 'example.com'). */
  websiteDomain?: string;
}

export interface UserProfile {
  name: string;
  username?: string;
  bio?: string;
  avatar?: string;
  avatarColor?: string;
  fields?: Array<{
    type: string;
    value: string;
    label: string;
    visibleTo?: string;
  }>;
  id?: string;
  color?: string;
  lastSeen?: number;
  isFavorite?: boolean;
  isBlocked?: boolean;
  email?: string;
  company?: string;
  position?: string;
  notes?: string;
  status?: string;
  profileShare?: {
    state?: string;
    updatedAt?: number;
  } | string;
  channelId?: string;
  channelIds?: string[];
}
