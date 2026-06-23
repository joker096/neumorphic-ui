import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { act } from 'react';
import { ContactProfileModal } from './ContactProfileModal';

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key === 'contacts.videoCall' ? 'Video' : key === 'contacts.call' ? 'Call' : key === 'contacts.moreActions' ? 'More actions' : key,
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
  onRequestDelete: vi.fn(),
  onBlock: vi.fn(),
  theme: 'dark' as const,
};

describe('ContactProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders contact name and ID', () => {
    render(<ContactProfileModal {...defaultProps} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('hash_test_123')).toBeInTheDocument();
  });

  it('shows online indicator when online', () => {
    render(<ContactProfileModal {...defaultProps} />);

    expect(screen.getByText('contacts.activeNow')).toBeInTheDocument();
  });

  it('shows last seen time when offline', () => {
    const modalProps = { ...defaultProps, contact: { ...mockContact, online: false, lastSeen: 3600000 } };
    render(<ContactProfileModal {...modalProps} />);

    expect(screen.getByText(/contacts\.lastSeenAgo|hours ago/)).toBeInTheDocument();
  });

  it('shows call info when provided', async () => {
    const callInfoProps = { ...defaultProps, contact: { ...mockContact, callInfo: { time: '10:30', type: 'missed' as const, duration: '00:45' } } };
    render(<ContactProfileModal {...callInfoProps} />);

    await waitFor(() => {
      expect(screen.getByText(/contacts\.callType/)).toBeInTheDocument();
    });
  });

  const getProfileActionButtons = () => {
    const profileCard = screen.getByText('Test User').closest('div[class*="max-w-"]') as HTMLElement;
    const buttons = within(profileCard).getAllByRole('button');
    const callBtn = buttons.find(b => b.querySelector('[class*="lucide-phone"]'));
    const messageBtn = buttons.find(b => b.querySelector('[class*="lucide-message-square"]'));
    return { callBtn, messageBtn };
  };

  it('calls onCall when Call button clicked', () => {
    render(<ContactProfileModal {...defaultProps} />);

    const { callBtn } = getProfileActionButtons();
    fireEvent.click(callBtn!);

    expect(defaultProps.onCall).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onVideoCall when Video button clicked', () => {
    const props = { ...defaultProps, onVideoCall: vi.fn() };
    render(<ContactProfileModal {...props} />);

    const videoBtn = screen.getByRole('button', { name: 'Video' });
    fireEvent.click(videoBtn);

    expect(props.onVideoCall).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onMessage when Message button clicked', () => {
    render(<ContactProfileModal {...defaultProps} />);

    const { messageBtn } = getProfileActionButtons();
    fireEvent.click(messageBtn!);

    expect(defaultProps.onMessage).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onEdit when Edit button clicked', () => {
    render(<ContactProfileModal {...defaultProps} />);

    const avatar = screen.getByText('T').closest('div[class*="group"]') as HTMLElement;
    const editBtn = within(avatar).getByLabelText('contacts.edit');
    fireEvent.click(editBtn);

    expect(defaultProps.onEdit).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onDelete when Delete confirmed', async () => {
    render(<ContactProfileModal {...defaultProps} />);

    const moreBtn = screen.getByRole('button', { name: /moreActions|More actions/ });
    expect(moreBtn).toBeInTheDocument();
    fireEvent.click(moreBtn!);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    const trashBtn = document.querySelector('[class*="lucide-trash"]')?.closest('button') as HTMLElement;
    expect(trashBtn).toBeInTheDocument();
    fireEvent.click(trashBtn!);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    const confirmDialog = document.querySelector('[class*="z-[200]"]') as HTMLElement;
    const confirmBtn = within(confirmDialog).getByText((content, el) =>
      content === 'contacts.deleteContact' && el?.tagName === 'BUTTON'
    );
    fireEvent.click(confirmBtn);

    expect(defaultProps.onDelete).toHaveBeenCalled();
  });

  it('does not call onDelete when Delete cancelled', async () => {
    render(<ContactProfileModal {...defaultProps} />);

    const moreBtn = screen.getByRole('button', { name: /moreActions|More actions/ });
    expect(moreBtn).toBeInTheDocument();
    fireEvent.click(moreBtn!);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    const trashBtn = document.querySelector('[class*="lucide-trash"]')?.closest('button') as HTMLElement;
    expect(trashBtn).toBeInTheDocument();
    fireEvent.click(trashBtn!);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    const confirmDialog = document.querySelector('[class*="z-[200]"]') as HTMLElement;
    const cancelBtn = within(confirmDialog).getByRole('button', { name: 'contacts.close' });
    fireEvent.click(cancelBtn);

    expect(defaultProps.onDelete).not.toHaveBeenCalled();
  });

  it('calls onBlock when Block confirmed', async () => {
    render(<ContactProfileModal {...defaultProps} />);

    const moreBtn = screen.getByRole('button', { name: /moreActions|More actions/ });
    expect(moreBtn).toBeInTheDocument();
    fireEvent.click(moreBtn!);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    const banBtn = document.querySelector('[class*="lucide-ban"]')?.closest('button') as HTMLElement;
    expect(banBtn).toBeInTheDocument();
    fireEvent.click(banBtn!);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    const confirmDialog = document.querySelector('[class*="z-[200]"]') as HTMLElement;
    const confirmBtn = within(confirmDialog).getByRole('button', { name: 'contacts.blockSpammer' });
    fireEvent.click(confirmBtn);

    expect(defaultProps.onBlock).toHaveBeenCalled();
  });

  it('does not call onBlock when Block cancelled', async () => {
    render(<ContactProfileModal {...defaultProps} />);

    const moreBtn = screen.getByRole('button', { name: /moreActions|More actions/ });
    expect(moreBtn).toBeInTheDocument();
    fireEvent.click(moreBtn!);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    const banBtn = document.querySelector('[class*="lucide-ban"]')?.closest('button') as HTMLElement;
    expect(banBtn).toBeInTheDocument();
    fireEvent.click(banBtn!);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    const confirmDialog = document.querySelector('[class*="z-[200]"]') as HTMLElement;
    const cancelBtn = within(confirmDialog).getByRole('button', { name: 'contacts.close' });
    fireEvent.click(cancelBtn);

    expect(defaultProps.onBlock).not.toHaveBeenCalled();
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

    expect(screen.getByText('T')).toBeInTheDocument();
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