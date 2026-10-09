import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const dict: Record<string, string> = {
  'chat.replyingTo': 'Replying to',
  'chat.yourMessage': 'your message',
  'chat.voiceNote': 'Voice note',
  'chat.attachment': 'Attachment',
};

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => fallback ?? dict[key] ?? key }),
}));

import { ReplyQuote } from './ReplyQuote';

describe('ReplyQuote', () => {
  it('renders the quoted text', () => {
    render(<ReplyQuote replyTo={{ id: 1, sender: 'bob', text: 'hello there' }} isDark={false} />);
    expect(screen.getByText('hello there')).toBeInTheDocument();
  });

  it('shows an expired placeholder instead of the content of a self-destructed message', () => {
    render(<ReplyQuote replyTo={{ id: 1, sender: 'bob', type: 'expired' }} isDark={false} />);
    expect(screen.getByText('Message expired')).toBeInTheDocument();
  });

  it('describes voice and attachment quotes without text', () => {
    const { unmount } = render(<ReplyQuote replyTo={{ id: 1, sender: 'bob', type: 'audio' }} isDark={false} />);
    expect(screen.getByText('Voice note')).toBeInTheDocument();
    unmount();
    render(<ReplyQuote replyTo={{ id: 2, sender: 'bob', type: 'image' }} isDark={false} />);
    expect(screen.getByText('Attachment')).toBeInTheDocument();
  });

  it('is not interactive when no jump handler is provided', () => {
    render(<ReplyQuote replyTo={{ id: 1, sender: 'bob', text: 'hello' }} isDark={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onJump and stops the click from reaching the bubble when tappable', () => {
    const onJump = vi.fn();
    const onBubbleClick = vi.fn();
    render(
      <div onClick={onBubbleClick}>
        <ReplyQuote replyTo={{ id: 1, sender: 'bob', text: 'hello' }} isDark={false} onJump={onJump} />
      </div>,
    );
    const quote = screen.getByRole('button', { name: 'Go to message' });
    fireEvent.click(quote);
    expect(onJump).toHaveBeenCalledTimes(1);
    expect(onBubbleClick).not.toHaveBeenCalled();
  });
});
