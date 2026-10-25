import { useStoriesStore, selectAuthorUnseen } from '../storiesStore';
import { StoryRing } from './StoryRing';

interface SearchStoryBadgeProps {
  size?: number;
  t?: (key: string, fallback?: string) => string;
}

/**
 * Small avatar with a story ring inside the chat-list search field. Click opens
 * the viewer on the author with unseen stories (or the first author when all seen).
 */
export function SearchStoryBadge({ size = 28, t }: SearchStoryBadgeProps) {
  const authors = useStoriesStore((s) => s.authors);
  const openViewer = useStoriesStore((s) => s.openViewer);

  if (authors.length === 0) return null;

  const target =
    authors.find((a) => selectAuthorUnseen(a) > 0) ?? authors[0];

  const label = t?.('stories.badge', 'Stories') ?? 'Stories';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        openViewer(target.id);
      }}
      className="shrink-0 min-w-11 min-h-11 flex items-center justify-center cursor-pointer transition-transform active:scale-95"
    >
      <StoryRing stories={target.stories} size={size}>
        <span
          className="block rounded-full overflow-hidden bg-[var(--bg-tertiary)]"
          style={{ width: size - 8, height: size - 8, backgroundImage: `url(${target.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      </StoryRing>
    </button>
  );
}
