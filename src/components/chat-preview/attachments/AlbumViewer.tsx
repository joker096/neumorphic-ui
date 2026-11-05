import React from "react";
import { X } from "lucide-react";
import { useEscapeKey } from "../../../hooks/useEscapeKey";

interface AlbumViewerProps {
  open: boolean;
  items: Array<{ url: string; text?: string; fileName?: string; fileSize?: number }>;
  alt: string;
  onClose: () => void;
}

/** Carousel view for a multi-photo/video album. Opens full-screen with swipe
    navigation and a close control, matching Telegram's album viewer. */
export function AlbumViewer({ open, items, alt, onClose }: AlbumViewerProps) {
  const [current, setCurrent] = React.useState(0);
  React.useEffect(() => { if (open) { setCurrent(0); document.body.style.overflow = "hidden"; } else { document.body.style.overflow = ""; } }, [open]);
  useEscapeKey(onClose, open);
  if (!open) return null;
  const item = items[current] ?? items[0];
  return (
    <div role="dialog" aria-modal="true" aria-label={alt} className="fixed inset-0 z-[var(--z-modal)] bg-[rgba(0,0,0,0.92)] backdrop-blur-xl flex items-center justify-center" onClick={onClose}>
      <button type="button" aria-label="Close" onClick={onClose} onPointerDown={(e) => e.stopPropagation()} className="absolute top-4 right-4 z-10 min-w-11 min-h-11 rounded-full bg-[var(--msg-bg-panel-hover)] text-[var(--text-primary)] hover:bg-[var(--msg-bg-panel)] transition-colors"><X size={18} /></button>
      <div className="relative max-w-[92vw] max-h-[80vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img src={item.url} alt={alt} className="max-w-full max-h-[72vh] object-contain rounded-[var(--message-radius)] shadow-2xl" />
        {items.length > 1 && (
          <div className="mt-3 text-xs font-medium text-[var(--text-secondary)] tracking-wide">{current + 1} / {items.length}</div>
        )}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
          {current > 0 && <button type="button" aria-label="Previous" onClick={() => setCurrent(current - 1)} className="min-w-11 min-h-11 rounded-full bg-[var(--msg-bg-panel)]/70 text-[var(--text-primary)] hover:bg-[var(--msg-bg-panel)] transition-colors">&#9664;</button>}
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
          {current < items.length - 1 && <button type="button" aria-label="Next" onClick={() => setCurrent(current + 1)} className="min-w-11 min-h-11 rounded-full bg-[var(--msg-bg-panel)]/70 text-[var(--text-primary)] hover:bg-[var(--msg-bg-panel)] transition-colors">&#9654;</button>}
        </div>
      </div>
    </div>
  );
}
