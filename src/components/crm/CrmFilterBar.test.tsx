// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { CrmFilterBar } from './CrmFilterBar';

const { state, useAppStore } = vi.hoisted(() => {
  const state: any = {
    crmFilters: { search: '', role: 'all', departmentId: 'all', status: 'all', tag: 'all', assignedToMe: false },
    setCrmFilter: vi.fn(),
    resetCrmFilters: vi.fn(),
    crmDepartments: [
      { id: 'dep1', name: 'Sales', color: '' },
      { id: 'dep2', name: 'Support', color: '' },
    ],
    crmContacts: [
      { tags: ['vip', 'hot'] },
      { tags: ['hot', 'cold'] },
      { tags: [''] },
    ],
  };
  const useAppStore = vi.fn((selector?: (s: any) => any) => (selector ? selector(state) : state));
  return { state, useAppStore };
});

vi.mock('../../store', () => ({ useAppStore }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));

describe('CrmFilterBar', () => {
  beforeEach(() => {
    state.crmFilters = { search: '', role: 'all', departmentId: 'all', status: 'all', tag: 'all', assignedToMe: false };
    state.setCrmFilter.mockClear();
    state.resetCrmFilters.mockClear();
  });

  it('renders desktop selects and mobile trigger', () => {
    render(<CrmFilterBar />);
    expect(screen.getAllByRole('combobox')).toHaveLength(4);
    expect(screen.getByRole('button', { name: /Filters/ })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the filter sheet and closes it via done', () => {
    render(<CrmFilterBar />);
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    expect(within(dialog).getAllByRole('combobox')).toHaveLength(4);
    fireEvent.click(within(dialog).getByRole('button', { name: /Done/ }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('resets filters and closes the sheet', () => {
    render(<CrmFilterBar />);
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    fireEvent.click(within(dialog).getByRole('button', { name: /Reset/ }));
    expect(state.resetCrmFilters).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the active filter badge on the mobile trigger', () => {
    state.crmFilters = { ...state.crmFilters, role: 'manager', tag: 'hot' };
    render(<CrmFilterBar />);
    expect(screen.getByTestId('crm-filter-badge')).toHaveTextContent('2');
  });

  it('toggles assigned-to-me from the sheet', () => {
    render(<CrmFilterBar />);
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    fireEvent.click(within(dialog).getByRole('button', { name: /Assigned to me/ }));
    expect(state.setCrmFilter).toHaveBeenCalledWith('assignedToMe', true);
  });

  it('role select lists system roles and writes filter', () => {
    render(<CrmFilterBar />);
    const roleSelect = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
    expect(roleSelect.value).toBe('all');
    expect(Array.from(roleSelect.options).map((o) => o.textContent)).toEqual(
      ['Role: All', 'Admin', 'Manager', 'Member'],
    );
    fireEvent.change(roleSelect, { target: { value: 'admin' } });
    expect(state.setCrmFilter).toHaveBeenCalledWith('role', 'admin');
  });

  it('department select lists departments and writes filter', () => {
    render(<CrmFilterBar />);
    const departmentSelect = screen.getAllByRole('combobox')[1] as HTMLSelectElement;
    expect(Array.from(departmentSelect.options).map((o) => o.textContent)).toEqual([
      'Department: All',
      'Sales',
      'Support',
    ]);
    fireEvent.change(departmentSelect, { target: { value: 'dep2' } });
    expect(state.setCrmFilter).toHaveBeenCalledWith('departmentId', 'dep2');
  });

  it('status select lists contact statuses and writes filter', () => {
    render(<CrmFilterBar />);
    const statusSelect = screen.getAllByRole('combobox')[2] as HTMLSelectElement;
    expect(Array.from(statusSelect.options).map((o) => o.value)).toEqual([
      'all', 'lead', 'client', 'partner', 'vendor', 'internal', 'vip',
    ]);
    fireEvent.change(statusSelect, { target: { value: 'vip' } });
    expect(state.setCrmFilter).toHaveBeenCalledWith('status', 'vip');
  });

  it('tag select is built from contact tags (deduped, empty filtered)', () => {
    render(<CrmFilterBar />);
    const tagSelect = screen.getAllByRole('combobox')[3] as HTMLSelectElement;
    expect(Array.from(tagSelect.options).map((o) => o.value)).toEqual([
      'all', 'vip', 'hot', 'cold',
    ]);
    fireEvent.change(tagSelect, { target: { value: 'cold' } });
    expect(state.setCrmFilter).toHaveBeenCalledWith('tag', 'cold');
  });

  it('reflects current filter values from store', () => {
    state.crmFilters = { search: 'q', role: 'manager', departmentId: 'dep1', status: 'lead', tag: 'hot', assignedToMe: true };
    const { unmount } = render(<CrmFilterBar />);
    const selects = screen.getAllByRole('combobox');
    expect((selects[0] as HTMLSelectElement).value).toBe('manager');
    expect((selects[1] as HTMLSelectElement).value).toBe('dep1');
    expect((selects[2] as HTMLSelectElement).value).toBe('lead');
    expect((selects[3] as HTMLSelectElement).value).toBe('hot');
    unmount();
  });

  it('omits manage-departments button without onOpenRoles', () => {
    render(<CrmFilterBar />);
    expect(screen.queryByRole('button', { name: 'Manage departments' })).toBeNull();
  });

  it('renders manage-departments button and calls onOpenRoles', () => {
    const onOpenRoles = vi.fn();
    render(<CrmFilterBar onOpenRoles={onOpenRoles} />);
    fireEvent.click(screen.getByRole('button', { name: 'Manage departments' }));
    expect(onOpenRoles).toHaveBeenCalledTimes(1);
  });

  it('manage-departments button keeps 44px tap target (no flex-shrink)', () => {
    const onOpenRoles = vi.fn();
    render(<CrmFilterBar onOpenRoles={onOpenRoles} />);
    const btn = screen.getByRole('button', { name: 'Manage departments' });
    expect(btn.className).toContain('min-h-11');
    expect(btn.className).toContain('w-11');
    expect(btn.className).toContain('shrink-0');
  });
});
