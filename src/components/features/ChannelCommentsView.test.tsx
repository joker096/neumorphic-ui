import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: 'div', button: 'button', span: 'span', p: 'p' },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('lucide-react', () => ({ X: 'div', Send: 'div', ChevronLeft: 'div' }));

vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));

vi.mock('../chat-preview/FormattedText', () => ({
  FormattedText: ({ text }: any) => <span>{text}</span>,
}));

import { ChannelCommentsView } from './ChannelCommentsView';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  postId: 1,
  postKey: 'test-key',
  channelChatId: 'ch_1',
};

describe('ChannelCommentsView', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ChannelCommentsView {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders title and reply count', () => {
    render(<ChannelCommentsView {...defaultProps} />);
    expect(screen.getByText('channelComments.title')).toBeInTheDocument();
  });

  it('renders existing comments', () => {
    render(<ChannelCommentsView {...defaultProps} />);
    expect(screen.getByText(/Alice Freeman/)).toBeInTheDocument();
    expect(screen.getByText(/Charlie/)).toBeInTheDocument();
  });

  it('renders input field', () => {
    render(<ChannelCommentsView {...defaultProps} />);
    const input = screen.getByPlaceholderText('channelComments.placeholder');
    expect(input).toBeInTheDocument();
  });

  it('calls onClose when back button clicked', () => {
    const onClose = vi.fn();
    render(<ChannelCommentsView {...defaultProps} onClose={onClose} />);
    const backBtn = screen.getAllByRole('button')[0];
    fireEvent.click(backBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
