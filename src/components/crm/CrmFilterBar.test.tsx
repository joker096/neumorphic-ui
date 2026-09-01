// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CrmFilterBar } from './CrmFilterBar';

const { state, useAppStore } = vi.hoisted(() => {
  const state: any = {
    crmFilters: { search: '', role: 'all', departmentId: 'all', status: 'all', tag: 'all', assignedToMe: false },
    setCrmFilter: vi.fn(),
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
  });

  it('renders search input wired to filters.search', () => {
    render(<CrmFilterBar />);
    const input = screen.getByRole('textbox', { name: 'Search contacts...' }) as HTMLInputElement;
    expect(input.value).toBe('');
    fireEvent.change(input, { target: { value: 'ali' } });
    expect(state.setCrmFilter).toHaveBeenCalledWith('search', 'ali');
  });

  it('toggles "Assigned to me" filter', () => {
    render(<CrmFilterBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Assigned to me' }));
    expect(state.setCrmFilter).toHaveBeenCalledWith('assignedToMe', true);
  });

  it('role select lists system roles and writes filter', () => {
    render(<CrmFilterBar />);
    const selects = screen.getAllByRole('combobox');
    const roleSelect = selects[0] as HTMLSelectElement;
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
    expect((screen.getByRole('textbox', { name: 'Search contacts...' }) as HTMLInputElement).value).toBe('q');
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
});
