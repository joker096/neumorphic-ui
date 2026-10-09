import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  sendAddressed: vi.fn(async (_target: unknown, _data: unknown) => true),
  peerForChat: vi.fn(),
  peerForChatName: vi.fn(),
  userProfile: { name: 'Alice' } as any,
}));

vi.mock('./network', () => ({
  p2pNetwork: {
    sendAddressed: h.sendAddressed,
    peerForChat: h.peerForChat,
    peerForChatName: h.peerForChatName,
  },
}));

vi.mock('../../store', () => ({
  useAppStore: { getState: () => ({ userProfile: h.userProfile }) },
}));

import { sendChatPin } from './pinSync';
import { parseChatPin } from './chatFrame';

describe('sendChatPin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.peerForChat.mockReturnValue('peer-1');
    h.peerForChatName.mockReturnValue(undefined);
    h.userProfile = { name: 'Alice' };
  });

  it('sends a well-formed pin frame addressed to the chat peer', () => {
    sendChatPin({ id: 'dm-1', name: 'Bob', type: 'direct' }, 42, 'pin');

    expect(h.sendAddressed).toHaveBeenCalledTimes(1);
    const [target, raw] = h.sendAddressed.mock.calls[0];
    expect(target).toBe('peer-1');
    const frame = parseChatPin(raw as string)!;
    expect(frame).toMatchObject({
      type: 'chat-pin', messageId: '42', chatId: 'dm-1', chatName: 'Bob', senderName: 'Alice', op: 'pin',
    });
  });

  it('falls back to the name-matched peer and encodes unpin', () => {
    h.peerForChat.mockReturnValue(undefined);
    h.peerForChatName.mockReturnValue('peer-by-name');

    sendChatPin({ id: 'dm-2', name: 'Bob', type: 'direct' }, 'wire-9', 'unpin');

    expect(h.sendAddressed).toHaveBeenCalledTimes(1);
    expect(h.sendAddressed.mock.calls[0][0]).toBe('peer-by-name');
    expect(parseChatPin(h.sendAddressed.mock.calls[0][1] as string)!.op).toBe('unpin');
  });

  it('does nothing when no peer is bound', () => {
    h.peerForChat.mockReturnValue(undefined);
    h.peerForChatName.mockReturnValue(undefined);

    sendChatPin({ id: 'dm-3', name: 'Bob', type: 'direct' }, 1, 'pin');

    expect(h.sendAddressed).not.toHaveBeenCalled();
  });

  it('skips non-direct chats (group/channel pinning is local-only)', () => {
    sendChatPin({ id: 'g-1', name: 'Team', type: 'group' }, 1, 'pin');

    expect(h.sendAddressed).not.toHaveBeenCalled();
  });
});
