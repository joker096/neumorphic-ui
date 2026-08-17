import React from "react";
import { Pin, X } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { sheetOverlay, sheetBackdrop, sheetSurface, sheetTitleClass, sheetCancelClass } from "../ui/modalShared";

interface PinnedMessagesBarProps {
  chatId: string | number;
  messages: any[];
  pinnedMessages: Array<{ id: number; chatId: string | number; pinBy: string }>;
  isDark?: boolean;
  onUnpin?: (id: number) => void;
  onJump?: (id: number) => void;
}

const previewOf = (messages: any[], id: number): string => {
  const msg = messages.find((m) => m.id === id);
  if (!msg) return "";
  if (typeof msg.text === "string" && msg.text) return msg.text;
  if (msg.type === "image") return "Photo";
  if (msg.type === "video") return "Video";
  if (msg.type === "audio") return "Voice message";
  if (msg.type === "sticker") return "Sticker";
  if (msg.type === "file") return "File";
  return "Message";
};

export const PinnedMessagesBar: React.FC<PinnedMessagesBarProps> = ({
  chatId,
  messages,
  pinnedMessages,
  isDark = false,
  onUnpin,
  onJump,
}) => {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const items = React.useMemo(
    () => pinnedMessages.filter((p) => p.chatId === chatId),
    [pinnedMessages, chatId],
  );

  if (items.length === 0) return null;

  const top = items[items.length - 1];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 w-full px-3 py-2 text-left transition-colors cursor-pointer ${
          isDark ? "bg-[var(--bg-tertiary)] hover:bg-white/5 text-[var(--text-primary)]" : "bg-slate-100 hover:bg-slate-200 text-slate-800"
        }`}
        aria-label={t("chat.pinnedMessages", "Pinned messages")}
      >
        <Pin size={15} className={isDark ? "text-orange-400" : "text-orange-500"} />
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-semibold truncate">{previewOf(messages, top.id)}</span>
          <span className="block text-[11px] opacity-70">
            {items.length > 1 ? t("chat.pinnedCount", `${items.length} pinned messages`) : t("chat.pinnedOne", "1 pinned message")}
          </span>
        </span>
      </button>

      {open && (
          <div className={sheetOverlay} role="dialog" aria-modal="true">
          <div className={sheetBackdrop} onClick={() => setOpen(false)} aria-hidden="true" />
          <div className={sheetSurface(isDark)}>
            <div className={sheetTitleClass(isDark)}>
              {t("chat.pinnedMessages", "Pinned messages")}
            </div>
            <div className="flex flex-col max-h-[60vh] overflow-y-auto">
              {items.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-start gap-2 w-full px-3 py-3 rounded-xl ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (onJump) onJump(p.id);
                      setOpen(false);
                    }}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <span className="block text-[14px] leading-snug line-clamp-2">{previewOf(messages, p.id)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUnpin(p.id)}
                    className={`shrink-0 min-h-[40px] px-2 rounded-lg flex items-center justify-center cursor-pointer ${isDark ? "text-gray-400 hover:text-red-400 hover:bg-white/5" : "text-slate-500 hover:text-red-500 hover:bg-black/5"}`}
                    aria-label={t("chat.unpin", "Unpin")}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={sheetCancelClass(isDark)}
            >
              {t("cancel", "Cancel")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
