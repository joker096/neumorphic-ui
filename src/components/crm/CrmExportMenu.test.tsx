// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CrmExportMenu } from './CrmExportMenu';
import { downloadFile } from '../../lib/crm/export';
import type { CrmContact, Department, Deal, CrmTask } from '../../lib/crm/types';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));

vi.mock('../../lib/crm/export', async () => {
  const actual = await vi.importActual<typeof import('../../lib/crm/export')>('../../lib/crm/export');
  return { ...actual, downloadFile: vi.fn(), exportStamp: () => '2026-08-30' };
});

const departments: Department[] = [{ id: 'dep1', name: 'Sales', color: '' }];
const contacts: CrmContact[] = [
  { userId: 'u1', displayName: 'Alice', role: 'member', tags: ['vip'], status: 'client', departmentId: 'dep1' },
];
const deals: Deal[] = [
  { id: 'd1', title: 'Big Deal', contactId: 'u1', stage: 'proposal', amount: 1000, currency: 'USD', ownerId: 'u1', createdAt: 0 },
];
const tasks: CrmTask[] = [
  { id: 't1', title: 'Call Alice', done: false, priority: 'high', createdAt: 0, contactId: 'u1' },
];

const props = { contacts, departments, deals, tasks };

describe('CrmExportMenu', () => {
  beforeEach(() => {
    vi.mocked(downloadFile).mockReset();
  });

  it('renders closed trigger with no items', () => {
    render(<CrmExportMenu {...props} />);
    expect(screen.getByRole('button', { name: 'Export' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Contacts (CSV)')).toBeNull();
  });

  it('opens on click and lists 4 export options', () => {
    render(<CrmExportMenu {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(screen.getByRole('button', { name: 'Export' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Contacts (CSV)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Deals (CSV)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tasks (CSV)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Company (JSON)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Contacts (CSV)' })).toHaveClass('min-h-11');
  });

  it('closes on second click of trigger', () => {
    render(<CrmExportMenu {...props} />);
    const trigger = screen.getByRole('button', { name: 'Export' });
    fireEvent.click(trigger);
    expect(screen.getByText('Contacts (CSV)')).toBeTruthy();
    fireEvent.click(trigger);
    expect(screen.queryByText('Contacts (CSV)')).toBeNull();
  });

  it('exports contacts CSV and closes menu', () => {
    render(<CrmExportMenu {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    fireEvent.click(screen.getByRole('button', { name: 'Contacts (CSV)' }));
    expect(vi.mocked(downloadFile)).toHaveBeenCalledWith(
      'crm-contacts-2026-08-30.csv',
      expect.stringContaining('Alice'),
      'text/csv',
    );
    expect(screen.queryByText('Contacts (CSV)')).toBeNull();
  });

  it('exports deals CSV', () => {
    render(<CrmExportMenu {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    fireEvent.click(screen.getByRole('button', { name: 'Deals (CSV)' }));
    expect(vi.mocked(downloadFile)).toHaveBeenCalledWith(
      'crm-deals-2026-08-30.csv',
      expect.stringContaining('Big Deal'),
      'text/csv',
    );
  });

  it('exports tasks CSV', () => {
    render(<CrmExportMenu {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tasks (CSV)' }));
    expect(vi.mocked(downloadFile)).toHaveBeenCalledWith(
      'crm-tasks-2026-08-30.csv',
      expect.stringContaining('Call Alice'),
      'text/csv',
    );
  });

  it('exports company as pretty JSON', () => {
    render(<CrmExportMenu {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    fireEvent.click(screen.getByRole('button', { name: 'Company (JSON)' }));
    const [filename, content, mime] = vi.mocked(downloadFile).mock.calls[0];
    expect(filename).toBe('crm-company-2026-08-30.json');
    expect(mime).toBe('application/json');
    const parsed = JSON.parse(content);
    expect(parsed.contacts).toHaveLength(1);
    expect(parsed.departments).toHaveLength(1);
    expect(parsed.deals).toHaveLength(1);
    expect(parsed.tasks).toHaveLength(1);
    expect(parsed.exportedAt).toBeTruthy();
  });

  it('closes on outside mousedown', () => {
    render(<CrmExportMenu {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(screen.getByText('Contacts (CSV)')).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Contacts (CSV)')).toBeNull();
  });

  it('closes on Escape', () => {
    render(<CrmExportMenu {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(screen.getByText('Contacts (CSV)')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Contacts (CSV)')).toBeNull();
  });

});
