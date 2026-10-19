import { useId } from "react";
import { Plus } from "lucide-react";
import { STORY_USERS, MY_STORY_USER, getVisibleStories, type StoryUser } from "../stories/storiesData";
import { getUnseenCount } from "../../lib/stories/storySeen";

interface AvatarRowProps {
  theme: "light" | "dark";
  onStoryClick?: (user: StoryUser) => void;
  onComposeStory?: () => void;
  t: (key: string, options?: any) => string;
}

const RING_BOX = 56;
const RING_RADIUS = 25.5;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_GAP = 4;

/** Telegram-style segmented story ring: one arc per story, gradient for unseen. */
const StoryRing = ({ segments, gradientId }: { segments: number; gradientId: string }) => {
  const count = Math.max(1, segments);
  const segmentLength = Math.max(1, (RING_CIRCUMFERENCE - RING_GAP * count) / count);
  return (
    <svg
      viewBox={`0 0 ${RING_BOX} ${RING_BOX}`}
      className="absolute inset-0 h-full w-full -rotate-90"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent2, var(--accent))" />
        </linearGradient>
      </defs>
      {Array.from({ length: count }).map((_, i) => (
        <circle
          key={i}
          cx={RING_BOX / 2}
          cy={RING_BOX / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={`${segmentLength} ${RING_CIRCUMFERENCE - segmentLength}`}
          strokeDashoffset={-i * (segmentLength + RING_GAP)}
        />
      ))}
    </svg>
  );
};

interface StoryTileProps {
  user: StoryUser;
  unseen: boolean;
  own: boolean;
  ringSegments: number;
  onStoryClick?: (user: StoryUser) => void;
}

const StoryTile = ({
  user,
  unseen,
  own,
  ringSegments,
  onStoryClick,
}: StoryTileProps) => {
  const gradientId = `story-ring-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const active = unseen || own;
  const label = user.name;

  return (
    <div className="relative w-14 shrink-0">
      <button
        type="button"
        onClick={() => onStoryClick?.(user)}
        aria-label={label}
        data-story-ring={active ? (own ? "own" : "unseen") : "seen"}
        className="group flex min-h-11 w-full flex-col items-center rounded-2xl transition-transform duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
      >
        <span className="relative block h-14 w-14">
          {active && <StoryRing segments={ringSegments} gradientId={gradientId} />}
          <span className="absolute inset-[5px] overflow-hidden rounded-full">
            <span
              className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${user.avatarColor} text-lg font-bold text-[var(--text-primary)]`}
            >
              {user.name.charAt(0)}
            </span>
          </span>
        </span>
        <span
          className={`mt-1 w-full truncate text-center text-xs font-semibold transition-colors ${
            active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
          }`}
        >
          {label}
        </span>
      </button>
    </div>
  );
};

export const AvatarRow = ({ theme, onStoryClick, onComposeStory, t }: AvatarRowProps) => {
  const myStories = getVisibleStories(MY_STORY_USER);
  const storyUsers: StoryUser[] = [
    ...STORY_USERS.filter((u) => getVisibleStories(u).length > 0),
  ];

  return (
    <div data-story-theme={theme} className="flex w-full shrink-0 flex-col overflow-visible bg-transparent pb-1 pt-1">
      <div
        className="scrollbar-none flex w-full shrink-0 items-center gap-2.5 overflow-x-auto px-2 pb-1"
        onWheel={(e) => {
          e.currentTarget.scrollLeft += e.deltaY;
        }}
      >
        <button
          type="button"
          onClick={onComposeStory}
          aria-label={t("header.myStory", "My story")}
          data-story-compose="true"
          className="group flex min-h-11 w-14 shrink-0 flex-col items-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-[var(--border-color)] bg-[var(--accent-soft)] text-[var(--accent)] transition-transform duration-200 group-active:scale-95">
            <Plus size={24} aria-hidden="true" />
          </span>
          <span className="mt-1 w-full truncate text-center text-xs font-semibold text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]">
            {t("header.myStory", "My story")}
          </span>
        </button>
        {myStories.length > 0 && (
          <StoryTile
            user={MY_STORY_USER}
            unseen={false}
            own
            ringSegments={myStories.length}
            onStoryClick={onStoryClick}
          />
        )}
        {storyUsers.map((u) => {
          const unseen = getUnseenCount(u) > 0;
          return (
            <StoryTile
              key={u.id}
              user={u}
              unseen={unseen}
              own={false}
              ringSegments={getVisibleStories(u).length}
              onStoryClick={onStoryClick}
            />
          );
        })}
      </div>
    </div>
  );
};
