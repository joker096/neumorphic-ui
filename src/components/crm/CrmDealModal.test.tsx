// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DealModal } from './CrmDealModal';
import type { Deal } from '../../lib/crm/types';

const { state, can, toastError, toastSuccess } = vi.hoisted(() => ({
  state: {
    crmContacts: [] as any[],
    userProfile: { id: 'u1' },
    addDeal: vi.fn(),
    updateDeal: vi.fn(),
  },
  can: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('../../store', () => ({ useAppStore: (selector: any) => selector(state) }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));
vi.mock('../../lib/crm/permissions', () => ({ useCrmPermissions: () => ({ can }) }));
vi.mock('sonner', () => ({ toast: { error: toastError, success: toastSuccess } }));

const alice: any = { userId: 'u1', displayName: 'Alice', status: 'client' };
const internal: any = { userId: 'u2', displayName: 'Internal Bob', status: 'internal' };

const fields = () => {
  const textboxes = screen.getAllByRole('textbox');
  const selects = screen.getAllByRole('combobox');
  return {
    title: textboxes[0],
    amount: textboxes[1],
    close: document.querySelector('input[type="date"]') as HTMLInputElement,
    contact: selects[0],
    stage: selects[1],
    owner: selects[2],
  };
};

describe('DealModal', () => {
  beforeEach(() => {
    state.crmContacts = [alice, internal];
    state.userProfile = { id: 'u1' };
    state.addDeal.mockClear();
    state.updateDeal.mockClear();
    can.mockImplementation((p: string) => p === 'manageDeals');
    toastError.mockClear();
    toastSuccess.mockClear();
  });

  it('renders an empty form in a new-deal dialog, excluding internal contacts', () => {
    render(<DealModal onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'New deal' })).toBeTruthy();
    expect(screen.getByText('Deal title')).toBeTruthy();
    expect(screen.getByText('Expected close')).toBeTruthy();
    const { contact, owner } = fields();
    expect(Array.from(contact.querySelectorAll('option')).map((o) => o.value)).toEqual(['', 'u1']);
    expect(Array.from(owner.querySelectorAll('option')).map((o) => o.value)).toEqual(['u1', 'u2']);
  });

  it('rejects saving without a title', () => {
    const onClose = vi.fn();
    render(<DealModal onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(toastError).toHaveBeenCalledWith('Title is required');
    expect(state.addDeal).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('creates a deal with the trimmed title, parsed amount and close date', () => {
    const onClose = vi.fn();
    render(<DealModal onClose={onClose} />);
    const { title, amount, close, contact, stage } = fields();
    fireEvent.change(title, { target: { value: '  Big deal  ' } });
    fireEvent.change(contact, { target: { value: 'u1' } });
    fireEvent.change(stage, { target: { value: 'proposal' } });
    fireEvent.change(amount, { target: { value: '1500' } });
    fireEvent.change(close, { target: { value: '2026-09-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(state.addDeal).toHaveBeenCalledWith({
      title: 'Big deal',
      contactId: 'u1',
      stage: 'proposal',
      amount: 1500,
      currency: 'RUB',
      ownerId: 'u1',
      expectedClose: new Date('2026-09-01').getTime(),
      notes: '',
    });
    expect(toastSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('updates an existing deal on save', () => {
    const onClose = vi.fn();
    const deal: Deal = {
      id: 'd9',
      title: 'Existing',
      contactId: 'u1',
      stage: 'won',
      amount: 100,
      currency: 'USD',
      ownerId: 'u1',
      expectedClose: null,
      createdAt: Date.parse('2026-01-01T00:00:00Z'),
    };
    render(<DealModal deal={deal} onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: 'Existing' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(state.updateDeal).toHaveBeenCalledWith(
      'd9',
      expect.objectContaining({ title: 'Existing', stage: 'won', amount: 100, currency: 'USD' }),
    );
    expect(state.addDeal).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('is read-only without manageDeals: no save button, disabled inputs', () => {
    can.mockImplementation(() => false);
    render(<DealModal onClose={() => {}} />);
    expect(screen.getByText('Read only — managers can edit')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    expect((fields().title as HTMLInputElement).disabled).toBe(true);
  });
});
