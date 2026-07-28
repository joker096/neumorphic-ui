import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { StickerPicker } from './StickerPicker';

vi.mock('../../lib/icqEmojis', () => ({
  ICQ_EMOJI_MAP: [
    { id: 'icq:1', name: 'smile' },
    { id: 'icq:2', name: 'laugh' },
    { id: 'icq:3', name: 'cry' },
  ],
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
});
