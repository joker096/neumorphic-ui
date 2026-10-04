import type { CrmContact, CrmContactStatus, SystemRole } from '../../../lib/crm/types';
import { uid } from './crmShared';
import type { CrmSlice } from '../crmSlice';

/** Contact mutations: CRUD, role/manager/status assignment and tag editing. */
export const createCrmContactActions = (set: any): Pick<
  CrmSlice,
  | 'addContact'
  | 'updateContact'
  | 'removeContact'
  | 'setContactRole'
  | 'assignManager'
  | 'setContactStatus'
  | 'addContactTag'
  | 'removeContactTag'
> => ({
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
  setContactRole: (userId, role: SystemRole, customRoleId = null) => set((s: any) => ({
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
      c.userId === userId ? { ...c, tags: c.tags.filter((t: string) => t !== tag) } : c,
    ),
  })),
});