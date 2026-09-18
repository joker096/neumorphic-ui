import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveVoiceBlob, getVoiceBlob, deleteVoiceBlob, persistVoiceBlob } from './voiceStore';

const store = vi.hoisted(() => new Map<string, unknown>());

vi.mock('./idb', () => ({
  set: vi.fn(async (k: string, v: unknown) => { store.set(k, v); }),
  get: vi.fn(async (k: string) => store.get(k)),
  del: vi.fn(async (k: string) => { store.delete(k); }),
}));

describe('voiceStore', () => {
  beforeEach(() => {
    store.clear();
    vi.restoreAllMocks();
  });

  it('saves and reads a voice blob by id', async () => {
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    await saveVoiceBlob('m1', blob);

    expect(await getVoiceBlob('m1')).toBe(blob);
  });

  it('returns undefined for a missing or non-blob entry', async () => {
    expect(await getVoiceBlob('missing')).toBeUndefined();

    store.set('voice_blob_broken', 'not-a-blob');
    expect(await getVoiceBlob('broken')).toBeUndefined();
  });

  it('deletes a stored voice blob', async () => {
    await saveVoiceBlob('m2', new Blob(['audio'], { type: 'audio/webm' }));
    await deleteVoiceBlob('m2');

    expect(await getVoiceBlob('m2')).toBeUndefined();
  });

  it('persists a live blob directly', async () => {
    const blob = new Blob(['recorded'], { type: 'audio/webm' });
    const fetchSpy = vi.spyOn(window, 'fetch');

    await persistVoiceBlob('m3', blob);

    expect(await getVoiceBlob('m3')).toBe(blob);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('persists a recorded object url through fetch (legacy path)', async () => {
    const blob = new Blob(['recorded'], { type: 'audio/webm' });
    vi.spyOn(window, 'fetch').mockResolvedValue({ ok: true, blob: vi.fn().mockResolvedValue(blob) } as any);

    await persistVoiceBlob('m3', 'blob:http://localhost/live');

    expect(await getVoiceBlob('m3')).toBe(blob);
  });

  it('ignores failed fetches, empty blobs and empty sources', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue({ ok: false } as any);
    await persistVoiceBlob('m4', 'blob:http://localhost/dead');
    expect(await getVoiceBlob('m4')).toBeUndefined();

    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob([], { type: 'audio/webm' })),
    } as any);
    await persistVoiceBlob('m5', 'blob:http://localhost/empty');
    expect(await getVoiceBlob('m5')).toBeUndefined();

    await persistVoiceBlob('m6', '');
    expect(await getVoiceBlob('m6')).toBeUndefined();
  });

  it('swallows thrown fetch errors', async () => {
    vi.spyOn(window, 'fetch').mockRejectedValue(new Error('network down'));

    await expect(persistVoiceBlob('m6', 'blob:http://localhost/x')).resolves.toBeUndefined();
  });
});
