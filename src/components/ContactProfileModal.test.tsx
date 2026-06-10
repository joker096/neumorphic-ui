import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ContactProfileModal } from './ContactProfileModal';

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  I18nContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
}));

const mockContact = {
  id: 'hash_test_123',
  name: 'Test User',
  color: 'from-teal-400 to-emerald-500',
  lastSeen: 1000,
  online: true,
  callInfo: undefined,
} as any;

const defaultProps = {
  contact: mockContact,
  onClose: vi.fn(),
  onCall: vi.fn(),
  onMessage: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onBlock: vi.fn(),
  theme: 'dark' as const,
};

describe('ContactProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn().mockReturnValue(true);
  });

  it('renders contact name and ID', () => {
    render(<ContactProfileModal {...defaultProps} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('hash_test_123')).toBeInTheDocument();
  });

  it('shows online indicator when online', () => {
    render(<ContactProfileModal {...defaultProps} />);

    const onlineIndicator = screen.getByText('contacts.activeNow');
    expect(onlineIndicator).toBeInTheDocument();
  });

  it('shows last seen time when offline', () => {
    const modalProps = { ...defaultProps, contact: { ...mockContact, online: false, lastSeen: 3600000 } };
    render(<ContactProfileModal {...modalProps} />);

    expect(screen.getByText('contacts.lastSeenAgo')).toBeInTheDocument();
  });

  it('shows call info when provided', () => {
    const callInfoProps = { ...defaultProps, contact: { ...mockContact, callInfo: { time: '10:30', type: 'missed' as const, duration: '00:45' } } };
    render(<ContactProfileModal {...callInfoProps} />);

   expect(screen.getByText('contacts.callType')).toBeInTheDocument();
     expect(screen.getByText(/10:30|00:45/)).toBeInTheDocument();
  });

  it('calls onCall when Call button clicked', () => {
    render(<ContactProfileModal {...defaultProps} />);

    fireEvent.click(screen.getByText('contacts.call'));

    expect(defaultProps.onCall).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onMessage when Message button clicked', () => {
    render(<ContactProfileModal {...defaultProps} />);

    fireEvent.click(screen.getByText('contacts.message'));

    expect(defaultProps.onMessage).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onEdit when Edit button clicked', () => {
    render(<ContactProfileModal {...defaultProps} />);

    fireEvent.click(screen.getByText('contacts.edit'));

    expect(defaultProps.onEdit).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onDelete when Delete confirmed', () => {
    render(<ContactProfileModal {...defaultProps} />);

    fireEvent.click(screen.getByText('contacts.deleteContact'));

    expect(window.confirm).toHaveBeenCalledWith('contacts.confirmDeleteMessage');
    expect(defaultProps.onDelete).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not call onDelete when Delete cancelled', () => {
    window.confirm = vi.fn().mockReturnValue(false);
    render(<ContactProfileModal {...defaultProps} />);

    fireEvent.click(screen.getByText('contacts.deleteContact'));

    expect(window.confirm).toHaveBeenCalledWith('contacts.confirmDeleteMessage');
    expect(defaultProps.onDelete).not.toHaveBeenCalled();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('calls onBlock when Block confirmed', () => {
    render(<ContactProfileModal {...defaultProps} />);

    fireEvent.click(screen.getByText('contacts.blockSpammer'));

    expect(window.confirm).toHaveBeenCalledWith('contacts.confirmBlockMessage');
    expect(defaultProps.onBlock).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not call onBlock when Block cancelled', () => {
    window.confirm = vi.fn().mockReturnValue(false);
    render(<ContactProfileModal {...defaultProps} />);

    fireEvent.click(screen.getByText('contacts.blockSpammer'));

    expect(window.confirm).toHaveBeenCalled();
    expect(defaultProps.onBlock).not.toHaveBeenCalled();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('closes modal when X clicked', () => {
    render(<ContactProfileModal {...defaultProps} />);

    fireEvent.click(screen.getByTitle('contacts.close'));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('applies dark theme styles', () => {
    render(<ContactProfileModal {...defaultProps} />);

    const modal = screen.getByText('Test User').closest('div[class*="bg-[#1a1d24]"]');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveClass('border-white/10');
  });

  it('applies light theme styles', () => {
    const lightProps = { ...defaultProps, theme: 'light' as const };
    render(<ContactProfileModal {...lightProps} />);

    const modal = screen.getByText('Test User').closest('div[class*="bg-white"]');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveClass('border-black/10');
  });

  it('shows first letter of name in avatar', () => {
    render(<ContactProfileModal {...defaultProps} />);

    const avatar = screen.getByText('T');
    expect(avatar).toBeInTheDocument();
  });

  it('uses provided color for avatar gradient', () => {
    render(<ContactProfileModal {...defaultProps} />);

    const avatar = screen.getByText('T').closest('div[class*="from-teal-400"]');
    expect(avatar).toBeInTheDocument();
  });

  it('falls back to gray gradient when no color provided', () => {
    const noColorProps = { ...defaultProps, contact: { ...mockContact, color: undefined } };
    render(<ContactProfileModal {...noColorProps} />);

    const avatar = screen.getByText('T').closest('div[class*="from-gray-500"]');
    expect(avatar).toBeInTheDocument();
  });

  it('does not render when contact is null', () => {
    const nullContactProps = { ...defaultProps, contact: null };
    render(<ContactProfileModal {...nullContactProps} />);

    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });
});