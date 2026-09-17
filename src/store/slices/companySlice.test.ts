import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/idb', () => {
  const store: Record<string, any> = {};
  return {
    saveCompanyDepartments: vi.fn(() => Promise.resolve()),
    saveCompanyContacts: vi.fn(() => Promise.resolve()),
    getCompanyDepartments: vi.fn(() => Promise.resolve(null)),
    getCompanyContacts: vi.fn(() => Promise.resolve(null)),
    saveCompanyWebsiteContacts: vi.fn(() => Promise.resolve()),
    getCompanyWebsiteContacts: vi.fn(() => Promise.resolve(null)),
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

describe('ingestWebsiteContact', () => {
  beforeEach(() => vi.clearAllMocks());

  it('imports a new website contact and mirrors it into CRM with site tag', () => {
    const { slice, get } = makeSlice();
    const importBatch = vi.fn();
    (get() as any).importBatch = importBatch;
    slice.ingestWebsiteContact({
      siteChatId: 'sc1',
      domain: 'https://Shop.Example.com/',
      name: 'Jane',
      email: 'jane@test.com',
      phone: '+123',
      pageUrl: 'https://shop.example.com/p',
      ts: 1000,
    });

    const contacts = get().websiteContacts;
    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject({
      siteChatId: 'sc1',
      domain: 'shop.example.com',
      name: 'Jane',
      email: 'jane@test.com',
      visitCount: 1,
      crmUserId: contacts[0].id,
    });
    expect(importBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        mergedContacts: [
          expect.objectContaining({
            displayName: 'Jane',
            email: 'jane@test.com',
            tags: ['site:shop.example.com', 'lead'],
            status: 'lead',
            source: 'website',
            websiteDomain: 'shop.example.com',
          }),
        ],
      }),
    );
  });

  it('dedupes by email and bumps visitCount', () => {
    const { slice, get } = makeSlice();
    (get() as any).importBatch = vi.fn();
    slice.ingestWebsiteContact({ siteChatId: 'sc1', domain: 'example.com', name: 'Jane', email: 'jane@test.com', ts: 1 });
    slice.ingestWebsiteContact({ siteChatId: 'sc1', domain: 'example.com', name: 'Jane', email: 'jane@test.com', ts: 2 });

    const contacts = get().websiteContacts;
    expect(contacts).toHaveLength(1);
    expect(contacts[0].visitCount).toBe(2);
    expect(contacts[0].ts).toBe(2);
  });

  it('dedupes by name when no email/phone match across chats separately', () => {
    const { slice, get } = makeSlice();
    (get() as any).importBatch = vi.fn();
    slice.ingestWebsiteContact({ siteChatId: 'sc1', domain: 'a.com', name: 'Bob', ts: 1 });
    slice.ingestWebsiteContact({ siteChatId: 'sc2', domain: 'b.com', name: 'Bob', ts: 2 });

    expect(get().websiteContacts).toHaveLength(2);
  });

  it('ignores empty domain', () => {
    const { slice, get } = makeSlice();
    const rec = slice.ingestWebsiteContact({ siteChatId: 'sc1', domain: '', name: 'Jane' });
    expect(rec).toBeNull();
    expect(get().websiteContacts).toHaveLength(0);
  });
});
