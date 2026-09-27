import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ScheduledMessages } from './ScheduledMessages';

vi.mock('motion/react', () => ({
  motion: { div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>, button: 'button', span: 'span', p: 'p' },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('./FormattedText', () => ({
  FormattedText: ({ text }: any) => <span>{text}</span>,
}));

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  I18nContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
}));

const mockScheduledMessages = [
  { id: 1, chatId: '1', text: 'Meeting at 3pm', scheduledAt: new Date('2025-01-15T15:00:00').getTime(), type: 'text' },
  { id: 2, chatId: '1', text: 'Reminder: call John', scheduledAt: new Date('2025-01-16T10:30:00').getTime(), type: 'text' },
];

const defaultProps = {
  messages: [],
  chatScheduledMessages: mockScheduledMessages,
  scheduledQueue: { removeMessage: vi.fn() },
};

describe('ScheduledMessages', () => {
  it('renders nothing when chatScheduledMessages is empty', () => {
    const { container } = render(
      <ScheduledMessages messages={[]} chatScheduledMessages={[]} scheduledQueue={{ removeMessage: vi.fn() }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders list of scheduled messages', () => {
    render(<ScheduledMessages {...defaultProps} />);
    expect(screen.getByText('Meeting at 3pm')).toBeInTheDocument();
    expect(screen.getByText('Reminder: call John')).toBeInTheDocument();
  });

  it('shows the time in the UI language, not the host runtime', () => {
    render(<ScheduledMessages {...defaultProps} />);
    // The i18n mock reports lang: 'en', so the stamps follow that locale
    // (12-hour) instead of whatever the host runtime prefers.
    const clock = (iso: string) =>
      new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
    expect(screen.getByText(clock('2025-01-15T15:00:00'))).toBeInTheDocument();
    expect(screen.getByText(clock('2025-01-16T10:30:00'))).toBeInTheDocument();
  });

  it('shows cancel/remove button for each message', () => {
    render(<ScheduledMessages {...defaultProps} />);
    const removeButtons = screen.getAllByRole('button', { name: 'chat.removeScheduledMessage' });
    expect(removeButtons).toHaveLength(2);
  });

  it('shows cancel/remove buttons for all messages', () => {
    render(<ScheduledMessages {...defaultProps} />);
    const removeButtons = document.querySelectorAll('[aria-label="chat.removeScheduledMessage"]');
    expect(removeButtons).toHaveLength(2);
  });

  it('calls scheduledQueue.removeMessage when cancel button is clicked', () => {
    const removeMessage = vi.fn();
    render(
      <ScheduledMessages
        messages={[]}
        chatScheduledMessages={mockScheduledMessages}
        scheduledQueue={{ removeMessage }}
      />,
    );
    const removeButtons = document.querySelectorAll('[aria-label="chat.removeScheduledMessage"]');
    fireEvent.click(removeButtons[0]);
    expect(removeMessage).toHaveBeenCalledWith(1);
  });

  it('renders Clock icon for each message', () => {
    const { container } = render(<ScheduledMessages {...defaultProps} />);
    const clockIcons = container.querySelectorAll('.lucide-clock');
    expect(clockIcons.length).toBe(2);
  });
});
