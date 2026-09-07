import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChatContextMenu, buildMenuIcon, CHAT_MENU_ICONS } from './ChatContextMenu';
import { Pin, BellOff, Trash2 } from 'lucide-react';

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

const baseItems = () => [
  { id: 'pin', label: t('chat.pin', 'Pin'), icon: Pin, onClick: vi.fn() },
  { id: 'delete', label: t('chat.delete', 'Delete'), icon: BellOff, danger: true, onClick: vi.fn() },
];

describe('ChatContextMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders desktop menu with items at anchor position', () => {
    const items = baseItems();
    render(<ChatContextMenu anchor={{ x: 100, y: 120 }} items={items} onClose={vi.fn()} />);
    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(menu.style.position).toBe('fixed');
    expect(menu.style.left).toBe('100px');
    expect(menu.style.top).toBe('120px');
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    expect(screen.getByText('Pin')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('clamps position to viewport bounds with margin', () => {
    const items = baseItems();
    render(<ChatContextMenu anchor={{ x: 5000, y: 5000 }} items={items} onClose={vi.fn()} />);
    const menu = screen.getByRole('menu');
    expect(menu.style.left).toBe(`${window.innerWidth - 188 - 8}px`);
    expect(menu.style.top).toBe(`${window.innerHeight - 2 * 44 - 8 - 8}px`);
  });

  it('marks item as disabled', () => {
    const items = [{ id: 'pin', label: 'Pin', icon: Pin, disabled: true, onClick: vi.fn() }];
    render(<ChatContextMenu anchor={{ x: 0, y: 0 }} items={items} onClose={vi.fn()} />);
    const btn = screen.getByRole('menuitem');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(items[0].onClick).not.toHaveBeenCalled();
  });

  it('clicking item runs onClick then closes', () => {
    const items = baseItems();
    const onClose = vi.fn();
    render(<ChatContextMenu anchor={{ x: 0, y: 0 }} items={items} onClose={onClose} />);
    fireEvent.click(screen.getByText('Pin'));
    expect(items[0].onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<ChatContextMenu anchor={{ x: 0, y: 0 }} items={baseItems()} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on outside mousedown', () => {
    const onClose = vi.fn();
    render(<ChatContextMenu anchor={{ x: 0, y: 0 }} items={baseItems()} onClose={onClose} />);
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on mousedown inside menu', () => {
    const onClose = vi.fn();
    render(<ChatContextMenu anchor={{ x: 0, y: 0 }} items={baseItems()} onClose={onClose} />);
    fireEvent.mouseDown(screen.getByRole('menu'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on outside touchstart', () => {
    const onClose = vi.fn();
    render(<ChatContextMenu anchor={{ x: 0, y: 0 }} items={baseItems()} onClose={onClose} />);
    fireEvent.touchStart(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('removes listeners when onClose changes (cleanup)', () => {
    const onClose = vi.fn();
    const { rerender } = render(<ChatContextMenu anchor={{ x: 0, y: 0 }} items={baseItems()} onClose={onClose} />);
    rerender(<ChatContextMenu anchor={{ x: 0, y: 0 }} items={baseItems()} onClose={vi.fn()} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders bottom sheet when anchor is null', () => {
    const items = baseItems();
    const onClose = vi.fn();
    const { container } = render(<ChatContextMenu anchor={null} items={items} onClose={onClose} />);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    const backdrop = container.querySelector('.absolute.inset-0');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('bottom sheet item click runs onClick then closes', () => {
    const items = baseItems();
    const onClose = vi.fn();
    render(<ChatContextMenu anchor={null} items={items} onClose={onClose} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(items[1].onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('bottom sheet closes on Escape', () => {
    const onClose = vi.fn();
    render(<ChatContextMenu anchor={null} items={baseItems()} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('buildMenuIcon', () => {
  it('maps known ids to icons', () => {
    expect(buildMenuIcon('pin')).toBe(Pin);
    expect(buildMenuIcon('delete')).toBe(Trash2);
  });

  it('falls back to Pin for unknown id', () => {
    expect(buildMenuIcon('nope')).toBe(Pin);
  });

  it('exposes CHAT_MENU_ICONS mapping', () => {
    expect(CHAT_MENU_ICONS.pin).toBe(Pin);
    expect(Object.keys(CHAT_MENU_ICONS)).toEqual(
      expect.arrayContaining(['pin', 'unpin', 'mute', 'unmute', 'markRead', 'archive', 'unarchive', 'delete', 'select']),
    );
  });
});