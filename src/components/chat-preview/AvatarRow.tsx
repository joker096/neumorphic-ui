import { Plus } from "lucide-react";
import { STORY_USERS, MY_STORY_USER, getVisibleStories, type StoryUser } from "../stories/storiesData";
import { getUnseenCount } from "../../lib/stories/storySeen";

interface AvatarRowProps {
  theme: "light" | "dark";
  onStoryClick?: (user: StoryUser) => void;
  onComposeStory?: () => void;
  t: (key: string, options?: any) => string;
}

export const AvatarRow = ({ theme, onStoryClick, onComposeStory, t }: AvatarRowProps) => {
  const isDark = theme === "dark";
  const myStories = getVisibleStories(MY_STORY_USER);
  const storyUsers: StoryUser[] = [
    ...(myStories.length > 0 ? [MY_STORY_USER] : []),
    ...STORY_USERS.filter((u) => getVisibleStories(u).length > 0),
  ];

  return (
    <div className="flex flex-col w-full overflow-visible mb-2 pt-2 pb-1 bg-transparent shrink-0">
      <div className={`px-4 mb-2 font-mono text-xs uppercase tracking-widest font-bold ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>{t("header.stories")}</div>
      <div className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2 overflow-x-auto pb-2 scrollbar-none shrink-0" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        <div
          onClick={() => onComposeStory && onComposeStory()}
          className="flex flex-col items-center gap-1 sm:gap-1.5 group cursor-pointer shrink-0"
        >
          <div className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-transform duration-200 active:scale-95 ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)] border-dashed" : "bg-[var(--bg-primary)] border border-[var(--border-color)] border-dashed"}`}>
            <Plus size={20} className={isDark ? "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]"} />
          </div>
          <span className={`text-xs sm:text-xs font-semibold tracking-wide transition-colors ${isDark ? "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]"}`}>
            {t("header.myStory")}
          </span>
        </div>
        {storyUsers.map((u) => {
          const unseen = !u.isMe && getUnseenCount(u) > 0;
          return (
            <div
              key={u.id}
              onClick={() => onStoryClick && onStoryClick(u)}
              className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
            >
              <div
                className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-transform duration-200 active:scale-95 ${
                  unseen || u.isMe
                    ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-primary)]"
                    : ""
                } ${isDark ? "bg-[var(--bg-tertiary)] shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-[var(--border-color)]" : "bg-[var(--bg-secondary)] shadow-[4px_4px_8px_rgba(165,175,190,0.3),_-4px_-4px_8px_rgba(255,255,255,0.8),_inset_1.5px_1.5px_2px_rgba(255,255,255,1)] border border-[var(--border-color)]"}`}
              >
                <div className="w-[85%] h-[85%] rounded-full overflow-hidden p-[2px]">
                  <div className={`w-full h-full rounded-full bg-gradient-to-br ${u.avatarColor} flex items-center justify-center text-[var(--text-primary)] font-bold text-lg`}>
                    {u.name.charAt(0)}
                  </div>
                </div>
                {unseen && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--accent)] ring-2 ring-[var(--bg-primary)] shrink-0"
                    aria-label={t("header.newStories", "New stories")}
                  />
                )}
              </div>
              <span className={`text-xs sm:text-xs font-semibold tracking-wide transition-colors ${isDark ? "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]"}`}>
                {u.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
