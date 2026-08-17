import React from "react";
import { X } from "lucide-react";
import { useI18n } from "../../lib/i18n";

interface ChatInputSchedulePopupProps {
  scheduleDateTime: string;
  setScheduleDateTime: (v: string) => void;
  showSchedulePopup: boolean;
  setShowSchedulePopup: (v: boolean) => void;
  isDark: boolean;
  t: (key: string, opts?: any) => string;
}

export function ChatInputSchedulePopup({ scheduleDateTime, setScheduleDateTime, showSchedulePopup, setShowSchedulePopup, isDark, t }: ChatInputSchedulePopupProps) {
  const { t: translate } = useI18n();
  if (!showSchedulePopup) return null;
  return (
    <div className={`mx-2 sm:mx-3 mb-2 p-2 sm:p-3 rounded-xl flex flex-col gap-2 ${
      isDark ? "bg-[var(--bg-secondary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)] shadow-sm"
    }`}>
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">{t("chat.scheduleSend")}</span>
        <button
          type="button"
          className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center cursor-pointer ${
            isDark ? "text-gray-400 hover:text-[var(--text-primary)]" : "text-slate-400 hover:text-slate-800"
          }`}
          onClick={() => setShowSchedulePopup(false)}
          aria-label={translate("common.close")}
        >
          <X size={16} />
        </button>
      </div>
      <input
        type="datetime-local"
        value={scheduleDateTime}
        onChange={(e) => setScheduleDateTime(e.target.value)}
        className={`w-full outline-none text-sm p-2 rounded-lg ${
          isDark ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)]" : "bg-slate-50 text-slate-800"
        }`}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setScheduleDateTime(""); setShowSchedulePopup(false); }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg ${
            isDark ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-black/5 text-slate-500 hover:bg-black/10"
          }`}
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={() => setShowSchedulePopup(false)}
          disabled={!scheduleDateTime}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
            !scheduleDateTime ? "opacity-50 cursor-not-allowed" : ""
          } ${isDark ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "bg-[var(--accent)]/10 text-[var(--accent)]"}`}
        >
          {t("chat.setTime")}
        </button>
      </div>
    </div>
  );
}