import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { act } from 'react';
import { ContactProfileModal } from './ContactProfileModal';
import { useAppStore } from '../store';
import { toast } from './ui/Toast';

vi.mock('./ui/Toast', () => ({
  toast: vi.fn(),
}));

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

  it('hides the scrollbar on the profile scroll region', () => {
    render(<ContactProfileModal {...defaultProps} />);

    const scrollRegion = document.querySelector('[class*="max-h-[85vh]"]') as HTMLElement;
    expect(scrollRegion).toBeInTheDocument();
    expect(scrollRegion.className).toContain('overflow-y-auto');
    expect(scrollRegion.className).toContain('scrollbar-none');
  });

  it('shows online indicator when online', () => {
    render(<ContactProfileModal {...defaultProps} />);

    expect(screen.getByText('contacts.activeNow')).toBeInTheDocument();
  });

  it('shows last seen time when offline', () => {
    const modalProps = { ...defaultProps, contact: { ...mockContact, online: false, lastSeen: Date.now() - 3600000 } };
    render(<ContactProfileModal {...modalProps} />);

    expect(screen.getByText(/chat\.hoursAgo|hours ago/)).toBeInTheDocument();
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

  it('calls onEdit when Edit button clicked', async () => {
    render(<ContactProfileModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /moreActions|More actions/ }));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    const editBtn = screen.getByLabelText('contacts.edit');
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

    const confirmDialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const confirmBtn = within(confirmDialog).getByRole('button', { name: 'contacts.deleteContact' });
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

    const confirmDialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const cancelBtn = within(confirmDialog).getByRole('button', { name: 'contacts.close' });
    fireEvent.click(cancelBtn);

    expect(defaultProps.onDelete).not.toHaveBeenCalled();
  });

  it('calls onBlock when Block confirmed', async () => {
    useAppStore.getState().setContacts([{ id: 'hash_test_123', name: 'Test User', color: '', lastSeen: 0 }] as any);
    render(<ContactProfileModal {...defaultProps} />);

    const moreBtn = screen.getByRole('button', { name: /moreActions|More actions/ });
    expect(moreBtn).toBeInTheDocument();
    fireEvent.click(moreBtn!);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    const banBtn = document.querySelector('[class*="lucide-ban"]')?.closest('button') as HTMLElement;
    expect(banBtn).toBeInTheDocument();
    fireEvent.click(banBtn!);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    const confirmDialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const confirmBtn = within(confirmDialog).getByRole('button', { name: 'contacts.blockSpammer' });
    fireEvent.click(confirmBtn);

    expect(defaultProps.onBlock).toHaveBeenCalled();
  });

  it('does not call onBlock when Block cancelled', async () => {
    useAppStore.getState().setContacts([{ id: 'hash_test_123', name: 'Test User', color: '', lastSeen: 0 }] as any);
    render(<ContactProfileModal {...defaultProps} />);

    const moreBtn = screen.getByRole('button', { name: /moreActions|More actions/ });
    expect(moreBtn).toBeInTheDocument();
    fireEvent.click(moreBtn!);
    await act(async () => { await new Promise(r => setTimeout(r, 100)); });

    const banBtn = document.querySelector('[class*="lucide-ban"]')?.closest('button') as HTMLElement;
    expect(banBtn).toBeInTheDocument();
    fireEvent.click(banBtn!);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    const confirmDialog = document.querySelector('[role="dialog"]') as HTMLElement;
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

    const modal = screen.getByText('Test User').closest('[class*="bg-[var(--bg-tertiary)]"]');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveClass('border-[var(--border-color)]');
  });

  it('applies light theme styles', () => {
    const lightProps = { ...defaultProps, theme: 'light' as const };
    render(<ContactProfileModal {...lightProps} />);

    const modal = screen.getByText('Test User').closest('[class*="bg-white"]');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveClass('border-[var(--border-color)]');
  });

  it('shows first letter of name in avatar', () => {
    render(<ContactProfileModal {...defaultProps} />);

    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('uses provided color for avatar gradient', () => {
    render(<ContactProfileModal {...defaultProps} />);

    const avatar = screen.getByText('T').closest('button[class*="from-teal-400"]');
    expect(avatar).toBeInTheDocument();
  });

  it('falls back to gray gradient when no color provided', () => {
    const noColorProps = { ...defaultProps, contact: { ...mockContact, color: undefined } };
    render(<ContactProfileModal {...noColorProps} />);

    const avatar = screen.getByText('T').closest('button[class*="from-gray-500"]');
    expect(avatar).toBeInTheDocument();
  });

  it('opens Telegram-style photo menu on avatar click', async () => {
    render(<ContactProfileModal {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('contacts.setPhoto'));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    expect(screen.getByRole('menuitem', { name: 'contacts.setPhoto' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'contacts.removePhoto' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: 'contacts.setPhoto' }));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    expect(screen.queryByRole('menuitem', { name: 'contacts.setPhoto' })).not.toBeInTheDocument();
  });

  it('removes contact avatar from photo menu', async () => {
    useAppStore.getState().setContactAvatar('Test User', 'data:image/png;base64,xx');
    render(<ContactProfileModal {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('contacts.changePhoto'));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    const removeItem = screen.getByRole('menuitem', { name: 'contacts.removePhoto' });
    fireEvent.click(removeItem);
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });

    expect(useAppStore.getState().contactAvatars['Test User']).toBeUndefined();
  });

  it('does not render when contact is null', () => {
    const nullContactProps = { ...defaultProps, contact: null };
    render(<ContactProfileModal {...nullContactProps} />);

    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  describe('shared media', () => {
    it('renders shared media from the DM chat history', () => {
      useAppStore.getState().setChats([{ id: 1, name: 'Test User', history: [{ id: 106, type: 'file', fileName: 'report.pdf' }] }]);
      render(<ContactProfileModal {...defaultProps} />);

      expect(screen.getByText('profile.sharedMedia')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'profile.tab.files' }));
      expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });

    it('does not render shared media when the contact has no DM chat', () => {
      useAppStore.getState().setChats([{ id: 1, name: 'Someone Else', history: [] }]);
      render(<ContactProfileModal {...defaultProps} />);

      expect(screen.queryByText('profile.sharedMedia')).not.toBeInTheDocument();
    });

    it('shows the no-media placeholder when the DM chat has no media', () => {
      useAppStore.getState().setChats([{ id: 1, name: 'Test User', history: [{ id: 1, type: 'text', text: 'hello' }] }]);
      render(<ContactProfileModal {...defaultProps} />);

      expect(screen.getByText('profile.noMedia')).toBeInTheDocument();
    });
  });

  describe('notifications', () => {
    it('defaults to on when the store contact is not muted', () => {
      useAppStore.getState().setContacts([{ id: 'hash_test_123', name: 'Test User', color: '', lastSeen: 0 }] as any);
      render(<ContactProfileModal {...defaultProps} />);

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });

    it('reflects a muted contact from the store and unmutes on toggle', () => {
      useAppStore.getState().setContacts([{ id: 'hash_test_123', name: 'Test User', color: '', lastSeen: 0, muted: true }] as any);
      render(<ContactProfileModal {...defaultProps} />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
      fireEvent.click(toggle);
      expect(useAppStore.getState().contacts[0].muted).toBe(false);
    });

    it('mutes the store contact when toggled off', () => {
      useAppStore.getState().setContacts([{ id: 'hash_test_123', name: 'Test User', color: '', lastSeen: 0 }] as any);
      render(<ContactProfileModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('switch'));
      expect(useAppStore.getState().contacts[0].muted).toBe(true);
    });
  });

  describe('block', () => {
    it('marks the store contact as blocked when Block is confirmed', async () => {
      useAppStore.getState().setContacts([{ id: 'hash_test_123', name: 'Test User', color: '', lastSeen: 0 }] as any);
      render(<ContactProfileModal {...defaultProps} />);

      const moreBtn = screen.getByRole('button', { name: /moreActions|More actions/ });
      fireEvent.click(moreBtn!);
      await act(async () => { await new Promise(r => setTimeout(r, 100)); });

      const banBtn = document.querySelector('[class*="lucide-ban"]')?.closest('button') as HTMLElement;
      expect(banBtn).toBeInTheDocument();
      fireEvent.click(banBtn!);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      const confirmDialog = document.querySelector('[role="dialog"]') as HTMLElement;
      const confirmBtn = within(confirmDialog).getByRole('button', { name: 'contacts.blockSpammer' });
      fireEvent.click(confirmBtn);

      expect(useAppStore.getState().contacts[0].isBlocked).toBe(true);
    });

    it('shows a blocked badge for a blocked store contact', () => {
      useAppStore.getState().setContacts([{ id: 'hash_test_123', name: 'Test User', color: '', lastSeen: 0, isBlocked: true }] as any);
      render(<ContactProfileModal {...defaultProps} />);

      expect(screen.getByText('profile.blocked')).toBeInTheDocument();
    });

    it('does not show the blocked badge for a non-blocked contact', () => {
      useAppStore.getState().setContacts([{ id: 'hash_test_123', name: 'Test User', color: '', lastSeen: 0 }] as any);
      render(<ContactProfileModal {...defaultProps} />);

      expect(screen.queryByText('profile.blocked')).not.toBeInTheDocument();
    });

    it('marks the store contact as blocked when the profile id is synthetic (name match)', async () => {
      useAppStore.getState().setContacts([{ id: 'hash_test_123', name: 'Test User', color: '', lastSeen: 0 }] as any);
      render(<ContactProfileModal {...defaultProps} contact={{ ...mockContact, id: 'hash_chat_999' }} />);

      const moreBtn = screen.getByRole('button', { name: /moreActions|More actions/ });
      fireEvent.click(moreBtn!);
      await act(async () => { await new Promise(r => setTimeout(r, 100)); });

      const banBtn = document.querySelector('[class*="lucide-ban"]')?.closest('button') as HTMLElement;
      expect(banBtn).toBeInTheDocument();
      fireEvent.click(banBtn!);
      await act(async () => { await new Promise(r => setTimeout(r, 50)); });

      const confirmDialog = document.querySelector('[role="dialog"]') as HTMLElement;
      const confirmBtn = within(confirmDialog).getByRole('button', { name: 'contacts.blockSpammer' });
      fireEvent.click(confirmBtn);

      expect(useAppStore.getState().contacts.find((c: any) => c.id === 'hash_test_123')?.isBlocked).toBe(true);
    });

    it('hides the Block action when no store contact resolves', async () => {
      useAppStore.getState().setContacts([] as any);
      render(<ContactProfileModal {...defaultProps} contact={{ ...mockContact, id: 'hash_chat_999' }} />);

      fireEvent.click(screen.getByRole('button', { name: /moreActions|More actions/ }));
      await act(async () => { await new Promise(r => setTimeout(r, 100)); });

      expect(document.querySelector('[class*="lucide-ban"]')).toBeNull();
    });
  });

  describe('report', () => {
    it('submits a report when Report is clicked from the More menu', async () => {
      render(<ContactProfileModal {...defaultProps} />);

      const moreBtn = screen.getByRole('button', { name: /moreActions|More actions/ });
      fireEvent.click(moreBtn!);
      await act(async () => { await new Promise(r => setTimeout(r, 100)); });

      const reportBtn = screen.getByRole('button', { name: 'profile.report' });
      fireEvent.click(reportBtn);

      expect(toast).toHaveBeenCalledWith('profile.reported', 'info');
    });
  });

  describe('tap targets', () => {
    it('verify-security button has min-h-11 touch zone', () => {
      render(<ContactProfileModal {...defaultProps} />);

      const verifyBtn = screen.getByRole('button', { name: 'contacts.verifySecurity' });
      expect(verifyBtn.className).toContain('min-h-11');
    });
  });

  describe('unblock', () => {
    it('unblocks a blocked contact when Unblock is clicked from the More menu', async () => {
      const onUnblock = vi.fn();
      useAppStore.getState().setContacts([{ id: 'hash_test_123', name: 'Test User', color: '', lastSeen: 0, isBlocked: true }] as any);
      render(<ContactProfileModal {...defaultProps} onUnblock={onUnblock} />);

      fireEvent.click(screen.getByRole('button', { name: /moreActions|More actions/ }));
      await act(async () => { await new Promise(r => setTimeout(r, 100)); });

      fireEvent.click(screen.getByRole('button', { name: /profile\.unblock/ }));

      expect(onUnblock).toHaveBeenCalled();
      const updated = useAppStore.getState().contacts.find((c: any) => c.id === 'hash_test_123');
      expect(updated?.isBlocked).toBe(false);
    });

    it('does not show the Unblock button for a non-blocked contact', async () => {
      useAppStore.getState().setContacts([{ id: 'hash_test_123', name: 'Test User', color: '', lastSeen: 0 }] as any);
      render(<ContactProfileModal {...defaultProps} onUnblock={() => {}} />);

      fireEvent.click(screen.getByRole('button', { name: /moreActions|More actions/ }));
      await act(async () => { await new Promise(r => setTimeout(r, 100)); });

      expect(screen.queryByRole('button', { name: /profile\.unblock/ })).not.toBeInTheDocument();
    });

    it('unblocks the store contact when the profile id is synthetic (name match)', async () => {
      const onUnblock = vi.fn();
      useAppStore.getState().setContacts([{ id: 'hash_test_123', name: 'Test User', color: '', lastSeen: 0, isBlocked: true }] as any);
      render(<ContactProfileModal {...defaultProps} contact={{ ...mockContact, id: 'hash_chat_999' }} onUnblock={onUnblock} />);

      fireEvent.click(screen.getByRole('button', { name: /moreActions|More actions/ }));
      await act(async () => { await new Promise(r => setTimeout(r, 100)); });

      fireEvent.click(screen.getByRole('button', { name: /profile\.unblock/ }));

      expect(onUnblock).toHaveBeenCalled();
      const updated = useAppStore.getState().contacts.find((c: any) => c.id === 'hash_test_123');
      expect(updated?.isBlocked).toBe(false);
    });
  });
});
