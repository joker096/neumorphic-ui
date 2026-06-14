import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StickerPicker } from './StickerPicker';

describe('StickerPicker', () => {
  const onSelect = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with dark theme', () => {
    render(<StickerPicker theme="dark" onSelect={onSelect} onClose={onClose} />);
    expect(screen.getByPlaceholderText('stickers.search')).toBeTruthy();
  });

  it('renders with light theme', () => {
    render(<StickerPicker theme="light" onSelect={onSelect} onClose={onClose} />);
    expect(screen.getByPlaceholderText('stickers.search')).toBeTruthy();
  });

  it('renders all tab buttons', () => {
    render(<StickerPicker theme="dark" onSelect={onSelect} onClose={onClose} />);
    expect(screen.getByText('stickers.all')).toBeTruthy();
    expect(screen.getByText('stickers.emoji')).toBeTruthy();
    const emojiHeaders = screen.getAllByText('Emoji');
    expect(emojiHeaders.length).toBe(1);
    const defaultTabs = screen.getAllByText('Default');
    expect(defaultTabs.length).toBe(2);
    const natureTabs = screen.getAllByText('Nature');
    expect(natureTabs.length).toBe(2);
  });

  it('renders emoji stickers', () => {
    render(<StickerPicker theme="dark" onSelect={onSelect} onClose={onClose} />);
    expect(screen.getByText('😀')).toBeTruthy();
    const laughEmojis = screen.getAllByText('😂');
    expect(laughEmojis.length).toBeGreaterThan(0);
    expect(screen.getByText('👍')).toBeTruthy();
  });

  it('filters by tab when clicked', () => {
    render(<StickerPicker theme="dark" onSelect={onSelect} onClose={onClose} />);
    const tabButtons = screen.getAllByText('Animals');
    fireEvent.click(tabButtons[0]);
    expect(screen.getByText('🐱')).toBeTruthy();
    expect(screen.queryByText('🍕')).toBeNull();
  });

  it('calls onSelect and onClose when sticker clicked', () => {
    render(<StickerPicker theme="dark" onSelect={onSelect} onClose={onClose} />);
    fireEvent.click(screen.getByText('😀'));
    expect(onSelect).toHaveBeenCalledWith('😀');
    expect(onClose).toHaveBeenCalled();
  });

  it('filters by search text', () => {
    render(<StickerPicker theme="dark" onSelect={onSelect} onClose={onClose} />);
    const searchInput = screen.getByPlaceholderText('stickers.search');
    fireEvent.change(searchInput, { target: { value: 'Food' } });
    const foodRefs = screen.getAllByText('Food');
    expect(foodRefs.length).toBe(2);
    const defaultTabs = screen.getAllByText('Default');
    expect(defaultTabs.length).toBe(1);
  });
});
