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

const toggleFilters = () => fireEvent.click(screen.getByRole('button', { name: /Filters/ }));

describe('CrmFilterBar', () => {
  beforeEach(() => {
    state.crmFilters = { search: '', role: 'all', departmentId: 'all', status: 'all', tag: 'all', assignedToMe: false };
    state.setCrmFilter.mockClear();
    state.resetCrmFilters.mockClear();
  });

  it('renders toggle button and badge, hides selects initially', () => {
    render(<CrmFilterBar />);
    expect(screen.getByRole('button', { name: /Filters/ })).toBeTruthy();
    expect(screen.queryAllByRole('combobox')).toHaveLength(0);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('toggles filter selects visible on click', () => {
    render(<CrmFilterBar />);
    toggleFilters();
    // jsdom renders both desktop inline + mobile sheet selects
    expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(4);
  });

  it('toggles filter selects hidden on second click', () => {
    render(<CrmFilterBar />);
    toggleFilters();
    expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(4);
    toggleFilters();
    expect(screen.queryAllByRole('combobox')).toHaveLength(0);
  });

  it('opens the filter sheet and closes it via done', () => {
    render(<CrmFilterBar />);
    toggleFilters();
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    expect(within(dialog).getAllByRole('combobox').length).toBeGreaterThanOrEqual(4);
    fireEvent.click(within(dialog).getByRole('button', { name: /Done/ }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('resets filters and closes the sheet', () => {
    render(<CrmFilterBar />);
    toggleFilters();
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    fireEvent.click(within(dialog).getByRole('button', { name: /Reset/ }));
    expect(state.resetCrmFilters).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the active filter badge on the toggle button', () => {
    state.crmFilters = { ...state.crmFilters, role: 'manager', tag: 'hot' };
    render(<CrmFilterBar />);
    expect(screen.getByTestId('crm-filter-badge')).toHaveTextContent('2');
  });

  it('toggles assigned-to-me from the sheet', () => {
    render(<CrmFilterBar />);
    toggleFilters();
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    fireEvent.click(within(dialog).getByRole('button', { name: /Assigned to me/ }));
    expect(state.setCrmFilter).toHaveBeenCalledWith('assignedToMe', true);
  });

  it('role select lists system roles and writes filter', () => {
    render(<CrmFilterBar />);
    toggleFilters();
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
    toggleFilters();
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
    toggleFilters();
    const statusSelect = screen.getAllByRole('combobox')[2] as HTMLSelectElement;
    expect(Array.from(statusSelect.options).map((o) => o.value)).toEqual([
      'all', 'lead', 'client', 'partner', 'vendor', 'internal', 'vip',
    ]);
    fireEvent.change(statusSelect, { target: { value: 'vip' } });
    expect(state.setCrmFilter).toHaveBeenCalledWith('status', 'vip');
  });

  it('tag select is built from contact tags (deduped, empty filtered)', () => {
    render(<CrmFilterBar />);
    toggleFilters();
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
    toggleFilters();
    const selects = screen.getAllByRole('combobox');
    expect((selects[0] as HTMLSelectElement).value).toBe('manager');
    expect((selects[1] as HTMLSelectElement).value).toBe('dep1');
    expect((selects[2] as HTMLSelectElement).value).toBe('lead');
    expect((selects[3] as HTMLSelectElement).value).toBe('hot');
    unmount();
  });

  it('omits manage-departments button without onOpenRoles', () => {
    render(<CrmFilterBar />);
    toggleFilters();
    expect(screen.queryByRole('button', { name: 'Manage departments' })).toBeNull();
  });

  it('renders manage-departments button and calls onOpenRoles', () => {
    const onOpenRoles = vi.fn();
    render(<CrmFilterBar onOpenRoles={onOpenRoles} />);
    toggleFilters();
    fireEvent.click(screen.getByRole('button', { name: 'Manage departments' }));
    expect(onOpenRoles).toHaveBeenCalledTimes(1);
  });

  it('manage-departments button keeps 44px tap target (no flex-shrink)', () => {
    const onOpenRoles = vi.fn();
    render(<CrmFilterBar onOpenRoles={onOpenRoles} />);
    toggleFilters();
    const btn = screen.getByRole('button', { name: 'Manage departments' });
    expect(btn.className).toContain('min-h-11');
    expect(btn.className).toContain('w-11');
    expect(btn.className).toContain('shrink-0');
  });
});
