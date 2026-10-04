import type { Contact } from '../../../types/contact';
import type { CrmContact } from '../../../lib/crm/types';
import { syncMessengerContacts as syncMessengerContactsBridge } from '../../../lib/crm/bridge';
import {
  MOCK_CRM_CONTACTS,
  MOCK_CUSTOM_ROLES,
  MOCK_DEALS,
  MOCK_DEPARTMENTS,
  MOCK_TASKS,
} from '../../../constants/crmMockData';
import {
  CRM_STORAGE_KEY,
  generateInviteCode,
  loadCrmPersisted,
  readStoredInviteCode,
  storeInviteCode,
} from './crmPersist';
import { ownerContact } from './crmShared';
import type { CrmSlice } from '../crmSlice';

/**
 * Seed / demo-reset / invite-code / batch-import actions. They share one state
 * contract (whole-store replacement or full-list merge), so they live together;
 * per-entity mutations are in the sibling action modules.
 */
export const createCrmLifecycleActions = (set: any, get: any): Pick<
  CrmSlice,
  'ensureCrmSeed' | 'resetCrmDemo' | 'ensureCrmInviteCode' | 'importBatch' | 'syncMessengerContacts'
> => ({
  ensureCrmSeed: async (currentUserId, currentUserName) => {
    const state = get();
    if (state.crmLoaded && state.crmContacts.length > 0) return;
    const currentUser = ownerContact(currentUserId, currentUserName);
    const persisted = await loadCrmPersisted();
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
    const currentUser = ownerContact(currentUserId, currentUserName);
    set({
      crmContacts: [currentUser, ...MOCK_CRM_CONTACTS],
      crmDepartments: MOCK_DEPARTMENTS,
      crmCustomRoles: MOCK_CUSTOM_ROLES,
      crmDeals: MOCK_DEALS,
      crmTasks: MOCK_TASKS,
    });
  },

  importBatch: (data) => set((s: any) => {
    const crmContacts = [...s.crmContacts];
    for (const m of data.mergedContacts ?? []) {
      const idx = crmContacts.findIndex((x: CrmContact) => x.userId === m.userId);
      const tags = Array.from(new Set([...(idx >= 0 ? (crmContacts[idx].tags ?? []) : []), ...(m.tags ?? [])]));
      const merged: CrmContact = idx >= 0
        ? {
            ...crmContacts[idx],
            phone: crmContacts[idx].phone ?? m.phone,
            email: crmContacts[idx].email ?? m.email,
            title: crmContacts[idx].title ?? m.title,
            notes: crmContacts[idx].notes ?? m.notes,
            avatarColor: crmContacts[idx].avatarColor ?? m.avatarColor,
            status: crmContacts[idx].status !== 'lead' ? crmContacts[idx].status : m.status,
            tags,
            lastActive: Date.now(),
          }
        : { ...m, tags };
      if (idx >= 0) crmContacts[idx] = merged;
      else crmContacts.push(merged);
    }
    return {
      crmContacts: [...crmContacts, ...(data.contacts ?? [])],
      crmDeals: [...s.crmDeals, ...(data.deals ?? [])],
      crmTasks: [...s.crmTasks, ...(data.tasks ?? [])],
    };
  }),

  syncMessengerContacts: (messenger: Contact[]) => {
    const { contacts, added, updated } = syncMessengerContactsBridge(get().crmContacts, messenger);
    set({ crmContacts: contacts });
    return { added, updated };
  },

  ensureCrmInviteCode: () => {
    const existing = get().crmInviteCode;
    if (existing) return existing;
    let code = readStoredInviteCode();
    if (!code) {
      code = generateInviteCode();
      storeInviteCode(code);
    }
    set({ crmInviteCode: code });
    return code;
  },
});