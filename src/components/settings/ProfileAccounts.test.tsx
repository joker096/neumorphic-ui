import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({
  Check: (props: any) => <div data-testid="icon-check" {...props} />,
  Plus: (props: any) => <div data-testid="icon-plus" {...props} />,
  Trash2: (props: any) => <div data-testid="icon-trash" {...props} />,
  Pencil: (props: any) => <div data-testid="icon-pencil" {...props} />,
  Crown: (props: any) => <div data-testid="icon-crown" {...props} />,
}));
vi.mock('./ConfirmModal', () => ({
  ConfirmModal: (props: any) => (
    <div data-testid="confirm-modal" data-open={String(props.isOpen)} data-title={props.title}>
      <button data-testid="cm-ok" onClick={() => props.onConfirm()}>confirm</button>
      <button data-testid="cm-x" onClick={() => props.onCancel()}>cancel</button>
    </div>
  ),
}));

import { ProfileAccounts } from './ProfileAccounts';

const t = (key: string, fallback?: string | Record<string, string | number>) =>
  (typeof fallback === 'string' ? fallback : key);

const accounts = [
  { id: 1, name: 'Nexus Terminal', color: 'from-blue-500 to-cyan-500' },
  { id: 2, name: 'Work Node', color: 'from-purple-500 to-indigo-500' },
];

const baseProps = () => ({
  isDark: false,
  t,
  accounts,
  activeId: 1,
  canAdd: true,
  onSelect: vi.fn(),
  onAddAccount: vi.fn(),
  onUpdateAccount: vi.fn(),
  onDelete: vi.fn(),
  onGetPremium: vi.fn(),
});

const renderAccounts = (overrides: Record<string, any> = {}) =>
  render(<ProfileAccounts {...baseProps()} {...overrides} />);

describe('ProfileAccounts', () => {
  it('renders all account names with Accounts header', () => {
    renderAccounts();
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('Nexus Terminal')).toBeInTheDocument();
    expect(screen.getByText('Work Node')).toBeInTheDocument();
    expect(screen.getAllByTestId('icon-check')).toHaveLength(1);
    expect(screen.getByText('Add Account')).toBeInTheDocument();
  });

  it('click on account row selects it', () => {
    const p = baseProps();
    renderAccounts(p);
    fireEvent.click(screen.getByText('Work Node'));
    expect(p.onSelect).toHaveBeenCalledWith(2);
  });

  it('shows check only on active account', () => {
    renderAccounts({ activeId: 2 });
    expect(screen.getAllByTestId('icon-check')).toHaveLength(1);
  });

  it('edit flow updates richer account fields via submit', () => {
    const p = baseProps();
    renderAccounts(p);
    fireEvent.click(screen.getAllByLabelText('Edit account')[0]);
    const nameInput = screen.getByDisplayValue('Nexus Terminal');
    fireEvent.change(nameInput, { target: { value: 'Neo' } });
    fireEvent.change(screen.getByPlaceholderText('@username'), { target: { value: 'neo' } });
    fireEvent.change(screen.getByPlaceholderText('Bio'), { target: { value: 'Neo bio' } });
    fireEvent.submit(nameInput.closest('form')!);
    expect(p.onUpdateAccount).toHaveBeenCalledWith(1, expect.objectContaining({
      name: 'Neo',
      username: 'neo',
      bio: 'Neo bio',
    }));
  });

  it('empty name does not call onUpdateAccount', () => {
    const p = baseProps();
    renderAccounts(p);
    fireEvent.click(screen.getAllByLabelText('Edit account')[1]);
    const input = screen.getByDisplayValue('Work Node');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form')!);
    expect(p.onUpdateAccount).not.toHaveBeenCalled();
  });

  it('clicking editing row input does not select', () => {
    const p = baseProps();
    renderAccounts(p);
    fireEvent.click(screen.getAllByLabelText('Edit account')[0]);
    fireEvent.click(screen.getByDisplayValue('Nexus Terminal'));
    expect(p.onSelect).not.toHaveBeenCalled();
  });

  it('delete opens confirm and confirms', () => {
    const p = baseProps();
    renderAccounts(p);
    fireEvent.click(screen.getAllByLabelText('Delete account')[1]);
    expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-open', 'true');
    fireEvent.click(screen.getByTestId('cm-ok'));
    expect(p.onDelete).toHaveBeenCalledWith(2);
    expect(screen.getByTestId('confirm-modal')).toHaveAttribute('data-open', 'false');
  });

  it('delete cancel does not call onDelete', () => {
    const p = baseProps();
    renderAccounts(p);
    fireEvent.click(screen.getAllByLabelText('Delete account')[0]);
    fireEvent.click(screen.getByTestId('cm-x'));
    expect(p.onDelete).not.toHaveBeenCalled();
  });

  it('delete hidden when single account', () => {
    renderAccounts({ accounts: [accounts[0]] });
    expect(screen.queryAllByLabelText('Delete account')).toHaveLength(0);
    expect(screen.getAllByTestId('icon-check')).toHaveLength(1);
  });

  it('add account flow submits trimmed name with optional fields', () => {
    const p = baseProps();
    renderAccounts(p);
    fireEvent.click(screen.getByText('Add Account'));
    const nameInput = screen.getByPlaceholderText('Account name...');
    const submitBtn = screen.getByLabelText('Add Account');
    expect(submitBtn).toBeDisabled();
    fireEvent.change(nameInput, { target: { value: '  ACME  ' } });
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'Pack' } });
    fireEvent.submit(nameInput.closest('form')!);
    expect(p.onAddAccount).toHaveBeenCalledWith({ name: 'ACME', username: 'Pack', bio: '' });
    expect(screen.getByText('Add Account')).toBeInTheDocument();
  });

  it('when limit reached shows premium upsell instead of Add row', () => {
    const p = baseProps();
    renderAccounts({ ...p, canAdd: false });
    expect(screen.queryByText('Add Account')).not.toBeInTheDocument();
    expect(screen.getByText('Unlimited accounts with Premium')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Premium' }));
    expect(p.onGetPremium).toHaveBeenCalled();
  });
});