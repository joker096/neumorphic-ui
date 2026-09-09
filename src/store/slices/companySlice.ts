const savedCompanyHide = (() => {
  try {
    return localStorage.getItem('app_hide_when_office_only') === 'true';
  } catch {
    return false;
  }
})();

import type { CompanyChannel, CompanyMessage, CompanyMember, CompanyDepartment, CompanyContact } from '../../types/constants';
import type { InviteQRPayload, CompanyEnvelope } from '../../lib/company/types';
import type { CrmContact, Deal, CrmTask } from '../../lib/crm/types';
import * as idb from '../../lib/idb';
import type { CompanyRosterSync, RosterMember, CompanyRosterHandlers } from '../../lib/company/relayRoster';
import { toast } from 'sonner';

// Active serverless roster/presence sync connection (one per store instance).
let activeRoster: CompanyRosterSync | null = null;

export interface SiteChat {
  id: string;
  name: string;
  token: string;
  snippet: string;
  createdAt: number;
}

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
  pushCrmSyncEnvelope: (env: CompanyEnvelope) => void;
  syncCrmOutbound: () => Promise<{ ok: boolean }>;
  applyCrmEnvelope: (env: CompanyEnvelope) => Promise<void>;
  acceptInvite: (code: string) => Promise<boolean>;
  broadcastRoster: () => void;
}

export const createCompanySlice = (set: any, get: any): CompanySlice => ({
  companyId: null,
  activeGroupKey: null,
  activeGroupKeyVersion: 1,
  activeChannelId: null,
  companyCrmEnvelopes: [],
  companyChannels: [],
  siteChats: [],
  channelKeys: {},
  companyMessages: [],
  companyMembers: [],
  companySettings: null,
  companyDepartments: [],
  companyContacts: [],
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
  addCompanyMessage: (msg) => {
    set((state: any) => ({ companyMessages: [...state.companyMessages, msg] }));
    idb.addCompanyMessage(msg).catch(() => {});
  },
  loadCompanyMessages: async () => {
    try {
      const msgs = await idb.getAllCompanyMessages();
      if (msgs.length > 0) {
        set({ companyMessages: msgs });
      }
    } catch {
      /* ignore */
    }
  },
  setCompanyMembers: (members) => set({ companyMembers: members }),
  updateMemberRole: (userId, role) => {
    const next = get().companyMembers.map((m: CompanyMember) =>
      m.userId === userId ? { ...m, role } : m,
    );
    set({ companyMembers: next });
    import('../../lib/company/companyUser')
      .then(({ saveMembers }) => saveMembers(next))
      .catch(() => {});
    get().broadcastRoster();
  },
  renameMember: (userId, displayName) => set((state: any) => ({
    companyMembers: state.companyMembers.map((m: CompanyMember) =>
      m.userId === userId ? { ...m, displayName } : m,
    ),
  })),
  removeMember: (userId) => {
    const next = get().companyMembers.filter((m: CompanyMember) => m.userId !== userId);
    set({ companyMembers: next });
    import('../../lib/company/companyUser')
      .then(({ saveMembers }) => saveMembers(next))
      .catch(() => {});
    get().broadcastRoster();
  },
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
    const stored = await idb.getCompanySettings();
    if (stored) {
      set({ companySettings: stored as any });
    }
    const storedId = await idb.getCompanyId();
    if (storedId) {
      set({ companyId: storedId });
      get().joinCompanyChannel();
    }
    const storedMembers = await idb.getCompanyMembers();
    if (storedMembers && storedMembers.length > 0) {
      set({ companyMembers: storedMembers });
    }
    if (storedId) {
      const raw = await idb.getCompanyGroupKey(storedId);
      if (raw) {
        try {
          const { importRawKey } = await import('../../lib/company/groupKey');
          set({ activeGroupKey: await importRawKey(raw), activeGroupKeyVersion: 1 });
        } catch {
          /* ignore corrupt key */
        }
      }
      const chans = await idb.getCompanyChannels();
      if (chans && chans.length) {
        set({ companyChannels: chans, activeChannelId: get().activeChannelId ?? chans[0].id });
      }
      const envs = await idb.getCompanyCrmEnvelopes();
      if (envs && envs.length) set({ companyCrmEnvelopes: envs });
      const ck = await idb.getCompanyChannelKeys();
      if (ck) set({ channelKeys: ck as Record<string, { publicKeyB64: string; secretKeyB64: string }> });
      const sc = await idb.getCompanySiteChats();
      if (sc) set({ siteChats: sc as SiteChat[] });
    }
  },
  saveCompanySettings: async () => {
    const current = get().companySettings;
    if (current) {
      await idb.saveCompanySettings(current as unknown as Record<string, string>);
    }
  },
  createCompany: async (name, displayName) => {
    const { generateCompanyId, createCompanyUser, saveMembers } = await import('../../lib/company/companyUser');
    const { b64encode } = await import('../../lib/crypto/cryptoCore');
    const { generateGroupKey, exportRawKey } = await import('../../lib/company/groupKey');
    const companyId = generateCompanyId();
    const user = await createCompanyUser(displayName, companyId, 'admin');
    const currentUserId = get().userProfile?.id || user.userId;
    const members: CompanyMember[] = [{
      userId: currentUserId,
      displayName: user.displayName,
      role: 'admin',
      publicKey: b64encode(user.publicKey),
      joinedAt: Date.now(),
      lastActive: Date.now(),
      online: true,
    }];
    const settings = { name, phone: '', email: '', address: '', website: '', taxId: '' };
    const groupKey = await generateGroupKey();
    const groupRaw = await exportRawKey(groupKey);
    const channel: CompanyChannel = {
      id: `chan_${companyId}_general`,
      companyId,
      name: 'General',
      description: 'Team channel',
      unread: 0,
      memberCount: members.length,
      createdAt: Date.now(),
    };
    set({
      companyId,
      companySettings: settings,
      companyMembers: members,
      activeGroupKey: groupKey,
      activeGroupKeyVersion: 1,
      companyChannels: [channel],
      activeChannelId: channel.id,
    });
    await idb.saveCompanySettings(settings as unknown as Record<string, string>);
    await idb.saveCompanyId(companyId);
    await saveMembers(members);
    await idb.saveCompanyGroupKey(companyId, groupRaw);
    await idb.saveCompanyChannels([channel]);
    get().joinCompanyChannel();
  },
  createCompanyInvite: async () => {
    const id = get().companyId;
    if (!id) return null;
    const { generateInviteCode } = await import('../../lib/company/companyUser');
    const code = generateInviteCode();
    const name = get().companySettings?.name || 'Company';
    const adminKey = get().companyMembers.find((m: CompanyMember) => m.role === 'admin')?.publicKey || '';
    const payload: InviteQRPayload = { org: id, code, name, adminKey };
    return payload;
  },
  joinCompanyFromInvite: async (payload, displayName) => {
    const { createCompanyUser, saveMembers } = await import('../../lib/company/companyUser');
    const { b64encode } = await import('../../lib/crypto/cryptoCore');
    const { generateGroupKey, exportRawKey, importRawKey } = await import('../../lib/company/groupKey');
    const user = await createCompanyUser(displayName, payload.org, 'member');
    const currentUserId = get().userProfile?.id || user.userId;
    const member: CompanyMember = {
      userId: currentUserId,
      displayName: user.displayName,
      role: 'member',
      publicKey: b64encode(user.publicKey),
      joinedAt: Date.now(),
      lastActive: Date.now(),
      online: true,
    };
    const members = [...get().companyMembers, member];
    // NOTE: in production the admin delivers a wrapped group key over the
    // relay; here we reuse an existing local key or generate a fresh one so a
    // second local profile can still participate in the demo.
    let groupKey: CryptoKey | null = null;
    try {
      const existing = await idb.getCompanyGroupKey(payload.org);
      if (existing) groupKey = await importRawKey(existing);
    } catch {
      groupKey = null;
    }
    if (!groupKey) {
      groupKey = await generateGroupKey();
      await idb.saveCompanyGroupKey(payload.org, await exportRawKey(groupKey));
    }
    set({ companyId: payload.org, companyMembers: members, activeGroupKey: groupKey, activeGroupKeyVersion: 1 });
    await idb.saveCompanyId(payload.org);
    await saveMembers(members);
    get().joinCompanyChannel();
  },
  isOnline: true,
  setOnlineStatus: (online) => set({ isOnline: online }),
  setCompanyDepartments: (departments) => set({ companyDepartments: departments }),
  setCompanyContacts: (contacts) => set({ companyContacts: contacts }),
  addCompanyDepartment: (input) => {
    const dept: CompanyDepartment = {
      id: `dep_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`,
      name: input.name,
      description: input.description,
      color: input.color,
      memberIds: input.memberIds || [],
      createdAt: Date.now(),
    };
    set((state: any) => ({ companyDepartments: [...state.companyDepartments, dept] }));
    const { saveCompanyDepartments } = idb;
    saveCompanyDepartments(get().companyDepartments).catch(() => {});
  },
  updateCompanyDepartment: (id, patch) => {
    set((state: any) => ({
      companyDepartments: state.companyDepartments.map((d: CompanyDepartment) =>
        d.id === id ? { ...d, ...patch } : d,
      ),
    }));
    idb.saveCompanyDepartments(get().companyDepartments).catch(() => {});
  },
  removeCompanyDepartment: (id) => {
    set((state: any) => ({
      companyDepartments: state.companyDepartments.filter((d: CompanyDepartment) => d.id !== id),
      companyContacts: state.companyContacts.map((c: CompanyContact) =>
        c.departmentId === id ? { ...c, departmentId: null } : c,
      ),
    }));
    idb.saveCompanyDepartments(get().companyDepartments).catch(() => {});
    idb.saveCompanyContacts(get().companyContacts).catch(() => {});
  },
  addCompanyContact: (input) => {
    const contact: CompanyContact = {
      id: `con_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`,
      name: input.name,
      title: input.title,
      phone: input.phone,
      email: input.email,
      departmentId: input.departmentId ?? null,
      notes: input.notes,
      createdAt: Date.now(),
    };
    set((state: any) => ({ companyContacts: [...state.companyContacts, contact] }));
    idb.saveCompanyContacts(get().companyContacts).catch(() => {});
  },
  updateCompanyContact: (id, patch) => {
    set((state: any) => ({
      companyContacts: state.companyContacts.map((c: CompanyContact) =>
        c.id === id ? { ...c, ...patch, departmentId: patch.departmentId ?? null } : c,
      ),
    }));
    idb.saveCompanyContacts(get().companyContacts).catch(() => {});
  },
  removeCompanyContact: (id) => {
    set((state: any) => ({
      companyContacts: state.companyContacts.filter((c: CompanyContact) => c.id !== id),
    }));
    idb.saveCompanyContacts(get().companyContacts).catch(() => {});
  },
  loadCompanyData: async () => {
    try {
      const storedDepts = await idb.getCompanyDepartments();
      if (storedDepts && storedDepts.length > 0) {
        set({ companyDepartments: storedDepts });
      }
      const storedContacts = await idb.getCompanyContacts();
      if (storedContacts && storedContacts.length > 0) {
        set({ companyContacts: storedContacts });
      }
    } catch {
      /* ignore */
    }
  },
  setActiveChannel: (id) => set({ activeChannelId: id }),
  loadCompanyChannels: async () => {
    const chans = await idb.getCompanyChannels();
    if (chans && chans.length) {
      set({ companyChannels: chans, activeChannelId: get().activeChannelId ?? chans[0].id });
    }
  },
  createSiteChat: async (name) => {
    const companyId = get().companyId;
    if (!companyId) return null;
    const channelId = `chan_${companyId}_site_${Math.random().toString(36).slice(2, 8)}`;
    const channel: CompanyChannel = {
      id: channelId,
      companyId,
      name: `Site: ${name}`,
      description: 'Embedded website chat',
      unread: 0,
      memberCount: 1,
      createdAt: Date.now(),
    };
    const { generateChannelKeyPair } = await import('../../lib/embed/embedCrypto');
    const { createEmbedToken, generateEmbedSnippet } = await import('../../lib/embed/token');
    const kp = generateChannelKeyPair();
    const channelKeys = { ...get().channelKeys, [channelId]: kp };
    const token = createEmbedToken({ companyId, channelId, channelPubKeyB64: kp.publicKeyB64, label: name });
    const snippet = generateEmbedSnippet(token);
    const siteChat: SiteChat = { id: channelId, name, token, snippet, createdAt: Date.now() };
    const siteChats = [...get().siteChats, siteChat];
    set((s: any) => ({
      companyChannels: [...s.companyChannels, channel],
      channelKeys,
      siteChats,
      activeChannelId: channelId,
    }));
    await idb.saveCompanyChannels(get().companyChannels);
    await idb.saveCompanyChannelKeys(channelKeys);
    await idb.saveCompanySiteChats(siteChats);
    get().joinCompanyChannel();
    return { channelId, token, snippet };
  },
  pushCrmSyncEnvelope: (env) => {
    set((s: any) => ({ companyCrmEnvelopes: [...s.companyCrmEnvelopes, env] }));
    idb.saveCompanyCrmEnvelopes(get().companyCrmEnvelopes).catch(() => {});
  },
  syncCrmOutbound: async () => {
    const gk = get().activeGroupKey;
    const companyId = get().companyId;
    if (!gk || !companyId) return { ok: false };
    try {
      const { getMasterKeySet } = await import('../../lib/identity/masterKey');
      const { b64encode } = await import('../../lib/crypto/cryptoCore');
      const { sealCrmSnapshot } = await import('../../lib/company/companyCrmSync');
      const master = await getMasterKeySet();
      const meta = {
        companyId,
        senderPubKey: b64encode(master.x25519Public),
        groupKeyVersion: get().activeGroupKeyVersion,
      };
      const payload = {
        contacts: (get().crmContacts as CrmContact[] | undefined) ?? [],
        deals: (get().crmDeals as Deal[] | undefined) ?? [],
        tasks: (get().crmTasks as CrmTask[] | undefined) ?? [],
      };
      const env = await sealCrmSnapshot(gk, meta, payload);
      get().pushCrmSyncEnvelope(env);
      if (activeRoster) activeRoster.notify('CRM sync', 'encrypted');
      return { ok: true };
    } catch {
      return { ok: false };
    }
  },
  applyCrmEnvelope: async (env) => {
    const gk = get().activeGroupKey;
    if (!gk) return;
    try {
      const { openCrmSnapshot } = await import('../../lib/company/companyCrmSync');
      const payload = await openCrmSnapshot(gk, env);
      get().importBatch(payload);
    } catch {
      /* corrupt envelope — ignore */
    }
  },
  broadcastRoster: () => {
    if (!activeRoster) return;
    const members: RosterMember[] = get().companyMembers.map((m: CompanyMember) => ({
      userId: m.userId,
      displayName: m.displayName,
      role: m.role,
      publicKey: m.publicKey,
      online: m.online,
    }));
    activeRoster.publishRoster(members);
  },
  acceptInvite: async (code: string) => {
    const invites = (await idb.get('company_invites')) as
      | Record<string, { companyId: string }>
      | null;
    const rec = invites?.[code];
    if (!rec) return false;
    try {
      const groupRaw = await idb.getCompanyGroupKey(rec.companyId);
      const { importRawKey } = await import('../../lib/company/groupKey');
      const groupKey = groupRaw ? await importRawKey(groupRaw) : null;
      set({
        companyId: rec.companyId,
        activeGroupKey: groupKey,
        activeGroupKeyVersion: groupKey ? 1 : 0,
      });
      await idb.saveCompanyId(rec.companyId);
      return true;
    } catch {
      return false;
    }
  },
  joinCompanyChannel: async (token?: string) => {
    const companyId = get().companyId;
    if (!companyId) return;
    try {
      const { getMasterKeySet } = await import('../../lib/identity/masterKey');
      const { b64encode } = await import('../../lib/crypto/cryptoCore');
      const { CompanyRosterSync } = await import('../../lib/company/relayRoster');
      const { saveMembers } = await import('../../lib/company/companyUser');
      const master = await getMasterKeySet();
      const myPublicKey = b64encode(master.x25519Public);
      const handlers: CompanyRosterHandlers = {
        onRoster: (incoming) => {
          const current = get().companyMembers;
          const byId = new Map<string, CompanyMember>(current.map((m) => [m.userId, m] as [string, CompanyMember]));
          const merged = [...current];
          let changed = false;
          for (const inc of incoming) {
            const existing = byId.get(inc.userId);
            if (!existing) {
              merged.push({
                userId: inc.userId,
                displayName: inc.displayName,
                role: inc.role,
                publicKey: inc.publicKey,
                joinedAt: Date.now(),
                lastActive: Date.now(),
                online: inc.online,
              });
              changed = true;
              toast.success(`${inc.displayName} joined the company`);
            } else if (existing.online !== inc.online || existing.displayName !== inc.displayName || existing.role !== inc.role) {
              const idx = merged.findIndex((m) => m.userId === inc.userId);
              merged[idx] = { ...existing, online: inc.online, displayName: inc.displayName, role: inc.role };
              changed = true;
            }
          }
          if (changed) {
            set({ companyMembers: merged });
            saveMembers(merged).catch(() => {});
          }
        },
        onPresence: (userId, online) => {
          const current = get().companyMembers;
          if (current.some((m) => m.userId === userId && m.online !== online)) {
            set({ companyMembers: current.map((m) => (m.userId === userId ? { ...m, online } : m)) });
          }
        },
        onNotification: (n) => {
          toast.info(n.body ? `${n.title}: ${n.body}` : n.title);
        },
      };
      const sync = new CompanyRosterSync(companyId, myPublicKey, handlers);
      activeRoster?.stop();
      activeRoster = sync;
      sync.start(token);
      const members: RosterMember[] = get().companyMembers.map((m: CompanyMember) => ({
        userId: m.userId,
        displayName: m.displayName,
        role: m.role,
        publicKey: m.publicKey,
        online: m.online,
      }));
      sync.publishRoster(members);
      sync.publishPresence(true);
    } catch {
      /* identity not ready — skip sync */
    }
  },
  leaveCompanyChannel: () => {
    activeRoster?.stop();
    activeRoster = null;
  },
});
