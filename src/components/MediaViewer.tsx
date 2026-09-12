import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, Download, Share2, Forward, Trash2, Bookmark, Play, Pause, FileText, Music, Film, Image as ImageIcon, ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { CloseButton } from './ui/CloseButton';
import { toast } from './ui/Toast';
import { useBodyScrollLock } from '../lib/a11y';

export type MediaKind = 'photo' | 'video' | 'document' | 'audio';

export interface MediaItem {
  type: MediaKind;
  url?: string;
  name?: string;
  caption?: string;
  size?: string;
}

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
}

const meta = (m: MediaItem): { icon: React.ReactNode } => {
  switch (m.type) {
    case 'video': return { icon: <Film size={18} /> };
    case 'document': return { icon: <FileText size={18} /> };
    case 'audio': return { icon: <Music size={18} /> };
    default: return { icon: <ImageIcon size={18} /> };
  }
};

export const MediaViewer = ({ media, onClose, isDark = false, prev, next, onPrev, onNext, total, index }: MediaViewerProps) => {
  useBodyScrollLock(true);
  const { t } = useI18n();
  const [scale, setScale] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(34);
  const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>(media?.type === 'photo' ? 'loading' : 'loaded');
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const touchStart = React.useRef<{ x: number; y: number } | null>(null);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [videoTime, setVideoTime] = React.useState(0);
  const [videoDur, setVideoDur] = React.useState(0);

  const togglePlay = React.useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || !e.changedTouches[0]) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5 || scale !== 1) return;
    if (dx < 0) onNext?.();
    else onPrev?.();
  };

  React.useEffect(() => {
    setImgStatus(media?.type === 'photo' ? 'loading' : 'loaded');
  }, [media]);

  React.useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowLeft') { onPrev?.(); return; }
      if (e.key === 'ArrowRight') { onNext?.(); return; }
      if (e.key === '+' || e.key === '=') { setScale(s => Math.min(4, s + 0.5)); return; }
      if (e.key === '-' || e.key === '_') { setScale(s => Math.max(0.5, s - 0.5)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else containerRef.current?.requestFullscreen().catch(() => {});
  };

  const downloadMedia = React.useCallback((item: MediaItem) => {
    const url = item.url;
    if (!url) {
      toast(t("media.downloadFailed", "Download failed"), "error");
      return;
    }
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = item.name || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      toast(t("media.downloadFailed", "Download failed"), "error");
    }
  }, [t]);

  if (!media) return null;
  const m = meta(media);
  const typeLabel = media.type === 'video' ? t('media.video') : media.type === 'document' ? t('media.document') : media.type === 'audio' ? t('media.audio') : t('media.photo');

  const zoom = (dir: 1 | -1) => setScale(s => Math.min(4, Math.max(0.5, s + dir * 0.5)));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        ref={containerRef}
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/92 backdrop-blur-xl touch-none"
        onTouchStart={onTouchStart}
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
            <button onClick={(e) => { e.stopPropagation(); setScale(1); }} aria-label={t('media.resetZoom')} className="w-10 h-10 min-w-11 min-h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
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

        <div className="w-full h-full flex items-center justify-center p-8" onClick={(e) => e.stopPropagation()}>
           {media.type === 'photo' && (
             <div className="relative flex items-center justify-center">
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
                   src={media.url}
                   alt={media.name || t('media.photo')}
                   animate={{ scale }}
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
            <div className="w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden relative flex items-center justify-center shadow-2xl">
              {media.url ? (
                <video
                  ref={videoRef}
                  src={media.url}
                  className="w-full h-full object-contain"
                  controls={false}
                  onClick={togglePlay}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
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
                </div>
              )}
            </div>
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
              <button onClick={() => downloadMedia(media)} aria-label={t('media.downloadDoc', 'Download')} title={t('media.downloadDoc', 'Download')} className="flex items-center justify-center w-9 h-9 min-w-11 min-h-11 rounded-lg bg-[var(--accent)] text-white">
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

        {/* Bottom actions */}
        <div className="absolute bottom-0 w-full p-4 flex items-center justify-center gap-3 z-10 bg-gradient-to-t from-black/70 to-transparent">
          <ActionButton icon={<Bookmark size={18} />} label={t('media.save')} onClick={() => toast(t('media.saved', 'Saved to collection'), 'success')} />
          <ActionButton icon={<Share2 size={18} />} label={t('media.share')} onClick={() => toast(t('media.shared', 'Shared'), 'info')} />
          <ActionButton icon={<Forward size={18} />} label={t('media.forward')} onClick={() => toast(t('media.forwarded', 'Forwarded'), 'info')} />
          <ActionButton icon={<Download size={18} />} label={t('media.download')} onClick={() => downloadMedia(media)} />
          <ActionButton icon={<Trash2 size={18} />} label={t('media.delete')} danger onClick={() => { toast(t('media.deleted', 'Deleted'), 'success'); onClose(); }} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const formatTime = (s: number): string => {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
};

const ActionButton = ({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors active:scale-95 min-h-11 min-w-[56px] ${danger ? 'hover:text-rose-300' : ''}`}
  >
    {icon}
    <span className="text-xs">{label}</span>
  </button>
);
