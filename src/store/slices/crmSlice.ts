import type {
  CrmContact, Department, CustomRole, Deal, CrmTask, CrmFilters,
  CrmPermission, SystemRole, CrmContactStatus, DealStage,
} from '../../lib/crm/types';
import { SYSTEM_ROLE_PERMISSIONS } from '../../constants/crmConstants';
import { DEFAULT_CRM_FILTERS } from '../../lib/crm/types';
import {
  MOCK_CRM_CONTACTS, MOCK_DEPARTMENTS, MOCK_CUSTOM_ROLES, MOCK_DEALS, MOCK_TASKS,
} from '../../constants/crmMockData';

const uid = (prefix: string) =>
  `${prefix}_${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}`;

export const CRM_STORAGE_KEY = 'neumorphic.crm.v1';
export const CRM_INVITE_KEY = 'neumorphic.crm.invite';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const out: string[] = [];
  try {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    bytes.forEach((b) => out.push(chars[b % chars.length]));
  } catch {
    for (let i = 0; i < 8; i += 1) out.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  return `INV-${out.join('')}`;
}

interface PersistedCrm {
  contacts: CrmContact[];
  departments: Department[];
  customRoles: CustomRole[];
  deals: Deal[];
  tasks: CrmTask[];
}

export function loadCrmPersisted(): PersistedCrm | null {
  try {
    const raw = localStorage.getItem(CRM_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<PersistedCrm>;
    if (!Array.isArray(data.contacts) || data.contacts.length === 0) return null;
    return {
      contacts: data.contacts,
      departments: Array.isArray(data.departments) ? data.departments : MOCK_DEPARTMENTS,
      customRoles: Array.isArray(data.customRoles) ? data.customRoles : MOCK_CUSTOM_ROLES,
      deals: Array.isArray(data.deals) ? data.deals : [],
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
    };
  } catch {
    return null;
  }
}

export function saveCrmPersisted(state: {
  crmContacts: CrmContact[];
  crmDepartments: Department[];
  crmCustomRoles: CustomRole[];
  crmDeals: Deal[];
  crmTasks: CrmTask[];
}): void {
  try {
    localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify({
      contacts: state.crmContacts,
      departments: state.crmDepartments,
      customRoles: state.crmCustomRoles,
      deals: state.crmDeals,
      tasks: state.crmTasks,
    }));
  } catch {
    /* storage unavailable — in-memory only */
  }
}

/** Resolve the effective permission set for a given contact. */
export function resolvePermissions(contact: CrmContact | undefined, customRoles: CustomRole[]): CrmPermission[] {
  if (!contact) return [];
  const base = SYSTEM_ROLE_PERMISSIONS[contact.role] ?? [];
  if (contact.customRoleId) {
    const custom = customRoles.find((r) => r.id === contact.customRoleId);
    if (custom) return Array.from(new Set([...base, ...custom.permissions]));
  }
  return base;
}

export interface CrmSlice {
  crmContacts: CrmContact[];
  crmDepartments: Department[];
  crmCustomRoles: CustomRole[];
  crmDeals: Deal[];
  crmTasks: CrmTask[];
  crmFilters: CrmFilters;
  crmLoaded: boolean;
  crmCollapsedGroups: string[];
  crmInviteCode: string;

  // lifecycle
  ensureCrmSeed: (currentUserId: string, currentUserName: string) => void;
  resetCrmDemo: (currentUserId: string, currentUserName: string) => void;
  ensureCrmInviteCode: () => string;

  // contacts
  addContact: (contact: Omit<CrmContact, 'userId' | 'tags' | 'status'> & Partial<Pick<CrmContact, 'tags' | 'status'>>) => void;
  updateContact: (userId: string, patch: Partial<CrmContact>) => void;
  removeContact: (userId: string) => void;
  setContactRole: (userId: string, role: SystemRole, customRoleId?: string | null) => void;
  assignManager: (userId: string, managerId: string | null) => void;
  setContactStatus: (userId: string, status: CrmContactStatus) => void;
  addContactTag: (userId: string, tag: string) => void;
  removeContactTag: (userId: string, tag: string) => void;

  // departments
  addDepartment: (name: string, color: string) => void;
  updateDepartment: (id: string, patch: Partial<Department>) => void;
  removeDepartment: (id: string) => void;

  // custom roles
  addCustomRole: (name: string) => void;
  updateCustomRole: (id: string, patch: Partial<CustomRole>) => void;
  toggleCustomRolePermission: (id: string, perm: CrmPermission) => void;
  removeCustomRole: (id: string) => void;

  // deals
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt'>) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  setDealStage: (id: string, stage: DealStage) => void;
  removeDeal: (id: string) => void;

  // tasks
  addTask: (task: Omit<CrmTask, 'id' | 'createdAt' | 'done'> & Partial<Pick<CrmTask, 'done'>>) => void;
  updateTask: (id: string, patch: Partial<CrmTask>) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;

  // filters
  setCrmFilter: <K extends keyof CrmFilters>(key: K, value: CrmFilters[K]) => void;
  resetCrmFilters: () => void;

  // people groups
  toggleCrmGroup: (key: string) => void;
}

export const createCrmSlice = (set: any, get: any): CrmSlice => ({
  crmContacts: [],
  crmDepartments: [],
  crmCustomRoles: [],
  crmDeals: [],
  crmTasks: [],
  crmFilters: { ...DEFAULT_CRM_FILTERS },
  crmLoaded: false,
  crmCollapsedGroups: [],
  crmInviteCode: '',

  ensureCrmSeed: (currentUserId, currentUserName) => {
    const state = get();
    if (state.crmLoaded && state.crmContacts.length > 0) return;
    const currentUser: CrmContact = {
      userId: currentUserId,
      displayName: currentUserName || 'You',
      role: 'admin',
      departmentId: null,
      title: 'Owner',
      status: 'internal',
      tags: ['me'],
      online: true,
    };
    const persisted = loadCrmPersisted();
    if (persisted) {
      set({
        crmContacts: persisted.contacts.some((c) => c.userId === currentUserId)
          ? persisted.contacts
          : [currentUser, ...persisted.contacts],
        crmDepartments: persisted.departments,
        crmCustomRoles: persisted.customRoles,
        crmDeals: persisted.deals,
        crmTasks: persisted.tasks,
        crmLoaded: true,
      });
      return;
    }
    set({
      crmContacts: [currentUser, ...MOCK_CRM_CONTACTS],
      crmDepartments: MOCK_DEPARTMENTS,
      crmCustomRoles: MOCK_CUSTOM_ROLES,
      crmDeals: MOCK_DEALS,
      crmTasks: MOCK_TASKS,
      crmLoaded: true,
    });
  },
  resetCrmDemo: (currentUserId, currentUserName) => {
    try {
      localStorage.removeItem(CRM_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    const currentUser: CrmContact = {
      userId: currentUserId,
      displayName: currentUserName || 'You',
      role: 'admin',
      departmentId: null,
      title: 'Owner',
      status: 'internal',
      tags: ['me'],
      online: true,
    };
    set({
      crmContacts: [currentUser, ...MOCK_CRM_CONTACTS],
      crmDepartments: MOCK_DEPARTMENTS,
      crmCustomRoles: MOCK_CUSTOM_ROLES,
      crmDeals: MOCK_DEALS,
      crmTasks: MOCK_TASKS,
    });
  },

  ensureCrmInviteCode: () => {
    const existing = get().crmInviteCode;
    if (existing) return existing;
    let code = '';
    try {
      code = (localStorage.getItem(CRM_INVITE_KEY) || '').trim();
    } catch {
      code = '';
    }
    if (!code) {
      code = generateInviteCode();
      try {
        localStorage.setItem(CRM_INVITE_KEY, code);
      } catch {
        /* storage unavailable — in-memory only */
      }
    }
    set({ crmInviteCode: code });
    return code;
  },

  addContact: (contact) => set((s: any) => ({
    crmContacts: [...s.crmContacts, {
      tags: [], status: 'lead' as CrmContactStatus, ...contact, userId: uid('usr'),
    }],
  })),
  updateContact: (userId, patch) => set((s: any) => ({
    crmContacts: s.crmContacts.map((c: CrmContact) => (c.userId === userId ? { ...c, ...patch } : c)),
  })),
  removeContact: (userId) => set((s: any) => ({
    crmContacts: s.crmContacts.filter((c: CrmContact) => c.userId !== userId),
  })),
  setContactRole: (userId, role, customRoleId = null) => set((s: any) => ({
    crmContacts: s.crmContacts.map((c: CrmContact) => (c.userId === userId ? { ...c, role, customRoleId } : c)),
  })),
  assignManager: (userId, managerId) => set((s: any) => ({
    crmContacts: s.crmContacts.map((c: CrmContact) => (c.userId === userId ? { ...c, assignedManagerId: managerId } : c)),
  })),
  setContactStatus: (userId, status) => set((s: any) => ({
    crmContacts: s.crmContacts.map((c: CrmContact) => (c.userId === userId ? { ...c, status } : c)),
  })),
  addContactTag: (userId, tag) => set((s: any) => ({
    crmContacts: s.crmContacts.map((c: CrmContact) =>
      c.userId === userId && tag && !c.tags.includes(tag) ? { ...c, tags: [...c.tags, tag] } : c,
    ),
  })),
  removeContactTag: (userId, tag) => set((s: any) => ({
    crmContacts: s.crmContacts.map((c: CrmContact) =>
      c.userId === userId ? { ...c, tags: c.tags.filter((t) => t !== tag) } : c,
    ),
  })),

  addDepartment: (name, color) => set((s: any) => ({
    crmDepartments: [...s.crmDepartments, { id: uid('dep'), name, color }],
  })),
  updateDepartment: (id, patch) => set((s: any) => ({
    crmDepartments: s.crmDepartments.map((d: Department) => (d.id === id ? { ...d, ...patch } : d)),
  })),
  removeDepartment: (id) => set((s: any) => ({
    crmDepartments: s.crmDepartments.filter((d: Department) => d.id !== id),
  })),

  addCustomRole: (name) => set((s: any) => ({
    crmCustomRoles: [...s.crmCustomRoles, { id: uid('role'), name, permissions: [] }],
  })),
  updateCustomRole: (id, patch) => set((s: any) => ({
    crmCustomRoles: s.crmCustomRoles.map((r: CustomRole) => (r.id === id ? { ...r, ...patch } : r)),
  })),
  toggleCustomRolePermission: (id, perm) => set((s: any) => ({
    crmCustomRoles: s.crmCustomRoles.map((r: CustomRole) => {
      if (r.id !== id) return r;
      const has = r.permissions.includes(perm);
      return {
        ...r,
        permissions: has ? r.permissions.filter((p) => p !== perm) : [...r.permissions, perm],
      };
    }),
  })),
  removeCustomRole: (id) => set((s: any) => ({
    crmCustomRoles: s.crmCustomRoles.filter((r: CustomRole) => r.id !== id),
  })),

  addDeal: (deal) => set((s: any) => ({
    crmDeals: [...s.crmDeals, { ...deal, id: uid('deal'), createdAt: Date.now() }],
  })),
  updateDeal: (id, patch) => set((s: any) => ({
    crmDeals: s.crmDeals.map((d: Deal) => (d.id === id ? { ...d, ...patch } : d)),
  })),
  setDealStage: (id, stage) => set((s: any) => ({
    crmDeals: s.crmDeals.map((d: Deal) => (d.id === id ? { ...d, stage } : d)),
  })),
  removeDeal: (id) => set((s: any) => ({
    crmDeals: s.crmDeals.filter((d: Deal) => d.id !== id),
  })),

  addTask: (task) => set((s: any) => ({
    crmTasks: [...s.crmTasks, { ...task, id: uid('task'), createdAt: Date.now(), done: task.done ?? false }],
  })),
  updateTask: (id, patch) => set((s: any) => ({
    crmTasks: s.crmTasks.map((t: CrmTask) => (t.id === id ? { ...t, ...patch } : t)),
  })),
  toggleTask: (id) => set((s: any) => ({
    crmTasks: s.crmTasks.map((t: CrmTask) => (t.id === id ? { ...t, done: !t.done } : t)),
  })),
  removeTask: (id) => set((s: any) => ({
    crmTasks: s.crmTasks.filter((t: CrmTask) => t.id !== id),
  })),

  setCrmFilter: (key, value) => set((s: any) => ({
    crmFilters: { ...s.crmFilters, [key]: value },
  })),
  resetCrmFilters: () => set({ crmFilters: { ...DEFAULT_CRM_FILTERS } }),

  toggleCrmGroup: (key) => set((s: any) => ({
    crmCollapsedGroups: s.crmCollapsedGroups.includes(key)
      ? s.crmCollapsedGroups.filter((k: string) => k !== key)
      : [...s.crmCollapsedGroups, key],
  })),
});
