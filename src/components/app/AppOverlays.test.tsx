import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: 'div' },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ theme: 'dark' }) }));

vi.mock('../CreateChannelModal', () => ({
  CreateChannelModal: () => <div>CreateChannelModal</div>,
}));

vi.mock('../CreateBotModal', () => ({
  CreateBotModal: () => <div>CreateBotModal</div>,
}));

vi.mock('../ContactCreateEditModal', () => ({
  ContactCreateEditModal: () => <div>ContactCreateEditModal</div>,
}));

vi.mock('../ContactProfileModal', () => ({
  ContactProfileModal: () => <div>ContactProfileModal</div>,
}));

import { AppOverlays } from './AppOverlays';

const defaultProps = {
  view: 'chats', showCreateChannel: false, setShowCreateChannel: vi.fn(),
  showCreateBot: false, setShowCreateBot: vi.fn(),
  showAdvancedFilterModal: false, setShowAdvancedFilterModal: vi.fn(),
  advancedFilters: {}, setAdvancedFilters: vi.fn(),
  globalSelectedContact: null, setGlobalSelectedContact: vi.fn(),
  activeChat: null, setActiveChat: vi.fn(),
  editingContact: null, setEditingContact: vi.fn(),
  contacts: [], setContacts: vi.fn(),
  chats: [], setChats: vi.fn(),
  t: (k: string) => k,
  onProfileCall: vi.fn(), onProfileVideoCall: vi.fn(),
  onProfileMessage: vi.fn(), onProfileDelete: vi.fn(),
  onProfileEdit: vi.fn(), onProfileBlock: vi.fn(),
  onProfileToggleFavorite: vi.fn(),
};

describe('AppOverlays', () => {
  it('renders nothing when all modals closed', () => {
    const { container } = render(<AppOverlays {...defaultProps} />);
    expect(screen.queryByText('CreateChannelModal')).not.toBeInTheDocument();
    expect(screen.queryByText('CreateBotModal')).not.toBeInTheDocument();
  });

  it('shows CreateChannelModal when showCreateChannel is true', () => {
    render(<AppOverlays {...defaultProps} showCreateChannel={true} />);
    expect(screen.getByText('CreateChannelModal')).toBeInTheDocument();
  });

  it('shows CreateBotModal when showCreateBot is true', () => {
    render(<AppOverlays {...defaultProps} showCreateBot={true} />);
    expect(screen.getByText('CreateBotModal')).toBeInTheDocument();
  });

  it('shows ContactProfileModal when globalSelectedContact is set', () => {
    render(<AppOverlays {...defaultProps} globalSelectedContact={{ id: '1', name: 'Test' }} />);
    expect(screen.getByText('ContactProfileModal')).toBeInTheDocument();
  });

  it('shows ContactCreateEditModal when editingContact is set', () => {
    render(<AppOverlays {...defaultProps} editingContact={{ id: '1', name: 'Test' }} />);
    expect(screen.getByText('ContactCreateEditModal')).toBeInTheDocument();
  });
});
