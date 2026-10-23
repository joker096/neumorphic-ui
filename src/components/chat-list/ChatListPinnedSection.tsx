import type { ReactElement } from "react";
import { Reorder, useDragControls } from "motion/react";
import { GripHorizontal } from "lucide-react";

type Translate = (key: string, options?: any) => string;

interface ChatListPinnedSectionProps {
  pinnedChats: any[];
  renderRow: (chat: any, type: "chat" | "channel", opts?: { disableSwipe?: boolean }) => ReactElement;
  onReorder: (ordered: any[]) => void;
  t: Translate;
}

/**
 * The pinned-chats section of the chat list. Pinned chats are rendered in
 * their own block (outside the virtualizer) so they can be reordered by
 * dragging a handle; each row reuses the same renderRow as the main list with
 * swipe disabled.
 */
export function ChatListPinnedSection({ pinnedChats, renderRow, onReorder, t }: ChatListPinnedSectionProps) {
  return (
    <div data-testid="pinned-chat-section" className="pb-2">
      <div className="pb-3 sm:pb-4 text-xs sm:text-xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--accent)]">
        {t("chat.sectionPinned")}
      </div>
      <Reorder.Group axis="y" values={pinnedChats} onReorder={onReorder} className="flex flex-col">
        {pinnedChats.map((chat) => (
          <PinnedReorderItem key={String(chat.id)} chat={chat} renderRow={renderRow} t={t} />
        ))}
      </Reorder.Group>
      <div className="h-px w-full bg-black/5 dark:bg-white/5 my-2" />
    </div>
  );
}

interface PinnedReorderItemProps {
  chat: any;
  renderRow: (chat: any, type: "chat" | "channel", opts?: { disableSwipe?: boolean }) => ReactElement;
  t: Translate;
}

/** One pinned chat row with a drag handle that reorders via Reorder.Item. */
function PinnedReorderItem({ chat, renderRow, t }: PinnedReorderItemProps) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item value={chat} dragListener={false} dragControls={dragControls}>
      <div className="relative">
        {renderRow(chat, "chat", { disableSwipe: true })}
        <div
          role="button"
          tabIndex={-1}
          aria-label={t("chat.reorderPinned")}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-grab"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripHorizontal size={16} />
        </div>
      </div>
    </Reorder.Item>
  );
}
