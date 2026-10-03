// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CrmDeals } from './CrmDeals';

const { state, can } = vi.hoisted(() => ({
  state: {
    crmDeals: [] as any[],
    crmContacts: [] as any[],
    crmFilters: { search: '' },
    setDealStage: vi.fn(),
  },
  can: vi.fn(),
}));

vi.mock('../../store', () => ({ useAppStore: (selector: any) => selector(state) }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ lang: 'en-US', t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));
vi.mock('../../lib/crm/permissions', () => ({ useCrmPermissions: () => ({ can }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('CrmDeals', () => {
  beforeEach(() => {
    state.crmDeals = [
      {
        id: 'd1',
        title: 'Deal 1',
        contactId: 'c1',
        stage: 'new',
        amount: 100,
        currency: 'RUB',
        ownerId: 'u1',
        expectedClose: null,
        createdAt: 0,
        notes: '',
      },
    ];
    state.crmContacts = [{ userId: 'c1', displayName: 'Alice' }];
    state.crmFilters = { search: '' };
    can.mockImplementation(() => true);
  });

  it('stage select has 44px tap target (§2.2)', () => {
    render(<CrmDeals />);
    const stageSelect = screen.getByRole('combobox') as HTMLSelectElement;
    expect(stageSelect.className).toContain('min-h-11');
  });

  it('filters deals by search query', () => {
    state.crmDeals = [
      { id: 'd1', title: 'Deal 1', contactId: 'c1', stage: 'new', amount: 100, currency: 'RUB', ownerId: 'u1', expectedClose: null, createdAt: 0, notes: '' },
      { id: 'd2', title: 'Other', contactId: 'c2', stage: 'new', amount: 1, currency: 'RUB', ownerId: 'u2', expectedClose: null, createdAt: 0, notes: '' },
    ];
    state.crmContacts = [{ userId: 'c1', displayName: 'Alice' }, { userId: 'c2', displayName: 'Bob' }];
    state.crmFilters = { search: 'Deal 1' };
    render(<CrmDeals />);
    expect(screen.getByText('Deal 1')).toBeTruthy();
    expect(screen.queryByText('Other')).toBeNull();
  });

  it('filters deals by contact name', () => {
    state.crmDeals = [
      { id: 'd1', title: 'Deal 1', contactId: 'c1', stage: 'new', amount: 100, currency: 'RUB', ownerId: 'u1', expectedClose: null, createdAt: 0, notes: '' },
      { id: 'd2', title: 'Other', contactId: 'c2', stage: 'new', amount: 1, currency: 'RUB', ownerId: 'u2', expectedClose: null, createdAt: 0, notes: '' },
    ];
    state.crmContacts = [{ userId: 'c1', displayName: 'Alice' }, { userId: 'c2', displayName: 'Bob' }];
    state.crmFilters = { search: 'Alice' };
    render(<CrmDeals />);
    expect(screen.getByText('Deal 1')).toBeTruthy();
    expect(screen.queryByText('Other')).toBeNull();
  });

  it('renders the amount in the UI locale, not a hardcoded one', () => {
    render(<CrmDeals />);
    // en-US: "RUB 100" (code prefix) on the board total and the card. ru-RU — the
    // old hardcode — was "100 ₽" for every locale.
    expect(screen.getAllByText('RUB 100').length).toBeGreaterThanOrEqual(2);
  });

  it('survives a malformed imported currency code instead of blanking the board', () => {
    // `new Intl.NumberFormat(..., { currency: 'RU' })` throws RangeError.
    state.crmDeals = [
      { id: 'd1', title: 'Broken', contactId: 'c1', stage: 'new', amount: 250, currency: 'RU', ownerId: 'u1', expectedClose: null, createdAt: 0, notes: '' },
      { id: 'd2', title: 'No currency', contactId: 'c1', stage: 'new', amount: 40, currency: '', ownerId: 'u1', expectedClose: null, createdAt: 0, notes: '' },
    ];
    expect(() => render(<CrmDeals />)).not.toThrow();
    expect(screen.getByText('250')).toBeTruthy();
    expect(screen.getByText('40')).toBeTruthy();
  });

  it('opens the linked conversation from the deal card action', () => {
    const onMessage = vi.fn();
    render(<CrmDeals onMessage={onMessage} />);
    fireEvent.click(screen.getByRole('button', { name: 'crm.openChat' }));
    expect(onMessage).toHaveBeenCalledWith('Alice');
  });

  it('hides the open-chat action when no handler is provided', () => {
    render(<CrmDeals />);
    expect(screen.queryByRole('button', { name: 'crm.openChat' })).toBeNull();
  });
});
