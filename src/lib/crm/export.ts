/**
 * CRM export helpers: CSV/JSON serialization + blob download.
 * All data is local — no network involved.
 */

import type { CrmContact, Department, Deal, CrmTask } from './types';

type Cell = string | number | null | undefined;

const esc = (v: Cell): string => {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toCsv = (rows: Cell[][]): string =>
  `\uFEFF${rows.map((r) => r.map(esc).join(',')).join('\r\n')}`;

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const depName = (id: string | null | undefined, departments: Department[]): string =>
  id ? (departments.find((d) => d.id === id)?.name ?? '') : '';

const contactName = (id: string | null | undefined, contacts: CrmContact[]): string =>
  id ? (contacts.find((c) => c.userId === id)?.displayName ?? id) : '';

export function contactsToCsv(contacts: CrmContact[], departments: Department[]): string {
  const rows: Cell[][] = [
    ['name', 'email', 'phone', 'title', 'role', 'status', 'department', 'manager', 'tags'],
  ];
  contacts.forEach((c) => {
    rows.push([
      c.displayName, c.email, c.phone, c.title, c.role, c.status,
      depName(c.departmentId, departments),
      contactName(c.assignedManagerId, contacts),
      c.tags.join('; '),
    ]);
  });
  return toCsv(rows);
}

export function dealsToCsv(deals: Deal[], contacts: CrmContact[]): string {
  const rows: Cell[][] = [
    ['id', 'title', 'stage', 'amount', 'currency', 'owner', 'contact', 'expectedClose'],
  ];
  deals.forEach((d) => {
    rows.push([
      d.id, d.title, d.stage, d.amount, d.currency,
      contactName(d.ownerId, contacts),
      contactName(d.contactId, contacts),
      d.expectedClose ? new Date(d.expectedClose).toISOString().slice(0, 10) : '',
    ]);
  });
  return toCsv(rows);
}

export function tasksToCsv(tasks: CrmTask[], contacts: CrmContact[]): string {
  const rows: Cell[][] = [
    ['id', 'title', 'done', 'priority', 'due', 'assignee', 'contact'],
  ];
  tasks.forEach((t) => {
    rows.push([
      t.id, t.title, t.done ? 'yes' : 'no', t.priority,
      t.dueAt ? new Date(t.dueAt).toISOString().slice(0, 10) : '',
      contactName(t.assigneeId, contacts),
      contactName(t.contactId, contacts),
    ]);
  });
  return toCsv(rows);
}

export function companyToCompanyJson(
  contacts: CrmContact[],
  departments: Department[],
  deals: Deal[],
  tasks: CrmTask[],
): string {
  return JSON.stringify(
    { exportedAt: new Date().toISOString(), contacts, departments, deals, tasks },
    null,
    2,
  );
}

export const exportStamp = (): string => new Date().toISOString().slice(0, 10);
