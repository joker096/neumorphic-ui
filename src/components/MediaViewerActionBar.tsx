import React from 'react';
import { Bookmark, Share2, Forward, Download, Trash2 } from 'lucide-react';
import { toast } from './ui/Toast';

type TranslateFn = (key: string, fallback?: string | Record<string, string | number>) => string;

interface MediaViewerActionBarProps {
  t: TranslateFn;
  message?: any;
  onClose: () => void;
  onToggleSave?: (msg: any) => void;
  onForward?: (msg: any) => void;
  onDelete?: (msg: any) => void;
  onShare: () => void;
  onDownload: () => void;
}

const ActionButton = ({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors active:scale-95 min-h-11 min-w-[56px] ${danger ? 'hover:text-rose-300' : ''}`}
  >
    {icon}
    <span className="text-xs">{label}</span>
  </button>
);

export function MediaViewerActionBar({ t, message, onClose, onToggleSave, onForward, onDelete, onShare, onDownload }: MediaViewerActionBarProps) {
  const handleSave = () => {
    if (!message) return;
    onToggleSave?.(message);
    toast(t('media.saved', 'Saved to collection'), 'success');
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

  return (
    <div className="absolute bottom-0 w-full p-4 flex items-center justify-center gap-3 z-10 bg-gradient-to-t from-black/70 to-transparent" onClick={(e) => e.stopPropagation()}>
      {onToggleSave && message && (
        <ActionButton icon={<Bookmark size={18} />} label={t('media.save')} onClick={handleSave} />
      )}
      <ActionButton icon={<Share2 size={18} />} label={t('media.share')} onClick={onShare} />
      {onForward && message && (
        <ActionButton icon={<Forward size={18} />} label={t('media.forward')} onClick={handleForward} />
      )}
      <ActionButton icon={<Download size={18} />} label={t('media.download')} onClick={onDownload} />
      {onDelete && message && (
        <ActionButton icon={<Trash2 size={18} />} label={t('media.delete')} danger onClick={handleDelete} />
      )}
    </div>
  );
}