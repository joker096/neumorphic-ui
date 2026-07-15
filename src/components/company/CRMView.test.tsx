import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));

vi.mock('../../store', () => ({ useAppStore: vi.fn(() => ({})) }));

vi.mock('../ContactProfileModal', () => ({
  ContactProfileModal: () => <div>ContactProfileModal</div>,
}));

const mockContacts = [
  { id: '1', name: 'Alice', email: 'alice@test.com', color: 'bg-blue-500', lastSeen: 1000, isFavorite: true },
  { id: '2', name: 'Bob', company: 'Acme', position: 'CEO', color: 'bg-green-500', lastSeen: 2000 },
  { id: '3', name: 'Charlie', company: 'Acme', tags: ['client'] as any, color: 'bg-red-500', lastSeen: 3000 },
];

import { CRMView } from './CRMView';

const defaultProps = {
  contacts: mockContacts,
  setContacts: vi.fn(),
  setChats: vi.fn(),
  onClose: vi.fn(), onMessage: vi.fn(), onCall: vi.fn(), onVideoCall: vi.fn(),
};

describe('CRMView', () => {
  it('renders tabs', () => {
    render(<CRMView {...defaultProps} />);
    expect(screen.getByText('crm.all')).toBeInTheDocument();
    expect(screen.getByText('crm.byCompany')).toBeInTheDocument();
    expect(screen.getByText('crm.byTag')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<CRMView {...defaultProps} />);
    expect(screen.getByPlaceholderText('crm.searchContacts')).toBeInTheDocument();
  });

  it('renders all contacts by default', () => {
    render(<CRMView {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows empty state when no contacts match filter', () => {
    render(<CRMView {...defaultProps} contacts={[]} />);
    expect(screen.getByText('No contacts found')).toBeInTheDocument();
  });
});
