import { Plus } from 'lucide-react';
import { MEDIA_COVER_CLASS } from '../../../components/ui/mediaClasses';
import { useStoriesStore, selectAuthorUnseen } from '../storiesStore';
import { StoryRing } from './StoryRing';

interface StoriesStripProps {
  t?: (key: string, fallback?: string) => string;
  onComposeStory?: () => void;
}

/**
 * Horizontal ribbon of story authors (used above the contacts block in search
 * mode). Sorted unseen-first, then by newest story date. Click opens the viewer.
 */
export function StoriesStrip({ t, onComposeStory }: StoriesStripProps) {
  const authors = useStoriesStore((s) => s.authors);
  const openViewer = useStoriesStore((s) => s.openViewer);

  if (authors.length === 0) return null;

  const sorted = [...authors].sort((a, b) => {
    const aUnseen = selectAuthorUnseen(a) > 0 ? 0 : 1;
    const bUnseen = selectAuthorUnseen(b) > 0 ? 0 : 1;
    if (aUnseen !== bUnseen) return aUnseen - bUnseen;
    const aNew = a.stories.reduce((m, s) => Math.max(m, new Date(s.createdAt).getTime()), 0);
    const bNew = b.stories.reduce((m, s) => Math.max(m, new Date(s.createdAt).getTime()), 0);
    return bNew - aNew;
  });

  const stripLabel = t?.('stories.strip', 'Stories') ?? 'Stories';

  return (
    <div
      className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar shrink-0"
      role="group"
      aria-label={stripLabel}
    >
      {onComposeStory && (
        <button
          type="button"
          onClick={onComposeStory}
          className="shrink-0 flex flex-col items-center gap-1 cursor-pointer group"
          style={{ width: 64 }}
          aria-label={t?.('header.myStory', 'My story')}
        >
          <span className="w-12 h-12 min-w-11 min-h-11 rounded-full flex items-center justify-center border-2 border-dashed border-[var(--accent-soft)] text-[var(--accent)] transition-transform group-hover:scale-105 group-active:scale-95">
            <Plus size={24} />
          </span>
          <span className="w-full truncate text-center text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
            {t?.('header.myStory', 'My story')}
          </span>
        </button>
      )}
      {sorted.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => openViewer(a.id)}
          className="shrink-0 flex flex-col items-center gap-1 cursor-pointer group"
          style={{ width: 64 }}
          aria-label={a.name}
        >
          <StoryRing
            stories={a.stories}
            size={48}
            label={`${stripLabel} — ${a.name}`}
            className="transition-transform group-hover:scale-105 group-active:scale-95"
          >
            <span
              className="block rounded-full overflow-hidden bg-[var(--bg-tertiary)]"
              style={{ width: 48, height: 48 }}
            >
              {a.avatarUrl ? (
                <img
                  src={a.avatarUrl}
                  alt=""
                  role="presentation"
                  className={MEDIA_COVER_CLASS}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-sm font-bold text-[var(--text-secondary)] truncate">
                  {a.name?.charAt(0) || '?'}
                </span>
              )}
            </span>
          </StoryRing>
          <span className="w-full truncate text-center text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
            {a.name}
          </span>
        </button>
      ))}
    </div>
  );
}
