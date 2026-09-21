import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  message?: any;
  onToggleSave?: (msg: any) => void;
  onForward?: (msg: any) => void;
  onDelete?: (msg: any) => void;
}

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-matroska': 'mkv',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/webm': 'weba',
  'audio/aac': 'aac',
  'audio/opus': 'opus',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/json': 'json',
};

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  avif: 'image/avif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  weba: 'audio/webm',
  aac: 'audio/aac',
  pdf: 'application/pdf',
  zip: 'application/zip',
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
};

const extForMime = (mime: string): string => {
  const base = String(mime || '').split(';')[0].trim().toLowerCase();
  return MIME_EXT[base] || '';
};

const mimeFromName = (name?: string): string => {
  const dot = String(name || '').lastIndexOf('.');
  if (dot <= 0) return '';
  return EXT_MIME[String(name).slice(dot + 1).toLowerCase()] || '';
};

/** Filename that always carries a recogniseable extension (fixes "save as .txt"). */
const buildFileName = (name: string | undefined, mime: string | undefined): string => {
  const base = String(name || '').trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_') || 'media';
  if (/\.[a-z0-9]{1,6}$/i.test(base)) return base;
  const ext = extForMime(mime || '') || mimeFromName(name) || (mime ? extForMime(mime) : '');
  return `${base}${ext ? `.${ext}` : ''}`;
};

const meta = (m: MediaItem): { icon: React.ReactNode } => {
  switch (m.type) {
    case 'video': return { icon: <Film size={18} /> };
    case 'document': return { icon: <FileText size={18} /> };
    case 'audio': return { icon: <Music size={18} /> };
    default: return { icon: <ImageIcon size={18} /> };
  }
};

export const MediaViewer = ({ media, onClose, isDark = false, prev, next, onPrev, onNext, total, index, message, onToggleSave, onForward, onDelete }: MediaViewerProps) => {
  useBodyScrollLock(true);
  const { t } = useI18n();
  const [scale, setScale] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(34);
  const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>(media?.type === 'photo' ? 'loading' : 'loaded');
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  type GestureMode = "idle" | "nav" | "pan" | "pinch" | "dismiss";

  const gestureRef = React.useRef<{
    mode: GestureMode;
    startX: number;
    startY: number;
    startDist: number;
    startScale: number;
    startOffset: { x: number; y: number };
    moved: boolean;
  }>({ mode: "idle", startX: 0, startY: 0, startDist: 0, startScale: 1, startOffset: { x: 0, y: 0 }, moved: false });

  const lastTapRef = React.useRef(0);
  const scaleRef = React.useRef(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  const clamp = React.useCallback((v: number, min: number, max: number) => Math.min(Math.max(v, min), max), []);

  const resetZoom = React.useCallback(() => {
    scaleRef.current = 1;
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const toggleZoom = React.useCallback(() => {
    const next = scaleRef.current > 1 ? 1 : 2.5;
    scaleRef.current = next;
    setScale(next);
    setOffset({ x: 0, y: 0 });
  }, []);

  React.useEffect(() => {
    resetZoom();
  }, [media?.url, resetZoom]);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [videoTime, setVideoTime] = React.useState(0);
  const [videoDur, setVideoDur] = React.useState(0);

  const togglePlay = React.useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, []);

  const dist = (a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) =>
    Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  const onTouchStart = (e: React.TouchEvent) => {
    const g = gestureRef.current;
    const touches = e.touches;
    if (touches.length === 2) {
      g.mode = "pinch";
      g.startDist = dist(touches[0], touches[1]);
      g.startScale = scaleRef.current;
      g.startOffset = offset;
      return;
    }
    if (touches.length === 1) {
      g.startX = touches[0].clientX;
      g.startY = touches[0].clientY;
      g.startOffset = offset;
      g.moved = false;
      g.mode = scaleRef.current > 1 ? "pan" : "nav";
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const g = gestureRef.current;
    if (g.mode === "pinch" && e.touches.length >= 2) {
      const d = dist(e.touches[0], e.touches[1]);
      if (g.startDist > 0) {
        const next = clamp(g.startScale * (d / g.startDist), 1, 5);
        scaleRef.current = next;
        setScale(next);
        setOffset(next === 1 ? { x: 0, y: 0 } : g.startOffset);
      }
      return;
    }
    if ((g.mode === "nav" || g.mode === "dismiss") && e.touches.length === 1) {
      const dx = e.touches[0].clientX - g.startX;
      const dy = e.touches[0].clientY - g.startY;
      if (Math.hypot(dx, dy) > 8) g.moved = true;
      if (!g.moved) return;
      setOffset({ x: dx, y: dy });
      if (Math.abs(dy) > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) g.mode = "dismiss";
      else if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 1.5) g.mode = "nav";
    } else if (g.mode === "pan" && e.touches.length === 1) {
      const dx = e.touches[0].clientX - g.startX;
      const dy = e.touches[0].clientY - g.startY;
      if (Math.hypot(dx, dy) > 8) g.moved = true;
      if (!g.moved) return;
      const maxX = Math.max(0, (window.innerWidth * scaleRef.current - window.innerWidth) / 2);
      const maxY = Math.max(0, (window.innerHeight * scaleRef.current - window.innerHeight) / 2);
      setOffset({
        x: clamp(g.startOffset.x + dx, -maxX, maxX),
        y: clamp(g.startOffset.y + dy, -maxY, maxY),
      });
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const g = gestureRef.current;
    const t0 = e.changedTouches[0] ?? e.touches[0];
    if (!t0) {
      g.mode = "idle";
      return;
    }
    const dx = t0.clientX - g.startX;
    const dy = t0.clientY - g.startY;
    const now = Date.now();
    const isTap = !g.moved && Math.hypot(dx, dy) < 12;

    if (g.mode === "pinch") {
      if (scaleRef.current === 1) setOffset({ x: 0, y: 0 });
      g.mode = "idle";
      return;
    }

    if (isTap) {
      g.mode = "idle";
      if (media.type === "photo") {
        if (now - lastTapRef.current < 300) {
          lastTapRef.current = 0;
          toggleZoom();
        } else {
          lastTapRef.current = now;
        }
      } else {
        lastTapRef.current = now;
      }
      return;
    }

    const prevMode = g.mode;
    g.mode = "idle";
    if (prevMode === "pan" || scaleRef.current > 1) {
      setOffset((p) => ({ ...p }));
      return;
    }
    setOffset({ x: 0, y: 0 });
    const wasDismiss = prevMode === "dismiss";
    if (wasDismiss && dy > 80) {
      onClose();
    } else if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) onNext?.();
      else onPrev?.();
    } else if (Math.abs(dy) > 110 && Math.abs(dy) > Math.abs(dx) * 1.5) {
      onClose();
    }
  };

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

  const downloadMedia = React.useCallback(async (item: MediaItem) => {
    const url = item.url;
    if (!url) {
      toast(t("media.downloadFailed", "Download failed"), "error");
      return;
    }
    const preferredName = buildFileName(item.name || message?.fileName, message?.mime || mimeFromName(item.name));
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const mime = blob.type || message?.mime || mimeFromName(preferredName) || "application/octet-stream";
      const objUrl = URL.createObjectURL(new Blob([blob], { type: mime }));
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = buildFileName(preferredName, mime);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(objUrl), 0);
    } catch {
      // Cross-origin / non-fetchable URL (e.g. external photo): plain anchor fallback.
      const a = document.createElement("a");
      a.href = url;
      a.download = preferredName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }, [t, message?.fileName, message?.mime]);

  const shareMedia = React.useCallback(async (item: MediaItem) => {
    const url = item.url;
    if (!url) {
      toast(t("media.downloadFailed", "Download failed"), "error");
      return;
    }
    const name = buildFileName(item.name || message?.fileName, message?.mime || mimeFromName(item.name));
    if (typeof navigator.share !== "function") {
      // No Web Share API (unsupported/desktop in dev): export instead of pretending.
      if (/^https?:/i.test(url)) {
        try {
          await navigator.clipboard.writeText(url);
          toast(t("media.shareCopied", "Link copied"), "success");
        } catch {
          await downloadMedia(item);
        }
      } else {
        await downloadMedia(item);
      }
      return;
    }
    try {
      let files: File[] | undefined;
      if (typeof navigator.canShare === "function") {
        try {
          const blob = await (await fetch(url)).blob();
          const mime = blob.type || message?.mime || mimeFromName(name) || "application/octet-stream";
          const file = new File([blob], name || "media", { type: mime });
          if (navigator.canShare({ files: [file] })) files = [file];
        } catch {
          /* fetch failed — fall back to text share below */
        }
      }
      if (files && files.length > 0) {
        await navigator.share({ files, title: name || t("media.photo") });
      } else {
        await navigator.share({
          title: name || item.caption || t("media.photo"),
          text: item.caption || "",
          url: /^https?:/i.test(url) ? url : undefined,
        });
      }
      toast(t("media.shared", "Shared"), "success");
    } catch (e) {
      if ((e as any)?.name === "AbortError" || (e as any)?.name === "NotAllowedError") return;
      toast(t("media.shareFailed", "Share failed"), "error");
    }
  }, [t, message?.fileName, message?.mime, downloadMedia]);

  const handleSave = () => {
    if (!message) return;
    onToggleSave?.(message);
    toast(t("media.saved", "Saved to collection"), "success");
  };

  const handleForward = () => {
    if (!message || !onForward) return;
    onForward(message);
    onClose();
  };

  const handleDelete = () => {
    if (!message || !onDelete) return;
    onDelete(message);
    onClose();
  };

  if (!media) return null;
  const m = meta(media);
  const typeLabel = media.type === 'video' ? t('media.video') : media.type === 'document' ? t('media.document') : media.type === 'audio' ? t('media.audio') : t('media.photo');

  const zoom = React.useCallback((dir: 1 | -1) => {
    const next = clamp(scaleRef.current + dir * 0.5, 0.5, 4);
    scaleRef.current = next;
    setScale(next);
    if (next === 1) setOffset({ x: 0, y: 0 });
  }, [clamp]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowLeft') { onPrev?.(); return; }
      if (e.key === 'ArrowRight') { onNext?.(); return; }
      if (e.key === '+' || e.key === '=') { zoom(1); return; }
      if (e.key === '-' || e.key === '_') { zoom(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext, zoom]);

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
        <div className="absolute bottom-0 w-full p-4 flex items-center justify-center gap-3 z-10 bg-gradient-to-t from-black/70 to-transparent" onClick={(e) => e.stopPropagation()}>
          {onToggleSave && message && (
            <ActionButton icon={<Bookmark size={18} />} label={t('media.save')} onClick={handleSave} />
          )}
          <ActionButton icon={<Share2 size={18} />} label={t('media.share')} onClick={() => void shareMedia(media)} />
          {onForward && message && (
            <ActionButton icon={<Forward size={18} />} label={t('media.forward')} onClick={handleForward} />
          )}
          <ActionButton icon={<Download size={18} />} label={t('media.download')} onClick={() => void downloadMedia(media)} />
          {onDelete && message && (
            <ActionButton icon={<Trash2 size={18} />} label={t('media.delete')} danger onClick={handleDelete} />
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
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
