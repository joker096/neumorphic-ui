import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useP2PMessages } from './useP2PMessages';
import { FTR_MAGIC, encodeFrame, encodeAlbumManifest, bytesToBase64, type FtrFrame } from '../lib/fileTransfer/frames';
import { encodeChatDeliveryAck, encodeChatReadReceipt, encodeChatText, encodeChatEdit, encodeCallSignal, encodeChatAudioMeta, encodeChatAudioChunk, encodeChatAudioEnd, VOICE_P2P_MAX_SIZE } from '../lib/p2p/chatFrame';
import { encodeChatLocation } from '../lib/p2p/chatRichFrames';
import { saveTransferMeta, saveChunk, pruneAbandonedTransfers, pruneCompletedTransfers, enforceFileTransferBudget, canAcceptFileTransfer, listTransfers, type StoredTransfer } from '../lib/fileTransfer/fileStore';
import { SELF_DESTRUCT_WIRE_MAX_MS } from '../lib/selfDestruct';
import { p2pNetwork, type BroadcastMessage } from '../lib/p2p/network';

const mocks = vi.hoisted(() => ({
  setChats: vi.fn(),
  onMessage: vi.fn(),
  handleRemoteCallSignal: vi.fn(),
  sha256Hex: vi.fn(),
  store: { chats: [] as any[] },
}));

vi.mock('../lib/voiceStore', () => ({
  saveVoiceBlob: vi.fn().mockResolvedValue(undefined),
}));
import { saveVoiceBlob } from '../lib/voiceStore';

vi.mock('../lib/call/CallManager', () => ({
  callManager: { handleRemoteCallSignal: mocks.handleRemoteCallSignal },
}));

vi.mock('../lib/fileTransfer/fileStore', () => ({
  saveTransferMeta: vi.fn().mockResolvedValue(undefined),
  saveChunk: vi.fn().mockResolvedValue(undefined),
  getTransferBlob: vi.fn().mockResolvedValue(new Blob([new Uint8Array([9, 8, 7])])),
  pruneAbandonedTransfers: vi.fn().mockResolvedValue(0),
  pruneCompletedTransfers: vi.fn().mockResolvedValue(0),
  enforceFileTransferBudget: vi.fn().mockResolvedValue(0),
  canAcceptFileTransfer: vi.fn().mockResolvedValue(true),
  listTransfers: vi.fn().mockResolvedValue([]),
  MAX_CONCURRENT_INCOMING_TRANSFERS: 4,
}));
vi.mock('../lib/fileTransfer/integrity', () => ({
  sha256Hex: mocks.sha256Hex,
}));
vi.mock('../lib/p2p/network', () => {
  const broadcast = vi.fn().mockResolvedValue(undefined);
  return {
    p2pNetwork: {
      onMessage: mocks.onMessage,
      broadcast,
      sendAddressed: vi.fn(async (_target: unknown, data: unknown) => { await broadcast(data); return false; }),
      getPeerId: () => 'peer-self',
      rememberPeer: vi.fn(),
      // First-write-wins binding: the hook drops a frame when the chat is
      // already bound to a different peer (mock returns false for that case).
      rememberChatPeer: vi.fn(() => true),
      peerForChat: () => undefined,
      peerForChatName: () => undefined,
      getPeerName: vi.fn(),
    },
  };
});
vi.mock('../store', () => ({
  useAppStore: {
    getState: () => ({
      setChats: (updater: any) => {
        mocks.setChats(updater);
        mocks.store.chats = typeof updater === 'function' ? updater(mocks.store.chats) : updater;
      },
      chats: mocks.store.chats,
    }),
  },
}));

function setup() {
  const { result } = renderHook(() => useP2PMessages());
  const handle = vi.mocked(mocks.onMessage).mock.calls.at(-1)![0] as (msg: BroadcastMessage) => void;
  return { result, handle };
}

async function settle() {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

function busyMeta(transferId: string): StoredTransfer {
  return {
    transferId,
    name: `${transferId}.bin`,
    mime: 'application/octet-stream',
    size: 1,
    chunkSize: 1,
    totalChunks: 1,
    sha256: 'x',
    senderPeerId: 'peer-remote',
    senderName: 'Bob',
  };
}

/** Seed the store chat list (inbound frames are authorized against real chats). */
function seedChats(chats: any[]): void {
  mocks.store.chats = JSON.parse(JSON.stringify(chats));
}

function currentChats(): any[] {
  return mocks.store.chats;
}

const INITIAL_CHATS = [{ id: 'dm-1', name: 'Bob', type: 'direct', history: [] }];

describe('useP2PMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: reassembled blob hash matches the declared sha256 (t-3 uses 'fff').
    vi.mocked(mocks.sha256Hex).mockResolvedValue('fff');
    // Default: the chat is unbound, so the first authenticated claim wins.
    vi.mocked(p2pNetwork.rememberChatPeer).mockReturnValue(true);
    seedChats(INITIAL_CHATS);
  });

  it('persists incoming meta, appends the ftr message to the name-matched DM, and reports progress 0', async () => {
    const { result, handle } = setup();
    const msg: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'ftr-t-1-meta',
      timestamp: 1,
      data: encodeFrame({
        type: 'meta',
        seq: 1,
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
      await settle();
    });

    expect(vi.mocked(saveTransferMeta).mock.calls[0][0]).toEqual(expect.objectContaining({ transferId: 't-1', receivedChunks: 0 }));
    const chats = currentChats();
    const last = chats[0].history.at(-1);
    expect(last.attachment).toBe(FTR_MAGIC + 't-1');
    expect(last.fileName).toBe('pic.png');
    expect(last.fileTransferId).toBe('t-1');
    expect(last.status).toBe('delivered');
    expect(result.current.receiveProgress['t-1']).toBe(0);
  });

  it('applies a file meta TTL so an incoming self-destruct attachment expires locally', async () => {
    const { handle } = setup();
    const before = Date.now();

    await act(async () => {
      handle({
        senderId: 'peer-remote',
        messageId: 'ftr-ttl-meta',
        timestamp: 1,
        data: encodeFrame({
          type: 'meta',
          seq: 1,
          transferId: 't-ttl',
          name: 'secret.txt',
          mime: 'text/plain',
          size: 3,
          chunkSize: 64 * 1024,
          totalChunks: 1,
          sha256: 'abc',
          senderPeerId: 'peer-remote',
          senderName: 'Bob',
          ttlMs: 30_000,
        } as FtrFrame),
      });
      await settle();
    });

    const last = currentChats()[0].history.at(-1);
    expect(last.fileTransferId).toBe('t-ttl');
    expect(last.selfDestructAt).toBeGreaterThanOrEqual(before + 30_000);
  });

  it('stores incoming chunks and tracks progress against the meta totalChunks', async () => {
    const { result, handle } = setup();
    const meta: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'ftr-t-2-meta',
      timestamp: 1,
      data: encodeFrame({
        type: 'meta',
        seq: 1,
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
      data: encodeFrame({ type: 'chunk', seq: 2, transferId: 't-2', index: 0, data: bytesToBase64(chunkBytes) }),
    };

    await act(async () => {
      handle(meta);
      await settle();
      handle(chunk);
      await settle();
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
        seq: 1,
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
      data: encodeFrame({ type: 'end', seq: 2, transferId: 't-3' }),
    };

    await act(async () => {
      handle(meta);
      await settle();
      handle(end);
      await settle();
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
        seq: 1,
        messageId: 'wire-msg-1',
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

    const chats = currentChats();
    const last = chats[0].history.at(-1);
    expect(last.text).toBe('hi there');
    expect(last.type).toBe('text');
    expect(vi.mocked(saveTransferMeta)).not.toHaveBeenCalled();
  });

  it('carries a self-destruct TTL from the wire into the inbound bubble', () => {
    const { handle } = setup();
    const before = Date.now();

    act(() => {
      handle({
        senderId: 'peer-remote',
        messageId: 'msg-ttl',
        timestamp: 3,
        data: encodeChatText({
          type: 'chat-text',
          seq: 1,
          messageId: 'wire-msg-ttl',
          chatId: 'dm-1',
          chatName: 'Bob',
          senderName: 'Bob',
          text: 'burns',
          silent: false,
          timestamp: 3,
          ttlMs: 60_000,
        }),
      });
    });

    const last = currentChats()[0].history.at(-1);
    expect(last.selfDestructAt).toBeGreaterThanOrEqual(before + 60_000);
    expect(last.selfDestructAt).toBeLessThanOrEqual(Date.now() + 60_000);
  });

  it('clamps an absurd inbound TTL and leaves a legacy frame without one untimed', () => {
    const { handle } = setup();
    const before = Date.now();

    act(() => {
      handle({
        senderId: 'peer-remote',
        messageId: 'msg-ttl-max',
        timestamp: 4,
        data: encodeChatText({
          type: 'chat-text', seq: 2, messageId: 'wire-ttl-max', chatId: 'dm-1', chatName: 'Bob',
          senderName: 'Bob', text: 'forever', silent: false, timestamp: 4, ttlMs: 365 * 24 * 3600 * 1000,
        }),
      });
      handle({
        senderId: 'peer-remote',
        messageId: 'msg-ttl-junk',
        timestamp: 5,
        data: encodeChatText({
          type: 'chat-text', seq: 3, messageId: 'wire-ttl-junk', chatId: 'dm-1', chatName: 'Bob',
          senderName: 'Bob', text: 'junk', silent: false, timestamp: 5, ttlMs: 'soon' as unknown as number,
        }),
      });
      handle({
        senderId: 'peer-remote',
        messageId: 'msg-ttl-legacy',
        timestamp: 6,
        data: encodeChatText({
          type: 'chat-text', seq: 4, messageId: 'wire-ttl-legacy', chatId: 'dm-1', chatName: 'Bob',
          senderName: 'Bob', text: 'legacy', silent: false, timestamp: 6,
        }),
      });
    });

    const history = currentChats()[0].history;
    const clamped = history.find((m: any) => m.text === 'forever');
    expect(clamped.selfDestructAt).toBeGreaterThanOrEqual(before + SELF_DESTRUCT_WIRE_MAX_MS);
    // Junk TTL and a legacy peer both degrade to "no timer" — the message stays.
    expect(history.find((m: any) => m.text === 'junk').selfDestructAt).toBeUndefined();
    expect(history.find((m: any) => m.text === 'legacy').selfDestructAt).toBeUndefined();
  });

  it('applies an incoming chat-edit frame to the matching DM message', () => {
    const { handle } = setup();
    const textMsg: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'edit-t-text',
      timestamp: 3,
      data: encodeChatText({
        type: 'chat-text',
        seq: 1,
        messageId: 'wire-msg-1',
        chatId: 'dm-1',
        chatName: 'Bob',
        senderName: 'Bob',
        text: 'original',
        silent: false,
        timestamp: 3,
      }),
    };
    const editMsg: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'edit-t-edit',
      timestamp: 4,
      data: encodeChatEdit({
        type: 'chat-edit',
        seq: 2,
        messageId: 'wire-msg-1',
        chatId: 'dm-1',
        chatName: 'Bob',
        senderName: 'Bob',
        text: 'revised',
        timestamp: 4,
      }),
    };

    act(() => {
      handle(textMsg);
      handle(editMsg);
    });

    const chats = currentChats();
    const edited = chats[0].history.find((m: any) => m.id === 'wire-msg-1');
    expect(edited).toMatchObject({ text: 'revised', edited: true });
    expect(chats[0].history).toHaveLength(1);
  });

  it('ignores chat-edit frames for unknown chats and unknown message ids', () => {
    const { handle } = setup();
    const noChatEdit: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'msg-3',
      timestamp: 5,
      data: encodeChatEdit({
        type: 'chat-edit',
        seq: 3,
        messageId: 'wire-msg-x',
        chatId: 'unknown-chat',
        chatName: 'Unknown',
        senderName: 'Bob',
        text: 'nowhere',
        timestamp: 5,
      }),
    };

    act(() => {
      handle(noChatEdit);
    });

    const chats = currentChats();
    expect(chats[0].history).toHaveLength(0);
  });

  it('inserts late-arriving frames in send-time order (not arrival order)', () => {
    const { handle } = setup();
    const frame = (messageId: string, text: string, ts: number): BroadcastMessage => ({
      senderId: 'peer-remote',
      messageId: `wire-${messageId}`,
      timestamp: ts,
      data: encodeChatText({
        type: 'chat-text',
        seq: 1,
        messageId,
        chatId: 'dm-1',
        chatName: 'Bob',
        senderName: 'Bob',
        text,
        silent: false,
        timestamp: ts,
      }),
    });

    act(() => {
      handle(frame('200', 'newer', 200));
      handle(frame('100', 'older', 100));
    });

    const chats = currentChats();
    expect(chats[0].history.map((m: any) => m.id)).toEqual(['100', '200']);
    expect(chats[0].history.map((m: any) => m.text)).toEqual(['older', 'newer']);
  });

  it('acks addressed to the sender and binds the peer to the chat', () => {
    const { handle } = setup();
    const msg: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'msg-ack-bound',
      timestamp: 9,
      data: encodeChatText({
        type: 'chat-text',
        seq: 1,
        messageId: 'wire-bind',
        chatId: 'dm-1',
        chatName: 'Bob',
        senderName: 'Bob',
        text: 'bind me',
        silent: false,
        timestamp: 9,
      }),
    };

    act(() => handle(msg));

    const sendAddressed = vi.mocked(p2pNetwork.sendAddressed);
    expect(sendAddressed).toHaveBeenCalledWith('peer-remote', expect.stringContaining('chat-ack'));
    expect(vi.mocked(p2pNetwork.rememberChatPeer)).toHaveBeenCalledWith('dm-1', 'Bob', 'peer-remote');
  });

  it('routes incoming chat text by chatId before same-name fallback', () => {
    const { handle } = setup();
    const msg: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'msg-exact-chat',
      timestamp: 7,
      data: encodeChatText({
        type: 'chat-text',
        seq: 1,
        messageId: 'wire-exact',
        chatId: 'dm-2',
        chatName: 'Bob',
        senderName: 'Bob',
        text: 'exact chat',
        silent: false,
        timestamp: 7,
      }),
    };

    seedChats([
      { id: 'dm-1', name: 'Bob', type: 'direct', history: [] },
      { id: 'dm-2', name: 'Bob', type: 'direct', history: [] },
    ]);

    act(() => handle(msg));

    const chats = currentChats();
    expect(chats[0].history).toHaveLength(0);
    expect(chats[1].history[0].text).toBe('exact chat');
  });

  it('marks the matching outgoing message delivered on peer ACK', () => {
    const { handle } = setup();
    const ack: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'ack-1',
      timestamp: 5,
      data: encodeChatDeliveryAck({ type: 'chat-ack', seq: 1, messageId: '42', chatId: 'dm-1', timestamp: 5 }),
    };

    seedChats([{ id: 'dm-1', name: 'Bob', type: 'direct', history: [{ id: 42, sender: 'me', text: 'hello', status: 'sent' }] }]);

    act(() => handle(ack));

    const chats = currentChats();
    expect(chats[0].history[0].status).toBe('delivered');
  });

  it('marks the matching outgoing message read on peer read receipt', () => {
    const { handle } = setup();
    const receipt: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'read-1',
      timestamp: 6,
      data: encodeChatReadReceipt({ type: 'chat-read', seq: 1, messageId: '42', chatId: 'dm-1', timestamp: 6 }),
    };

    seedChats([{ id: 'dm-1', name: 'Bob', type: 'direct', history: [{ id: 42, sender: 'me', text: 'hello', status: 'delivered' }] }]);

    act(() => handle(receipt));

    const chats = currentChats();
    expect(chats[0].history[0].status).toBe('read');
  });

  it('processes each wire messageId exactly once', () => {
    const { handle } = setup();
    const msg: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'msg-dup',
      timestamp: 4,
      data: encodeChatText({
        type: 'chat-text',
        seq: 1,
        messageId: 'wire-once',
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

  it('routes call-ring frames to the call manager and skips chat/file handling', async () => {
    const { handle } = setup();
    const ring: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'call-1',
      timestamp: 9,
      data: encodeCallSignal({ type: 'call-ring', seq: 1, callId: 'c-1', callType: 'video', timestamp: 9 }),
    };

    act(() => handle(ring));

    await waitFor(() => expect(mocks.handleRemoteCallSignal).toHaveBeenCalledWith('peer-remote', expect.objectContaining({ type: 'call-ring', callId: 'c-1', callType: 'video' })));
    expect(mocks.setChats).not.toHaveBeenCalled();
    expect(vi.mocked(saveTransferMeta)).not.toHaveBeenCalled();
  });

  it('ignores messages from its own peer and non-frame payloads', () => {
    const { handle } = setup();
    const own: BroadcastMessage = {
      senderId: 'peer-self',
      messageId: 'own-1',
      timestamp: 5,
      data: encodeChatText({
        type: 'chat-text',
        seq: 1,
        messageId: 'wire-never',
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

  it('drops out-of-range and duplicate chunks (bounds + dedupe)', async () => {
    const { handle } = setup();
    const metaMsg: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'ftr-t-5-meta',
      timestamp: 1,
      data: encodeFrame({
        type: 'meta',
        seq: 1,
        transferId: 't-5',
        name: 'f.bin',
        mime: 'application/octet-stream',
        size: 2,
        chunkSize: 1,
        totalChunks: 2,
        sha256: 'x',
        senderPeerId: 'peer-remote',
        senderName: 'Bob',
      } as FtrFrame),
    };
    const outOfRange: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'ftr-t-5-chunk-9',
      timestamp: 2,
      data: encodeFrame({ type: 'chunk', seq: 2, transferId: 't-5', index: 9, data: bytesToBase64(new Uint8Array([1])) }),
    };
    const dupChunk = (msgId: string): BroadcastMessage => ({
      senderId: 'peer-remote',
      messageId: msgId,
      timestamp: 3,
      data: encodeFrame({ type: 'chunk', seq: 3, transferId: 't-5', index: 0, data: bytesToBase64(new Uint8Array([7])) }),
    });
    const orphan: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'ftr-orphan-chunk',
      timestamp: 4,
      data: encodeFrame({ type: 'chunk', seq: 4, transferId: 't-ghost', index: 0, data: bytesToBase64(new Uint8Array([1])) }),
    };

    await act(async () => {
      handle(metaMsg);
      await settle();
      handle(outOfRange);
      handle(dupChunk('ftr-t-5-chunk-0a'));
      handle(dupChunk('ftr-t-5-chunk-0b'));
      handle(orphan);
      await settle();
    });

    const saveChunkMock = vi.mocked(saveChunk);
    expect(saveChunkMock).toHaveBeenCalledTimes(1);
    expect(saveChunkMock).toHaveBeenCalledWith('t-5', 0, expect.anything());
    expect(saveChunkMock).not.toHaveBeenCalledWith('t-5', 9, expect.anything());
    expect(saveChunkMock).not.toHaveBeenCalledWith('t-ghost', 0, expect.anything());
  });

  it('flags an integrity mismatch when the reassembled blob hash differs', async () => {
    vi.mocked(mocks.sha256Hex).mockResolvedValueOnce('deadbeef');
    const { result, handle } = setup();
    const metaMsg: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'ftr-t-6-meta',
      timestamp: 1,
      data: encodeFrame({
        type: 'meta',
        seq: 1,
        transferId: 't-6',
        name: 'bad.png',
        mime: 'image/png',
        size: 1,
        chunkSize: 1,
        totalChunks: 1,
        sha256: 'fff',
        senderPeerId: 'peer-remote',
        senderName: 'Bob',
      } as FtrFrame),
    };
    const endMsg: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'ftr-t-6-end',
      timestamp: 3,
      data: encodeFrame({ type: 'end', seq: 2, transferId: 't-6' }),
    };

    await act(async () => {
      handle(metaMsg);
      await settle();
      handle(endMsg);
      await settle();
    });

    expect(vi.mocked(saveTransferMeta).mock.calls.at(-1)![0]).toEqual(
      expect.objectContaining({ transferId: 't-6', completed: false, integrityError: true }),
    );
    expect(result.current.receiveProgress['t-6']).toBe(0);
  });

  it('runs storage GC at mount (abandoned, completed, byte budget)', async () => {
    setup();
    await act(async () => { await settle(); });
    expect(vi.mocked(pruneAbandonedTransfers)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(pruneCompletedTransfers)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(enforceFileTransferBudget)).toHaveBeenCalledTimes(1);
  });

  it('rejects incoming meta when the concurrency cap is reached', async () => {
    vi.mocked(listTransfers).mockResolvedValueOnce([
      busyMeta('cap-1'), busyMeta('cap-2'), busyMeta('cap-3'), busyMeta('cap-4'),
    ]);
    const { handle } = setup();
    const msg: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'ftr-t-7-meta',
      timestamp: 1,
      data: encodeFrame({
        type: 'meta',
        seq: 1,
        transferId: 't-7',
        name: 'cap.bin',
        mime: 'application/octet-stream',
        size: 1,
        chunkSize: 1,
        totalChunks: 1,
        sha256: 'x',
        senderPeerId: 'peer-remote',
        senderName: 'Bob',
      } as FtrFrame),
    };
    await act(async () => {
      handle(msg);
      await settle();
    });
    expect(vi.mocked(saveTransferMeta)).not.toHaveBeenCalled();
    expect(mocks.setChats).not.toHaveBeenCalled();
  });

  it('rejects incoming meta when the byte budget would be exceeded', async () => {
    vi.mocked(canAcceptFileTransfer).mockResolvedValueOnce(false);
    const { handle } = setup();
    const msg: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'ftr-t-8-meta',
      timestamp: 1,
      data: encodeFrame({
        type: 'meta',
        seq: 1,
        transferId: 't-8',
        name: 'big.bin',
        mime: 'application/octet-stream',
        size: 1024,
        chunkSize: 1,
        totalChunks: 1,
        sha256: 'x',
        senderPeerId: 'peer-remote',
        senderName: 'Bob',
      } as FtrFrame),
    };
    await act(async () => {
      handle(msg);
      await settle();
    });
    expect(vi.mocked(saveTransferMeta)).not.toHaveBeenCalled();
    expect(mocks.setChats).not.toHaveBeenCalled();
  });

  it('reassembles an incoming voice message from meta/chunk/end and acks', async () => {
    vi.mocked(mocks.sha256Hex).mockResolvedValue('aabb');
    const { handle } = setup();
    const meta: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'audio-v1-meta',
      timestamp: 11,
      data: encodeChatAudioMeta({
        type: 'chat-audio-meta',
        seq: 1,
        messageId: 'voice-1',
        chatId: 'dm-1',
        chatName: 'Bob',
        senderName: 'Bob',
        duration: 5,
        mime: 'audio/webm',
        size: 3,
        chunkSize: 46080,
        totalChunks: 1,
        sha256: 'aabb',
        timestamp: 11,
      }),
    };
    const chunk: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'audio-v1-chunk-0',
      timestamp: 12,
      data: encodeChatAudioChunk({
        type: 'chat-audio-chunk',
        seq: 2,
        messageId: 'voice-1',
        index: 0,
        data: bytesToBase64(new Uint8Array([1, 2, 3])),
      }),
    };
    const end: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'audio-v1-end',
      timestamp: 13,
      data: encodeChatAudioEnd({ type: 'chat-audio-end', seq: 3, messageId: 'voice-1' }),
    };

    await act(async () => {
      handle(meta);
      await settle();
      handle(chunk);
      await settle();
      handle(end);
      await settle();
    });

    expect(vi.mocked(saveVoiceBlob)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(saveVoiceBlob).mock.calls[0][0]).toBe('voice-1');
    expect(vi.mocked(saveVoiceBlob).mock.calls[0][1]).toBeInstanceOf(Blob);
    expect(vi.mocked(p2pNetwork.rememberChatPeer)).toHaveBeenCalledWith('dm-1', 'Bob', 'peer-remote');
    expect(vi.mocked(p2pNetwork.sendAddressed)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(p2pNetwork.sendAddressed).mock.calls[0][1]).toContain('chat-ack');

    const chats = currentChats();
    const last = chats[0].history.at(-1);
    expect(last.id).toBe('voice-1');
    expect(last.type).toBe('audio');
    expect(last.sender).toBe('Bob');
    expect(last.voiceId).toBe('voice-1');
    expect(last.duration).toBe('0:05');
    expect(last.status).toBe('delivered');
  });

  it('drops voice data when the declared hash does not match', async () => {
    vi.mocked(mocks.sha256Hex).mockResolvedValue('deadbeef');
    const { handle } = setup();
    const meta: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'audio-v2-meta',
      timestamp: 21,
      data: encodeChatAudioMeta({
        type: 'chat-audio-meta',
        seq: 1,
        messageId: 'voice-2',
        chatId: 'dm-1',
        chatName: 'Bob',
        senderName: 'Bob',
        duration: 2,
        mime: 'audio/webm',
        size: 2,
        chunkSize: 46080,
        totalChunks: 1,
        sha256: 'aabb',
        timestamp: 21,
      }),
    };
    const chunk: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'audio-v2-chunk-0',
      timestamp: 22,
      data: encodeChatAudioChunk({
        type: 'chat-audio-chunk',
        seq: 2,
        messageId: 'voice-2',
        index: 0,
        data: bytesToBase64(new Uint8Array([7, 8])),
      }),
    };
    const end: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'audio-v2-end',
      timestamp: 23,
      data: encodeChatAudioEnd({ type: 'chat-audio-end', seq: 3, messageId: 'voice-2' }),
    };

    await act(async () => {
      handle(meta);
      await settle();
      handle(chunk);
      await settle();
      handle(end);
      await settle();
    });

    expect(vi.mocked(saveVoiceBlob)).not.toHaveBeenCalled();
    expect(mocks.setChats).not.toHaveBeenCalled();
  });

  it('fails closed on oversized voice meta and ignores its chunks', async () => {
    const { handle } = setup();
    const meta: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'audio-v3-meta',
      timestamp: 31,
      data: encodeChatAudioMeta({
        type: 'chat-audio-meta',
        seq: 1,
        messageId: 'voice-3',
        chatId: 'dm-1',
        chatName: 'Bob',
        senderName: 'Bob',
        duration: 2,
        mime: 'audio/webm',
        size: VOICE_P2P_MAX_SIZE + 1,
        chunkSize: 46080,
        totalChunks: 1,
        sha256: 'aabb',
        timestamp: 31,
      }),
    };
    const chunk: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'audio-v3-chunk-0',
      timestamp: 32,
      data: encodeChatAudioChunk({
        type: 'chat-audio-chunk',
        seq: 2,
        messageId: 'voice-3',
        index: 0,
        data: bytesToBase64(new Uint8Array([1])),
      }),
    };

    await act(async () => {
      handle(meta);
      await settle();
      handle(chunk);
      await settle();
    });

    expect(mocks.setChats).not.toHaveBeenCalled();
    expect(vi.mocked(saveVoiceBlob)).not.toHaveBeenCalled();
  });

  it('ignores an audio end frame that arrives before its chunks', async () => {
    const { handle } = setup();
    const meta: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'audio-v4-meta',
      timestamp: 41,
      data: encodeChatAudioMeta({
        type: 'chat-audio-meta',
        seq: 1,
        messageId: 'voice-4',
        chatId: 'dm-1',
        chatName: 'Bob',
        senderName: 'Bob',
        duration: 1,
        mime: 'audio/webm',
        size: 5,
        chunkSize: 46080,
        totalChunks: 1,
        sha256: 'aabb',
        timestamp: 41,
      }),
    };
    const end: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'audio-v4-end',
      timestamp: 42,
      data: encodeChatAudioEnd({ type: 'chat-audio-end', seq: 2, messageId: 'voice-4' }),
    };

    await act(async () => {
      handle(meta);
      await settle();
      handle(end);
      await settle();
    });

    expect(vi.mocked(saveVoiceBlob)).not.toHaveBeenCalled();
    expect(mocks.setChats).not.toHaveBeenCalled();
  });

  it('builds an album bubble from the manifest and suppresses duplicate single-file bubbles for its transfers', async () => {
    const { handle } = setup();
    const manifestMsg: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'album-1-manif',
      timestamp: 50,
      data: encodeAlbumManifest({
        albumId: 'album-1',
        messageId: 500,
        chatId: 'dm-1',
        chatName: 'Bob',
        senderName: 'Bob',
        silent: false,
        timestamp: 100,
        entries: [
          { transferId: 'a-1', name: 'm.png', mime: 'image/png', size: 2 },
          { transferId: 'a-2', name: 'n.png', mime: 'image/png', size: 3 },
        ],
      }),
    };
    const metaForAlbumEntry: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'album-1-meta-a1',
      timestamp: 51,
      data: encodeFrame({
        type: 'meta',
        seq: 1,
        transferId: 'a-1',
        name: 'm.png',
        mime: 'image/png',
        size: 2,
        chunkSize: 2,
        totalChunks: 1,
        sha256: 'fff',
        senderPeerId: 'peer-remote',
        senderName: 'Bob',
      } as FtrFrame),
    };

    await act(async () => {
      handle(manifestMsg);
      await settle();
      handle(metaForAlbumEntry);
      await settle();
    });

    const chats = currentChats();
    expect(chats[0].history).toHaveLength(1);
    const album = chats[0].history[0];
    expect(album.id).toBe(500);
    expect(album.type).toBe('image');
    expect(album.sender).toBe('Bob');
    expect(album.attachment).toBe(FTR_MAGIC + 'a-1');
    expect(album.fileTransferId).toBe('a-1');
    expect(album.album).toHaveLength(2);
    expect(album.album[0].url).toBe(FTR_MAGIC + 'a-1');
    expect(album.album[1].url).toBe(FTR_MAGIC + 'a-2');
    expect(album.status).toBe('delivered');
    expect(vi.mocked(saveTransferMeta)).toHaveBeenCalled();
    expect(vi.mocked(p2pNetwork.rememberChatPeer)).toHaveBeenCalledWith('dm-1', 'Bob', 'peer-remote');
    expect(vi.mocked(p2pNetwork.sendAddressed)).toHaveBeenCalledWith('peer-remote', expect.stringContaining('chat-ack'));
  });

  it('rejects an album manifest whose raw payload is not ALBUM_MAGIC-prefixed', async () => {
    const { handle } = setup();
    const msg: BroadcastMessage = {
      senderId: 'peer-remote',
      messageId: 'album-bad',
      timestamp: 60,
      data: 'not-an-album',
    };

    act(() => handle(msg));

    expect(mocks.setChats).not.toHaveBeenCalled();
    expect(vi.mocked(saveTransferMeta)).not.toHaveBeenCalled();
  });

  // ── inbound authorization (P1-5: sender-asserted chatId/chatName/senderName) ──

  it('drops a chat-text frame whose asserted chatId and chatName disagree', () => {
    const { handle } = setup();
    seedChats([
      { id: 'dm-1', name: 'Bob', type: 'direct', history: [] },
      { id: 'dm-2', name: 'Alice', type: 'direct', history: [] },
    ]);

    act(() =>
      handle({
        senderId: 'peer-remote',
        messageId: 'msg-mix',
        timestamp: 1,
        data: encodeChatText({
          type: 'chat-text',
          seq: 1,
          messageId: 'wire-mix',
          chatId: 'dm-1',
          chatName: 'Alice',
          senderName: 'Alice',
          text: 'spoofed',
          silent: false,
          timestamp: 1,
        }),
      }),
    );

    expect(currentChats()[0].history).toHaveLength(0);
    expect(currentChats()[1].history).toHaveLength(0);
    expect(vi.mocked(p2pNetwork.rememberChatPeer)).not.toHaveBeenCalled();
  });

  it('drops a chat-text frame for a chat the victim does not have', () => {
    const { handle } = setup();

    act(() =>
      handle({
        senderId: 'peer-remote',
        messageId: 'msg-ghost',
        timestamp: 1,
        data: encodeChatText({
          type: 'chat-text',
          seq: 1,
          messageId: 'wire-ghost',
          chatId: 'dm-999',
          chatName: 'Ghost',
          senderName: 'Ghost',
          text: 'who am I',
          silent: false,
          timestamp: 1,
        }),
      }),
    );

    expect(mocks.setChats).not.toHaveBeenCalled();
    expect(vi.mocked(p2pNetwork.rememberChatPeer)).not.toHaveBeenCalled();
  });

  it('drops a chat-text frame once the chat is bound to a different peer', () => {
    const { handle } = setup();
    // rememberChatPeer refuses the conflicting claim (first-write-wins).
    vi.mocked(p2pNetwork.rememberChatPeer).mockReturnValue(false);

    act(() =>
      handle({
        senderId: 'peer-attacker',
        messageId: 'msg-rebind',
        timestamp: 1,
        data: encodeChatText({
          type: 'chat-text',
          seq: 1,
          messageId: 'wire-rebind',
          chatId: 'dm-1',
          chatName: 'Bob',
          senderName: 'Bob',
          text: 'hijack',
          silent: false,
          timestamp: 1,
        }),
      }),
    );

    expect(mocks.setChats).not.toHaveBeenCalled();
  });

  it('stamps the local contact name on an inbound bubble, not the asserted senderName', () => {
    const { handle } = setup();
    seedChats([{ id: 'dm-1', name: 'Bob', type: 'direct', history: [] }]);
    // The frame claims to be from "bob" (case differs) and asserts a bogus
    // display name; authorization only requires the chat to match, and the
    // rendered bubble must use the local name.
    vi.mocked(p2pNetwork.rememberChatPeer).mockReturnValue(true);

    act(() =>
      handle({
        senderId: 'peer-remote',
        messageId: 'msg-name',
        timestamp: 1,
        data: encodeChatText({
          type: 'chat-text',
          seq: 1,
          messageId: 'wire-name',
          chatId: 'dm-1',
          chatName: 'Bob',
          senderName: 'Totally Different Name',
          text: 'hi',
          silent: false,
          timestamp: 1,
        }),
      }),
    );

    const last = currentChats()[0].history.at(-1);
    expect(last.text).toBe('hi');
    expect(last.sender).toBe('Bob');
  });

  it('never inserts a frame into a group chat (direct-only surface)', () => {
    const { handle } = setup();
    seedChats([{ id: 'grp-1', name: 'Team', type: 'group', history: [] }]);

    act(() =>
      handle({
        senderId: 'peer-remote',
        messageId: 'msg-group',
        timestamp: 1,
        data: encodeChatText({
          type: 'chat-text',
          seq: 1,
          messageId: 'wire-group',
          chatId: 'grp-1',
          chatName: 'Team',
          senderName: 'Mallory',
          text: 'into the group',
          silent: false,
          timestamp: 1,
        }),
      }),
    );

    expect(mocks.setChats).not.toHaveBeenCalled();
  });

  it('drops a file meta frame from a peer that does not own the named chat (no state, no persist)', async () => {
    const { result, handle } = setup();
    vi.mocked(p2pNetwork.rememberChatPeer).mockReturnValue(false);

    await act(async () => {
      handle({
        senderId: 'peer-attacker',
        messageId: 'ftr-x-meta',
        timestamp: 1,
        data: encodeFrame({
          type: 'meta',
          seq: 1,
          transferId: 't-x',
          name: 'evil.bin',
          mime: 'application/octet-stream',
          size: 1,
          chunkSize: 1,
          totalChunks: 1,
          sha256: 'x',
          senderPeerId: 'peer-attacker',
          senderName: 'Bob',
        } as FtrFrame),
      });
      await settle();
    });

    expect(vi.mocked(saveTransferMeta)).not.toHaveBeenCalled();
    expect(mocks.setChats).not.toHaveBeenCalled();
    expect(result.current.receiveProgress['t-x']).toBeUndefined();
  });

  it('persists the transport-authenticated sender id, not the asserted one', async () => {
    const { handle } = setup();

    await act(async () => {
      handle({
        senderId: 'peer-transport',
        messageId: 'ftr-y-meta',
        timestamp: 1,
        data: encodeFrame({
          type: 'meta',
          seq: 1,
          transferId: 't-y',
          name: 'ok.bin',
          mime: 'application/octet-stream',
          size: 1,
          chunkSize: 1,
          totalChunks: 1,
          sha256: 'x',
          senderPeerId: 'peer-forged',
          senderName: 'Bob',
        } as FtrFrame),
      });
      await settle();
    });

    expect(vi.mocked(saveTransferMeta).mock.calls[0][0]).toEqual(
      expect.objectContaining({ senderPeerId: 'peer-transport', senderName: 'Bob' }),
    );
  });

  describe('incoming live location stream', () => {
    const liveFrame = (over: Record<string, any> = {}) => ({
      type: 'chat-location' as const,
      seq: 1,
      messageId: 'live-1',
      chatId: 'dm-1',
      chatName: 'Bob',
      senderName: 'Bob',
      lat: 52.52,
      lng: 13.405,
      silent: false,
      timestamp: 1000,
      live: true,
      expiresAt: Date.now() + 60_000,
      approximate: true,
      accuracy: 12,
      ...over,
    });

    // `p2pNetwork` stamps a unique transport-level messageId per received
    // message, and useP2PMessages dedupes on it module-wide. A live stream
    // reuses ONE wire `messageId` across all its frames, so each frame here
    // needs its own transport id or the dedupe swallows every update.
    let transportId = 0;
    const incoming = (frame: any): BroadcastMessage => ({
      senderId: 'peer-remote',
      timestamp: 1,
      messageId: `transport-${++transportId}`,
      data: encodeChatLocation(frame),
    } as any);

    it('patches the same bubble instead of appending one per fix', () => {
      const { handle } = setup();
      seedChats([{ id: 'dm-1', name: 'Bob', type: 'direct', history: [] }]);

      act(() => handle(incoming(liveFrame({ seq: 1, lat: 1, lng: 1 }))));
      act(() => handle(incoming(liveFrame({ seq: 2, lat: 2, lng: 2 }))));
      act(() => handle(incoming(liveFrame({ seq: 3, lat: 3, lng: 3 }))));

      const history = currentChats()[0].history;
      expect(history).toHaveLength(1);
      expect(history[0].lat).toBe(3);
    });

    it('keeps the original send time so a moving bubble does not jump', () => {
      const { handle } = setup();
      seedChats([{ id: 'dm-1', name: 'Bob', type: 'direct', history: [] }]);

      act(() => handle(incoming(liveFrame({ seq: 1, timestamp: 1000 }))));
      act(() => handle(incoming(liveFrame({ seq: 2, timestamp: 999_999 }))));

      expect(currentChats()[0].history[0].ts).toBe(1000);
    });

    // The final "stop" frame may never arrive, so the absolute expiry must
    // demote the bubble on its own or the receiver shows a live share forever.
    it('demotes an expired frame to a static pin without a stop frame', () => {
      const { handle } = setup();
      seedChats([{ id: 'dm-1', name: 'Bob', type: 'direct', history: [] }]);

      act(() => handle(incoming(liveFrame({ seq: 1, expiresAt: Date.now() + 60_000 }))));
      expect(currentChats()[0].history[0].isLive).toBe(true);

      act(() => handle(incoming(liveFrame({ seq: 2, expiresAt: Date.now() - 1 }))));
      expect(currentChats()[0].history[0].isLive).toBe(false);
    });

    it('acknowledges only the frame that created the bubble', () => {
      const { handle } = setup();
      seedChats([{ id: 'dm-1', name: 'Bob', type: 'direct', history: [] }]);
      const acks = () => (p2pNetwork.sendAddressed as any).mock.calls
        .map((c: any[]) => String(c[1]))
        .filter((s: string) => s.includes('chat-ack')).length;

      act(() => handle(incoming(liveFrame({ seq: 1 }))));
      const afterFirst = acks();

      act(() => handle(incoming(liveFrame({ seq: 2, lat: 9 }))));
      act(() => handle(incoming(liveFrame({ seq: 3, lat: 10 }))));

      // Acking every GPS fix would flood the wire back to the sender.
      expect(afterFirst).toBeGreaterThan(0);
      expect(acks()).toBe(afterFirst);
    });

    // A live id is `live_<chat>_<ts>`, so ordering must come from `ts`. Reading
    // only the id coerced it to 0, which sorted a share started mid-conversation
    // above every message that actually predates it.
    it('orders a live share by its send time, not by its non-numeric id', () => {
      const { handle } = setup();
      seedChats([{
        id: 'dm-1', name: 'Bob', type: 'direct',
        history: [
          { id: 500, type: 'text', text: 'earlier', ts: 500 },
          { id: 999_999, type: 'text', text: 'later', ts: 999_999 },
        ],
      }]);

      act(() => handle(incoming(liveFrame({
        seq: 1,
        messageId: 'live_dm-1_9000',
        timestamp: 9_000,
      }))));

      const history = currentChats()[0].history;
      expect(history.map((m: any) => m.text || m.id)).toEqual(['earlier', 'live_dm-1_9000', 'later']);
    });

    it('renders a legacy geo frame with no live fields as a plain pin', () => {
      const { handle } = setup();
      seedChats([{ id: 'dm-1', name: 'Bob', type: 'direct', history: [] }]);

      act(() => handle(incoming({
        type: 'chat-location', seq: 1, messageId: 'geo-legacy', chatId: 'dm-1',
        chatName: 'Bob', senderName: 'Bob', lat: 1.5, lng: 2.5,
        silent: false, timestamp: 5,
      })));

      const bubble = currentChats()[0].history[0];
      expect(bubble.isLive).toBe(false);
      expect(bubble.lat).toBe(1.5);
    });

    // The closing frame of a stream. The peer that never receives it still holds
    // the deadline from the last live frame, so the bubble is expirable either
    // way; the closing frame additionally records when the share really stopped.
    it('keeps the deadline on the bubble when the closing frame arrives', () => {
      const { handle } = setup();
      seedChats([{ id: 'dm-1', name: 'Bob', type: 'direct', history: [] }]);
      const deadline = Date.now() + 60_000;

      act(() => handle(incoming(liveFrame({ seq: 1, expiresAt: deadline }))));
      act(() => handle(incoming(liveFrame({ seq: 2, live: false, expiresAt: deadline }))));

      const bubble = currentChats()[0].history[0];
      expect(bubble.isLive).toBe(false);
      expect(bubble.expiresAt).toBe(deadline);
    });
  });});
