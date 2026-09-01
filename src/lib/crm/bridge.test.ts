import { describe, it, expect } from 'vitest';
import type { Contact, ContactTag } from '../../types/contact';
import {
  deriveCrmStatus,
  contactToCrm,
  crmToContact,
  findExistingCrmContact,
  mergeIntoCrm,
  syncMessengerContacts,
} from './bridge';
import type { CrmContact } from './types';

const mkContact = (over: Partial<Contact> = {}): Contact => ({
  name: 'Ivan Petrov',
  id: 'msg_1',
  color: '#123456',
  lastSeen: 1000,
  ...over,
});

describe('bridge.deriveCrmStatus', () => {
  it('defaults to lead when no tags', () => {
    expect(deriveCrmStatus(undefined)).toBe('lead');
    expect(deriveCrmStatus([])).toBe('lead');
  });
  it('prefers higher-priority status', () => {
    expect(deriveCrmStatus(['lead', 'vip'] as ContactTag[])).toBe('vip');
    expect(deriveCrmStatus(['partner'] as ContactTag[])).toBe('partner');
  });
});

describe('bridge.contactToCrm', () => {
  it('maps messenger contact to crm contact', () => {
    const c = mkContact({
      position: 'CTO',
      email: 'ivan@x.io',
      whatsapp: '+79001112233',
      tags: ['client'],
      notes: 'met at conf',
      lastInteraction: 500,
    });
    const out = contactToCrm(c);
    expect(out.userId).toBe('msg_1');
    expect(out.displayName).toBe('Ivan Petrov');
    expect(out.title).toBe('CTO');
    expect(out.email).toBe('ivan@x.io');
    expect(out.phone).toBe('+79001112233');
    expect(out.tags).toEqual(['client']);
    expect(out.status).toBe('client');
    expect(out.avatarColor).toBe('#123456');
  });

  it('pulls phone from localFields when present', () => {
    const c = mkContact({
      localFields: [{ id: 'f1', type: 'phone', label: 'P', value: '+79990001122' }],
      whatsapp: '+79000000000',
    });
    expect(contactToCrm(c).phone).toBe('+79990001122');
  });
});

describe('bridge.crmToContact', () => {
  it('round-trips core fields', () => {
    const crm: CrmContact = {
      userId: 'msg_1', displayName: 'Ivan', role: 'member', tags: ['vip'],
      status: 'vip', email: 'a@b.io', phone: '+7', avatarColor: '#abc',
      lastActive: 444,
    };
    const back = crmToContact(crm);
    expect(back.id).toBe('msg_1');
    expect(back.name).toBe('Ivan');
    expect(back.email).toBe('a@b.io');
    expect(back.position).toBeUndefined();
    expect(back.tags).toEqual(['vip']);
  });
});

describe('bridge.findExistingCrmContact', () => {
  const base: CrmContact[] = [
    { userId: 'msg_1', displayName: 'Ivan', role: 'member', tags: [], status: 'lead', phone: '+79001112233' },
  ];
  it('matches by messenger id', () => {
    expect(findExistingCrmContact(base, mkContact({ id: 'msg_1' }))?.userId).toBe('msg_1');
  });
  it('matches by phone (normalized)', () => {
    expect(findExistingCrmContact(base, mkContact({ id: 'other', whatsapp: '+7 900 111 22 33' }))?.userId).toBe('msg_1');
  });
  it('matches by email', () => {
    expect(findExistingCrmContact(base, mkContact({ id: 'other', email: 'ivan@x.io', localFields: [] }))).toBeUndefined();
  });
});

describe('bridge.mergeIntoCrm', () => {
  it('fills gaps only, preserves existing status', () => {
    const existing: CrmContact = {
      userId: 'msg_1', displayName: 'Ivan', role: 'member', tags: ['client'],
      status: 'client', phone: '+79001112233',
    };
    const merged = mergeIntoCrm(existing, mkContact({ email: 'new@x.io', tags: ['vip'] }));
    expect(merged.email).toBe('new@x.io');
    expect(merged.status).toBe('client'); // not overwritten
    expect(merged.tags).toEqual(['client', 'vip']);
  });
});

describe('bridge.syncMessengerContacts', () => {
  it('adds new and updates existing without dupes', () => {
    const base: CrmContact[] = [
      { userId: 'msg_1', displayName: 'Ivan', role: 'member', tags: [], status: 'lead', phone: '+79001112233' },
    ];
    const { contacts, added, updated } = syncMessengerContacts(base, [
      mkContact({ id: 'msg_1', email: 'ivan@x.io' }),
      mkContact({ id: 'msg_2', name: 'New Person' }),
    ]);
    expect(contacts).toHaveLength(2);
    expect(added).toHaveLength(1);
    expect(updated).toHaveLength(1);
    expect(contacts.find((c) => c.userId === 'msg_1')?.email).toBe('ivan@x.io');
  });
});
