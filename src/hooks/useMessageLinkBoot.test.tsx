import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMessageLinkBoot } from './useMessageLinkBoot';

const holder = vi.hoisted(() => ({ state: {} as any }));

vi.mock('../store', () => ({
  useAppStore: { getState: () => holder.state },
}));

const withHash = (hash: string) => window.history.replaceState({}, '', `/${hash}`);

describe('useMessageLinkBoot', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    holder.state = { chats: [{ id: 'c1', name: 'Alice' }], channels: [] };
  });

  it('opens the linked chat and asks for the message', () => {
    withHash('#nexus://chat/c1/42');
    const openChat = vi.fn();
    renderHook(() => useMessageLinkBoot({ openChat }));
    expect(openChat).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1', __jumpToMessageId: 42 }),
    );
    expect(window.location.hash).toBe('');
  });

  it('resolves channels as well as chats', () => {
    holder.state = { chats: [], channels: [{ id: 'ch7', name: 'News' }] };
    withHash('#nexus://chat/ch7/3');
    const openChat = vi.fn();
    renderHook(() => useMessageLinkBoot({ openChat }));
    expect(openChat).toHaveBeenCalledWith(expect.objectContaining({ id: 'ch7', __jumpToMessageId: 3 }));
  });

  it('consumes a link for an unknown chat without opening anything', () => {
    withHash('#nexus://chat/other-device-chat/1');
    const openChat = vi.fn();
    renderHook(() => useMessageLinkBoot({ openChat }));
    expect(openChat).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('');
  });

  it('does nothing when there is no link', () => {
    const openChat = vi.fn();
    renderHook(() => useMessageLinkBoot({ openChat }));
    expect(openChat).not.toHaveBeenCalled();
  });
});
