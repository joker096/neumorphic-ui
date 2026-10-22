import { describe, expect, it, beforeEach, vi } from 'vitest';

// The gate reads the chat list from the store; a mock keeps the test free of
// persistence side effects.
const store = vi.hoisted(() => ({ chats: [] as any[] }));

vi.mock('../../../store', () => ({
  useAppStore: { getState: () => ({ chats: store.chats }) },
}));

import { p2pNetwork } from '../network';
import { authorizeInboundChatFrame, resolveInboundChat } from './inboundGate';

const ALICE = { id: 'dm-1', name: 'Alice', type: 'direct' };
const BOB = { id: 'dm-2', name: 'Bob', type: 'direct' };

function resetBindings() {
  const net = p2pNetwork as any;
  net.chatPeers.clear();
  net.chatNamePeers.clear();
  net.peerChats.clear();
  net.peerNames.clear();
}

describe('inbound chat gate', () => {
  beforeEach(() => {
    store.chats = [ALICE, BOB];
    resetBindings();
  });

  it('binds the chat to the peer on the first frame', () => {
    const chat = authorizeInboundChatFrame('dm-1', 'Alice', 'peer-1', 'text');
    expect(chat).toBe(ALICE);
    expect(p2pNetwork.chatForPeer('peer-1')).toBe('dm-1');
  });

  it('routes a later frame by the peer, not by the display name', () => {
    authorizeInboundChatFrame('dm-1', 'Alice', 'peer-1', 'text');

    // The contact was renamed (or the sender asserts a stale name): the
    // transport-authenticated peer still owns the chat, so the frame lands in
    // the right conversation instead of being dropped.
    const resolved = resolveInboundChat('', 'Totally Different Name', 'peer-1');
    expect(resolved?.via).toBe('bound');
    expect(resolved?.chat).toBe(ALICE);

    const chat = authorizeInboundChatFrame('', 'Totally Different Name', 'peer-1', 'text');
    expect(chat).toBe(ALICE);
  });

  it('drops a frame from an unknown peer with a wrong name', () => {
    expect(authorizeInboundChatFrame('', 'Totally Different Name', 'peer-x', 'text')).toBeNull();
    expect(p2pNetwork.chatForPeer('peer-x')).toBeUndefined();
  });

  it('bootstraps by the display name for a peer without a binding', () => {
    const chat = authorizeInboundChatFrame('', 'Bob', 'peer-2', 'text');
    expect(chat).toBe(BOB);
    expect(p2pNetwork.chatForPeer('peer-2')).toBe('dm-2');
  });

  it('still refuses an id/name mix for a peer without a binding', () => {
    expect(authorizeInboundChatFrame('dm-1', 'Bob', 'peer-3', 'text')).toBeNull();
  });

  it('keeps the binding first-write-wins', () => {
    authorizeInboundChatFrame('dm-1', 'Alice', 'peer-1', 'text');

    // Another peer claims the same chat: the frame is dropped and the binding
    // stays with the first peer.
    expect(authorizeInboundChatFrame('dm-1', 'Alice', 'peer-attacker', 'text')).toBeNull();
    expect(p2pNetwork.chatForPeer('peer-1')).toBe('dm-1');
    expect(p2pNetwork.chatForPeer('peer-attacker')).toBeUndefined();
  });

  it('does not let a bound peer move to another chat', () => {
    authorizeInboundChatFrame('dm-1', 'Alice', 'peer-1', 'text');

    // The peer owns one chat; a frame that names another chat stays in the
    // bound one instead of crossing the conversation boundary.
    const chat = authorizeInboundChatFrame('dm-2', 'Bob', 'peer-1', 'text');
    expect(chat).toBe(ALICE);
  });
});
