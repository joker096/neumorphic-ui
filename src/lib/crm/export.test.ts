// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { downloadFile, contactsToCsv, dealsToCsv, tasksToCsv, companyToCompanyJson, exportStamp } from './export';
import type { CrmContact, Department, Deal, CrmTask } from './types';

const alice: CrmContact = {
  userId: 'u1',
  displayName: 'Alice',
  role: 'admin',
  tags: ['vip', 'warm'],
  status: 'client',
  email: 'alice@x.io',
  phone: '+1555',
  title: 'CTO',
  departmentId: 'dep1',
  assignedManagerId: 'u2',
};
const bob: CrmContact = { userId: 'u2', displayName: 'Doe, John', role: 'member', tags: [], status: 'internal' };
const ghost: CrmContact = {
  userId: 'u3',
  displayName: 'Ghost',
  role: 'member',
  tags: [],
  status: 'lead',
  assignedManagerId: 'nobody',
};
const departments: Department[] = [{ id: 'dep1', name: 'Sales', color: 'from-blue-400 to-indigo-500' }];

const deal: Deal = {
  id: 'd1',
  title: 'Alpha deal',
  contactId: 'u1',
  stage: 'proposal',
  amount: 1500,
  currency: 'USD',
  ownerId: 'u3',
  expectedClose: Date.parse('2026-01-02T00:00:00Z'),
  createdAt: Date.parse('2025-01-01T00:00:00Z'),
};
const task: CrmTask = {
  id: 't1',
  title: 'Follow up',
  done: false,
  priority: 'high',
  dueAt: Date.parse('2026-02-03T00:00:00Z'),
  assigneeId: 'u1',
  contactId: 'u1',
  createdAt: Date.parse('2025-01-01T00:00:00Z'),
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('downloadFile', () => {
  it('creates a blob, clicks the anchor and revokes the url', () => {
    const createUrl = vi.fn(() => 'blob:mock');
    const revokeUrl = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: createUrl, revokeObjectURL: revokeUrl });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadFile('contacts.csv', 'a,b', 'text/csv');

    expect(createUrl).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(revokeUrl).toHaveBeenCalledWith('blob:mock');
    expect(document.body.querySelector('a')).toBeNull();
  });
});

describe('contactsToCsv', () => {
  it('emits a BOM-prefixed header row and one row per contact', () => {
    const csv = contactsToCsv([alice], departments);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('\uFEFFname,email,phone,title,role,status,department,manager,tags');
    expect(lines.length).toBe(2);
  });

  it('resolves department and manager names and joins tags', () => {
    const csv = contactsToCsv([alice, bob, ghost], departments);
    const lines = csv.split('\r\n');
    expect(lines[1]).toContain('"Doe, John"');
    expect(lines[1]).toContain('Sales');
    expect(lines[1]).toContain('vip; warm');
  });

  it('escapes commas, quotes and newlines in cells', () => {
    const tricky: CrmContact = { ...alice, userId: 'u9', displayName: 'O"Neil, Jr.' };
    const csv = contactsToCsv([tricky], departments);
    expect(csv).toContain('"O""Neil, Jr."');
  });

  it('falls back to the raw manager id for unknown managers', () => {
    const csv = contactsToCsv([ghost], departments);
    const lines = csv.split('\r\n');
    expect(lines[1]).toBe('Ghost,,,,member,lead,,nobody,');
  });

  it('returns only the header for an empty list', () => {
    const csv = contactsToCsv([], departments);
    expect(csv.split('\r\n')).toHaveLength(1);
  });
});

describe('dealsToCsv', () => {
  it('resolves owner and contact names and formats the close date', () => {
    const csv = dealsToCsv([deal], [ghost, alice]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('\uFEFFid,title,stage,amount,currency,owner,contact,expectedClose');
    expect(lines[1]).toBe('d1,Alpha deal,proposal,1500,USD,Ghost,Alice,2026-01-02');
  });

  it('leaves owner and close date empty when missing', () => {
    const open: Deal = { ...deal, id: 'd2', ownerId: '', expectedClose: null };
    const csv = dealsToCsv([open], []);
    const lines = csv.split('\r\n');
    expect(lines[1]).toBe('d2,Alpha deal,proposal,1500,USD,,u1,');
  });
});

describe('tasksToCsv', () => {
  it('serializes done flag, dates and resolved names', () => {
    const csv = tasksToCsv([task], [alice]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('\uFEFFid,title,done,priority,due,assignee,contact');
    expect(lines[1]).toBe('t1,Follow up,no,high,2026-02-03,Alice,Alice');
  });

  it('marks done tasks and leaves missing dates blank', () => {
    const done: CrmTask = { ...task, id: 't2', title: 'Done task', done: true, dueAt: null };
    const csv = tasksToCsv([done], []);
    const lines = csv.split('\r\n');
    expect(lines[1]).toBe('t2,Done task,yes,high,,u1,u1');
  });
});

describe('companyToCompanyJson', () => {
  it('embeds all collections plus an export timestamp', () => {
    const parsed = JSON.parse(companyToCompanyJson([alice], departments, [deal], [task]));
    expect(parsed.contacts).toEqual([alice]);
    expect(parsed.departments).toEqual(departments);
    expect(parsed.deals).toEqual([deal]);
    expect(parsed.tasks).toEqual([task]);
    expect(parsed.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe('exportStamp', () => {
  it('is a yyyy-mm-dd date', () => {
    expect(exportStamp()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
