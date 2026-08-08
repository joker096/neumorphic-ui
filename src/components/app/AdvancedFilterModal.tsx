import { motion } from "motion/react";
import { Bot, Hash, ListFilter, MessageCircle, Mic } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { AppModal } from "../ui/AppModal";

type Translate = (key: string, options?: any) => string;

type AdvancedFilterModalProps = {
  onClose: () => void;
  isDark?: boolean;
  filters: Record<string, boolean>;
  setFilters: Dispatch<SetStateAction<Record<string, boolean>>>;
  t: Translate;
};

export const AdvancedFilterModal = ({ onClose, isDark = false, filters, setFilters, t }: AdvancedFilterModalProps) => (
  <AppModal isOpen={true} onClose={onClose} isDark={isDark} title={t("chat.filters.title")} maxWidth="max-w-[320px]">
    <div className="flex flex-col gap-4">
      {[
        { id: "hasMedia", label: t("chat.filters.hasMedia"), icon: ListFilter },
        { id: "hasAudio", label: t("chat.filters.hasAudio"), icon: Mic },
        { id: "hasReplies", label: t("chat.filters.hasReplies"), icon: MessageCircle },
        { id: "fromBots", label: t("chat.filters.fromBots"), icon: Bot },
        { id: "priority", label: t("chat.filters.priority"), icon: Hash },
      ].map((filter) => (
        <label key={filter.id} className="flex items-center gap-3 cursor-pointer group">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
              filters[filter.id as keyof typeof filters]
                ? "bg-orange-500 text-[var(--text-primary)]"
                : isDark
                  ? "bg-[var(--bg-tertiary)] text-gray-400 group-hover:text-gray-200"
                  : "bg-slate-50 text-slate-500 group-hover:text-slate-700"
            }`}
          >
            <filter.icon size={18} />
          </div>
          <span className={`text-sm font-bold flex-1 ${isDark ? "text-gray-300" : "text-slate-700"}`}>{filter.label}</span>
          <div
            className={`w-[44px] h-[24px] rounded-full p-1 transition-colors flex items-center ${
              filters[filter.id as keyof typeof filters] ? "bg-orange-500" : isDark ? "bg-[var(--bg-tertiary)]" : "bg-slate-100"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                filters[filter.id as keyof typeof filters] ? "translate-x-[20px]" : "translate-x-0"
              }`}
            />
          </div>
          <input
            type="checkbox"
            className="hidden"
            checked={filters[filter.id as keyof typeof filters]}
            onChange={() =>
              setFilters((prev) => ({ ...prev, [filter.id]: !prev[filter.id as keyof typeof prev] }))
            }
          />
        </label>
      ))}
    </div>

    <div className="mt-8 flex gap-3">
      <button
        onClick={() => setFilters({ hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false })}
        className={`flex-1 py-3 text-xs font-bold rounded-2xl transition-colors ${isDark ? "bg-[var(--bg-tertiary)] text-gray-400 hover:bg-white/5" : "bg-slate-50 text-slate-500 hover:bg-black/5"}`}
      >
        {t("chat.filters.reset")}
      </button>
      <button
        onClick={onClose}
        className="flex-1 py-3 text-xs font-bold rounded-2xl bg-orange-500 text-[var(--text-primary)] transition-opacity hover:opacity-90 shadow-md"
      >
        {t("chat.filters.apply")}
      </button>
    </div>
  </AppModal>
);




