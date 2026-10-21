import React from "react";
import { X } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { ACCENT_CAPS_BOLD_CLASS } from "../ui/textClasses";

interface ChatInputSchedulePopupProps {
  scheduleDateTime: string;
  setScheduleDateTime: (v: string) => void;
  showSchedulePopup: boolean;
  setShowSchedulePopup: (v: boolean) => void;
  t: (key: string, opts?: any) => string;
}

export function ChatInputSchedulePopup({ scheduleDateTime, setScheduleDateTime, showSchedulePopup, setShowSchedulePopup, t }: ChatInputSchedulePopupProps) {
  const { t: translate } = useI18n();
  if (!showSchedulePopup) return null;
  return (
    <div className="mx-2 sm:mx-3 mb-2 p-2 sm:p-3 rounded-xl flex flex-col gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)]">
      <div className="flex justify-between items-center">
        <span className={ACCENT_CAPS_BOLD_CLASS}>{t("chat.scheduleSend")}</span>
        <button
          type="button"
          className="min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          onClick={() => setShowSchedulePopup(false)}
          aria-label={translate("common.close")}
        >
          <X size={16} />
        </button>
      </div>
      <input
        aria-label={t('chat.scheduleSend', 'Schedule send')}
        type="datetime-local"
        value={scheduleDateTime}
        onChange={(e) => setScheduleDateTime(e.target.value)}
        className="w-full outline-none text-sm p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setScheduleDateTime(""); setShowSchedulePopup(false); }}
          className="flex-1 py-2 text-xs font-bold rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--msg-bg-panel-hover)]"
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={() => setShowSchedulePopup(false)}
          disabled={!scheduleDateTime}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
            !scheduleDateTime ? "opacity-50 cursor-not-allowed" : ""
          } bg-[var(--accent)]/20 text-[var(--accent)]`}
        >
          {t("chat.setTime")}
        </button>
      </div>
    </div>
  );
}