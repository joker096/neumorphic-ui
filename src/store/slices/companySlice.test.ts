import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/idb', () => {
  const store: Record<string, any> = {};
  return {
    saveCompanyDepartments: vi.fn(() => Promise.resolve()),
    saveCompanyContacts: vi.fn(() => Promise.resolve()),
    getCompanyDepartments: vi.fn(() => Promise.resolve(null)),
    getCompanyContacts: vi.fn(() => Promise.resolve(null)),
    get: vi.fn((k: string) => Promise.resolve(store[k] ?? null)),
    set: vi.fn((k: string, v: any) => {
      store[k] = v;
      return Promise.resolve();
    }),
    getCompanyGroupKey: vi.fn(() => Promise.resolve(null)),
    saveCompanyId: vi.fn(() => Promise.resolve()),
  };
});

import * as idb from '../../lib/idb';
import { createCompanySlice } from './companySlice';

const makeSlice = () => {
  let state: any = {};
  const set = (partial: any) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...next };
  };
  const get = () => state;
  const slice = createCompanySlice(set, get) as any;
  state = { ...slice };
  return { slice, get };
};

describe('companySlice departments & contacts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts with empty departments and contacts', () => {
    const { slice } = makeSlice();
    expect(slice.companyDepartments).toEqual([]);
    expect(slice.companyContacts).toEqual([]);
  });

  it('addCompanyDepartment creates a department and persists it', () => {
    const { slice, get } = makeSlice();
    slice.addCompanyDepartment({ name: 'Engineering', color: 'from-indigo-400 to-purple-500', memberIds: ['u1'] });
    const depts = get().companyDepartments;
    expect(depts).toHaveLength(1);
    expect(depts[0].name).toBe('Engineering');
    expect(depts[0].memberIds).toEqual(['u1']);
    expect(typeof depts[0].id).toBe('string');
    expect(idb.saveCompanyDepartments).toHaveBeenCalledWith(depts);
  });

  it('updateCompanyDepartment patches fields', () => {
    const { slice, get } = makeSlice();
    slice.addCompanyDepartment({ name: 'Sales' });
    const id = get().companyDepartments[0].id;
    slice.updateCompanyDepartment(id, { name: 'Sales Team' });
    expect(get().companyDepartments[0].name).toBe('Sales Team');
  });

  it('removeCompanyDepartment nullifies departmentId on linked contacts', () => {
    const { slice, get } = makeSlice();
    slice.addCompanyDepartment({ name: 'Support' });
    const id = get().companyDepartments[0].id;
    slice.addCompanyContact({ name: 'Helpline', departmentId: id });
    expect(get().companyContacts[0].departmentId).toBe(id);
    slice.removeCompanyDepartment(id);
    expect(get().companyDepartments).toHaveLength(0);
    expect(get().companyContacts[0].departmentId).toBeNull();
  });

  it('addCompanyContact creates a contact and persists it', () => {
    const { slice, get } = makeSlice();
    slice.addCompanyContact({ name: 'John', email: 'john@x.com', phone: '+1' });
    const contacts = get().companyContacts;
    expect(contacts).toHaveLength(1);
    expect(contacts[0].email).toBe('john@x.com');
    expect(idb.saveCompanyContacts).toHaveBeenCalledWith(contacts);
  });

  it('updateCompanyContact patches fields', () => {
    const { slice, get } = makeSlice();
    slice.addCompanyContact({ name: 'Jane' });
    const id = get().companyContacts[0].id;
    slice.updateCompanyContact(id, { title: 'CEO' });
    expect(get().companyContacts[0].title).toBe('CEO');
  });

  it('removeCompanyContact deletes the contact', () => {
    const { slice, get } = makeSlice();
    slice.addCompanyContact({ name: 'Bob' });
    const id = get().companyContacts[0].id;
    slice.removeCompanyContact(id);
    expect(get().companyContacts).toHaveLength(0);
  });
});

describe('acceptInvite', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns false when no invite record exists', async () => {
    const { slice } = makeSlice();
    const ok = await slice.acceptInvite('NOPE');
    expect(ok).toBe(false);
  });

  it('joins local company when invite record exists', async () => {
    const { slice, get } = makeSlice();
    await (idb as any).set('company_invites', {
      'INV-1': { companyId: 'org_1' },
    });
    const ok = await slice.acceptInvite('INV-1');
    expect(ok).toBe(true);
    expect(get().companyId).toBe('org_1');
  });
});
