import { Archive } from 'lucide-react';
import { useStoriesStore, selectAuthorUnseen } from '../storiesStore';
import { StoryRing } from './StoryRing';

interface StoriesArchiveRowProps {
  t: (key: string, fallback?: string) => string;
}

function archiveSubtitle(count: number, t: (k: string, f?: string) => string): string {
  if (count === 0) return t('stories.archiveHiddenChats', 'Скрытые чаты');
  const last = count % 10;
  const teen = count % 100;
  if (teen >= 11 && teen <= 14) return `${count} ${t('stories.newHistories5', 'новых историй')}`;
  if (last === 1) return `${count} ${t('stories.newHistory1', 'новая история')}`;
  if (last >= 2 && last <= 4) return `${count} ${t('stories.newHistories24', 'новые истории')}`;
  return `${count} ${t('stories.newHistories5', 'новых историй')}`;
}

/** Archive row at the top of the chat list. Opens the viewer on muted (archive) authors. */
export function StoriesArchiveRow({ t }: StoriesArchiveRowProps) {
  const authors = useStoriesStore((s) => s.authors);
  const openViewer = useStoriesStore((s) => s.openViewer);

  const archiveAuthors = authors.filter((a) => a.isMuted);
  if (archiveAuthors.length === 0) return null;

  const unseen = archiveAuthors.reduce((acc, a) => acc + selectAuthorUnseen(a), 0);
  const archiveStories = archiveAuthors.flatMap((a) => a.stories);

  return (
    <button
      type="button"
      onClick={() => openViewer(archiveAuthors[0].id)}
      className="w-full flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer hover:bg-[var(--msg-bg-panel-hover)] transition-colors text-left"
      aria-label={t('chat.archived', 'Archived')}
    >
      <StoryRing stories={archiveStories} size={56}>
        <span className="flex items-center justify-center w-12 h-12 rounded-full bg-black text-white/90">
          <Archive size={22} />
        </span>
      </StoryRing>
      <span className="flex-1 min-w-0">
        <span className="block font-bold text-[var(--text-primary)] truncate">{t('chat.archived', 'Архив')}</span>
        <span className="block text-sm text-[var(--text-secondary)] truncate">{archiveSubtitle(unseen, t)}</span>
      </span>
    </button>
  );
}
