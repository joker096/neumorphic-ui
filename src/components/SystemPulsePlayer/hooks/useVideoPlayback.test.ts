import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useVideoPlayback } from './useVideoPlayback';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe('useVideoPlayback blob URL ownership', () => {
  const created: string[] = [];
  const revoked: string[] = [];
  let realCreate: typeof URL.createObjectURL;
  let realRevoke: typeof URL.revokeObjectURL;

  beforeEach(() => {
    created.length = 0;
    revoked.length = 0;
    realCreate = URL.createObjectURL;
    realRevoke = URL.revokeObjectURL;
    URL.createObjectURL = (() => {
      const url = `blob:vid-${created.length}`;
      created.push(url);
      return url;
    }) as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = ((url: string) => {
      revoked.push(url);
    }) as unknown as typeof URL.revokeObjectURL;
  });

  afterEach(() => {
    URL.createObjectURL = realCreate;
    URL.revokeObjectURL = realRevoke;
  });

  it('revokes the previous URL when a new one is opened', () => {
    const { result } = renderHook(() => useVideoPlayback());

    act(() => { result.current.openVideoUrl(new Blob(['a'])); });
    act(() => { result.current.openVideoUrl(new Blob(['b'])); });

    expect(created).toEqual(['blob:vid-0', 'blob:vid-1']);
    // the outgoing one is released immediately, not only at unmount
    expect(revoked).toEqual(['blob:vid-0']);
    expect(result.current.videoUrl).toBe('blob:vid-1');
    expect(result.current.showVideo).toBe(true);
    expect(result.current.isVideoPlaying).toBe(true);
  });

  it('revokes the current URL on close', () => {
    const { result } = renderHook(() => useVideoPlayback());
    act(() => { result.current.openVideoUrl(new Blob(['a'])); });
    act(() => { result.current.closeVideo(); });

    expect(revoked).toEqual(['blob:vid-0']);
    expect(result.current.videoUrl).toBeNull();
    expect(result.current.showVideo).toBe(false);
  });

  it('revokes every URL it minted on unmount', () => {
    const { result, unmount } = renderHook(() => useVideoPlayback());
    act(() => { result.current.openVideoUrl(new Blob(['a'])); });
    act(() => { result.current.openVideoUrl(new Blob(['b'])); });
    act(() => { result.current.openVideoUrl(new Blob(['c'])); });
    // both superseded URLs are released as they are replaced
    expect(revoked).toEqual(['blob:vid-0', 'blob:vid-1']);

    unmount();

    // no URL is left holding its blob after the player goes away
    expect(new Set(revoked)).toEqual(new Set(created));
  });

  it('never mints a URL when a non-video file is selected', () => {
    const { result } = renderHook(() => useVideoPlayback());
    const input = document.createElement('input');
    const file = new File(['x'], 'notes.txt', { type: 'text/plain' });
    Object.defineProperty(input, 'files', { value: [file] });

    act(() => { result.current.handleVideoFileSelect({ target: input } as unknown as React.ChangeEvent<HTMLInputElement>); });

    expect(created).toEqual([]);
    expect(result.current.videoUrl).toBeNull();
  });
});
