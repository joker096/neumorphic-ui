import { Check, Megaphone } from "lucide-react";
import { STORY_USERS } from "../../stories/storiesData";
import { getUnseenCount } from "../../../lib/stories/storySeen";

type Translate = (key: string, options?: any) => string;

interface ChatListItemAvatarProps {
  chat: any;
  isDark: boolean;
  active: boolean;
  type: "chat" | "channel";
  selectMode: boolean;
  selected: boolean;
  overrideAvatar?: string;
  t: Translate;
  onToggleSelect?: () => void;
  onAvatarClick?: (chat: any) => void;
}

const ROUNDED = "rounded-full";

/** Leading avatar: selection box, stored photo or gradient initial, plus the online and channel badges. */
export function ChatListItemAvatar({ chat, isDark, active, type, selectMode, selected, overrideAvatar, t, onToggleSelect, onAvatarClick }: ChatListItemAvatarProps) {
  // Telegram marks the contact's avatar when they have an unseen story. Stories here
  // are name-matched against the demo `STORY_USERS` (same fallback used elsewhere).
  const storyUser =
    !selectMode && type !== "channel" && typeof chat.name === "string"
      ? STORY_USERS.find((u) => chat.name.toLowerCase().startsWith(u.name.toLowerCase()))
      : undefined;
  const hasUnseenStory = !!storyUser && getUnseenCount(storyUser) > 0;

  return (
    <div
      onClick={(e) => {
        if (selectMode) {
          onToggleSelect?.();
          e.stopPropagation();
          return;
        }
        if (onAvatarClick && type !== "channel") {
          e.stopPropagation();
          onAvatarClick(chat);
        }
      }}
      className={`relative shrink-0 ${ROUNDED} avatar transition-transform duration-200 ${active ? "scale-95" : ""} ${hasUnseenStory ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-secondary)]" : ""}`}
      data-story-ring={hasUnseenStory ? "unseen" : undefined}
    >
      {selectMode ? (
        <div
          className={`w-full h-full ${ROUNDED} flex items-center justify-center shadow-sm ${selected ? "bg-[var(--accent)]" : isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)]"}`}
        >
          {selected ? (
            <Check size={16} strokeWidth={2.5} className="text-[var(--ink-on-saturate)]" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-[var(--text-tertiary)]" />
          )}
        </div>
      ) : overrideAvatar ? (
        <img
          src={overrideAvatar}
          alt=""
          role="presentation"
          className={`w-full h-full ${ROUNDED} object-cover`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className={`w-full h-full ${ROUNDED} bg-gradient-to-br ${chat.color} flex items-center justify-center text-[var(--text-primary)] font-bold text-sm shadow-sm`}>
          {chat.name.charAt(0)}
        </div>
      )}
      {chat.online && !selectMode && (
        <div role="img" aria-label={t("chat.filters.online")} className="avatar-status" />
      )}
      {type === "channel" && !selectMode && (
        <div className={`absolute -bottom-0.5 -right-0.5 w-[15px] h-[15px] rounded-full border-2 z-10 flex items-center justify-center bg-[var(--accent)] border-[var(--bg-secondary)]`}>
          <Megaphone size={12} className="text-[var(--ink-on-saturate)]" />
        </div>
      )}
    </div>
  );
}
