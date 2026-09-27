import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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
});
