import { describe, it, expect } from 'vitest';
import { importFromText, parseDate, applyPlan, type ImportPlan } from './import';
import type { CrmContact } from './types';

const CSV = `name,phone,email,status,tags,deal,amount,stage
Иван Иванов,+79990000001,ivan@test.ru,client,vip;retail,Поставка,120000 RUB,qualified
Петр Петров,+79990000002,petr@test.ru,lead,,Консалтинг,250000 RUB,proposal`;

describe('importFromText — CSV flat rows', () => {
  it('maps contacts, deals and tags with no errors', () => {
    const { format, result } = importFromText(CSV);
    expect(format).toBe('csv');
    expect(result.stats.importedContacts).toBe(2);
    expect(result.stats.importedDeals).toBe(2);
    expect(result.stats.errors).toBe(0);

    const ivan = result.contacts.find((c) => c.displayName === 'Иван Иванов')!;
    expect(ivan.status).toBe('client');
    expect(ivan.tags).toEqual(['vip', 'retail']);
    expect(ivan.phone).toBe('+79990000001');

    const deal = result.deals.find((d) => d.title === 'Поставка')!;
    expect(deal.amount).toBe(120000);
    expect(deal.currency).toBe('RUB');
    expect(deal.stage).toBe('qualified');
    expect(deal.contactId).toBe(ivan.userId);
  });

  it('does not fabricate a deal when no deal column present', () => {
    const { result } = importFromText('name,email\nОлег,oleg@x.ru');
    expect(result.stats.importedContacts).toBe(1);
    expect(result.stats.importedDeals).toBe(0);
  });
});

describe('importFromText — JSON structured', () => {
  it('links deal + task to contact by email handle', () => {
    const json = JSON.stringify({
      contacts: [{ name: 'Анна', email: 'a@x.ru', status: 'partner' }],
      deals: [{ deal: 'Сделка1', contact: 'a@x.ru', amount: '50000 USD', stage: 'won' }],
      tasks: [{ task: 'Позвонить', contact: 'a@x.ru', priority: 'high', due: '2026-01-15' }],
    });
    const { result } = importFromText(json);
    expect(result.stats.importedContacts).toBe(1);
    expect(result.stats.importedDeals).toBe(1);
    expect(result.stats.importedTasks).toBe(1);

    const anna = result.contacts[0];
    expect(result.deals[0].contactId).toBe(anna.userId);
    expect(result.tasks[0].contactId).toBe(anna.userId);
    expect(result.tasks[0].dueAt).not.toBeNull();
  });

  it('parses a flat JSON array of contact objects', () => {
    const json = JSON.stringify([{ name: 'Боб', phone: '+79990000009', status: 'vip' }]);
    const { result } = importFromText(json);
    expect(result.stats.importedContacts).toBe(1);
    expect(result.contacts[0].status).toBe('vip');
  });
});

describe('dedup + synonyms', () => {
  const existing: CrmContact[] = [{
    userId: 'usr_existing', displayName: 'Иван Иванов', role: 'member',
    tags: [], status: 'client', phone: '+79990000001', email: 'ivan@test.ru',
  }];

  it('merges duplicate by phone into existing contact and tags the source', () => {
    const { result } = importFromText(CSV, { existingContacts: existing, source: 'bitrix' });
    expect(result.stats.duplicatesSkipped).toBe(1);
    expect(result.stats.mergedContacts).toBe(1);
    expect(result.stats.importedContacts).toBe(1);
    expect(result.mergedContacts).toHaveLength(1);
    expect(result.mergedContacts[0].userId).toBe('usr_existing');
    expect(result.mergedContacts[0].tags).toEqual(expect.arrayContaining(['vip', 'retail', 'imported:bitrix']));
    const linked = result.deals.find((d) => d.title === 'Поставка')!;
    expect(linked.contactId).toBe('usr_existing');
  });

  it('cross-source: second import merges by phone into first import contacts', () => {
    const first = importFromText('name,phone\nИван,+79990000001');
    expect(first.result.stats.importedContacts).toBe(1);
    const second = importFromText('name,phone\nIvan,+79990000001', {
      existingContacts: first.result.contacts,
      source: 'bitrix',
    });
    expect(second.result.stats.importedContacts).toBe(0);
    expect(second.result.stats.mergedContacts).toBe(1);
    expect(second.result.mergedContacts[0].tags).toEqual(expect.arrayContaining(['imported:bitrix']));
  });

  it('warns and falls back on unknown status', () => {
    const { plan } = importFromText('name,status\nСаша,zzz');
    expect(plan.issues.some((i) => i.severity === 'warning' && i.field === 'status')).toBe(true);
    const issue = plan.issues.find((i) => i.field === 'status')!;
    expect(issue.code).toBe('unknown-status');
    expect(issue.value).toBe('zzz');
    const { result } = importFromText('name,status\nСаша,zzz');
    expect(result.contacts[0].status).toBe('lead');
  });

  it('imports duplicate as new when skipDuplicates=false', () => {
    const { result } = importFromText(CSV, { existingContacts: existing, skipDuplicates: false });
    expect(result.stats.importedContacts).toBe(2);
    expect(result.stats.duplicatesSkipped).toBe(0);
  });
});

describe('parseDate', () => {
  it('parses DD.MM.YYYY', () => {
    const ts = parseDate('31.12.2025')!;
    const d = new Date(ts);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });
  it('returns null for empty', () => {
    expect(parseDate(undefined)).toBeNull();
  });
});

describe('applyPlan determinism', () => {
  it('produces stable shape for empty plan', () => {
    const plan: ImportPlan = { contacts: [], deals: [], tasks: [], issues: [], stats: { contacts: 0, deals: 0, tasks: 0, errors: 0, warnings: 0 } };
    const r = applyPlan(plan);
    expect(r.contacts).toEqual([]);
    expect(r.deals).toEqual([]);
    expect(r.tasks).toEqual([]);
  });
});
