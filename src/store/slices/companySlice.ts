import type { StateCreator } from 'zustand';
import type { AppState } from '../index';
import type { CompanyChannel, CompanyMessage, CompanyMember } from '../../constants';
import type { InviteQRPayload } from '../../lib/company/types';
import type { UserProfile } from '../../types/contact';

export interface CompanySlice {
  companyId: string | null;
  companyChannels: CompanyChannel[];
  companyMessages: CompanyMessage[];
  companyMembers: CompanyMember[];
  companySettings: {
    name: string;
    logo?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    taxId?: string;
  } | null;
  setCompanyName: (name: string) => void;
  setCompanySettings: (settings: {
    name: string;
    logo?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    taxId?: string;
  } | null) => void;
  updateCompanyField: <K extends string>(key: K, value: string) => void;
  userProfile: UserProfile;
  setUserProfile: (profile: Partial<UserProfile>) => void;
  hideWhenOfficeOnly: boolean;
  pendingInvite: InviteQRPayload | null;
  setCompanyId: (id: string | null) => void;
  setCompanyChannels: (channels: CompanyChannel[]) => void;
  addCompanyMessage: (msg: CompanyMessage) => void;
  setCompanyMembers: (members: CompanyMember[]) => void;
  setHideWhenOfficeOnly: (hide: boolean) => void;
  initCompanyFromInvite: (payload: InviteQRPayload) => Promise<void>;
  isOnline: boolean;
  setOnlineStatus: (online: boolean) => void;
}

export const createCompanySlice: StateCreator<AppState, [], [], CompanySlice> = (set) => ({
  companyId: null,
  companyChannels: [],
  companyMessages: [],
  companyMembers: [],
  companySettings: null,
  setCompanyName: (name) => set((s: any) => ({
    companySettings: s.companySettings ? { ...s.companySettings, name } : { name }
  })),
  setCompanySettings: (settings) => set({ companySettings: settings }),
  updateCompanyField: (key, value) => set((s: any) => ({
    companySettings: s.companySettings ? { ...s.companySettings, [key]: value } : { name: '', [key]: value }
  })),
  userProfile: { name: 'User', bio: '', avatar: '', fields: [] },
  setUserProfile: (profile) => set((s: any) => ({
    userProfile: { ...s.userProfile, ...profile }
  })),
  hideWhenOfficeOnly: false,
  pendingInvite: null,
  setCompanyId: (id) => set({ companyId: id }),
  setCompanyChannels: (channels) => set({ companyChannels: channels }),
  addCompanyMessage: (msg) => set((state) => ({ companyMessages: [...state.companyMessages, msg] })),
  setCompanyMembers: (members) => set({ companyMembers: members }),
  setHideWhenOfficeOnly: (hide) => set({ hideWhenOfficeOnly: hide }),
  initCompanyFromInvite: async (payload) => {
    const { initializeJoinFlow } = await import('../../lib/company/onboarding/joinFlow');
    await initializeJoinFlow(payload, '');
    set({ pendingInvite: payload });
  },
  isOnline: typeof navigator !== 'undefined' && navigator.onLine,
  setOnlineStatus: (online) => set({ isOnline: online }),
});
