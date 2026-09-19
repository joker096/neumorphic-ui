import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { toast } from 'sonner';
import { useFileSend } from './useFileSend';
import { FTR_MAGIC, parseFrame, bytesToBase64 } from '../lib/fileTransfer/frames';
import { saveTransferMeta, saveChunk } from '../lib/fileTransfer/fileStore';
import { sha256Hex } from '../lib/fileTransfer/integrity';
import { getAttachmentLimit } from '../config/premium';
import { isAllowedFileType } from '../config/allowedFileTypes';
import { p2pNetwork } from '../lib/p2p/network';
import { useAppStore } from '../store';

vi.mock('sonner', () => ({ toast: vi.fn() }));
vi.mock('../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: any) => fallback ?? key }),
}));
vi.mock('../lib/fileTransfer/integrity', () => ({ sha256Hex: vi.fn() }));
vi.mock('../lib/fileTransfer/fileStore', () => ({
  saveTransferMeta: vi.fn().mockResolvedValue(undefined),
  saveChunk: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../config/premium', () => ({
  getAttachmentLimit: vi.fn(() => 50 * 1024 * 1024),
}));
vi.mock('../config/allowedFileTypes', () => ({ isAllowedFileType: vi.fn(() => true) }));
vi.mock('../lib/p2p/network', () => {
  const broadcast = vi.fn().mockResolvedValue(undefined);
  return {
    p2pNetwork: {
      broadcast,
      sendAddressed: vi.fn(async (_target: unknown, data: unknown) => { await broadcast(data); return false; }),
      getPeerId: () => 'peer-self',
      peerForChat: () => undefined,
      peerForChatName: () => undefined,
    },
  };
});
vi.mock('../store', () => ({
  useAppStore: {
    getState: () => ({
      premiumEntitlement: null,
      userProfile: { name: 'Me' },
    }),
  },
}));

vi.stubGlobal('crypto', { randomUUID: () => 'transfer-uuid-1' });

function setOnLine(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true, writable: true });
}

const CHAT: any = { id: 'dm-1', name: 'Bob', type: 'direct', history: [] };

function setup() {
  const state: any = {
    chats: [JSON.parse(JSON.stringify(CHAT))],
    activeChat: JSON.parse(JSON.stringify(CHAT)),
  };
  const deps: any = {
    setChats: (updater: any) => { state.chats = typeof updater === 'function' ? updater(state.chats) : updater; },
    setActiveChat: (updater: any) => { state.activeChat = typeof updater === 'function' ? updater(state.activeChat) : updater; },
  };
  const { result } = renderHook(() => useFileSend(CHAT, deps));
  return { state, result };
}

describe('useFileSend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sha256Hex).mockResolvedValue('sha-abc');
    vi.mocked(getAttachmentLimit).mockReturnValue(50 * 1024 * 1024);
    vi.mocked(isAllowedFileType).mockReturnValue(true);
  });

  afterEach(() => {
    setOnLine(true);
  });

  it('streams meta/chunk/end over broadcast, persists locally, and delivers', async () => {
    const { state, result } = setup();
    const file = new File([new Uint8Array([1, 2, 3])], 'pic.png', { type: 'image/png' });

    await act(async () => {
      await result.current.sendFile(file);
    });

    expect(sha256Hex).toHaveBeenCalledTimes(1);
    const broadcasts = vi.mocked(p2pNetwork.broadcast).mock.calls.map((call) => call[0] as string);
    expect(broadcasts).toHaveLength(3);
    const [metaFrame, chunkFrame, endFrame] = broadcasts.map((raw) => parseFrame(raw)) as any[];
    expect(metaFrame.type).toBe('meta');
    expect(metaFrame.transferId).toBe('transfer-uuid-1');
    expect(metaFrame.sha256).toBe('sha-abc');
    expect(metaFrame.totalChunks).toBe(1);
    expect(metaFrame.senderPeerId).toBe('peer-self');
    expect(metaFrame.senderName).toBe('Me');
    expect(chunkFrame.type).toBe('chunk');
    expect(chunkFrame.index).toBe(0);
    expect(chunkFrame.data).toBe(bytesToBase64(new Uint8Array([1, 2, 3])));
    expect(endFrame).toEqual({ type: 'end', transferId: 'transfer-uuid-1', seq: 3 });

    expect(vi.mocked(saveTransferMeta).mock.calls[0][0]).toEqual(expect.objectContaining({ transferId: 'transfer-uuid-1', receivedChunks: 0 }));
    expect(vi.mocked(saveTransferMeta).mock.calls.at(-1)![0]).toEqual(expect.objectContaining({ transferId: 'transfer-uuid-1', completed: true, receivedChunks: 1 }));
    expect(vi.mocked(saveChunk).mock.calls[0][0]).toBe('transfer-uuid-1');

    const last = state.activeChat.history.at(-1);
    expect(last.attachment).toBe(FTR_MAGIC + 'transfer-uuid-1');
    expect(last.fileName).toBe('pic.png');
    expect(last.type).toBe('image');
    expect(last.status).toBe('sent');
  });

  it('keeps the message queued and skips broadcast when offline', async () => {
    setOnLine(false);
    const { state, result } = setup();
    const file = new File([new Uint8Array([1])], 'a.png', { type: 'image/png' });

    await act(async () => {
      await result.current.sendFile(file);
    });

    expect(p2pNetwork.broadcast).not.toHaveBeenCalled();
    expect(vi.mocked(saveTransferMeta)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(saveTransferMeta).mock.calls[0][0]).toEqual(expect.objectContaining({ transferId: 'transfer-uuid-1', receivedChunks: 0 }));
    expect(vi.mocked(saveTransferMeta).mock.calls.at(-1)![0]).toEqual(expect.objectContaining({ transferId: 'transfer-uuid-1', completed: true, receivedChunks: 1 }));
    expect(state.activeChat.history.at(-1).status).toBe('queued');
  });

  it('toasts and drops the file over the attachment limit', async () => {
    vi.mocked(getAttachmentLimit).mockReturnValue(2);
    const { state, result } = setup();
    const file = new File([new Uint8Array([1, 2, 3])], 'big.png', { type: 'image/png' });

    await act(async () => {
      await result.current.sendFile(file);
    });

    expect(toast).toHaveBeenCalledWith({ limit: '0 MB' });
    expect(p2pNetwork.broadcast).not.toHaveBeenCalled();
    expect(state.activeChat.history).toHaveLength(0);
  });

  it('toasts and drops a disallowed file type', async () => {
    vi.mocked(isAllowedFileType).mockReturnValue(false);
    const { result } = setup();
    const file = new File([new Uint8Array([1])], 'bad.exe', { type: 'application/octet-stream' });

    await act(async () => {
      await result.current.sendFile(file);
    });

    expect(toast).toHaveBeenCalledWith('File type not allowed');
    expect(p2pNetwork.broadcast).not.toHaveBeenCalled();
  });

  it('marks the message failed and toasts when hashing fails', async () => {
    vi.mocked(sha256Hex).mockRejectedValueOnce(new Error('boom'));
    const { state, result } = setup();
    const file = new File([new Uint8Array([1])], 'err.png', { type: 'image/png' });

    await act(async () => {
      await result.current.sendFile(file);
    });

    expect(toast).toHaveBeenCalledWith('File transfer failed');
    expect(p2pNetwork.broadcast).not.toHaveBeenCalled();
    expect(vi.mocked(saveTransferMeta)).not.toHaveBeenCalled();
    expect(state.activeChat.history.at(-1).status).toBe('failed');
  });
});
