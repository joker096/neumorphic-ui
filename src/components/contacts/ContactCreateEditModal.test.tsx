import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: 'div', button: 'button' },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('lucide-react', () => ({
  X: 'div', UserPlus: 'div', Edit: 'div', Scan: 'div', Check: 'div',
  Loader2: 'div', Trash2: 'div', User: 'div', Building: 'div', Tag: 'div',
}));

vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));

import { ContactCreateEditModal } from './ContactCreateEditModal';

const defaultProps = {
  onClose: vi.fn(),
  onSave: vi.fn(),
  isLoading: false,
};

describe('ContactCreateEditModal', () => {
  it('renders add contact form', () => {
    render(<ContactCreateEditModal {...defaultProps} />);
    expect(screen.getByText('contacts.addContact')).toBeInTheDocument();
    expect(screen.getByText('contacts.saveContact')).toBeInTheDocument();
  });

  it('renders name and network id inputs', () => {
    render(<ContactCreateEditModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('contacts.contactName')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('contacts.networkId')).toBeInTheDocument();
  });

  it('shows error when submitting empty form', () => {
    const { container } = render(<ContactCreateEditModal {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText('contacts.contactName');
    fireEvent.change(nameInput, { target: { value: 'Test' } });
    const form = container.querySelector('form')!;
    fireEvent.submit(form);
    expect(screen.getByText('Please fill in both fields')).toBeInTheDocument();
  });

  it('renders edit mode when contact provided', () => {
    const contact = { id: '123', name: 'Alice', color: 'bg-blue-500' };
    render(<ContactCreateEditModal {...defaultProps} contact={contact as any} />);
    expect(screen.getByText('contacts.editContact')).toBeInTheDocument();
    expect(screen.getByText('contacts.saveChanges')).toBeInTheDocument();
  });
});
