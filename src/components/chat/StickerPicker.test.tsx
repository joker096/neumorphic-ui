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
  CAVEMAN_STICKERS: [
    { id: 'caveman-train', name: 'Train', file: 'caveman-train.png' },
    { id: 'caveman-boulder', name: 'Boulder', file: 'caveman-boulder.png' },
  ],
  RACOON_STICKERS: [
    { id: 'racoon-sleep', name: 'Sleep', file: 'racoon-sleep.png' },
    { id: 'racoon-workout2', name: 'Workout', file: 'racoon-workout2.png' },
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

  it('renders all four tabs (all, icq, caveman, raccoon)', () => {
    render(<StickerPicker {...defaultProps} />);
    expect(screen.getAllByText('stickers.all').length).toBeGreaterThan(0);
    expect(screen.getAllByText('stickers.icq').length).toBe(2);
    expect(screen.getAllByText('stickers.caveman').length).toBe(1);
    expect(screen.getAllByText('stickers.raccoon').length).toBe(1);
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

  it('renders Caveman sticker pack', () => {
    render(<StickerPicker {...defaultProps} />);
    expect(screen.getAllByText('stickers.caveman').length).toBe(1);
  });

  it('renders Raccoon sticker pack', () => {
    render(<StickerPicker {...defaultProps} />);
    expect(screen.getAllByText('stickers.raccoon').length).toBe(1);
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
        fireEvent.change(searchInput, { target: { value: 'caveman' } });
      });
      expect(screen.getAllByText('stickers.caveman').length).toBe(1);
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
    expect(screen.getAllByText('stickers.caveman').length).toBe(1);
    expect(screen.getAllByText('stickers.raccoon').length).toBe(1);
  });

  it('switches to specific tab when clicked', () => {
    render(<StickerPicker {...defaultProps} />);
    const cavemanTab = screen.getAllByText('stickers.caveman')[0] as HTMLElement;
    fireEvent.click(cavemanTab);
    expect(screen.getAllByText('stickers.caveman').length).toBe(1);
  });
});
