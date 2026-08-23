const savedCompanyHide = localStorage.getItem('app_hide_when_office_only') === 'true';

import type { CompanyChannel, CompanyMessage, CompanyMember, CompanyDepartment, CompanyContact } from '../../types/constants';
import type { InviteQRPayload } from '../../lib/company/types';
import * as idb from '../../lib/idb';
import { generateCompanyId, generateInviteCode, createCompanyUser, saveMembers } from '../../lib/company/companyUser';
import { b64encode } from '../../lib/crypto/cryptoCore';
import { getMasterKeySet } from '../../lib/identity/masterKey';
import { CompanyRosterSync, type RosterMember, type CompanyRosterHandlers } from '../../lib/company/relayRoster';
import { toast } from 'sonner';

// Active serverless roster/presence sync connection (one per store instance).
let activeRoster: CompanyRosterSync | null = null;

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
  broadcastRoster: () => void;
}

export const createCompanySlice = (set: any, get: any): CompanySlice => ({
  companyId: null,
  companyChannels: [],
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
    saveMembers(next).catch(() => {});
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
    saveMembers(next).catch(() => {});
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
  },
  saveCompanySettings: async () => {
    const current = get().companySettings;
    if (current) {
      await idb.saveCompanySettings(current as unknown as Record<string, string>);
    }
  },
  createCompany: async (name, displayName) => {
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
    set({
      companyId,
      companySettings: settings,
      companyMembers: members,
    });
    await idb.saveCompanySettings(settings as unknown as Record<string, string>);
    await idb.saveCompanyId(companyId);
    await saveMembers(members);
    get().joinCompanyChannel();
  },
  createCompanyInvite: async () => {
    const id = get().companyId;
    if (!id) return null;
    const code = generateInviteCode();
    const name = get().companySettings?.name || 'Company';
    const adminKey = get().companyMembers.find((m: CompanyMember) => m.role === 'admin')?.publicKey || '';
    const payload: InviteQRPayload = { org: id, code, name, adminKey };
    return payload;
  },
  joinCompanyFromInvite: async (payload, displayName) => {
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
    set({ companyId: payload.org, companyMembers: members });
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
  joinCompanyChannel: async (token?: string) => {
    const companyId = get().companyId;
    if (!companyId) return;
    try {
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
