import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createCrmSlice,
  loadCrmPersisted,
  saveCrmPersisted,
  resolvePermissions,
  CRM_STORAGE_KEY,
} from './crmSlice';
import { SYSTEM_ROLE_PERMISSIONS } from '../../constants/crmConstants';
import { DEFAULT_CRM_FILTERS } from '../../lib/crm/types';
import type { CrmContact, CrmPermission } from '../../lib/crm/types';

vi.mock('../../lib/crm/atRest', () => ({
  isEncryptedPayload: (v: unknown) =>
    !!v &&
    typeof v === 'object' &&
    typeof (v as Record<string, unknown>).cipher === 'string' &&
    typeof (v as Record<string, unknown>).iv === 'string',
  encryptCrmData: async (plain: string) => ({ cipher: plain, iv: 'x' }),
  decryptCrmData: async (p: { cipher: string }) => p.cipher,
}));

const makeStore = () => {
  let state: Record<string, any> = {
    crmContacts: [],
    crmDepartments: [],
    crmCustomRoles: [],
    crmDeals: [],
    crmTasks: [],
    crmFilters: { ...DEFAULT_CRM_FILTERS },
    crmLoaded: false,
  };
  const set = (partial: any) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...next };
  };
  const get = () => state;
  const slice = createCrmSlice(set, get);
  return { slice, getState: get };
};

const user = (userId: string, patch: Partial<CrmContact> = {}): CrmContact => ({
  userId,
  displayName: `User ${userId}`,
  role: 'member',
  departmentId: null,
  tags: [],
  status: 'lead',
  ...patch,
});

beforeEach(() => {
  localStorage.clear();
});

describe('crmSlice persistence', () => {
  it('returns null when nothing is stored', async () => {
    expect(await loadCrmPersisted()).toBeNull();
  });

  it('returns null for corrupted JSON', async () => {
    localStorage.setItem(CRM_STORAGE_KEY, '{not json');
    expect(await loadCrmPersisted()).toBeNull();
  });

  it('returns null when contacts list is empty', async () => {
    localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify({ contacts: [] }));
    expect(await loadCrmPersisted()).toBeNull();
  });

  it('round-trips saved CRM data', async () => {
    const contacts = [user('u1')];
    const departments = [{ id: 'dep_1', name: 'Sales', color: 'from-teal-400 to-cyan-500' }];
    const customRoles = [{ id: 'role_1', name: 'Custom', permissions: ['viewAll' as CrmPermission] }];
    await saveCrmPersisted({ crmContacts: contacts, crmDepartments: departments, crmCustomRoles: customRoles, crmDeals: [], crmTasks: [] });
    const loaded = await loadCrmPersisted();
    expect(loaded).not.toBeNull();
    expect(loaded?.contacts).toEqual(contacts);
    expect(loaded?.departments).toEqual(departments);
    expect(loaded?.customRoles).toEqual(customRoles);
  });

  it('stores an encrypted envelope (wrapped payload, no top-level plaintext keys)', async () => {
    const contacts = [user('u1', { displayName: 'SecretCo' })];
    await saveCrmPersisted({ crmContacts: contacts, crmDepartments: [], crmCustomRoles: [], crmDeals: [], crmTasks: [] });
    const raw = localStorage.getItem(CRM_STORAGE_KEY) ?? '';
    const parsed = JSON.parse(raw);
    expect(parsed.cipher).toBeTypeOf('string');
    expect(parsed.iv).toBeTypeOf('string');
    expect(parsed).not.toHaveProperty('contacts');
  });
});

describe('resolvePermissions', () => {
  it('returns empty array for missing contact', () => {
    expect(resolvePermissions(undefined, [])).toEqual([]);
  });

  it('returns system role permissions by default', () => {
    expect(resolvePermissions(user('u1', { role: 'admin' }), [])).toEqual(SYSTEM_ROLE_PERMISSIONS.admin);
  });

  it('merges custom role permissions with the system role set', () => {
    const contact = user('u1', { role: 'member', customRoleId: 'role_1' });
    const perms = resolvePermissions(contact, [
      { id: 'role_1', name: 'Custom', permissions: ['manageDeals', 'viewAll'] },
    ]);
    const base = SYSTEM_ROLE_PERMISSIONS.member;
    expect(perms).toEqual([...base, 'manageDeals']);
  });
});

describe('ensureCrmSeed', () => {
  it('seeds demo data for a fresh store', async () => {
    const { slice, getState } = makeStore();
    expect(getState().crmLoaded).toBe(false);
    await slice.ensureCrmSeed('me', 'Me');
    expect(getState().crmLoaded).toBe(true);
    expect(getState().crmContacts.length).toBeGreaterThan(1);
    expect(getState().crmContacts[0].userId).toBe('me');
    expect(getState().crmContacts[0].role).toBe('admin');
  });

  it('is a no-op when data is already loaded', async () => {
    const { slice, getState } = makeStore();
    await slice.ensureCrmSeed('me', 'Me');
    const before = getState().crmContacts;
    await slice.ensureCrmSeed('other', 'Other');
    expect(getState().crmContacts).toBe(before);
  });

  it('loads persisted data and prepends the current user when missing', async () => {
    const persisted = [user('a'), user('b')];
    await saveCrmPersisted({
      crmContacts: persisted,
      crmDepartments: [{ id: 'd1', name: 'D', color: 'x' }],
      crmCustomRoles: [],
      crmDeals: [],
      crmTasks: [],
    });
    const { slice, getState } = makeStore();
    await slice.ensureCrmSeed('me', 'Me');
    expect(getState().crmContacts.map((c: CrmContact) => c.userId)).toEqual(['me', 'a', 'b']);
    expect(getState().crmDepartments).toHaveLength(1);
  });

  it('does not duplicate the current user when already persisted', async () => {
    const persisted = [user('me', { role: 'admin' }), user('a')];
    await saveCrmPersisted({
      crmContacts: persisted,
      crmDepartments: [],
      crmCustomRoles: [],
      crmDeals: [],
      crmTasks: [],
    });
    const { slice, getState } = makeStore();
    await slice.ensureCrmSeed('me', 'Me');
    expect(getState().crmContacts.filter((c: CrmContact) => c.userId === 'me')).toHaveLength(1);
  });
});

describe('resetCrmDemo', () => {
  it('clears the storage key and restores demo data', async () => {
    const { slice, getState } = makeStore();
    await saveCrmPersisted({
      crmContacts: [user('a')],
      crmDepartments: [],
      crmCustomRoles: [],
      crmDeals: [],
      crmTasks: [],
    });
    expect(localStorage.getItem(CRM_STORAGE_KEY)).not.toBeNull();
    slice.resetCrmDemo('me', 'Me');
    expect(localStorage.getItem(CRM_STORAGE_KEY)).toBeNull();
    expect(getState().crmContacts[0].userId).toBe('me');
    expect(getState().crmContacts.length).toBeGreaterThan(1);
  });
});

describe('contact actions', () => {
  it('adds a contact with generated id, default tags and lead status', () => {
    const { slice, getState } = makeStore();
    slice.addContact({ displayName: 'New', role: 'member' });
    const contacts = getState().crmContacts;
    const last = contacts[contacts.length - 1];
    expect(last.userId).toMatch(/^usr_/);
    expect(last.tags).toEqual([]);
    expect(last.status).toBe('lead');
  });

  it('updates, re-roles, manages tags and removes a contact', () => {
    const { slice, getState } = makeStore();
    slice.addContact({ displayName: 'Target', role: 'member' });
    const id = getState().crmContacts[getState().crmContacts.length - 1].userId;

    slice.updateContact(id, { title: 'CEO' });
    expect(getState().crmContacts.find((c: CrmContact) => c.userId === id)?.title).toBe('CEO');

    slice.setContactRole(id, 'manager', 'role_9');
    const c1 = getState().crmContacts.find((c: CrmContact) => c.userId === id);
    expect(c1?.role).toBe('manager');
    expect(c1?.customRoleId).toBe('role_9');

    slice.assignManager(id, 'mgr-1');
    slice.setContactStatus(id, 'client');
    slice.addContactTag(id, 'vip');
    slice.addContactTag(id, 'vip');
    const c2 = getState().crmContacts.find((c: CrmContact) => c.userId === id);
    expect(c2?.assignedManagerId).toBe('mgr-1');
    expect(c2?.status).toBe('client');
    expect(c2?.tags).toEqual(['vip']);

    slice.removeContactTag(id, 'vip');
    slice.removeContact(id);
    expect(getState().crmContacts.find((c: CrmContact) => c.userId === id)).toBeUndefined();
  });
});

describe('department actions', () => {
  it('adds, updates and removes departments', () => {
    const { slice, getState } = makeStore();
    slice.addDepartment('Sales', 'from-teal-400 to-cyan-500');
    const departments = getState().crmDepartments;
    const dep = departments[departments.length - 1];
    expect(dep.name).toBe('Sales');

    slice.updateDepartment(dep.id, { name: 'Sales EU' });
    expect(getState().crmDepartments.find((d: any) => d.id === dep.id)?.name).toBe('Sales EU');

    slice.removeDepartment(dep.id);
    expect(getState().crmDepartments.find((d: any) => d.id === dep.id)).toBeUndefined();
  });
});

describe('custom role actions', () => {
  it('creates a role and toggles permissions', () => {
    const { slice, getState } = makeStore();
    slice.addCustomRole('Support');
    const roles = getState().crmCustomRoles;
    const role = roles[roles.length - 1];
    expect(role.permissions).toEqual([]);

    slice.toggleCustomRolePermission(role.id, 'viewAll');
    expect(getState().crmCustomRoles.find((r: any) => r.id === role.id)?.permissions).toContain('viewAll');
    slice.toggleCustomRolePermission(role.id, 'viewAll');
    expect(getState().crmCustomRoles.find((r: any) => r.id === role.id)?.permissions).toEqual([]);

    slice.updateCustomRole(role.id, { name: 'Support Plus' });
    expect(getState().crmCustomRoles.find((r: any) => r.id === role.id)?.name).toBe('Support Plus');

    slice.removeCustomRole(role.id);
    expect(getState().crmCustomRoles.find((r: any) => r.id === role.id)).toBeUndefined();
  });
});

describe('deal actions', () => {
  it('adds, stages and removes a deal', () => {
    const { slice, getState } = makeStore();
    slice.addDeal({ title: 'Big deal', contactId: 'u1', stage: 'new', amount: 1000, currency: 'USD', ownerId: 'me' });
    const deals = getState().crmDeals;
    const deal = deals[deals.length - 1];
    expect(deal.id).toMatch(/^deal_/);
    expect(deal.createdAt).toBeTypeOf('number');

    slice.setDealStage(deal.id, 'won');
    expect(getState().crmDeals.find((d: any) => d.id === deal.id)?.stage).toBe('won');

    slice.updateDeal(deal.id, { amount: 2000 });
    expect(getState().crmDeals.find((d: any) => d.id === deal.id)?.amount).toBe(2000);

    slice.removeDeal(deal.id);
    expect(getState().crmDeals.find((d: any) => d.id === deal.id)).toBeUndefined();
  });
});

describe('task actions', () => {
  it('adds, toggles and removes a task', () => {
    const { slice, getState } = makeStore();
    slice.addTask({ title: 'Follow up', priority: 'high', assigneeId: 'u1' });
    const tasks = getState().crmTasks;
    const task = tasks[tasks.length - 1];
    expect(task.done).toBe(false);

    slice.toggleTask(task.id);
    expect(getState().crmTasks.find((t: any) => t.id === task.id)?.done).toBe(true);

    slice.updateTask(task.id, { priority: 'low' });
    expect(getState().crmTasks.find((t: any) => t.id === task.id)?.priority).toBe('low');

    slice.removeTask(task.id);
    expect(getState().crmTasks.find((t: any) => t.id === task.id)).toBeUndefined();
  });
});

describe('filters', () => {
  it('sets a single filter and resets all', () => {
    const { slice, getState } = makeStore();
    slice.setCrmFilter('search', 'acme');
    expect(getState().crmFilters.search).toBe('acme');

    slice.setCrmFilter('status', 'client');
    expect(getState().crmFilters.status).toBe('client');
    expect(getState().crmFilters.search).toBe('acme');

    slice.resetCrmFilters();
    expect(getState().crmFilters).toEqual(DEFAULT_CRM_FILTERS);
  });
});
