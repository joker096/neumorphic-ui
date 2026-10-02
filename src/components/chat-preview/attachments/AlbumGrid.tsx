import { Loader2, ImageOff } from "lucide-react";
import { useI18n } from "../../../lib/i18n";
import { FTR_MAGIC } from "../../../lib/fileTransfer/frames";
import { useFtrBlobUrl } from "../../../hooks/useFtrBlobUrl";

interface AlbumTileProps {
  url: string;
  alt: string;
  onError: () => void;
  className?: string;
}

function AlbumTile({ url, alt, onError, className }: AlbumTileProps) {
  const isFtr = typeof url === "string" && url.startsWith(FTR_MAGIC);
  const ftrId = isFtr ? url.slice(FTR_MAGIC.length) : null;
  const ftrEntry = useFtrBlobUrl(ftrId);
  const src = ftrId ? ftrEntry?.url : url;
  if (!src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--msg-bg-panel)]">
        <Loader2 size={18} className="animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={onError}
    />
  );
}

interface AlbumGridProps {
  items: Array<{ url: string }>;
  alt: string;
  failed: number[];
  onItemError: (index: number) => void;
  onOpen: (url: string) => void;
}

/** 2x2 album preview with a +N overlay; one failed tile falls back to an icon. */
export function AlbumGrid({ items, alt, failed, onItemError, onOpen }: AlbumGridProps) {
  const shown = items.slice(0, 4);
  const remaining = items.length - shown.length;
  return (
    <div
      className="grid grid-cols-2 gap-1 rounded-[var(--message-radius)] overflow-hidden mb-1 border border-[var(--border-color)] inline-block max-w-full cursor-pointer w-[260px] sm:w-[300px]"
      onClick={() => onOpen(shown[0]!.url)}
    >
      {shown.map((it, i) => {
        const isFailed = failed.includes(i);
        return (
          <div key={`${it.url}-${i}`} className="relative aspect-square overflow-hidden">
            {!isFailed ? (
              <AlbumTile
                url={it.url}
                alt={alt}
                className="w-full h-full object-cover"
                onError={() => onItemError(i)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--msg-bg-panel)]">
                <ImageOff size={18} className="text-[var(--text-tertiary)]" />
              </div>
            )}
            {i === shown.length - 1 && remaining > 0 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">+{remaining}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
