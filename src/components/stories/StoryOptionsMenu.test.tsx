import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { StoryOptionsMenu } from './StoryOptionsMenu';
import { toast } from '../ui/Toast';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));
vi.mock('../ui/Toast', () => ({ toast: vi.fn() }));

const makeProps = (overrides: Record<string, unknown> = {}) => ({
  open: true,
  onClose: vi.fn(),
  isMe: false,
  onCopyLink: vi.fn(),
  onDelete: vi.fn(),
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

  it('shows copy, save and report for other users', () => {
    render(<StoryOptionsMenu {...makeProps({ isMe: false })} />);
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save story' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Report' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete story' })).toBeNull();
  });

  it('shows delete instead of report for own story', () => {
    render(<StoryOptionsMenu {...makeProps({ isMe: true })} />);
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

  it('save shows success toast and closes', () => {
    render(<StoryOptionsMenu {...makeProps()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save story' }));
    expect(toast).toHaveBeenCalledWith('Story saved', 'success');
  });

  it('delete calls onDelete for own story', () => {
    const onDelete = vi.fn();
    render(<StoryOptionsMenu {...makeProps({ isMe: true, onDelete })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete story' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('report shows success toast for other users', () => {
    render(<StoryOptionsMenu {...makeProps({ isMe: false })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Report' }));
    expect(toast).toHaveBeenCalledWith('Reported', 'success');
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
