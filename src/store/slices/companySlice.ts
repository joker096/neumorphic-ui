const savedCompanyHide = (() => {
  try {
    return localStorage.getItem('app_hide_when_office_only') === 'true';
  } catch {
    return false;
  }
})();

import type { CompanyChannel, CompanyMessage, CompanyMember, CompanyDepartment, CompanyContact } from '../../types/constants';
import type { InviteQRPayload, CompanyEnvelope } from '../../lib/company/types';
import { createCompanySettingsActions } from './company/companySettingsActions';
import { createCompanyMemberActions } from './company/companyMemberActions';
import { createCompanyDirectoryActions } from './company/companyDirectoryActions';
import { createCompanyChannelActions } from './company/companyChannelActions';
import { createCompanyLifecycleActions } from './company/companyLifecycleActions';
import { createCompanyRosterActions } from './company/companyRosterActions';
import { createCompanySiteChatActions } from './company/companySiteChatActions';
import { createCompanyCrmSyncActions } from './company/companyCrmSyncActions';
import {
  DEFAULT_SITE_CHAT_CONFIG,
  type SiteChat,
  type SiteChatWidgetConfig,
  type WebsiteContactRecord,
} from './company/siteChatTypes';

// Site-chat widget/visitor types are declared next to the site-chat actions
// (which need them at runtime); re-exported here to keep the slice's public
// surface unchanged.
export { DEFAULT_SITE_CHAT_CONFIG };
export type { SiteChat, SiteChatWidgetConfig, WebsiteContactRecord };

export interface CompanySlice {
  companyId: string | null;
  activeGroupKey: CryptoKey | null;
  activeGroupKeyVersion: number;
  activeChannelId: string | null;
  companyCrmEnvelopes: CompanyEnvelope[];
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
  updateMemberRole: (userId: string, role: 'admin' | 'manager' | 'member') => void;
  renameMember: (userId: string, displayName: string) => void;
  removeMember: (userId: string) => void;
  setHideWhenOfficeOnly: (hide: boolean) => void;
  initCompanyFromInvite: (payload: InviteQRPayload) => Promise<void>;
  loadCompanySettings: () => Promise<void>;
  saveCompanySettings: () => Promise<void>;
  loadCompanyMessages: () => Promise<void>;
  createCompany: (name: string, displayName: string) => Promise<void>;
  isOnline: boolean;
  setOnlineStatus: (online: boolean) => void;
  companyDepartments: CompanyDepartment[];
  companyContacts: CompanyContact[];
  setCompanyDepartments: (departments: CompanyDepartment[]) => void;
  setCompanyContacts: (contacts: CompanyContact[]) => void;
  addCompanyDepartment: (input: { name: string; description?: string; color?: string; memberIds?: string[] }) => void;
  updateCompanyDepartment: (id: string, patch: Partial<Omit<CompanyDepartment, 'id' | 'createdAt'>>) => void;
  removeCompanyDepartment: (id: string) => void;
  addCompanyContact: (input: { name: string; title?: string; phone?: string; email?: string; departmentId?: string | null; notes?: string }) => void;
  updateCompanyContact: (id: string, patch: Partial<Omit<CompanyContact, 'id' | 'createdAt'>>) => void;
  removeCompanyContact: (id: string) => void;
  loadCompanyData: () => Promise<void>;
  createCompanyInvite: () => Promise<InviteQRPayload | null>;
  joinCompanyFromInvite: (payload: InviteQRPayload, displayName: string) => Promise<void>;
  joinCompanyChannel: (token?: string) => Promise<void>;
  leaveCompanyChannel: () => void;
  setActiveChannel: (id: string | null) => void;
  loadCompanyChannels: () => Promise<void>;
  siteChats: SiteChat[];
  channelKeys: Record<string, { publicKeyB64: string; secretKeyB64: string }>;
  createSiteChat: (name: string) => Promise<{ channelId: string; token: string; snippet: string } | null>;
  updateSiteChatConfig: (
    id: string,
    patch: Partial<SiteChatWidgetConfig>,
  ) => Promise<{ token: string; snippet: string } | null>;
  websiteContacts: WebsiteContactRecord[];
  ingestWebsiteContact: (data: {
    siteChatId: string;
    domain: string;
    name: string;
    email?: string;
    phone?: string;
    pageUrl?: string;
    pageTitle?: string;
    referrer?: string;
    ts?: number;
  }) => WebsiteContactRecord | null;
  removeWebsiteContact: (id: string) => void;
  pushCrmSyncEnvelope: (env: CompanyEnvelope) => void;
  syncCrmOutbound: () => Promise<{ ok: boolean }>;
  applyCrmEnvelope: (env: CompanyEnvelope) => Promise<void>;
  acceptInvite: (code: string) => Promise<boolean>;
  broadcastRoster: () => void;
}

/**
 * Company slice state + action wiring. The actions themselves live in
 * `./company/*` grouped by concern (settings/members/directory/channels/
 * lifecycle/roster/site-chat/CRM sync); each group is typed as
 * `Pick<CompanySlice, …>` so a renamed or dropped action fails `tsc`.
 * The live roster connection is owned by `./company/companyRosterState`.
 */
export const createCompanySlice = (set: any, get: any): CompanySlice => ({
  companyId: null,
  activeGroupKey: null,
  activeGroupKeyVersion: 1,
  activeChannelId: null,
  companyCrmEnvelopes: [],
  companyChannels: [],
  siteChats: [],
  websiteContacts: [],
  channelKeys: {},
  companyMessages: [],
  companyMembers: [],
  companySettings: null,
  companyDepartments: [],
  companyContacts: [],
  hideWhenOfficeOnly: savedCompanyHide,
  pendingInvite: null,
  isOnline: true,
  ...createCompanySettingsActions(set, get),
  ...createCompanyMemberActions(set, get),
  ...createCompanyDirectoryActions(set, get),
  ...createCompanyChannelActions(set, get),
  ...createCompanyLifecycleActions(set, get),
  ...createCompanyRosterActions(set, get),
  ...createCompanySiteChatActions(set, get),
  ...createCompanyCrmSyncActions(set, get),
});