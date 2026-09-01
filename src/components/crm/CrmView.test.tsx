// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { CrmView } from './CrmView';
import type { CrmContact } from '../../lib/crm/types';

const { state, useAppStore, perms, captured } = vi.hoisted(() => {
  const state: any = {
    ensureCrmSeed: vi.fn().mockResolvedValue(undefined),
    userProfile: { id: 'u1', name: 'Me' },
    crmContacts: [] as any[],
    crmDepartments: [] as any[],
    crmDeals: [] as any[],
    crmTasks: [] as any[],
  };
  const useAppStore = vi.fn((selector?: (s: any) => any) => (selector ? selector(state) : state));
  const perms: any = { me: null, permissions: [] as string[], can: vi.fn(() => false) };
  const captured: any = {
    people: null as any,
    deals: null as any,
    tasks: null as any,
    search: null as any,
  };
  return { state, useAppStore, perms, captured };
});

vi.mock('../../store', () => ({ useAppStore }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));
vi.mock('../../lib/crm/permissions', () => ({ useCrmPermissions: () => perms }));
vi.mock('./CrmPeople', () => ({
  CrmPeople: (props: any) => {
    captured.people = props;
    return React.createElement('div', { 'data-testid': 'crm-people' });
  },
}));
vi.mock('./CrmDeals', () => ({
  CrmDeals: (props: any) => {
    captured.deals = props;
    return React.createElement('div', { 'data-testid': 'crm-deals' });
  },
}));
vi.mock('./CrmTasks', () => ({
  CrmTasks: (props: any) => {
    captured.tasks = props;
    return React.createElement('div', { 'data-testid': 'crm-tasks' });
  },
}));
vi.mock('./CrmRoles', () => ({
  CrmRoles: () => React.createElement('div', { 'data-testid': 'crm-roles' }),
}));
vi.mock('./CrmGlobalSearch', () => ({
  CrmGlobalSearch: (props: any) => {
    captured.search = props;
    return React.createElement('button', { 'data-testid': 'global-search', onClick: () => props.onPick('deals', 'd9') });
  },
}));
vi.mock('./CrmExportMenu', () => ({
  CrmExportMenu: () => React.createElement('div', { 'data-testid': 'export-menu' }),
}));
vi.mock('./CrmInviteModal', () => ({
  CrmInviteModal: () => React.createElement('div', { 'data-testid': 'invite-modal' }),
}));
vi.mock('./CrmImportWizard', () => ({
  CrmImportWizard: () => React.createElement('div', { 'data-testid': 'import-wizard' }),
}));

describe('CrmView', () => {
  beforeEach(() => {
    state.ensureCrmSeed.mockClear();
    perms.me = null;
    perms.permissions = [];
    perms.can.mockReset();
    perms.can.mockReturnValue(false);
    captured.people = null;
    captured.deals = null;
    captured.tasks = null;
    captured.search = null;
  });

  it('seeds CRM data on mount with current user', () => {
    render(<CrmView />);
    expect(state.ensureCrmSeed).toHaveBeenCalledWith('u1', 'Me');
  });

  it('renders title and all 4 tabs', () => {
    render(<CrmView />);
    expect(screen.getByRole('heading', { name: 'CRM' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'People' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Deals' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tasks' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Roles' })).toBeTruthy();
  });

  it('renders people tab active by default with export + import buttons', () => {
    render(<CrmView />);
    expect(screen.getByRole('button', { name: 'People' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Deals' })).toHaveAttribute('aria-current', 'false');
    expect(screen.getByTestId('crm-people')).toBeTruthy();
    expect(screen.getByTestId('export-menu')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Import CRM data' })).toBeTruthy();
  });

  it('switches tabs on click', () => {
    render(<CrmView />);
    fireEvent.click(screen.getByRole('button', { name: 'Deals' }));
    expect(screen.getByTestId('crm-deals')).toBeTruthy();
    expect(screen.queryByTestId('crm-people')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tasks' }));
    expect(screen.getByTestId('crm-tasks')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Roles' }));
    expect(screen.getByTestId('crm-roles')).toBeTruthy();
  });

  it('shows role label Member for unknown user', () => {
    render(<CrmView />);
    expect(screen.getByText(/Member/)).toBeTruthy();
  });

  it('shows displayName and admin role label', () => {
    perms.me = {
      userId: 'u1',
      displayName: 'Me',
      role: 'admin',
      tags: [],
      status: 'internal',
    } as CrmContact;
    perms.permissions = ['viewAll', 'manageCompany'];
    render(<CrmView />);
    expect(screen.getByText(/Me · Admin · 2 perms/)).toBeTruthy();
  });

  it('hides invite button without manageCompany permission', () => {
    render(<CrmView />);
    expect(screen.queryByRole('button', { name: 'Invite' })).toBeNull();
  });

  it('opens invite modal for manageCompany users', () => {
    perms.can.mockImplementation((p: string) => p === 'manageCompany');
    render(<CrmView />);
    fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
    expect(screen.getByTestId('invite-modal')).toBeTruthy();
  });

  it('opens import wizard', () => {
    render(<CrmView />);
    fireEvent.click(screen.getByRole('button', { name: 'Import CRM data' }));
    expect(screen.getByTestId('import-wizard')).toBeTruthy();
  });

  it('global search pick switches tab and passes focus id', () => {
    render(<CrmView />);
    expect(captured.search.onPick).toBeTruthy();
    act(() => {
      captured.search.onPick('deals', 'd9');
    });
    expect(screen.getByRole('button', { name: 'Deals' })).toHaveAttribute('aria-current', 'true');
    expect(captured.deals.focusDealId).toBe('d9');
    expect(captured.deals.onFocusHandled).toBeTruthy();
  });

  it('clears focus after onFocusHandled', () => {
    render(<CrmView />);
    act(() => {
      captured.search.onPick('people', 'u5');
    });
    expect(captured.people.focusContactId).toBe('u5');
    act(() => {
      captured.people.onFocusHandled();
    });
    expect(captured.people.focusContactId).toBeNull();
  });
});
