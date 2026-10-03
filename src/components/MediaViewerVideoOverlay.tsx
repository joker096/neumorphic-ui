import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, PictureInPicture2 } from 'lucide-react';
import { formatTime } from './mediaUtils';
import type { MediaItem } from './mediaUtils';

type TranslateFn = (key: string, fallback?: string | Record<string, string | number>) => string;

interface MediaViewerVideoOverlayProps {
  media: MediaItem;
  t: TranslateFn;
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
}

export function MediaViewerVideoOverlay({ media, t, playing, onPlayingChange }: MediaViewerVideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDur, setVideoDur] = useState(0);
  const [pipActive, setPipActive] = useState(false);
  const [pipSupported] = useState(
    () => typeof document !== 'undefined' && 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled,
  );

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => onPlayingChange(false));
    else v.pause();
  }, [onPlayingChange]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !pipSupported) return;
    const onEnter = () => setPipActive(true);
    const onLeave = () => setPipActive(false);
    v.addEventListener('enterpictureinpicture', onEnter);
    v.addEventListener('leavepictureinpicture', onLeave);
    return () => {
      v.removeEventListener('enterpictureinpicture', onEnter);
      v.removeEventListener('leavepictureinpicture', onLeave);
    };
  }, [pipSupported, media.url]);

  const togglePip = useCallback(() => {
    const v = videoRef.current;
    if (!v || typeof document === 'undefined') return;
    if (pipActive) void document.exitPictureInPicture?.().catch(() => {});
    else void v.requestPictureInPicture?.().catch(() => {});
  }, [pipActive]);

  return (
    <div className="w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden relative flex items-center justify-center shadow-2xl">
      {media.url ? (
        <video
          ref={videoRef}
          src={media.url}
          className="w-full h-full object-contain"
          controls={false}
          onClick={togglePlay}
          onPlay={() => onPlayingChange(true)}
          onPause={() => onPlayingChange(false)}
          onTimeUpdate={(e) => setVideoTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setVideoDur(e.currentTarget.duration || 0)}
          aria-label={media.name || t('media.video')}
        />
      ) : (
        <div className="text-white/40 text-sm">{t('ui.videoPreview')}</div>
      )}
      <button
        onClick={togglePlay}
        className="absolute w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white"
        aria-label={t('media.play')}
      >
        {playing ? <Pause size={32} /> : <Play size={32} />}
      </button>
      {media.url && videoDur > 0 && (
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-9 h-9 min-w-11 min-h-11 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white"
            aria-label={t('media.play')}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <span className="text-white/70 text-xs tabular-nums">{formatTime(videoTime)}</span>
          <input
            type="range"
            min={0}
            max={Math.round(videoDur) || 1}
            step={0.1}
            value={videoTime}
            onChange={(e) => {
              const next = Number(e.target.value);
              setVideoTime(next);
              if (videoRef.current) videoRef.current.currentTime = next;
            }}
            className="flex-1 accent-[var(--accent)]"
            aria-label={t('media.seek')}
          />
          <span className="text-white/70 text-xs tabular-nums">{formatTime(videoDur)}</span>
          {pipSupported && (
            <button
              onClick={togglePip}
              aria-label={t('media.pictureInPicture')}
              aria-pressed={pipActive}
              className="w-9 h-9 min-w-11 min-h-11 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white"
            >
              <PictureInPicture2 size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}