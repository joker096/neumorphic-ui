const savedCompanyHide = localStorage.getItem('app_hide_when_office_only') === 'true';

import type { CompanyChannel, CompanyMessage, CompanyMember } from '../../constants';
import type { InviteQRPayload } from '../../lib/company/types';
import * as idb from '../../lib/idb';
import { generateCompanyId, createCompanyUser, saveMembers } from '../../lib/company/companyUser';

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
  updateCompanyField: (field: string, value: any) => void;
  hideWhenOfficeOnly: boolean;
  pendingInvite: InviteQRPayload | null;
  setCompanyId: (id: string | null) => void;
  setCompanyChannels: (channels: CompanyChannel[]) => void;
  addCompanyMessage: (msg: CompanyMessage) => void;
  setCompanyMembers: (members: CompanyMember[]) => void;
  setHideWhenOfficeOnly: (hide: boolean) => void;
  initCompanyFromInvite: (payload: InviteQRPayload) => Promise<void>;
  loadCompanySettings: () => Promise<void>;
  saveCompanySettings: () => Promise<void>;
  createCompany: (name: string, displayName: string) => Promise<void>;
  isOnline: boolean;
  setOnlineStatus: (online: boolean) => void;
}

export const createCompanySlice = (set: any, get: any): CompanySlice => ({
  companyId: null,
  companyChannels: [],
  companyMessages: [],
  companyMembers: [],
  companySettings: null,
  setCompanyName: (name) => set((state: any) => ({
    companySettings: state.companySettings ? { ...state.companySettings, name } : { name } as { name: string; logo?: string }
  })),
  setCompanySettings: (settings) => set({ companySettings: settings }),
  updateCompanyField: (field, value) => set((state: any) => ({
    companySettings: state.companySettings ? { ...state.companySettings, [field]: value } : { name: '', [field]: value }
  })),
  hideWhenOfficeOnly: savedCompanyHide,
  pendingInvite: null,
  setCompanyId: (id) => set({ companyId: id }),
  setCompanyChannels: (channels) => set({ companyChannels: channels }),
  addCompanyMessage: (msg) => set((state: any) => ({ companyMessages: [...state.companyMessages, msg] })),
  setCompanyMembers: (members) => set({ companyMembers: members }),
  setHideWhenOfficeOnly: (hide) => {
    set({ hideWhenOfficeOnly: hide });
    localStorage.setItem('app_hide_when_office_only', String(hide));
  },
  initCompanyFromInvite: async (payload) => {
    const { initializeJoinFlow } = await import('../../lib/company/onboarding/joinFlow');
    await initializeJoinFlow(payload, '');
    set({ pendingInvite: payload });
  },
  loadCompanySettings: async () => {
    const { getCompanySettings } = await import('../../lib/idb');
    const stored = await getCompanySettings();
    if (stored) {
      set({ companySettings: stored as any });
    } else {
      const { MOCK_COMPANY_SETTINGS } = await import('../../constants/companyMockData');
      set({ companySettings: { ...MOCK_COMPANY_SETTINGS } });
    }
  },
  saveCompanySettings: async () => {
    const { saveCompanySettings: persistSettings } = await import('../../lib/idb');
    const current = get().companySettings;
    if (current) {
      await persistSettings(current as unknown as Record<string, string>);
    }
  },
  createCompany: async (name, displayName) => {
    const companyId = generateCompanyId();
    const user = await createCompanyUser(displayName, companyId, 'admin');
    const members: CompanyMember[] = [{
      userId: user.userId,
      displayName: user.displayName,
      role: 'admin',
      publicKey: btoa(String.fromCharCode(...user.publicKey)),
      joinedAt: Date.now(),
      lastActive: Date.now(),
      online: true,
    }];
    const settings = { name, phone: '', email: '', address: '', website: '', taxId: '' };
    set({
      companyId,
      companySettings: settings,
      companyMembers: members,
    });
    await idb.saveCompanySettings(settings as unknown as Record<string, string>);
    await saveMembers(members);
  },
  isOnline: true,
  setOnlineStatus: (online) => set({ isOnline: online }),
});
