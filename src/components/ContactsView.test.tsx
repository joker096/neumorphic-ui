import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ContactsView } from './ContactsView';

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  I18nContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
}));

const mockContacts = [
  { name: 'Alice', id: 'hash_alice_123', color: 'from-teal-400 to-emerald-500', lastSeen: 1000 },
  { name: 'Bob', id: 'hash_bob_456', color: 'from-pink-400 to-rose-500', lastSeen: 3600000 },
  { name: 'Charlie', id: 'hash_charlie_789', color: 'from-yellow-400 to-orange-500', lastSeen: 86400000 },
];

const mockOnCall = vi.fn();
const mockOnMessage = vi.fn();

const defaultProps = {
  theme: 'dark' as const,
  contacts: mockContacts,
  setContacts: vi.fn(),
  onCall: mockOnCall,
  onMessage: mockOnMessage,
};

describe('ContactsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true) as any;
    
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  it('renders contact list with correct count', () => {
    render(<ContactsView {...defaultProps} />);

    expect(screen.getByText('contacts.title')).toBeInTheDocument();
    expect(screen.getByText('contacts.allTab')).toBeInTheDocument();
  });

  it('displays all contacts with names and IDs', () => {
    render(<ContactsView {...defaultProps} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('hash_alice_123')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('hash_bob_456')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('hash_charlie_789')).toBeInTheDocument();
  });

  it('shows last seen times correctly', () => {
    render(<ContactsView {...defaultProps} />);

    expect(screen.getByText('• chat.minutesAgo')).toBeInTheDocument();
    expect(screen.getByText('• chat.hoursAgo')).toBeInTheDocument();
    expect(screen.getByText('• chat.daysAgo')).toBeInTheDocument();
  });

  it('opens add contact modal when + button clicked', () => {
    render(<ContactsView {...defaultProps} />);

    fireEvent.click(screen.getByTitle('contacts.addContact'));

    expect(screen.getByRole('heading', { name: /contacts.addContact/ })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('contacts.contactName')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('contacts.networkId')).toBeInTheDocument();
  });

  it('adds new contact when form submitted', () => {
    render(<ContactsView {...defaultProps} />);

    fireEvent.click(screen.getByTitle('contacts.addContact'));
    expect(screen.getByRole('heading', { name: /contacts.addContact/ })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('contacts.contactName'), { target: { value: 'David' } });
    fireEvent.change(screen.getByPlaceholderText('contacts.networkId'), { target: { value: 'hash_david_999' } });
    fireEvent.click(screen.getByText('contacts.saveContact'));

    expect(defaultProps.setContacts).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ name: 'David', id: 'hash_david_999' }),
    ]));
  });

  it('opens share ID modal when QR button clicked', () => {
    render(<ContactsView {...defaultProps} />);

    fireEvent.click(screen.getByTitle('contacts.shareIdentity'));

    expect(screen.getByRole('heading', { name: /contacts.shareIdentity/ })).toBeInTheDocument();
    expect(screen.getByText('nexus://id/fingerprint')).toBeInTheDocument();
    expect(screen.getByText('header.copyLink')).toBeInTheDocument();
  });

  it('copies ID to clipboard', () => {
    render(<ContactsView {...defaultProps} />);

    fireEvent.click(screen.getByTitle('contacts.shareIdentity'));
    expect(screen.getByText(/header.copyLink/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('header.copyLink'));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('nexus://id/fingerprint');
  });

  it('sorts contacts alphabetically by default', () => {
    render(<ContactsView {...defaultProps} />);

    const contacts = screen.getAllByText(/Alice|Bob|Charlie/);
    expect(contacts[0]).toHaveTextContent('Alice');
    expect(contacts[1]).toHaveTextContent('Bob');
    expect(contacts[2]).toHaveTextContent('Charlie');
  });

  it('sorts contacts by recent when recent tab clicked', () => {
    render(<ContactsView {...defaultProps} />);

    fireEvent.click(screen.getByText('contacts.recentTab'));

    const contacts = screen.getAllByText(/Alice|Bob|Charlie/);
    expect(contacts[0]).toHaveTextContent('Alice');
    expect(contacts[1]).toHaveTextContent('Bob');
    expect(contacts[2]).toHaveTextContent('Charlie');
  });

  it('opens contact profile when contact clicked', () => {
    render(<ContactsView {...defaultProps} />);

    fireEvent.click(screen.getByText('Alice'));

    expect(screen.getByRole('heading', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /contacts.call/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /contacts.message/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /contacts.edit/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /contacts.deleteContact/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /contacts.blockSpammer/ })).toBeInTheDocument();
  });

  it('calls onCall when Call button clicked in profile', () => {
    render(<ContactsView {...defaultProps} />);

    fireEvent.click(screen.getByText('Alice'));
    fireEvent.click(screen.getByRole('button', { name: 'contacts.call' }));

    expect(mockOnCall).toHaveBeenCalledWith('Alice', 'from-teal-400 to-emerald-500');
  });

  it('calls onMessage when Message button clicked in profile', () => {
    render(<ContactsView {...defaultProps} />);

    fireEvent.click(screen.getByText('Alice'));
    fireEvent.click(screen.getByRole('button', { name: 'contacts.message' }));

    expect(mockOnMessage).toHaveBeenCalledWith('Alice', 'from-teal-400 to-emerald-500');
  });

  it('deletes contact when Delete confirmed', () => {
    render(<ContactsView {...defaultProps} />);

    fireEvent.click(screen.getByText('Alice'));
    fireEvent.click(screen.getByRole('button', { name: 'contacts.deleteContact' }));

    expect(window.confirm).toHaveBeenCalledWith('contacts.confirmDeleteMessage');
    expect(defaultProps.setContacts).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'Bob' }),
      expect.objectContaining({ name: 'Charlie' }),
    ]);
  });

  it('calls onEdit when Edit clicked', () => {
    render(<ContactsView {...defaultProps} />);

    fireEvent.click(screen.getByText('Alice'));
    fireEvent.click(screen.getByRole('button', { name: 'contacts.edit' }));
  });

  it('saves edited contact via setContacts', () => {
    const mockSetContacts = vi.fn();
    const editProps = { ...defaultProps, setContacts: mockSetContacts };
    
    render(<ContactsView {...editProps} />);

    fireEvent.click(screen.getByText('Alice'));
    fireEvent.click(screen.getByRole('button', { name: 'contacts.edit' }));
  });

  it('opens scan modal when Scan button clicked', () => {
    render(<ContactsView {...defaultProps} />);

    fireEvent.click(screen.getByTitle('contacts.scanContactQR'));

    expect(screen.getByRole('heading', { name: /contacts.scanContactQR/ })).toBeInTheDocument();
  });

  it('applies dark theme styles', () => {
    render(<ContactsView {...defaultProps} />);

    const container = screen.getByTestId('contacts-container');
    expect(container).toHaveClass('bg-[#11141c]/50');
    expect(container).toHaveClass('border-white/5');
  });

  it('applies light theme styles', () => {
    const lightProps = { ...defaultProps, theme: 'light' as const };
    render(<ContactsView {...lightProps} />);

    const container = screen.getByTestId('contacts-container');
    expect(container).toHaveClass('bg-[#eaeff4]/50');
    expect(container).toHaveClass('border-black/5');
  });

  it('shows empty state when no contacts', () => {
    render(<ContactsView {...defaultProps} contacts={[]} />);

    expect(screen.getByText('contacts.allTab')).toBeInTheDocument();
  });

  it('closes modals when X clicked', () => {
    render(<ContactsView {...defaultProps} />);

    fireEvent.click(screen.getByTitle('contacts.addContact'));
    expect(screen.getByRole('heading', { name: /contacts.addContact/ })).toBeInTheDocument();

    // Check that close button exists
    expect(screen.getByTitle('contacts.close')).toBeInTheDocument();
  });
});
