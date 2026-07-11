import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MessageBubble } from './MessageBubble';

vi.mock('motion/react', () => ({
  motion: { div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>, button: 'button', span: 'span', p: 'p' },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('./FormattedText', () => ({
  FormattedText: ({ text }: any) => <span>{text}</span>,
}));

vi.mock('./VoiceWaveform', () => ({
  VoiceWaveform: ({ duration }: any) => <div>{duration}</div>,
}));

vi.mock('../../lib/morse', () => ({ encodeMorse: vi.fn() }));

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, lang: 'en', setLang: vi.fn() }),
}));

const createMockMsg = (overrides = {}) => ({
  id: 1,
  text: 'Hello!',
  time: '10:30',
  status: 'sent',
  type: 'text',
  _isLastInGroup: true,
  reactions: {},
  ...overrides,
});

const baseProps: any = {
  isMe: false,
  groupPosition: 'single',
  deliveryReceipts: true,
  readReceipts: true,
  searchQuery: '',
  swipeReplyId: null,
  setSwipeReplyId: vi.fn(),
  lastTapRef: { current: { time: 0, msgId: 0 } },
  handleReactionMessage: vi.fn(),
  bounceMsgId: null,
  setBounceMsgId: vi.fn(),
  setActiveReactionPicker: vi.fn(),
  activeReactionPicker: null,
  onReply: vi.fn(),
  onToggleSavedMessage: vi.fn(),
  savedMessages: [],
  chat: { id: 'chat-1', isChannel: false },
  setActivePhotoUrl: vi.fn(),
  setVideoOpen: vi.fn(),
  setActivePostId: vi.fn(),
  setShowComments: vi.fn(),
  fuzzTime: (t: string) => t,
  setActiveVideo: vi.fn(),
  setActivePhoto: vi.fn(),
};

describe('MessageBubble', () => {
  it('renders text content', () => {
    render(<MessageBubble {...baseProps} msg={createMockMsg({ text: 'Hello!' })} />);
    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });

  it('applies sent styling when isMe is true', () => {
    const { container } = render(
      <MessageBubble {...baseProps} isMe={true} msg={createMockMsg({ text: 'From me' })} />,
    );
    const itemsEnd = container.querySelector('.items-end');
    expect(itemsEnd).toBeInTheDocument();
  });

  it('applies received styling when isMe is false', () => {
    const { container } = render(
      <MessageBubble {...baseProps} isMe={false} msg={createMockMsg({ text: 'From them' })} />,
    );
    const itemsStart = container.querySelector('.items-start');
    expect(itemsStart).toBeInTheDocument();
  });

  it('shows timestamp', () => {
    render(<MessageBubble {...baseProps} msg={createMockMsg({ time: '10:30' })} />);
    expect(screen.getByText('10:30')).toBeInTheDocument();
  });

  it('shows sent status icon for own messages', () => {
    const { container } = render(
      <MessageBubble {...baseProps} isMe={true} msg={createMockMsg({ status: 'sent' })} />,
    );
    const checkIcon = container.querySelector('.lucide-check');
    expect(checkIcon).toBeInTheDocument();
  });

  it('shows delivered status icon', () => {
    const { container } = render(
      <MessageBubble {...baseProps} isMe={true} msg={createMockMsg({ status: 'delivered' })} />,
    );
    const checkCheckIcon = container.querySelector('.lucide-check-check');
    expect(checkCheckIcon).toBeInTheDocument();
  });

  it('shows read status icon in blue', () => {
    const { container } = render(
      <MessageBubble {...baseProps} isMe={true} msg={createMockMsg({ status: 'read' })} />,
    );
    const checkCheckIcon = container.querySelector('.text-blue-500');
    expect(checkCheckIcon).toBeInTheDocument();
  });

  it('renders reactions when present', () => {
    render(
      <MessageBubble
        {...baseProps}
        msg={createMockMsg({ reactions: { '👍': 2, '❤️': 1 } })}
      />,
    );
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows reply preview when msg has replyTo', () => {
    render(
      <MessageBubble
        {...baseProps}
        msg={createMockMsg({ replyTo: { id: 99, sender: 'them', text: 'Original message' } })}
      />,
    );
    expect(screen.getByText(/Original message/)).toBeInTheDocument();
  });

  it('renders image attachment when type is image', () => {
    render(
      <MessageBubble
        {...baseProps}
        msg={createMockMsg({ type: 'image', attachment: 'photo.jpg', url: 'photo.jpg' })}
      />,
    );
    const img = document.querySelector('img[alt="Shared"]');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'photo.jpg');
  });

  it('renders video attachment when type is video', () => {
    render(
      <MessageBubble
        {...baseProps}
        msg={createMockMsg({ type: 'video', thumb: 'thumb.jpg', duration: '1:30' })}
      />,
    );
    expect(screen.getByText('1:30')).toBeInTheDocument();
    const img = document.querySelector('img[alt="Video thumbnail"]');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'thumb.jpg');
  });

  it('renders sender name in reply preview for received messages', () => {
    render(
      <MessageBubble
        {...baseProps}
        msg={createMockMsg({ replyTo: { id: 99, sender: 'them', text: 'Reply content' } })}
      />,
    );
    expect(screen.getByText(/them/)).toBeInTheDocument();
  });
});
