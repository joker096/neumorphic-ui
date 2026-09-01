import { describe, it, expect, vi } from 'vitest';
import { createCrmSlice } from './crmSlice';
import { DEFAULT_CRM_FILTERS } from '../../lib/crm/types';
import type { CrmContact, Deal, CrmTask } from '../../lib/crm/types';

vi.mock('../../lib/crm/atRest', () => ({
  isEncryptedPayload: (v: any) =>
    !!v && typeof v === 'object' && typeof v.cipher === 'string' && typeof v.iv === 'string',
  encryptCrmData: async (plain: string) => ({ cipher: plain, iv: 'x' }),
  decryptCrmData: async (p: any) => p.cipher,
}));

const makeStore = () => {
  let state: any = {
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
  return { slice: createCrmSlice(set, get), getState: get };
};

const contact = (userId: string): CrmContact => ({
  userId,
  displayName: userId,
  role: 'member',
  departmentId: null,
  tags: [],
  status: 'lead',
});

describe('crmSlice.importBatch', () => {
  it('merges imported contacts/deals/tasks into the store', () => {
    const { slice, getState } = makeStore();
    const deals: Deal[] = [
      { id: 'deal_1', title: 'D', contactId: 'u1', stage: 'new', amount: 10, currency: 'USD', ownerId: '', createdAt: 0 },
    ];
    const tasks: CrmTask[] = [
      { id: 'task_1', title: 'T', done: false, priority: 'low', dueAt: null, assigneeId: null, contactId: null, dealId: null, createdAt: 0 },
    ];
    slice.importBatch({ contacts: [contact('u1')], deals, tasks });
    expect(getState().crmContacts).toHaveLength(1);
    expect(getState().crmDeals).toHaveLength(1);
    expect(getState().crmTasks).toHaveLength(1);
  });

  it('appends to existing data without dropping it', () => {
    const { slice, getState } = makeStore();
    slice.importBatch({ contacts: [contact('a')], deals: [], tasks: [] });
    slice.importBatch({ contacts: [contact('b')], deals: [], tasks: [] });
    expect(getState().crmContacts.map((c: CrmContact) => c.userId)).toEqual(['a', 'b']);
  });
});

describe('crmSlice.importBatch — cross-source merge', () => {
  it('merges mergedContacts into existing contacts by userId', () => {
    const { slice, getState } = makeStore();
    slice.importBatch({ contacts: [contact('u1')], deals: [], tasks: [] });
    slice.importBatch({
      contacts: [],
      mergedContacts: [{ ...contact('u1'), phone: '+10000000000', tags: ['bitrix'] }],
      deals: [],
      tasks: [],
    });
    const after = getState().crmContacts[0];
    expect(getState().crmContacts).toHaveLength(1);
    expect(after.userId).toBe('u1');
    expect(after.phone).toBe('+10000000000');
    expect(after.tags).toEqual(expect.arrayContaining(['bitrix']));
  });
});

describe('crmSlice.syncMessengerContacts', () => {
  const mk = (id: string, name: string) =>
    ({ id, name, color: '#000', lastSeen: 0, lastInteraction: 0, localFields: [], tags: ['lead'] } as any);

  it('adds a new messenger contact as CRM contact', () => {
    const { slice, getState } = makeStore();
    slice.syncMessengerContacts([mk('m1', 'Mike')]);
    expect(getState().crmContacts).toHaveLength(1);
    expect(getState().crmContacts[0].userId).toBe('m1');
  });

  it('updates rather than duplicates on repeated sync', () => {
    const { slice, getState } = makeStore();
    slice.syncMessengerContacts([mk('m1', 'Mike')]);
    slice.syncMessengerContacts([mk('m1', 'Mike2')]);
    // No duplicate: still a single contact (bridge keeps existing name, fills gaps only).
    expect(getState().crmContacts).toHaveLength(1);
    expect(getState().crmContacts[0].userId).toBe('m1');
  });
});
