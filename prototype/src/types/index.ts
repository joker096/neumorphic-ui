/** Domain types, spec §6. */

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  status?: string;
}

export interface VoiceMessage {
  duration: string;
  /** Normalised 0..1 peaks for the 30-bar waveform. */
  waveform: number[];
}

export interface Message {
  id: string;
  chatId: string;
  from: 'me' | string;
  text?: string;
  time: string;
  status?: MessageStatus;
  images?: string[];
  voice?: VoiceMessage;
}

export interface Chat {
  id: string;
  title: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unread?: number;
  isGroup?: boolean;
  /** Group avatars use a gradient instead of a photo. */
  accent?: string;
}

export interface SharedMediaGroup {
  id: string;
  label: string;
  images: string[];
}

export interface SharedLink {
  id: string;
  title: string;
  url: string;
  date: string;
}

export interface SharedDocument {
  id: string;
  title: string;
  meta: string;
  date: string;
}
