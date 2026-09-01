import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildMessageMenuActions } from './messageMenuActions';
import { toast } from '../ui/Toast';
import { useAppStore } from '../../store';

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

const h = vi.hoisted(() => ({
  pinned: [] as any[],
  addPinned: vi.fn(),
  removePinned: vi.fn(),
}));

vi.mock('../../store', () => ({
  useAppStore: {
    getState: () => ({
      pinnedMessageList: h.pinned,
      addPinnedMessage: h.addPinned,
      removePinnedMessage: h.removePinned,
    }),
  },
}));

vi.mock('../ui/Toast', () => ({ toast: vi.fn() }));

const baseArgs = (overrides: any = {}) => ({
  msg: { id: 1, text: 'hello' },
  isMe: false,
  t,
  isChannel: false,
  chat: { id: 'c1' },
  chatSavedMessages: [] as any[],
  onReply: vi.fn(),
  onToggleSavedMessage: vi.fn(),
  onTranslate: vi.fn(),
  ...overrides,
});

describe('buildMessageMenuActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.pinned = [];
  });

  it('builds reply/copy/translate/save/pin/forward/report without select', () => {
    const actions = buildMessageMenuActions(baseArgs());
    expect(actions.map(a => a.key)).toEqual(['reply', 'copy', 'translate', 'save', 'pin', 'forward', 'report']);
    expect(actions.find(a => a.key === 'reply')!.label).toBe('chat.reply');
    expect(actions.find(a => a.key === 'report')!.danger).toBe(true);
  });

  it('prepends select action when onSelect given', () => {
    const onSelect = vi.fn();
    const actions = buildMessageMenuActions(baseArgs({ onSelect }));
    expect(actions[0].key).toBe('select');
    actions[0].onClick();
    expect(onSelect).toHaveBeenCalledWith({ id: 1, text: 'hello' });
  });

  it('reply action calls onReply with msg', () => {
    const msg = { id: 5, text: 'yo' };
    const onReply = vi.fn();
    const actions = buildMessageMenuActions(baseArgs({ msg, onReply }));
    actions.find(a => a.key === 'reply')!.onClick();
    expect(onReply).toHaveBeenCalledWith(msg);
  });

  it('copy action writes to clipboard and toasts', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    (navigator as any).clipboard = { writeText };
    const actions = buildMessageMenuActions(baseArgs({ msg: { id: 1, text: 'secret text' } }));
    actions.find(a => a.key === 'copy')!.onClick();
    expect(writeText).toHaveBeenCalledWith('secret text');
    expect(toast).toHaveBeenCalledWith('Copied');
  });

  it('skips copy when clipboard missing', () => {
    delete (navigator as any).clipboard;
    const actions = buildMessageMenuActions(baseArgs());
    actions.find(a => a.key === 'copy')!.onClick();
    expect(toast).toHaveBeenCalledWith('Copied');
  });

  it('omits copy and translate for non-text messages', () => {
    const actions = buildMessageMenuActions(baseArgs({ msg: { id: 1 } }));
    expect(actions.map(a => a.key)).not.toContain('copy');
    expect(actions.map(a => a.key)).not.toContain('translate');
  });

  it('translate action calls onTranslate', () => {
    const onTranslate = vi.fn();
    const actions = buildMessageMenuActions(baseArgs({ onTranslate }));
    actions.find(a => a.key === 'translate')!.onClick();
    expect(onTranslate).toHaveBeenCalledTimes(1);
  });

  it('omits save action for channels', () => {
    const actions = buildMessageMenuActions(baseArgs({ isChannel: true }));
    expect(actions.map(a => a.key)).not.toContain('save');
  });

  it('save action toggles saved message', () => {
    const onToggleSavedMessage = vi.fn();
    const actions = buildMessageMenuActions(baseArgs({ onToggleSavedMessage }));
    actions.find(a => a.key === 'save')!.onClick();
    expect(onToggleSavedMessage).toHaveBeenCalledWith({ id: 'c1' }, { id: 1, text: 'hello' });
  });

  it('labels save action as saved when message already saved', () => {
    const chatSavedMessages = [{ messageId: 1 }];
    const actions = buildMessageMenuActions(baseArgs({ chatSavedMessages }));
    expect(actions.find(a => a.key === 'save')!.label).toBe('chat.saved');
  });

  it('pin action adds pinned message and toasts', () => {
    const actions = buildMessageMenuActions(baseArgs());
    actions.find(a => a.key === 'pin')!.onClick();
    expect(h.addPinned).toHaveBeenCalledWith({ id: 1, chatId: 'c1', pinBy: 'me' });
    expect(toast).toHaveBeenCalledWith('Pinned');
  });

  it('pin action removes pinned message when already pinned', () => {
    h.pinned = [{ id: 1, chatId: 'c1' }];
    const actions = buildMessageMenuActions(baseArgs());
    const pin = actions.find(a => a.key === 'pin')!;
    expect(pin.label).toBe('Unpin');
    pin.onClick();
    expect(h.removePinned).toHaveBeenCalledWith(1, 'c1');
    expect(toast).toHaveBeenCalledWith('Unpinned');
  });

  it('pin label differs per pinned state', () => {
    expect(buildMessageMenuActions(baseArgs()).find(a => a.key === 'pin')!.label).toBe('Pin');
    h.pinned = [{ id: 7, chatId: 'c1' }];
    expect(buildMessageMenuActions(baseArgs({ msg: { id: 7, text: 'x' } })).find(a => a.key === 'pin')!.label).toBe('Unpin');
  });

  it('forward action calls onForward when provided', () => {
    const onForward = vi.fn();
    const actions = buildMessageMenuActions(baseArgs({ onForward }));
    actions.find(a => a.key === 'forward')!.onClick();
    expect(onForward).toHaveBeenCalledWith({ id: 1, text: 'hello' });
  });

  it('forward action toasts when unavailable', () => {
    const actions = buildMessageMenuActions(baseArgs());
    actions.find(a => a.key === 'forward')!.onClick();
    expect(toast).toHaveBeenCalledWith('Forward not available');
  });

  it('delete action for own messages calls onDelete', () => {
    const onDelete = vi.fn();
    const actions = buildMessageMenuActions(baseArgs({ isMe: true, onDelete }));
    expect(actions.map(a => a.key)).toContain('delete');
    actions.find(a => a.key === 'delete')!.onClick();
    expect(onDelete).toHaveBeenCalledWith({ id: 1, text: 'hello' });
  });

  it('delete action toasts when unavailable', () => {
    const actions = buildMessageMenuActions(baseArgs({ isMe: true }));
    actions.find(a => a.key === 'delete')!.onClick();
    expect(toast).toHaveBeenCalledWith('Delete not available');
  });

  it('report action replaces delete for foreign messages', () => {
    const actions = buildMessageMenuActions(baseArgs());
    expect(actions.map(a => a.key)).not.toContain('delete');
    actions.find(a => a.key === 'report')!.onClick();
    expect(toast).toHaveBeenCalledWith('Reported');
  });
});