import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { StoryFooter } from './StoryFooter';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));
vi.mock('../ui/Toast', () => ({ toast: vi.fn() }));

const makeProps = (overrides: Record<string, unknown> = {}) => ({
  user: { id: 1, name: 'Alice', color: 'x', avatarColor: 'x', stories: [] },
  reply: '',
  liked: false,
  onReplyChange: vi.fn(),
  onSendReply: vi.fn(),
  onToggleLike: vi.fn(),
  onShare: vi.fn(),
  onOpenMenu: vi.fn(),
  ...overrides,
});

describe('StoryFooter', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('send button starts disabled for empty reply', () => {
    render(<StoryFooter {...makeProps()} />);
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('send button enables and submits once reply is non-empty', () => {
    const onSendReply = vi.fn();
    const { rerender } = render(<StoryFooter {...makeProps({ onSendReply })} />);
    const open = () => screen.getByRole('button', { name: 'Send' });
    expect(open()).toBeDisabled();
    rerender(<StoryFooter {...makeProps({ onSendReply, reply: 'hi' })} />);
    expect(open()).not.toBeDisabled();
    fireEvent.click(open());
    expect(onSendReply).toHaveBeenCalledTimes(1);
  });

  it('hides reply input, send and like for own story', () => {
    render(<StoryFooter {...makeProps({ user: { id: 0, name: 'You', color: 'x', avatarColor: 'x', stories: [], isMe: true } })} />);
    expect(screen.queryByLabelText('Send a reply…')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'story.react' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.more' })).toBeInTheDocument();
  });
});