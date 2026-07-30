import { motion } from "motion/react";

interface CallFilterTabsProps {
  callFilter: "all" | "incoming" | "outgoing" | "missed";
  activeFolder: string;
  isDark: boolean;
  t: (key: string) => string;
  onFilterChange: (filter: "all" | "incoming" | "outgoing" | "missed") => void;
}

const FILTERS = [
  { id: "all" as const, labelKey: "chat.all" },
  { id: "incoming" as const, labelKey: "chat.incomingShort" },
  { id: "outgoing" as const, labelKey: "chat.outgoingShort" },
  { id: "missed" as const, labelKey: "chat.missed" },
];

export const CallFilterTabs = ({ callFilter, activeFolder, isDark, t, onFilterChange }: CallFilterTabsProps) => (
  <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 shrink-0" role="tablist" aria-label={t('call.callHistory')} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
    {FILTERS.map((tab) => (
      <motion.button
        type="button"
        key={tab.id}
        onClick={() => { onFilterChange(tab.id); }}
        whileTap={{ scale: 0.95 }}
        aria-pressed={callFilter === tab.id && activeFolder === 'all'}
        aria-label={t(tab.labelKey)}
        className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg shrink-0 ${
          callFilter === tab.id && activeFolder === 'all'
            ? isDark ? "bg-white/10 text-[var(--text-primary)]" : "bg-black/10 text-slate-800"
            : isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        {t(tab.labelKey)}
      </motion.button>
    ))}
  </div>
);

