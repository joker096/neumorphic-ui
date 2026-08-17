import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, Download, Share2, Forward, Trash2, Bookmark, Play, Pause, FileText, Music, Film, Image as ImageIcon } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { CloseButton } from './ui/CloseButton';
import { toast } from './ui/Toast';

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
}

const meta = (m: MediaItem): { icon: React.ReactNode; label: string } => {
  switch (m.type) {
    case 'video': return { icon: <Film size={18} />, label: 'Video' };
    case 'document': return { icon: <FileText size={18} />, label: 'Document' };
    case 'audio': return { icon: <Music size={18} />, label: 'Audio' };
    default: return { icon: <ImageIcon size={18} />, label: 'Photo' };
  }
};

export const MediaViewer = ({ media, onClose, isDark = false, prev, next, onPrev, onNext }: MediaViewerProps) => {
  const { t } = useI18n();
  const [scale, setScale] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(34);

  if (!media) return null;
  const m = meta(media);

  const zoom = (dir: 1 | -1) => setScale(s => Math.min(4, Math.max(0.5, s + dir * 0.5)));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/92 backdrop-blur-xl touch-none"
      >
        {/* Top toolbar */}
        <div className="absolute top-0 w-full p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            {m.icon} {media.name || m.label}
            {media.size && <span className="text-white/50 text-xs">{media.size}</span>}
          </div>
          <div className="flex gap-2">
            {(prev || next) && (
              <>
                <button onClick={(e) => { e.stopPropagation(); onPrev?.(); }} disabled={!prev} aria-label={t('media.prev')} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-30">
                  ‹
                </button>
                <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} disabled={!next} aria-label={t('media.next')} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-30">
                  ›
                </button>
              </>
            )}
            <button onClick={(e) => { e.stopPropagation(); setScale(1); }} aria-label={t('media.resetZoom')} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
              <ZoomOut size={18} onClick={(e) => { e.stopPropagation(); zoom(-1); }} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); zoom(1); }} aria-label={t('media.zoomIn')} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
              <ZoomIn size={18} />
            </button>
            <CloseButton onClick={onClose} aria-label={t('common.close')} size="lg" className="!text-white hover:!bg-white/20" />
          </div>
        </div>

        <div className="w-full h-full flex items-center justify-center p-8" onClick={(e) => e.stopPropagation()}>
          {media.type === 'photo' && (
            <motion.img
              src={media.url}
              alt={media.name || 'photo'}
              animate={{ scale }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="max-w-full max-h-[82vh] object-contain rounded-lg shadow-[0_0_60px_rgba(0,0,0,0.8)] select-none pointer-events-none"
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            />
          )}

          {media.type === 'video' && (
            <div className="w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden relative flex items-center justify-center shadow-2xl">
              {media.url ? (
                <video src={media.url} className="w-full h-full object-contain" controls={false} onClick={() => setPlaying(v => !v)} />
              ) : (
                <div className="text-white/40 text-sm">Video preview</div>
              )}
              <button
                onClick={() => setPlaying(v => !v)}
                className="absolute w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white"
                aria-label={t('media.play')}
              >
                {playing ? <Pause size={28} /> : <Play size={28} />}
              </button>
            </div>
          )}

          {media.type === 'document' && (
            <div className="w-full max-w-md rounded-xl bg-white/10 backdrop-blur p-8 flex flex-col items-center gap-4 text-white">
              <FileText size={64} className="text-white/80" />
              <div className="text-center">
                <div className="font-semibold">{media.name || 'Document'}</div>
                {media.size && <div className="text-white/50 text-sm mt-1">{media.size}</div>}
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-[var(--accent)]" style={{ width: `${progress}%` }} />
              </div>
              <button onClick={() => toast(t('media.downloading', 'Downloading…'), 'info')} className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-white">
                {t('media.downloadDoc', 'Download')}
              </button>
            </div>
          )}

          {media.type === 'audio' && (
            <div className="w-full max-w-md rounded-xl bg-white/10 backdrop-blur p-6 flex flex-col gap-4 text-white">
              <div className="flex items-center gap-3">
                <Music size={28} className="text-white/80" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{media.name || 'Audio message'}</div>
                  <div className="text-white/50 text-xs">{media.size || '0:42'}</div>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-[var(--accent)]" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setPlaying(v => !v)} className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white" aria-label={t('media.play')}>
                  {playing ? <Pause size={22} /> : <Play size={22} />}
                </button>
                <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))} className="flex-1 accent-[var(--accent)]" aria-label={t('media.seek')} />
              </div>
            </div>
          )}
        </div>

        {media.caption && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-[80%] text-center text-white/80 text-sm z-10">{media.caption}</div>
        )}

        {/* Bottom actions */}
        <div className="absolute bottom-0 w-full p-4 flex items-center justify-center gap-3 z-10 bg-gradient-to-t from-black/70 to-transparent">
          <ActionButton icon={<Bookmark size={18} />} label={t('media.save')} onClick={() => toast(t('media.saved', 'Saved to collection'), 'success')} />
          <ActionButton icon={<Share2 size={18} />} label={t('media.share')} onClick={() => toast(t('media.shared', 'Shared'), 'info')} />
          <ActionButton icon={<Forward size={18} />} label={t('media.forward')} onClick={() => toast(t('media.forwarded', 'Forwarded'), 'info')} />
          <ActionButton icon={<Download size={18} />} label={t('media.download')} onClick={() => toast(t('media.downloading', 'Downloading…'), 'info')} />
          <ActionButton icon={<Trash2 size={18} />} label={t('media.delete')} danger onClick={() => { toast(t('media.deleted', 'Deleted'), 'success'); onClose(); }} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const ActionButton = ({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors active:scale-95 min-h-[44px] min-w-[56px] ${danger ? 'hover:text-rose-300' : ''}`}
  >
    {icon}
    <span className="text-[10px]">{label}</span>
  </button>
);
