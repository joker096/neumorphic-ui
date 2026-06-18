export type FieldType = 'phone' | 'email' | 'telegram' | 'whatsapp' | 'signal' | 'custom';
export type PhoneSubtype = 'mobile' | 'work' | 'home' | 'main';

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
  localFields?: ContactField[];
}
