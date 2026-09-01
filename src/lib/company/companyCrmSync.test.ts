// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateGroupKey } from './groupKey';
import { sealCrmSnapshot, openCrmSnapshot } from './companyCrmSync';
import type { CrmContact, Deal, CrmTask } from '../crm/types';

describe('company CRM sync envelope', () => {
  it('seals and opens a CRM snapshot', async () => {
    const group = await generateGroupKey();
    const contacts: CrmContact[] = [
      { userId: 'u1', displayName: 'Al', role: 'member', tags: ['lead'], status: 'lead' },
    ];
    const deals: Deal[] = [
      { id: 'd1', title: 'Big', contactId: 'u1', stage: 'new', amount: 10, currency: 'USD', ownerId: 'u1', createdAt: 1 },
    ];
    const tasks: CrmTask[] = [
      { id: 't1', title: 'Call', done: false, priority: 'high', createdAt: 1 },
    ];
    const env = await sealCrmSnapshot(
      group,
      { companyId: 'org1', senderPubKey: 'k', groupKeyVersion: 1 },
      { contacts, deals, tasks },
    );
    const out = await openCrmSnapshot(group, env);
    expect(out.contacts).toHaveLength(1);
    expect(out.contacts[0].displayName).toBe('Al');
    expect(out.deals[0].title).toBe('Big');
    expect(out.tasks[0].title).toBe('Call');
  });
});
