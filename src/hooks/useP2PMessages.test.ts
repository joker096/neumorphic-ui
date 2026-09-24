import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useP2PMessages } from './useP2PMessages';
import { FTR_MAGIC, encodeFrame, encodeAlbumManifest, bytesToBase64, type FtrFrame } from '../lib/fileTransfer/frames';
import { encodeChatDeliveryAck, encodeChatReadReceipt, encodeChatText, encodeChatEdit, encodeCallSignal, encodeChatAudioMeta, encodeChatAudioChunk, encodeChatAudioEnd, VOICE_P2P_MAX_SIZE } from '../lib/p2p/chatFrame';
import { saveTransferMeta, saveChunk, pruneAbandonedTransfers, pruneCompletedTransfers, enforceFileTransferBudget, canAcceptFileTransfer, listTransfers, type StoredTransfer } from '../lib/fileTransfer/fileStore';
import { p2pNetwork, type BroadcastMessage } from '../lib/p2p/network';

const mocks = vi.hoisted(() => ({
  setChats: vi.fn(),
  onMessage: vi.fn(),
  handleRemoteCallSignal: vi.fn(),
  sha256Hex: vi.fn(),
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
      rememberChatPeer: vi.fn(),
      peerForChat: () => undefined,
      peerForChatName: () => undefined,
      getPeerName: vi.fn(),
    },
  };
});
vi.mock('../store', () => ({
  useAppStore: { getState: () => ({ setChats: mocks.setChats }) },
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
    // Default: reassembled blob hash matches the declared sha256 (t-3 uses 'fff').
    vi.mocked(mocks.sha256Hex).mockResolvedValue('fff');
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

    const chats = chatsFromCalls(JSON.parse(JSON.stringify(INITIAL_CHATS)));
    const last = chats[0].history.at(-1);
    expect(last.text).toBe('hi there');
    expect(last.type).toBe('text');
    expect(vi.mocked(saveTransferMeta)).not.toHaveBeenCalled();
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

    const chats = chatsFromCalls(JSON.parse(JSON.stringify(INITIAL_CHATS)));
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

    const chats = chatsFromCalls(JSON.parse(JSON.stringify(INITIAL_CHATS)));
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

    const chats = chatsFromCalls(JSON.parse(JSON.stringify(INITIAL_CHATS)));
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

    act(() => handle(msg));

    const chats = chatsFromCalls([
      { id: 'dm-1', name: 'Bob', type: 'direct', history: [] },
      { id: 'dm-2', name: 'Bob', type: 'direct', history: [] },
    ]);
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

    act(() => handle(ack));

    const chats = chatsFromCalls([{ id: 'dm-1', name: 'Bob', type: 'direct', history: [{ id: 42, sender: 'me', text: 'hello', status: 'sent' }] }]);
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

    act(() => handle(receipt));

    const chats = chatsFromCalls([{ id: 'dm-1', name: 'Bob', type: 'direct', history: [{ id: 42, sender: 'me', text: 'hello', status: 'delivered' }] }]);
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

    const chats = chatsFromCalls(JSON.parse(JSON.stringify(INITIAL_CHATS)));
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

    const chats = chatsFromCalls(JSON.parse(JSON.stringify(INITIAL_CHATS)));
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
});
