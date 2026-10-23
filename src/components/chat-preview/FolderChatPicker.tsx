import { useMemo, useState } from "react";
import {
  folderHasChat,
  toggleChatInFolder,
  type ChatFolder,
} from "../../lib/chat/customFolders";
import { SearchInput } from "../ui/SearchInput";

type Translate = (key: string, options?: any) => string;

export interface ChatOption {
  id: string | number;
  name: string;
}

interface FolderChatPickerProps {
  folder: ChatFolder;
  chats: ChatOption[];
  onChange: (chatIds: Array<string | number>) => void;
  t: Translate;
}

/**
 * Scrollable multi-select that edits one folder's membership. Every row is a
 * toggle (checkmark in a circle, accent highlight when selected); changes are
 * applied immediately through `onChange` so the folder list behind it stays in
 * sync. Uses the same token/card language as the rest of the settings UI.
 */
export const FolderChatPicker = ({ folder, chats, onChange, t }: FolderChatPickerProps) => {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return chats;
    return chats.filter((c) => c.name.toLowerCase().includes(q));
  }, [chats, query]);

  if (chats.length === 0) {
    return (
      <div className="text-sm text-[var(--text-secondary)] py-3 text-center">
        {t("chat.folders.noChats", "Нет чатов для назначения.")}
      </div>
    );
  }

  return (
    <div className="mt-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] overflow-hidden">
      <div className="p-2 border-b border-[var(--border-color)]">
        <SearchInput value={query} onChange={setQuery} />
      </div>
      <div className="max-h-56 overflow-y-auto p-1">
        {visible.map((c) => {
          const selected = folderHasChat(folder, c.id);
          return (
            <button
              key={String(c.id)}
              type="button"
              role="checkbox"
              aria-checked={selected}
              aria-label={c.name}
              onClick={() => onChange(toggleChatInFolder(folder, c.id).chatIds)}
              className={`w-full flex items-center gap-3 px-3 min-h-11 rounded-lg transition-colors ${
                selected
                  ? "bg-[var(--accent-soft)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--msg-bg-panel-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-[11px] ${
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--ink-on-saturate)]"
                    : "border-[var(--text-tertiary)]/50"
                }`}
              >
                {selected ? "✓" : ""}
              </span>
              <span className="truncate text-sm">{c.name}</span>
            </button>
          );
        })}
        {visible.length === 0 && (
          <div className="text-sm text-[var(--text-secondary)] py-3 text-center">
            {t("chat.folders.searchEmpty", "Ничего не найдено.")}
          </div>
        )}
      </div>
    </div>
  );
};
