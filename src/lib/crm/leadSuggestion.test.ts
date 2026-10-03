import { describe, it, expect } from 'vitest';
import { resolveLeadSuggestion } from './leadSuggestion';
import type { Contact } from '../../types/contact';
import type { CrmContact } from './types';

const contact = (over: Partial<Contact> = {}): Contact => ({
  id: 'c1',
  name: 'Ivan',
  color: '#000',
  lastSeen: 0,
  localFields: [{ id: 'f1', type: 'phone', label: 'Phone', value: '+79001112233' }],
  email: 'ivan@x.io',
  ...over,
});

const crm = (over: Partial<CrmContact> = {}): CrmContact => ({
  userId: 'crm1',
  displayName: 'Other',
  role: 'member',
  tags: [],
  status: 'lead',
  ...over,
});

const dm = (over: Record<string, unknown> = {}) => ({
  id: 'chat1',
  name: 'Ivan',
  history: [{ sender: 'them' as const }],
  ...over,
});

describe('resolveLeadSuggestion', () => {
  it('suggests a lead for an incoming DM from an unknown contact', () => {
    const out = resolveLeadSuggestion(dm(), [contact()], []);
    expect(out?.contact.name).toBe('Ivan');
    expect(out?.detail).toBe('+79001112233');
  });

  it('returns null when the phone is already in the CRM (digit match)', () => {
    const out = resolveLeadSuggestion(dm(), [contact()], [crm({ phone: '+7 (900) 111-22-33' })]);
    expect(out).toBeNull();
  });

  it('returns null when the email is already in the CRM', () => {
    const bare = contact({ localFields: undefined });
    const out = resolveLeadSuggestion(dm(), [bare], [crm({ email: 'IVAN@x.io ' })]);
    expect(out).toBeNull();
  });

  it('returns null when the peer never wrote to us', () => {
    const out = resolveLeadSuggestion(dm({ history: [{ sender: 'me' }] }), [contact()], []);
    expect(out).toBeNull();
  });

  it('returns null for group, channel and bot chats', () => {
    expect(resolveLeadSuggestion(dm({ type: 'group' }), [contact()], [])).toBeNull();
    expect(resolveLeadSuggestion(dm({ type: 'channel' }), [contact()], [])).toBeNull();
    expect(resolveLeadSuggestion(dm({ isBot: true }), [contact()], [])).toBeNull();
  });

  it('returns null when no messenger contact matches the chat', () => {
    const out = resolveLeadSuggestion(dm({ name: 'Ghost' }), [contact()], []);
    expect(out).toBeNull();
  });

  it('falls back to email then name for the hint detail', () => {
    const noPhone = contact({ localFields: undefined });
    expect(resolveLeadSuggestion(dm(), [noPhone], [])?.detail).toBe('ivan@x.io');
    const bare = contact({ localFields: undefined, email: undefined });
    expect(resolveLeadSuggestion(dm(), [bare], [])?.detail).toBe('Ivan');
  });
});
