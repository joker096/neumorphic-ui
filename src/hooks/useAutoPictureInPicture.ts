import { useEffect, type RefObject } from 'react';

/**
 * Auto-enter Picture-in-Picture when the page is hidden while the video is
 * still playing — the «keep watching in a corner while doing something else»
 * behavior Play asks for (Home button / tab switch mid-playback).
 *
 * Gated by `enabled` (the caller's `document.pictureInPictureEnabled` check);
 * rejections (no user gesture, audio-only, metadata not loaded) are swallowed —
 * Chrome may also auto-PiP on its own, and a failed request must never throw
 * into the visibilitychange handler.
 */
export function useAutoPictureInPicture(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return undefined;
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return;
      if (document.pictureInPictureElement) return;
      const video = videoRef.current;
      if (!video || video.paused || video.ended || video.readyState < 1) return;
      void video.requestPictureInPicture?.().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [videoRef, enabled]);
}
