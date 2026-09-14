import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useP2PMessages } from './useP2PMessages';
import { FTR_MAGIC, encodeFrame, bytesToBase64, type FtrFrame } from '../lib/fileTransfer/frames';
import { encodeChatText } from '../lib/p2p/chatFrame';
import { saveTransferMeta, saveChunk } from '../lib/fileTransfer/fileStore';
import type { BroadcastMessage } from '../lib/p2p/network';

const mocks = vi.hoisted(() => ({
  setChats: vi.fn(),
  onMessage: vi.fn(),
}));

vi.mock('../lib/fileTransfer/fileStore', () => ({
  saveTransferMeta: vi.fn().mockResolvedValue(undefined),
  saveChunk: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../lib/p2p/network', () => ({
  p2pNetwork: {
    onMessage: mocks.onMessage,
    broadcast: vi.fn().mockResolvedValue(undefined),
    getPeerId: () => 'peer-self',
  },
}));
vi.mock('../store', () => ({
  useAppStore: { getState: () => ({ setChats: mocks.setChats }) },
}));

function setup() {
  const { result } = renderHook(() => useP2PMessages());
  const handle = vi.mocked(mocks.onMessage).mock.calls.at(-1)![0] as (msg: BroadcastMessage) => void;
  return { result, handle };
}

function chatsFromCalls(initial: any[]): any[] {
  let chats = initial;
  for (const [updater] of mocks.setChats.mock.calls) {
    chats = typeof updater === 'function' ? updater(chats) : updater;
  }
  return chats;
}

const INITIAL_CHATS = [{ id: 'dm-1', name: 'Bob', type: 'direct', history: [] }];

describe('useP2PMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists incoming meta, appends the ftr message to the name-matched DM, and reports progress 0', async () => {
    const { result, handle } = setup();
    const msg: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'ftr-t-1-meta',
      timestamp: 1,
      data: encodeFrame({
        type: 'meta',
        transferId: 't-1',
        name: 'pic.png',
        mime: 'image/png',
        size: 3,
        chunkSize: 64 * 1024,
        totalChunks: 1,
        sha256: 'abc',
        senderPeerId: 'peer-remote',
        senderName: 'Bob',
      } as FtrFrame),
    };

    await act(async () => {
      handle(msg);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(vi.mocked(saveTransferMeta).mock.calls[0][0]).toEqual(expect.objectContaining({ transferId: 't-1', receivedChunks: 0 }));
    const chats = chatsFromCalls(JSON.parse(JSON.stringify(INITIAL_CHATS)));
    const last = chats[0].history.at(-1);
    expect(last.attachment).toBe(FTR_MAGIC + 't-1');
    expect(last.fileName).toBe('pic.png');
    expect(last.fileTransferId).toBe('t-1');
    expect(last.status).toBe('delivered');
    expect(result.current.receiveProgress['t-1']).toBe(0);
  });

  it('stores incoming chunks and tracks progress against the meta totalChunks', async () => {
    const { result, handle } = setup();
    const meta: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'ftr-t-2-meta',
      timestamp: 1,
      data: encodeFrame({
        type: 'meta',
        transferId: 't-2',
        name: 'vid.mp4',
        mime: 'video/mp4',
        size: 4,
        chunkSize: 2,
        totalChunks: 2,
        sha256: 'def',
        senderPeerId: 'peer-remote',
        senderName: 'Bob',
      } as FtrFrame),
    };
    const chunkBytes = new Uint8Array([9, 8, 7]);
    const chunk: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'ftr-t-2-chunk-0',
      timestamp: 2,
      data: encodeFrame({ type: 'chunk', transferId: 't-2', index: 0, data: bytesToBase64(chunkBytes) }),
    };

    await act(async () => {
      handle(meta);
      handle(chunk);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(vi.mocked(saveChunk).mock.calls[0][0]).toBe('t-2');
    expect(vi.mocked(saveChunk).mock.calls[0][1]).toBe(0);
    expect(new Uint8Array(vi.mocked(saveChunk).mock.calls[0][2] as ArrayBuffer)).toEqual(chunkBytes);
    expect(result.current.receiveProgress['t-2']).toBe(50);
  });

  it('completes the transfer on the end frame', async () => {
    const { result, handle } = setup();
    const meta: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'ftr-t-3-meta',
      timestamp: 1,
      data: encodeFrame({
        type: 'meta',
        transferId: 't-3',
        name: 'n.png',
        mime: 'image/png',
        size: 1,
        chunkSize: 1,
        totalChunks: 1,
        sha256: 'fff',
        senderPeerId: 'peer-remote',
        senderName: 'Bob',
      } as FtrFrame),
    };
    const end: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'ftr-t-3-end',
      timestamp: 3,
      data: encodeFrame({ type: 'end', transferId: 't-3' }),
    };

    await act(async () => {
      handle(meta);
      handle(end);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(vi.mocked(saveTransferMeta).mock.calls.at(-1)![0]).toEqual(expect.objectContaining({ transferId: 't-3', completed: true, receivedChunks: 1 }));
    expect(result.current.receiveProgress['t-3']).toBe(100);
  });

  it('appends incoming chat text to the name-matched DM', () => {
    const { handle } = setup();
    const msg: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'msg-1',
      timestamp: 3,
      data: encodeChatText({
        type: 'chat-text',
        chatId: 'dm-1',
        chatName: 'Bob',
        senderName: 'Bob',
        text: 'hi there',
        silent: false,
        timestamp: 3,
      }),
    };

    act(() => {
      handle(msg);
    });

    const chats = chatsFromCalls(JSON.parse(JSON.stringify(INITIAL_CHATS)));
    const last = chats[0].history.at(-1);
    expect(last.text).toBe('hi there');
    expect(last.type).toBe('text');
    expect(vi.mocked(saveTransferMeta)).not.toHaveBeenCalled();
  });

  it('processes each wire messageId exactly once', () => {
    const { handle } = setup();
    const msg: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'msg-dup',
      timestamp: 4,
      data: encodeChatText({
        type: 'chat-text',
        chatId: 'dm-1',
        chatName: 'Bob',
        senderName: 'Bob',
        text: 'once',
        silent: false,
        timestamp: 4,
      }),
    };

    act(() => {
      handle(msg);
      handle(msg);
    });

    expect(mocks.setChats).toHaveBeenCalledTimes(1);
  });

  it('ignores messages from its own peer and non-frame payloads', () => {
    const { handle } = setup();
    const own: BroadcastMessage = {
      senderId: 'peer-self',
      messageId: 'own-1',
      timestamp: 5,
      data: encodeChatText({
        type: 'chat-text',
        chatId: 'dm-1',
        chatName: 'Bob',
        senderName: 'Bob',
        text: 'never',
        silent: false,
        timestamp: 5,
      }),
    };
    const junk: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'junk-1',
      timestamp: 6,
      data: 'not-a-frame',
    };

    act(() => {
      handle(own);
      handle(junk);
    });

    expect(mocks.setChats).not.toHaveBeenCalled();
    expect(vi.mocked(saveTransferMeta)).not.toHaveBeenCalled();
  });
});
