import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChatMessage } from './ChatMessage';
import { MessageContextMenu } from './MessageContextMenu';
import { toast } from '../ui/Toast';

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

const h = vi.hoisted(() => ({
  menuArgs: null as any,
  motionProps: null as any,
  detectLang: vi.fn(),
  translate: vi.fn(),
  executeEditMessage: vi.fn(),
}));

vi.mock('../../hooks/useMessageActions', () => ({
  executeEditMessage: h.executeEditMessage,
}));

vi.mock('motion/react', () => ({
  motion: {
    div: (props: any) => {
      const { layout, initial, animate, exit, transition, drag, dragConstraints, dragElastic, ...rest } = props;
      h.motionProps = props;
      return React.createElement('div', rest);
    },
  },
}));
vi.mock('../../lib/icqEmojis', () => ({ getICQStickerSrc: () => 'sticker-url' }));
vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t }) }));
vi.mock('../../services', () => ({
  useServices: () => ({ translate: { detectLang: h.detectLang, translate: h.translate } }),
}));
vi.mock('../ui/Toast', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn() }) }));
vi.mock('./FormattedText', () => ({
  FormattedText: ({ text }: any) => <span data-testid="formatted-text">{text}</span>,
}));
vi.mock('./MessageReactions', () => ({
  MessageReactions: ({ activeReactionPicker }: any) => (
    <div data-testid="message-reactions" data-active={String(activeReactionPicker)} />
  ),
}));
vi.mock('./MessageContextMenu', () => ({
  MessageContextMenu: vi.fn(({ open }: any) => (open ? <div data-testid="message-context-menu" data-open="true" /> : null)),
}));
vi.mock('./messageMenuActions', () => ({
  buildMessageMenuActions: vi.fn((args: any) => {
    h.menuArgs = args;
    return [{ key: 'reply', label: 'Reply', onClick: () => args.onReply(args.msg) }];
  }),
}));
vi.mock('../features/bot/InlineKeyboard', () => ({
  InlineKeyboard: ({ botId, messageId, rows }: any) => (
    <div data-testid="inline-keyboard" data-bot={botId} data-msg={messageId}>{String(rows.length)}</div>
  ),
}));
vi.mock('./AttachmentMedia', () => ({
  AttachmentMedia: (props: any) => (
    <div data-testid="attachment-media" data-sticker={props.stickerSrc || ''} />
  ),
}));
vi.mock('./MessageTimestamp', () => ({ MessageTimestamp: () => <div data-testid="message-timestamp" /> }));
vi.mock('./BubbleActions', () => ({ BubbleActions: () => <div data-testid="bubble-actions" /> }));
vi.mock('./ChannelCommentsRow', () => ({ ChannelCommentsRow: () => <div data-testid="channel-comments" /> }));
vi.mock('./ReplyQuote', () => ({ ReplyQuote: () => <div data-testid="reply-quote" /> }));
vi.mock('../payments/PaymentChatBubble', () => ({
  PaymentChatBubble: ({ isDark }: any) => <div data-testid="payment-bubble" data-dark={String(isDark)} />,
}));

const storeState = vi.hoisted(() => ({
  contactAvatars: {} as Record<string, string>,
  userProfile: {} as any,
}));

vi.mock('../../store', () => ({
  useAppStore: (sel?: any) => (sel ? sel(storeState) : storeState),
}));

const baseProps = (overrides: any = {}) => ({
  msg: { id: 1, text: 'hello', _isLastInGroup: false },
  isMe: false,
  isDark: false,
  isChannel: false,
  chat: { id: 'c1' },
  stealthMode: false,
  deliveryReceipts: true,
  readReceipts: true,
  chatSavedMessages: [],
  searchQuery: '',
  swipeReplyId: null,
  activeReactionPicker: null,
  theme: 'light',
  onReply: vi.fn(),
  onToggleSavedMessage: vi.fn(),
  onSetActivePhotoUrl: vi.fn(),
  onSetPhotoOpen: vi.fn(),
  onSetActiveReactionPicker: vi.fn(),
  onSwipeReplyId: vi.fn(),
  onSetVideoOpen: vi.fn(),
  onSetShowComments: vi.fn(),
  onSetActivePostId: vi.fn(),
  onSetBounceMsgId: vi.fn(),
  onReactionMessage: vi.fn(),
  ...overrides,
});

const bubbleEl = () => document.querySelector('[class*="max-w-[85%] md:max-w-[80%]"]') as HTMLElement;

describe('ChatMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState.contactAvatars = {};
    storeState.userProfile = {};
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders text message with formatted text and bubble actions for non-channel', () => {
    render(<ChatMessage {...baseProps()} />);
    expect(screen.getByTestId('formatted-text')).toHaveTextContent('hello');
    expect(screen.getByTestId('bubble-actions')).toBeInTheDocument();
    expect(screen.queryByTestId('channel-comments')).not.toBeInTheDocument();
    expect(screen.queryByTestId('message-timestamp')).not.toBeInTheDocument();
    expect(screen.getByTestId('message-reactions')).toHaveAttribute('data-active', 'null');
  });

  it('renders timestamp when message is last in group', () => {
    render(<ChatMessage {...baseProps({ msg: { id: 1, text: 'hi', _isLastInGroup: true } })} />);
    expect(screen.getByTestId('message-timestamp')).toBeInTheDocument();
  });

  it('renders own message right-aligned with gradient bubble', () => {
    render(<ChatMessage {...baseProps({ isMe: true })} />);
    const wrapper = screen.getByText('hello').closest('.items-end') as HTMLElement;
    expect(wrapper).not.toBeNull();
    const bubble = bubbleEl();
    expect(bubble.className).toContain('message');
    expect(bubble.className).toContain('outgoing');
  });

  it('renders date separator without bubble', () => {
    render(<ChatMessage {...baseProps({ msg: { _isDateSeparator: true, _dateLabel: 'Today' } })} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.queryByTestId('formatted-text')).not.toBeInTheDocument();
  });

  it('passes sticker source to AttachmentMedia and hides formatted text', () => {
    render(<ChatMessage {...baseProps({ msg: { id: 2, type: 'sticker', text: 'smile', _isLastInGroup: true } })} />);
    expect(screen.getByTestId('attachment-media')).toHaveAttribute('data-sticker', 'sticker-url');
    expect(screen.queryByTestId('formatted-text')).not.toBeInTheDocument();
  });

  it('renders sender avatar initials on first message in group', () => {
    render(<ChatMessage {...baseProps({ msg: { id: 1, text: 'hi', sender: 'Bob', _groupPosition: 'first' } })} />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders contact avatar image when contactAvatars has the sender', () => {
    storeState.contactAvatars = { Bob: 'data:image/png;base64,xxx' };
    render(<ChatMessage {...baseProps({ msg: { id: 1, text: 'hi', sender: 'Bob', _groupPosition: 'single' } })} />);
    expect(screen.getByAltText('Bob avatar')).toHaveAttribute('src', 'data:image/png;base64,xxx');
  });

  it('renders own avatar image from user profile for outgoing group-first', () => {
    storeState.userProfile = { name: 'Alice', avatar: 'https://cdn.example/me.png' };
    render(<ChatMessage {...baseProps({ isMe: true, msg: { id: 1, text: 'hi', sender: 'me', _groupPosition: 'first' } })} />);
    expect(screen.getByAltText('me avatar')).toHaveAttribute('src', 'https://cdn.example/me.png');
  });

  it('renders spacer instead of avatar on non-first messages', () => {
    render(<ChatMessage {...baseProps({ msg: { id: 1, text: 'hi', sender: 'Bob', _groupPosition: 'middle' } })} />);
    expect(screen.queryByText('B')).not.toBeInTheDocument();
  });

  it('renders payment bubble for payment messages', () => {
    render(<ChatMessage {...baseProps({ msg: { id: 3, type: 'payment', text: '$10', _isLastInGroup: true }, isDark: true })} />);
    expect(screen.getByTestId('payment-bubble')).toHaveAttribute('data-dark', 'true');
    expect(screen.queryByTestId('formatted-text')).not.toBeInTheDocument();
  });

  it('renders reply quote when msg has replyTo', () => {
    render(<ChatMessage {...baseProps({ msg: { id: 4, text: 'chained', replyTo: { id: 1 }, _isLastInGroup: true } })} />);
    expect(screen.getByTestId('reply-quote')).toBeInTheDocument();
  });

  it('renders link preview for URL in text', () => {
    render(<ChatMessage {...baseProps({ msg: { id: 5, text: 'see https://example.com now', _isLastInGroup: true } })} />);
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });

  it('skips link preview without URL', () => {
    render(<ChatMessage {...baseProps({ msg: { id: 6, text: 'plain text', _isLastInGroup: true } })} />);
    expect(screen.queryByText(/https?:\/\//)).not.toBeInTheDocument();
  });

  it('renders keyboard rows and fires onAction', () => {
    const onAction = vi.fn();
    const msg = {
      id: 7,
      text: 'kb',
      keyboard: [
        [{ text: 'A', action: 'actA' }, { text: 'B' }],
        [{ text: 'C' }],
      ],
      _isLastInGroup: true,
    };
    render(<ChatMessage {...baseProps({ msg, onAction })} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    buttons.forEach((b) => expect(b.className).toContain('min-h-11'));
    fireEvent.click(screen.getByText('A'));
    expect(onAction).toHaveBeenCalledWith('actA');
    fireEvent.click(screen.getByText('B'));
    expect(onAction).toHaveBeenCalledWith('B');
  });

  it('morse toggle has 44px hit area and toggles decode', () => {
    const msg = { id: 11, text: '. . . . - . . . -', _isLastInGroup: true };
    render(<ChatMessage {...baseProps({ msg })} />);
    const btn = screen.getByRole('button', { name: 'Show text' });
    expect(btn.className).toContain('min-h-11');
    const before = screen.getByTestId('formatted-text').textContent;
    fireEvent.click(btn);
    expect(screen.getByTestId('formatted-text').textContent).not.toBe(before);
    fireEvent.click(screen.getByRole('button', { name: 'Show Morse code' }));
    expect(screen.getByTestId('formatted-text').textContent).toBe(before);
  });

  it('renders inline keyboard with bot and message ids', () => {
    const msg = { id: 9, text: 'ib', inlineKeyboard: [[{ text: 'Go' }]], _isLastInGroup: true };
    render(<ChatMessage {...baseProps({ msg, chat: { id: 'c9', botId: 'bot1' } })} />);
    const kb = screen.getByTestId('inline-keyboard');
    expect(kb).toHaveAttribute('data-bot', 'bot1');
    expect(kb).toHaveAttribute('data-msg', '9');
    expect(kb).toHaveTextContent('1');
  });

  it('renders channel comments row for channels', () => {
    render(<ChatMessage {...baseProps({ isChannel: true })} />);
    expect(screen.getByTestId('channel-comments')).toBeInTheDocument();
    expect(screen.queryByTestId('bubble-actions')).not.toBeInTheDocument();
  });

  it('applies selection ring when selected', () => {
    render(<ChatMessage {...baseProps({ selected: true, selectionMode: true })} />);
    expect(bubbleEl().className).toContain('ring-2 ring-[var(--accent)]');
  });

  it('opens context menu on right-click', () => {
    const MCMMock = MessageContextMenu as any as ReturnType<typeof vi.fn>;
    render(<ChatMessage {...baseProps()} />);
    fireEvent.contextMenu(bubbleEl());
    const lastCall = MCMMock.mock.calls[MCMMock.mock.calls.length - 1][0];
    expect(lastCall.open).toBe(true);
    expect(lastCall.isDark).toBe(false);
    expect(lastCall.actions).toEqual([{ key: 'reply', label: 'Reply', onClick: expect.any(Function) }]);
  });

  it('does not open menu on right-click during selection mode', () => {
    const MCMMock = MessageContextMenu as any as ReturnType<typeof vi.fn>;
    render(<ChatMessage {...baseProps({ selectionMode: true })} />);
    fireEvent.contextMenu(bubbleEl());
    const lastCall = MCMMock.mock.calls[MCMMock.mock.calls.length - 1][0];
    expect(lastCall.open).toBe(false);
  });

  it('double-tap bubbles heart reaction', () => {
    const onReactionMessage = vi.fn();
    const onSetBounceMsgId = vi.fn();
    render(<ChatMessage {...baseProps({ onReactionMessage, onSetBounceMsgId })} />);
    fireEvent.click(bubbleEl());
    fireEvent.click(bubbleEl());
    expect(onReactionMessage).toHaveBeenCalledWith(1, '👍');
    expect(onSetBounceMsgId).toHaveBeenCalledWith(1);
  });

  it('long-press opens context menu', () => {
    vi.useFakeTimers();
    const MCMMock = MessageContextMenu as any as ReturnType<typeof vi.fn>;
    render(<ChatMessage {...baseProps()} />);
    fireEvent.pointerDown(bubbleEl());
    act(() => { vi.advanceTimersByTime(500); });
    const lastCall = MCMMock.mock.calls[MCMMock.mock.calls.length - 1][0];
    expect(lastCall.open).toBe(true);
  });

  it('forwards reply through built menu actions', () => {
    const onReply = vi.fn();
    render(<ChatMessage {...baseProps({ onReply })} />);
    expect(h.menuArgs.msg).toEqual({ id: 1, text: 'hello', _isLastInGroup: false });
    expect(h.menuArgs.isChannel).toBe(false);
    h.menuArgs.onReply(h.menuArgs.msg);
    expect(onReply).toHaveBeenCalledWith({ id: 1, text: 'hello', _isLastInGroup: false });
  });

  it('translates message and shows translation', async () => {
    h.detectLang.mockResolvedValue('en');
    h.translate.mockResolvedValue('Привет');
    render(<ChatMessage {...baseProps()} />);
    await act(async () => { await h.menuArgs.onTranslate(); });
    expect(h.detectLang).toHaveBeenCalledWith('hello');
    expect(h.translate).toHaveBeenCalledWith('hello', 'en', 'ru');
    await waitFor(() => expect(screen.getByText('Привет')).toBeInTheDocument());
  });

  it('toasts when translation unavailable', async () => {
    h.detectLang.mockRejectedValue(new Error('no'));
    render(<ChatMessage {...baseProps()} />);
    await act(async () => { await h.menuArgs.onTranslate(); });
    await waitFor(() => expect(toast).toHaveBeenCalledWith('Перевод не подключён'));
  });

  it('incoming message swipes right to reply', () => {
    const onReply = vi.fn();
    const onSwipeReplyId = vi.fn();
    render(<ChatMessage {...baseProps({ isMe: false, onReply, onSwipeReplyId })} />);
    expect(h.motionProps.drag).toBe('x');
    expect(h.motionProps.dragConstraints).toEqual({ left: 0, right: 80 });
    act(() => { h.motionProps.onDrag(null, { offset: { x: 50, y: 0 } }); });
    expect(onSwipeReplyId).toHaveBeenLastCalledWith(1);
    act(() => { h.motionProps.onDrag(null, { offset: { x: 5, y: 0 } }); });
    expect(onSwipeReplyId).toHaveBeenLastCalledWith(null);
    act(() => { h.motionProps.onDragEnd(null, { offset: { x: 80, y: 0 } }); });
    expect(onReply).toHaveBeenCalledWith({ id: 1, text: 'hello', _isLastInGroup: false });
    expect(onSwipeReplyId).toHaveBeenLastCalledWith(null);
  });

  it('outgoing message swipes left to reply (mirrored)', () => {
    const onReply = vi.fn();
    const onSwipeReplyId = vi.fn();
    render(<ChatMessage {...baseProps({ isMe: true, onReply, onSwipeReplyId })} />);
    expect(h.motionProps.drag).toBe('x');
    expect(h.motionProps.dragConstraints).toEqual({ left: -80, right: 0 });
    act(() => { h.motionProps.onDrag(null, { offset: { x: -50, y: 0 } }); });
    expect(onSwipeReplyId).toHaveBeenLastCalledWith(1);
    act(() => { h.motionProps.onDrag(null, { offset: { x: 5, y: 0 } }); });
    expect(onSwipeReplyId).toHaveBeenLastCalledWith(null);
    act(() => { h.motionProps.onDragEnd(null, { offset: { x: -80, y: 0 } }); });
    expect(onReply).toHaveBeenCalledWith({ id: 1, text: 'hello', _isLastInGroup: false });
    expect(onSwipeReplyId).toHaveBeenLastCalledWith(null);
  });

  it('does not reply on short swipe', () => {
    const onReply = vi.fn();
    render(<ChatMessage {...baseProps({ isMe: true, onReply })} />);
    act(() => { h.motionProps.onDragEnd(null, { offset: { x: -30, y: 0 } }); });
    expect(onReply).not.toHaveBeenCalled();
  });

  it('disables drag in selection mode', () => {
    render(<ChatMessage {...baseProps({ selectionMode: true })} />);
    expect(h.motionProps.drag).toBe(false);
  });

  it('places swipe indicator on near edge (incoming left, outgoing right)', () => {
    const { rerender } = render(<ChatMessage {...baseProps({ isMe: false, swipeReplyId: 1 })} />);
    const left = Array.from(document.querySelectorAll('div')).find(
      (el) => el.className.includes('absolute left-0') && el.className.includes('w-1.5'),
    );
    expect(left).toBeTruthy();
    rerender(<ChatMessage {...baseProps({ isMe: true, swipeReplyId: 1 })} />);
    const right = Array.from(document.querySelectorAll('div')).find(
      (el) => el.className.includes('absolute right-0') && el.className.includes('w-1.5'),
    );
    expect(right).toBeTruthy();
  });

  it('hides swipe indicator when id does not match', () => {
    render(<ChatMessage {...baseProps({ isMe: true, swipeReplyId: 999 })} />);
    expect(
      Array.from(document.querySelectorAll('div')).some(
        (el) => (el.className.includes('absolute left-0') || el.className.includes('absolute right-0')) && el.className.includes('w-1.5'),
      ),
    ).toBe(false);
  });

  it('own text message exposes an edit action that starts the inline editor', () => {
    render(<ChatMessage {...baseProps({ isMe: true })} />);
    expect(typeof h.menuArgs.onEdit).toBe('function');
    act(() => { h.menuArgs.onEdit(); });
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });

  it('saving an edited message calls executeEditMessage with chat context', () => {
    render(<ChatMessage {...baseProps({ isMe: true })} />);
    act(() => { h.menuArgs.onEdit(); });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'revised' } });
    fireEvent.click(screen.getByText('Save'));
    expect(h.executeEditMessage).toHaveBeenCalledWith(1, 'revised', { id: 'c1' });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('cancelling edit closes editor without persisting', () => {
    render(<ChatMessage {...baseProps({ isMe: true })} />);
    act(() => { h.menuArgs.onEdit(); });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'unwanted' } });
    fireEvent.click(screen.getByText('Cancel'));
    expect(h.executeEditMessage).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('foreign messages expose no edit action', () => {
    render(<ChatMessage {...baseProps({ isMe: false })} />);
    expect(h.menuArgs.onEdit).toBeUndefined();
  });
});