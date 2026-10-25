import { useStoriesStore, selectAuthorUnseen } from '../storiesStore';
import { StoryRing } from './StoryRing';

interface StoriesStripProps {
  t?: (key: string, fallback?: string) => string;
}

/**
 * Horizontal ribbon of story authors (used above the contacts block in search
 * mode). Sorted unseen-first, then by newest story date. Click opens the viewer.
 */
export function StoriesStrip({ t }: StoriesStripProps) {
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

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar shrink-0">
      {sorted.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => openViewer(a.id)}
          className="shrink-0 flex flex-col items-center gap-1 cursor-pointer group"
          style={{ width: 64 }}
          aria-label={a.name}
        >
          <StoryRing stories={a.stories} size={56} className="transition-transform group-hover:scale-105 group-active:scale-95">
            <span
              className="block rounded-full overflow-hidden bg-[var(--bg-tertiary)]"
              style={{ width: 48, height: 48, backgroundImage: `url(${a.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
          </StoryRing>
          <span className="w-full truncate text-center text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
            {a.name}
          </span>
        </button>
      ))}
      <span className="sr-only">{t?.('stories.strip', 'Stories')}</span>
    </div>
  );
}
