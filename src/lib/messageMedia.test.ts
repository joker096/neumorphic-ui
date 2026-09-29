import { describe, it, expect, vi, beforeEach } from 'vitest';
import { releaseMessageMedia } from './messageMedia';
import { deleteVoiceBlob } from './voiceStore';
import { deleteTransfer } from './fileTransfer/fileStore';

vi.mock('./voiceStore', () => ({ deleteVoiceBlob: vi.fn().mockResolvedValue(undefined) }));
vi.mock('./fileTransfer/fileStore', () => ({ deleteTransfer: vi.fn().mockResolvedValue(undefined) }));

// Installed once for the file: `restoreAllMocks` in a per-test hook would drop
// the spy back to the jsdom implementation after the first case.
const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

describe('releaseMessageMedia', () => {
  beforeEach(() => {
    vi.mocked(deleteVoiceBlob).mockReset().mockResolvedValue(undefined);
    vi.mocked(deleteTransfer).mockReset().mockResolvedValue(undefined);
    revoke.mockClear();
  });

  it('no-ops on empty input and never touches the stores', async () => {
    await releaseMessageMedia(undefined);
    await releaseMessageMedia([]);
    expect(deleteVoiceBlob).not.toHaveBeenCalled();
    expect(deleteTransfer).not.toHaveBeenCalled();
  });

  it('erases the voice blob and revokes the live object URL', async () => {
    await releaseMessageMedia([
      { id: 'm1', type: 'audio', voiceId: 'v1', audioUrl: 'blob:http://x/abc' },
    ]);
    expect(deleteVoiceBlob).toHaveBeenCalledWith('v1');
    expect(revoke).toHaveBeenCalledWith('blob:http://x/abc');
  });

  it('falls back to the message id for voice blobs that carry no voiceId', async () => {
    await releaseMessageMedia([{ id: 'm2', type: 'audio' }]);
    expect(deleteVoiceBlob).toHaveBeenCalledWith('m2');
  });

  it('erases a file transfer from the id field and from an inline ftr1: attachment', async () => {
    await releaseMessageMedia([
      { id: 'f1', fileTransferId: 'direct-id' },
      { id: 'f2', attachment: 'ftr1:from-attach' },
    ]);
    expect(deleteTransfer).toHaveBeenCalledWith('direct-id');
    expect(deleteTransfer).toHaveBeenCalledWith('from-attach');
  });

  it('erases every album entry of an album message', async () => {
    await releaseMessageMedia([
      { id: 'a1', album: [{ url: 'ftr1:one' }, { url: 'ftr1:two' }, { url: 'https://cdn/x.jpg' }] },
    ]);
    expect(deleteTransfer).toHaveBeenCalledWith('one');
    expect(deleteTransfer).toHaveBeenCalledWith('two');
    expect(deleteTransfer).toHaveBeenCalledTimes(2);
  });

  it('de-dupes repeated ids across a batch', async () => {
    await releaseMessageMedia([
      { id: 'm3', type: 'audio', voiceId: 'same' },
      { id: 'm4', type: 'audio', voiceId: 'same' },
      { id: 'f3', fileTransferId: 'dup' },
      { id: 'f4', attachment: 'ftr1:dup' },
    ]);
    expect(deleteVoiceBlob).toHaveBeenCalledTimes(1);
    expect(deleteTransfer).toHaveBeenCalledTimes(1);
  });

  it('never revokes a non-blob URL', async () => {
    await releaseMessageMedia([{ id: 'r1', audioUrl: 'https://cdn/voice.webm' }]);
    expect(revoke).not.toHaveBeenCalled();
  });

  it('revokes the object URL even when the store delete rejects', async () => {
    vi.mocked(deleteVoiceBlob).mockRejectedValueOnce(new Error('idb down'));
    await expect(
      releaseMessageMedia([{ id: 'm5', type: 'audio', voiceId: 'v5', audioUrl: 'blob:http://x/gone' }]),
    ).resolves.toBeUndefined();
    expect(revoke).toHaveBeenCalledWith('blob:http://x/gone');
  });

  it('revokes every batch URL and keeps erasing after one failure', async () => {
    vi.mocked(deleteTransfer).mockRejectedValueOnce(new Error('boom'));
    await releaseMessageMedia([
      { id: 'm6', voiceId: 'v6', audioUrl: 'blob:http://x/1' },
      { id: 'm7', fileTransferId: 'bad' },
      { id: 'm8', fileTransferId: 'good' },
    ]);
    expect(deleteTransfer).toHaveBeenCalledWith('bad');
    expect(deleteTransfer).toHaveBeenCalledWith('good');
    expect(revoke).toHaveBeenCalledWith('blob:http://x/1');
  });
});
