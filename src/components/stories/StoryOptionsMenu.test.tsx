import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { StoryOptionsMenu } from './StoryOptionsMenu';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));

const makeProps = (overrides: Record<string, unknown> = {}) => ({
  open: true,
  onClose: vi.fn(),
  isMe: false,
  savable: false,
  onCopyLink: vi.fn(),
  onDelete: vi.fn(),
  onSave: vi.fn(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('StoryOptionsMenu', () => {
  it('renders nothing when closed', () => {
    render(<StoryOptionsMenu {...makeProps({ open: false })} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders options dialog with title when open', () => {
    render(<StoryOptionsMenu {...makeProps()} />);
    expect(screen.getByRole('dialog', { name: 'Story options' })).toBeInTheDocument();
  });

  it('hides Save for gradient-only (unsavable) stories', () => {
    render(<StoryOptionsMenu {...makeProps({ savable: false })} />);
    expect(screen.queryByRole('button', { name: 'Save story' })).toBeNull();
  });

  it('shows copy and save for other users on a savable story', () => {
    render(<StoryOptionsMenu {...makeProps({ isMe: false, savable: true })} />);
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save story' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete story' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Report' })).toBeNull();
  });

  it('shows delete for own story', () => {
    render(<StoryOptionsMenu {...makeProps({ isMe: true, savable: true })} />);
    expect(screen.getByRole('button', { name: 'Delete story' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Report' })).toBeNull();
  });

  it('copy link calls onCopyLink and closes', () => {
    const onClose = vi.fn();
    const onCopyLink = vi.fn();
    render(<StoryOptionsMenu {...makeProps({ onClose, onCopyLink })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(onCopyLink).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('save calls onSave for savable stories', () => {
    const onSave = vi.fn();
    render(<StoryOptionsMenu {...makeProps({ savable: true, onSave })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save story' }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('delete calls onDelete for own story', () => {
    const onDelete = vi.fn();
    render(<StoryOptionsMenu {...makeProps({ isMe: true, savable: true, onDelete })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete story' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('foreign stories show no report stub and no delete', () => {
    render(<StoryOptionsMenu {...makeProps({ isMe: false })} />);
    expect(screen.queryByRole('button', { name: 'Report' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete story' })).toBeNull();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<StoryOptionsMenu {...makeProps({ onClose })} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on cancel button', () => {
    const onClose = vi.fn();
    render(<StoryOptionsMenu {...makeProps({ onClose })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
