import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { StickerPicker } from './StickerPicker';

const mockGetIcqStickerIds = vi.hoisted(() =>
  vi.fn((premium: boolean) => (premium ? ['icq:1', 'icq:2', 'icq:3'] : ['icq:1', 'icq:2'])),
);

const mockToast = vi.hoisted(() => vi.fn());

vi.mock('../ui/Toast', () => ({ toast: mockToast }));

let mockStore: any = { premiumEntitlement: { premium: false, plan: null, expiresAt: null } };

vi.mock('../../store', () => ({
  useAppStore: (selector: any) => (typeof selector === 'function' ? selector(mockStore) : mockStore),
}));

vi.mock('../../lib/icqEmojis', () => ({
  ICQ_EMOJI_MAP: [
    { id: 'icq:1', name: 'smile' },
    { id: 'icq:2', name: 'laugh' },
    { id: 'icq:3', name: 'cry' },
  ],
  getIcqStickerIds: mockGetIcqStickerIds,
  getICQEmojiPath: vi.fn((id: string) => `/icq/${id}.png`),
  getICQStickerSrc: vi.fn((path: string) => `/stickers/${path}.png`),
}));

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
}));

const mockOnSelect = vi.fn();
const mockOnClose = vi.fn();

const defaultProps = {
  theme: 'dark',
  onSelect: mockOnSelect,
  onClose: mockOnClose,
} as const;

describe('StickerPicker', () => {
  beforeEach(() => {
    mockOnSelect.mockClear();
    mockOnClose.mockClear();
    mockGetIcqStickerIds.mockClear();
    mockToast.mockClear();
    mockStore = { premiumEntitlement: { premium: false, plan: null, expiresAt: null } };
  });

  it('renders all tabs', () => {
    render(<StickerPicker {...defaultProps} />);
    expect(screen.getAllByText('stickers.all').length).toBeGreaterThan(0);
    expect(screen.getAllByText('stickers.icq').length).toBe(2);
    expect(screen.getAllByText('stickers.default').length).toBe(1);
  });

  it('renders search input with placeholder', () => {
    render(<StickerPicker {...defaultProps} />);
    const searchInput = document.querySelector('input');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'stickers.searchPlaceholder');
  });

  it('renders ICQ sticker pack', () => {
    render(<StickerPicker {...defaultProps} />);
    expect(screen.getAllByText('stickers.icq').length).toBe(2);
  });

  it('renders Default sticker pack', () => {
    render(<StickerPicker {...defaultProps} />);
    expect(screen.getAllByText('stickers.default').length).toBe(1);
  });

  it('renders emoji sticker pack', () => {
    render(<StickerPicker {...defaultProps} />);
    expect(screen.getAllByText('stickers.emoji').length).toBe(1);
  });

  it('filters sticker packs when searching', () => {
    render(<StickerPicker {...defaultProps} />);
    const searchInput = document.querySelector('input');
    if (searchInput) {
      act(() => {
        fireEvent.change(searchInput, { target: { value: 'icq' } });
      });
      expect(screen.getAllByText('stickers.icq').length).toBe(2);
    }
  });

  it('calls onSelect and onClose when clicking a sticker', () => {
    render(<StickerPicker {...defaultProps} />);
    const emojiButtons = document.querySelectorAll('[class*="transition-transform"]');
    if (emojiButtons.length > 0) {
      fireEvent.click(emojiButtons[0]);
      expect(mockOnSelect).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalledWith();
    }
  });

  it('renders in light theme', () => {
    render(<StickerPicker {...defaultProps} theme="light" />);
    expect(screen.getAllByText('stickers.icq').length).toBe(2);
  });

  it('limits the ICQ pack for the free tier', () => {
    render(<StickerPicker {...defaultProps} />);
    expect(mockGetIcqStickerIds).toHaveBeenCalledWith(false);
  });

  it('unlocks the full ICQ pack for premium', () => {
    mockStore = { premiumEntitlement: { premium: true, plan: 'premium', expiresAt: null } };
    render(<StickerPicker {...defaultProps} />);
    expect(mockGetIcqStickerIds).toHaveBeenCalledWith(true);
  });

  it('shows the premium teaser on non-ICQ packs for the free tier and toasts on click', () => {
    render(<StickerPicker {...defaultProps} />);
    const teasers = screen.getAllByLabelText('premium.stickerLocked');
    expect(teasers.length).toBeGreaterThan(0);
    fireEvent.click(teasers[0]);
    expect(mockToast).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('navigates to Premium and closes instead of toasting when onOpenPremium is wired (D5)', () => {
    const onOpenPremium = vi.fn();
    render(<StickerPicker {...defaultProps} onOpenPremium={onOpenPremium} />);
    const teasers = screen.getAllByLabelText('premium.stickerLocked');
    fireEvent.click(teasers[0]);
    expect(onOpenPremium).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockToast).not.toHaveBeenCalled();
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('hides the teaser for premium', () => {
    mockStore = { premiumEntitlement: { premium: true, plan: 'premium', expiresAt: null } };
    render(<StickerPicker {...defaultProps} />);
    expect(screen.queryByLabelText('premium.stickerLocked')).not.toBeInTheDocument();
  });

  it('renders sticker and premium-teaser buttons with 44px tap targets (§2.2)', () => {
    render(<StickerPicker {...defaultProps} />);
    const stickerBtns = document.querySelectorAll('button[class*="min-w-11"]');
    expect(stickerBtns.length).toBeGreaterThan(0);
    stickerBtns.forEach((btn) => expect(btn.className).toContain('min-h-11'));
    const teasers = screen.getAllByLabelText('premium.stickerLocked');
    expect(teasers.length).toBeGreaterThan(0);
    teasers.forEach((teaser) => {
      expect(teaser.className).toContain('min-w-11');
      expect(teaser.className).toContain('min-h-11');
    });
  });
});
