import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createRef } from 'react';
import { useAutoPictureInPicture } from './useAutoPictureInPicture';

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

function makePlayingVideo() {
  const video = document.createElement('video');
  Object.defineProperty(video, 'paused', { value: false, configurable: true });
  Object.defineProperty(video, 'ended', { value: false, configurable: true });
  Object.defineProperty(video, 'readyState', { value: 4, configurable: true });
  const reqPip = vi.fn(() => Promise.resolve());
  (video as unknown as { requestPictureInPicture: unknown }).requestPictureInPicture = reqPip;
  return { video, reqPip };
}

describe('useAutoPictureInPicture', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'pictureInPictureEnabled', { value: true, configurable: true });
    setVisibility('visible');
  });

  afterEach(() => {
    setVisibility('visible');
  });

  it('requests PiP when the page is hidden while the video plays', () => {
    const { video, reqPip } = makePlayingVideo();
    const ref = createRef<HTMLVideoElement | null>();
    (ref as { current: HTMLVideoElement | null }).current = video;
    renderHook(() => useAutoPictureInPicture(ref, true));
    act(() => setVisibility('hidden'));
    expect(reqPip).toHaveBeenCalledTimes(1);
  });

  it('does nothing while the video is paused', () => {
    const { video, reqPip } = makePlayingVideo();
    Object.defineProperty(video, 'paused', { value: true, configurable: true });
    const ref = createRef<HTMLVideoElement | null>();
    (ref as { current: HTMLVideoElement | null }).current = video;
    renderHook(() => useAutoPictureInPicture(ref, true));
    act(() => setVisibility('hidden'));
    expect(reqPip).not.toHaveBeenCalled();
  });

  it('does nothing while the document is still visible', () => {
    const { video, reqPip } = makePlayingVideo();
    const ref = createRef<HTMLVideoElement | null>();
    (ref as { current: HTMLVideoElement | null }).current = video;
    renderHook(() => useAutoPictureInPicture(ref, true));
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(reqPip).not.toHaveBeenCalled();
  });

  it('stays inert when disabled', () => {
    const { video, reqPip } = makePlayingVideo();
    const ref = createRef<HTMLVideoElement | null>();
    (ref as { current: HTMLVideoElement | null }).current = video;
    renderHook(() => useAutoPictureInPicture(ref, false));
    act(() => setVisibility('hidden'));
    expect(reqPip).not.toHaveBeenCalled();
  });

  it('stops reacting after unmount', () => {
    const { video, reqPip } = makePlayingVideo();
    const ref = createRef<HTMLVideoElement | null>();
    (ref as { current: HTMLVideoElement | null }).current = video;
    const { unmount } = renderHook(() => useAutoPictureInPicture(ref, true));
    unmount();
    act(() => setVisibility('hidden'));
    expect(reqPip).not.toHaveBeenCalled();
  });
});
