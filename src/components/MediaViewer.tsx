import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ZoomIn, ZoomOut, Maximize, Minimize, ChevronLeft, ChevronRight, FileText, Music, Image as ImageIcon, Play, Pause, Download } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { CloseButton } from './ui/CloseButton';
import { useBodyScrollLock } from '../lib/a11y';
import type { MediaItem } from './mediaUtils';
import { meta, downloadMedia, shareMedia } from './mediaUtils';
import { MediaViewerActionBar } from './MediaViewerActionBar';
import { MediaViewerVideoOverlay } from './MediaViewerVideoOverlay';
import { useMediaViewerGestures } from './useMediaViewerGestures';

export type { MediaKind, MediaItem } from './mediaUtils';

interface MediaViewerProps {
  media: MediaItem | null;
  onClose: () => void;
  isDark?: boolean;
  prev?: MediaItem | null;
  next?: MediaItem | null;
  onPrev?: () => void;
  onNext?: () => void;
  total?: number;
  index?: number;
  message?: any;
  onToggleSave?: (msg: any) => void;
  onForward?: (msg: any) => void;
  onDelete?: (msg: any) => void;
}

export const MediaViewer = ({ media, onClose, isDark = false, prev, next, onPrev, onNext, total, index, message, onToggleSave, onForward, onDelete }: MediaViewerProps) => {
  useBodyScrollLock(true);
  const { t } = useI18n();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(34);
  const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>(media?.type === 'photo' ? 'loading' : 'loaded');
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const { scale, offset, resetZoom, toggleZoom, zoom, onTouchStart, onTouchMove, onTouchEnd } = useMediaViewerGestures({
    isPhoto: media?.type === 'photo',
    onClose,
    onPrev,
    onNext,
  });

  React.useEffect(() => {
    resetZoom();
  }, [media?.url, resetZoom]);

  React.useEffect(() => {
    if (media?.type !== 'photo') {
      setImgStatus('loaded');
      return;
    }
    if (!media?.url) {
      setImgStatus('error');
      return;
    }
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setImgStatus('loaded');
    } else {
      setImgStatus('loading');
    }
  }, [media?.url, media?.type]);

  React.useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else containerRef.current?.requestFullscreen().catch(() => {});
  };

  React.useEffect(() => {
    if (!media) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowLeft') { onPrev?.(); return; }
      if (e.key === 'ArrowRight') { onNext?.(); return; }
      if (e.key === '+' || e.key === '=') { zoom(1); return; }
      if (e.key === '-' || e.key === '_') { zoom(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext, zoom, media]);

  if (!media) return null;
  const m = meta(media);
  const typeLabel = media.type === 'video' ? t('media.video') : media.type === 'document' ? t('media.document') : media.type === 'audio' ? t('media.audio') : t('media.photo');

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        ref={containerRef}
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/92 backdrop-blur-xl touch-none"
        data-zoom={scale.toFixed(1)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Top toolbar */}
        <div className="absolute top-0 w-full p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            {m.icon} {media.name || typeLabel}
            {media.size && <span className="text-white/50 text-xs">{media.size}</span>}
          </div>
          <div className="flex gap-2">
            {(prev || next) && (
              <>
                <button onClick={(e) => { e.stopPropagation(); onPrev?.(); }} disabled={!prev} aria-label={t('media.prev')} title={t('media.prev')} className="w-10 h-10 min-w-11 min-h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-30">
                  <ChevronLeft size={18} />
                  <span className="sr-only">{t('media.prev')}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} disabled={!next} aria-label={t('media.next')} title={t('media.next')} className="w-10 h-10 min-w-11 min-h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-30">
                  <ChevronRight size={18} />
                  <span className="sr-only">{t('media.next')}</span>
                </button>
              </>
            )}
            <button onClick={(e) => { e.stopPropagation(); resetZoom(); }} aria-label={t('media.resetZoom')} className="w-10 h-10 min-w-11 min-h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
              <ZoomOut size={18} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); zoom(1); }} aria-label={t('media.zoomIn')} className="w-10 h-10 min-w-11 min-h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
              <ZoomIn size={18} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} aria-label={t('media.fullscreen', 'Fullscreen')} title={t('media.fullscreen', 'Fullscreen')} className="w-10 h-10 min-w-11 min-h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
            <CloseButton onClick={onClose} aria-label={t('common.close')} size="lg" className="!text-white hover:!bg-white/20" />
          </div>
        </div>

        <div
          className="w-full h-full flex items-center justify-center p-8"
          style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
          onClick={(e) => e.stopPropagation()}
        >
           {media.type === 'photo' && (
             <div className="relative flex items-center justify-center" onDoubleClick={(e) => { e.stopPropagation(); if (media.type === 'photo') toggleZoom(); }}>
               {imgStatus === 'loading' && (
                 <div className="absolute inset-0 flex items-center justify-center">
                   <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 </div>
               )}
               {imgStatus === 'error' ? (
                 <div className="text-white/60 text-sm flex flex-col items-center gap-2">
                   <ImageIcon size={48} />
                   <span>{t('media.loadError', 'Failed to load')}</span>
                 </div>
               ) : (
<motion.img
                     ref={imgRef}
                     src={media.url}
                     alt={media.name || t('media.photo')}
                    animate={{ scale, x: scale > 1 ? offset.x : 0, y: scale > 1 ? offset.y : 0 }}
                   transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                   onLoad={() => setImgStatus('loaded')}
                   onError={() => setImgStatus('error')}
                   className={`max-w-full max-h-[82vh] object-contain rounded-lg shadow-[0_0_60px_rgba(0,0,0,0.8)] select-none ${imgStatus === 'loading' ? 'opacity-0' : 'opacity-100'} transition-opacity`}
                   onContextMenu={(e) => e.preventDefault()}
                   draggable={false}
                 />
               )}
             </div>
           )}

          {media.type === 'video' && (
            <MediaViewerVideoOverlay media={media} t={t} playing={playing} onPlayingChange={setPlaying} />
          )}

          {media.type === 'document' && (
            <div className="w-full max-w-md rounded-xl bg-white/10 backdrop-blur p-8 flex flex-col items-center gap-4 text-white">
              <FileText size={48} className="text-white/80" />
              <div className="text-center">
                <div className="font-semibold">{media.name || t('media.document')}</div>
                {media.size && <div className="text-white/50 text-sm mt-1">{media.size}</div>}
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-[var(--accent)]" style={{ width: `${progress}%` }} />
              </div>
              <button onClick={() => void downloadMedia(media, t, message)} aria-label={t('media.downloadDoc', 'Download')} title={t('media.downloadDoc', 'Download')} className="flex items-center justify-center w-9 h-9 min-w-11 min-h-11 rounded-lg bg-[var(--accent)] text-white">
                <Download size={18} />
                <span className="sr-only">{t('media.downloadDoc', 'Download')}</span>
              </button>
            </div>
          )}

          {media.type === 'audio' && (
            <div className="w-full max-w-md rounded-xl bg-white/10 backdrop-blur p-6 flex flex-col gap-4 text-white">
              <div className="flex items-center gap-3">
                <Music size={32} className="text-white/80" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{media.name || t('media.audioMessage')}</div>
                  <div className="text-white/50 text-xs">{media.size || '0:42'}</div>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-[var(--accent)]" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setPlaying(v => !v)} className="w-9 h-9 min-w-11 min-h-11 rounded-full bg-[var(--accent)] flex items-center justify-center text-white" aria-label={t('media.play')}>
                  {playing ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))} className="flex-1 accent-[var(--accent)]" aria-label={t('media.seek')} />
              </div>
            </div>
          )}
        </div>

        {media.caption && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-[80%] text-center text-white/80 text-sm z-10">{media.caption}</div>
        )}

        {typeof total === 'number' && total > 1 && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/40 text-white/80 text-xs z-10 tabular-nums" aria-label={t('media.position')}>
            {((index ?? 0) + 1)} / {total}
          </div>
        )}

        <MediaViewerActionBar
          t={t}
          message={message}
          onClose={onClose}
          onToggleSave={onToggleSave}
          onForward={onForward}
          onDelete={onDelete}
          onShare={() => void shareMedia(media, t, message)}
          onDownload={() => void downloadMedia(media, t, message)}
        />
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};