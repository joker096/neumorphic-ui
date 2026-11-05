import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useVoiceBlobUrl } from './useVoiceBlobUrl';

const voiceStore = vi.hoisted(() => ({
  getVoiceBlob: vi.fn(),
}));

vi.mock('../lib/voiceStore', () => ({
  getVoiceBlob: voiceStore.getVoiceBlob,
}));

describe('useVoiceBlobUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    voiceStore.getVoiceBlob.mockResolvedValue(undefined);
    if (!URL.createObjectURL) (URL as any).createObjectURL = () => 'blob:mock';
    if (!URL.revokeObjectURL) (URL as any).revokeObjectURL = () => {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves a fresh object url from the persisted blob', async () => {
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    voiceStore.getVoiceBlob.mockResolvedValue(blob);
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fresh');

    const { result } = renderHook(() => useVoiceBlobUrl('v1', 'blob:dead'));

    await waitFor(() => expect(result.current).toBe('blob:fresh'));
    expect(voiceStore.getVoiceBlob).toHaveBeenCalledWith('v1');
    expect(createSpy).toHaveBeenCalledWith(blob);
  });

  it('falls back to the transient url when no blob is stored', async () => {
    const { result } = renderHook(() => useVoiceBlobUrl('v2', 'blob:live'));

    await waitFor(() => expect(voiceStore.getVoiceBlob).toHaveBeenCalledWith('v2'));
    expect(result.current).toBe('blob:live');
  });

  it('uses the transient url without touching IndexedDB when there is no voiceId', async () => {
    const { result } = renderHook(() => useVoiceBlobUrl(undefined, 'blob:live'));

    await waitFor(() => expect(result.current).toBe('blob:live'));
    expect(voiceStore.getVoiceBlob).not.toHaveBeenCalled();
  });

  it('revokes the created object url on unmount', async () => {
    voiceStore.getVoiceBlob.mockResolvedValue(new Blob(['a'], { type: 'audio/webm' }));
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fresh');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const { result, unmount } = renderHook(() => useVoiceBlobUrl('v3', 'blob:dead'));
    await waitFor(() => expect(result.current).toBe('blob:fresh'));

    unmount();
    expect(revokeSpy).toHaveBeenCalledWith('blob:fresh');
  });

  it('rebuilds fresh object url from IDB blob after reload (regression: playback/store contract)', async () => {
    const blob = new Blob(['audio after reload'], { type: 'audio/webm' });
    voiceStore.getVoiceBlob.mockResolvedValue(blob);
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:rebuilt');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const { result, unmount: firstUnmount } = renderHook(() => useVoiceBlobUrl('v_reload', undefined));
    await waitFor(() => expect(result.current).toBe('blob:rebuilt'));
    expect(voiceStore.getVoiceBlob).toHaveBeenCalledWith('v_reload');

    firstUnmount();
    expect(revokeSpy).toHaveBeenCalledWith('blob:rebuilt');
    revokeSpy.mockClear();

    const { result: result2, unmount: secondUnmount } = renderHook(() => useVoiceBlobUrl('v_reload', undefined));
    await waitFor(() => expect(result2.current).toBe('blob:rebuilt'));
    secondUnmount();
  });

  it('falls back to undefined when store returns no blob (regression: playback best-effort)', async () => {
    voiceStore.getVoiceBlob.mockResolvedValue(undefined);
    const { result } = renderHook(() => useVoiceBlobUrl('missing', undefined));
    await waitFor(() => expect(voiceStore.getVoiceBlob).toHaveBeenCalledWith('missing'));
    expect(result.current).toBeUndefined();
  });
});
