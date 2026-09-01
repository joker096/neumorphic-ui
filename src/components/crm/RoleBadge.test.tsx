// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { RoleBadge } from './RoleBadge';
import type { CrmContact } from '../../lib/crm/types';

const { state } = vi.hoisted(() => ({
  state: { crmCustomRoles: [] as any[] },
}));

vi.mock('../../store', () => ({ useAppStore: (selector: any) => selector(state) }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));

const contact = (role: CrmContact['role'], customRoleId?: string | null): CrmContact => ({
  userId: 'u1',
  displayName: 'User',
  role,
  tags: [],
  status: 'client',
  customRoleId,
});

describe('RoleBadge', () => {
  beforeEach(() => {
    state.crmCustomRoles = [];
  });

  it('labels the system role', () => {
    render(<RoleBadge contact={contact('admin')} />);
    expect(screen.getByText('Admin')).toBeTruthy();
  });

  it('labels manager and member roles', () => {
    render(<RoleBadge contact={contact('manager')} />);
    expect(screen.getByText('Manager')).toBeTruthy();
    render(<RoleBadge contact={contact('member')} />);
    expect(screen.getByText('Member')).toBeTruthy();
  });

  it('shows the custom role name when the role exists', () => {
    state.crmCustomRoles = [{ id: 'cr1', name: 'Billing', permissions: [] }];
    render(<RoleBadge contact={contact('member', 'cr1')} />);
    expect(screen.getByText('Member')).toBeTruthy();
    expect(screen.getByText('Billing')).toBeTruthy();
  });

  it('does not show a custom badge for an unknown role id', () => {
    render(<RoleBadge contact={contact('member', 'missing')} />);
    expect(screen.getByText('Member')).toBeTruthy();
    expect(screen.queryByText('Billing')).toBeNull();
  });
});
