import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store';
import { mergeCrmBundle, type CrmMigrationBundle, type CrmBackup } from './backup';

const bundle = (crm: CrmBackup): CrmMigrationBundle => ({
  version: 1,
  app: 'neumorphic-ui',
  kind: 'crm',
  createdAt: new Date().toISOString(),
  crm,
});

describe('backup.mergeCrmBundle', () => {
  beforeEach(() => {
    useAppStore.setState({
      crmContacts: [],
      crmDeals: [],
      crmTasks: [],
      crmDepartments: [],
      crmCustomRoles: [],
    });
  });

  it('adds new records and reports counts', () => {
    const res = mergeCrmBundle(bundle({
      contacts: [{ userId: 'u1', displayName: 'A', role: 'member', tags: [], status: 'lead' }],
      departments: [{ id: 'd1', name: 'D', color: 'c' }],
      customRoles: [{ id: 'r1', name: 'R', permissions: [] }],
      deals: [{ id: 'deal1', title: 'T', contactId: '', stage: 'new', amount: 1, currency: 'USD', ownerId: '', createdAt: 1 }],
      tasks: [{ id: 'task1', title: 'X', done: false, priority: 'low', createdAt: 1 }],
    }));
    expect(res.added).toBe(5);
    expect(res.updated).toBe(0);
    const s = useAppStore.getState();
    expect(s.crmContacts).toHaveLength(1);
    expect(s.crmDeals).toHaveLength(1);
    expect(s.crmTasks).toHaveLength(1);
  });

  it('updates existing by id and counts updated', () => {
    useAppStore.setState({
      crmContacts: [{ userId: 'u1', displayName: 'Old', role: 'member', tags: [], status: 'lead' }],
    });
    const res = mergeCrmBundle(bundle({
      contacts: [{ userId: 'u1', displayName: 'New', role: 'member', tags: ['vip'], status: 'vip' }],
      departments: [],
      customRoles: [],
      deals: [],
      tasks: [],
    }));
    expect(res.updated).toBe(1);
    expect(res.added).toBe(0);
    expect(useAppStore.getState().crmContacts[0].displayName).toBe('New');
  });
});
