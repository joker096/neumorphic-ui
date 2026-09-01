// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCrmPermissions } from './permissions';

const { state } = vi.hoisted(() => ({
  state: {
    crmContacts: [] as any[],
    crmCustomRoles: [] as any[],
    userProfile: { id: 'u1' },
  },
}));

vi.mock('../../store', () => ({ useAppStore: (selector: any) => selector(state) }));

const admin: any = { userId: 'u1', displayName: 'Me', role: 'admin', tags: [], status: 'client' };
const member: any = { userId: 'u1', displayName: 'Me', role: 'member', tags: [], status: 'client' };

describe('useCrmPermissions', () => {
  beforeEach(() => {
    state.crmContacts = [];
    state.crmCustomRoles = [];
    state.userProfile = { id: 'u1' };
  });

  it('exposes the full admin permission set for the current user', () => {
    state.crmContacts = [admin];
    const { result } = renderHook(() => useCrmPermissions());
    expect(result.current.me).toBe(admin);
    expect(result.current.permissions).toEqual([
      'viewAll',
      'manageMembers',
      'manageDepartments',
      'manageRoles',
      'manageCompany',
      'manageDeals',
      'manageTasks',
      'assignManagers',
    ]);
    expect(result.current.can('manageRoles')).toBe(true);
    expect(result.current.can('viewAll')).toBe(true);
  });

  it('returns an empty set when the current user is not in contacts', () => {
    state.userProfile = { id: 'ghost' };
    const { result } = renderHook(() => useCrmPermissions());
    expect(result.current.me).toBeUndefined();
    expect(result.current.permissions).toEqual([]);
    expect(result.current.can('viewAll')).toBe(false);
  });

  it('merges custom role permissions with the base role permissions', () => {
    state.crmContacts = [{ ...member, customRoleId: 'cr1' }];
    state.crmCustomRoles = [{ id: 'cr1', name: 'Billing', permissions: ['manageRoles', 'manageRoles'] }];
    const { result } = renderHook(() => useCrmPermissions());
    expect(result.current.permissions).toEqual(['viewAll', 'manageRoles']);
    expect(result.current.can('manageRoles')).toBe(true);
    expect(result.current.can('manageCompany')).toBe(false);
  });

  it('falls back to base role permissions when the custom role id is unknown', () => {
    state.crmContacts = [{ ...member, customRoleId: 'gone' }];
    const { result } = renderHook(() => useCrmPermissions());
    expect(result.current.permissions).toEqual(['viewAll']);
    expect(result.current.can('manageRoles')).toBe(false);
  });
});
