import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireOsNotification, emitOpenChat, OPEN_CHAT_EVENT } from './osNotify';

const REAL_NOTIFICATION = globalThis.Notification;

function stubNotification(permission: NotificationPermission): any {
  const fake: any = vi.fn(function (this: any, title: string, opts?: any) {
    this.title = title;
    this.opts = opts;
    this.onclick = null;
  });
  fake.permission = permission;
  (globalThis as any).Notification = fake;
  return fake;
}

beforeEach(() => {
  (globalThis as any).Notification = undefined as unknown as typeof Notification;
});

afterEach(() => {
  (globalThis as any).Notification = REAL_NOTIFICATION;
});

describe('osNotify', () => {
  it('fireOsNotification does nothing when permission is not granted', () => {
    const fake = stubNotification('denied');
    fireOsNotification('T', 'B');
    expect(fake).not.toHaveBeenCalled();
  });

  it('fireOsNotification shows a notification when granted', () => {
    const fake = stubNotification('granted');
    fireOsNotification('Title', 'Body');
    expect(fake).toHaveBeenCalledWith('Title', { body: 'Body' });
  });

  it('fireOsNotification omits the body when undefined', () => {
    const fake = stubNotification('granted');
    fireOsNotification('Title', undefined);
    expect(fake).toHaveBeenCalledWith('Title', undefined);
  });

  it('notification click emits the open-chat event with the chat id', () => {
    const fake = stubNotification('granted');
    const seen: { chatId?: string }[] = [];
    const onEvent = (e: Event) => seen.push((e as CustomEvent<{ chatId?: string }>).detail);
    window.addEventListener(OPEN_CHAT_EVENT, onEvent as EventListener);
    try {
      fireOsNotification('Title', 'Body', 'dm-9');
      const inst = fake.mock.instances[0];
      inst.onclick?.();
      expect(seen).toHaveLength(1);
      expect(seen[0].chatId).toBe('dm-9');
    } finally {
      window.removeEventListener(OPEN_CHAT_EVENT, onEvent as EventListener);
    }
  });

  it('emitOpenChat dispatches the event directly', () => {
    const seen: unknown[] = [];
    const onEvent = (e: Event) => seen.push((e as CustomEvent).detail);
    window.addEventListener(OPEN_CHAT_EVENT, onEvent as EventListener);
    try {
      emitOpenChat('dm-4');
      expect(seen).toHaveLength(1);
      expect((seen[0] as { chatId: string }).chatId).toBe('dm-4');
    } finally {
      window.removeEventListener(OPEN_CHAT_EVENT, onEvent as EventListener);
    }
  });
});
