import type { MentionSuggestion } from "../../types";

export const MENTION_MENU_ID = "chat-mention-menu";

export interface MentionSuggestionsMenuProps {
  open: boolean;
  suggestions: MentionSuggestion[];
  activeIndex: number;
  onPick: (suggestion: MentionSuggestion) => void;
  t: (key: string, opts?: any) => string;
}

/**
 * `@`-autocomplete popup rendered above the composer.
 *
 * Rows use `mousedown` + `preventDefault` so the textarea keeps focus and the
 * caret position that produced the token is still valid on click.
 */
export function MentionSuggestionsMenu({
  open,
  suggestions,
  activeIndex,
  onPick,
  t,
}: MentionSuggestionsMenuProps) {
  if (!open || !suggestions.length) return null;
  return (
    <div
      id={MENTION_MENU_ID}
      role="menu"
      aria-label={t("notif.settings.mentions")}
      className="glass-menu absolute bottom-full left-0 right-0 mb-2 z-50 max-h-56 overflow-y-auto"
    >
      {suggestions.map((suggestion, index) => (
        <button
          id={`${MENTION_MENU_ID}-${index}`}
          key={suggestion.id}
          type="button"
          role="menuitem"
          aria-selected={index === activeIndex}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(suggestion)}
          className={`glass-menu-item ${index === activeIndex ? "bg-[var(--msg-bg-panel-hover)]" : ""}`}
        >
          <span className="min-w-0 flex-1 truncate">{suggestion.name}</span>
          <span className="text-xs text-[var(--msg-text-muted)] truncate">@{suggestion.username}</span>
        </button>
      ))}
    </div>
  );
}
