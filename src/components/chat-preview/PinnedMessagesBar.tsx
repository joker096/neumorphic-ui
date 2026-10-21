import React from "react";
import { ChevronRight, Pin, X } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import {
  sheetOverlay,
  sheetBackdrop,
  sheetSurface,
  sheetTitleClass,
  sheetCancelClass,
} from "../ui/modalShared";

interface PinnedMessagesBarProps {
  chatId: string | number;
  messages: any[];
  pinnedMessages: Array<{ id: number; chatId: string | number; pinBy: string }>;
  onUnpin?: (id: number) => void;
  onJump?: (id: number) => void;
}

/** Translator shape accepted by {@link previewOf}; `useI18n().t` is assignable. */
type PreviewTranslator = (key: string, fallback?: string) => string;

/**
 * Builds a one-line preview for a pinned message.
 * Falls back to a localized type label for media-only messages; the optional
 * `t` keeps existing two-argument call sites (e.g. `ChatProfileBody`) working.
 */
export const previewOf = (
  messages: any[],
  id: number,
  t?: PreviewTranslator,
): string => {
  const tr: PreviewTranslator = t ?? ((_key, fallback) => fallback ?? "");
  const msg = messages.find((m) => m.id === id);
  if (!msg) return "";
  if (typeof msg.text === "string" && msg.text) return msg.text;
  if (msg.type === "image") return tr("chat.photo", "Photo");
  if (msg.type === "video") return tr("chat.video", "Video");
  if (msg.type === "audio") return tr("chat.filters.voiceNote", "Voice note");
  if (msg.type === "sticker") return tr("a11y.sticker", "Sticker");
  if (msg.type === "file") return tr("chat.file", "File");
  if (msg.type === "story") return tr("chat.story", "Story");
  return tr("chat.message", "Message");
};

export const PinnedMessagesBar: React.FC<PinnedMessagesBarProps> = ({
  chatId,
  messages,
  pinnedMessages,
  onUnpin,
  onJump,
}) => {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);

  const items = React.useMemo(
    () => pinnedMessages.filter((p) => p.chatId === chatId),
    [pinnedMessages, chatId],
  );

  useEscapeKey(() => setOpen(false), open);

  if (items.length === 0) return null;

  const top = items[items.length - 1];
  const countLabel =
    items.length > 1
      ? t("chat.pinnedCount", `${items.length} pinned messages`)
      : t("chat.pinnedOne", "1 pinned message");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("chat.pinnedMessages", "Pinned messages")}
        className="group flex w-full min-h-11 items-center gap-2.5 rounded-xl bg-[var(--bg-tertiary)] px-3 text-left text-[var(--text-primary)] transition-colors cursor-pointer hover:bg-[var(--msg-bg-panel-hover)] active:scale-[0.995]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <Pin size={16} />
        </span>
        <span className="min-w-0 flex-1 py-1.5">
          <span className="block truncate text-sm font-semibold leading-tight">
            {previewOf(messages, top.id, t)}
          </span>
          <span className="block truncate text-xs leading-tight text-[var(--text-secondary)]">
            {countLabel}
          </span>
        </span>
        <ChevronRight
          size={16}
          className="shrink-0 text-[var(--text-tertiary)] transition-transform group-hover:translate-x-0.5"
        />
      </button>

      {open && (
        <div className={sheetOverlay} role="dialog" aria-modal="true">
          <div
            className={sheetBackdrop}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className={sheetSurface(false)}>
            <div className={sheetTitleClass(false)}>
              {t("chat.pinnedMessages", "Pinned messages")}
            </div>
            <div className="flex max-h-[60vh] flex-col overflow-y-auto">
              {items.map((p) => (
                <div key={p.id} className="flex w-full items-stretch gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onJump?.(p.id);
                      setOpen(false);
                    }}
                    className="min-h-11 flex-1 min-w-0 rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer hover:bg-[var(--msg-bg-panel-hover)] active:scale-[0.99]"
                  >
                    <span className="line-clamp-2 block text-sm leading-snug text-[var(--text-primary)]">
                      {previewOf(messages, p.id, t)}
                    </span>
                  </button>
                  {onUnpin && (
                    <button
                      type="button"
                      onClick={() => onUnpin(p.id)}
                      aria-label={t("chat.unpin", "Unpin")}
                      title={t("chat.unpin", "Unpin")}
                      className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-[var(--text-tertiary)] transition-colors cursor-pointer hover:bg-[var(--msg-bg-panel-hover)] hover:text-[var(--danger)] active:scale-95"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={sheetCancelClass(false)}
            >
              {t("cancel", "Cancel")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
