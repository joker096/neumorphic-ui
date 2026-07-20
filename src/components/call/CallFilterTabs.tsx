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
  <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 shrink-0" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
    {FILTERS.map((tab) => (
      <motion.button
        key={tab.id}
        onClick={() => { onFilterChange(tab.id); }}
        whileTap={{ scale: 0.95 }}
        className={`text-[10px] font-bold uppercase cursor-pointer transition-colors px-2.5 py-1.5 rounded-lg shrink-0 ${
          callFilter === tab.id && activeFolder === 'all'
            ? isDark ? "bg-white/10 text-white" : "bg-black/10 text-slate-800"
            : isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        {t(tab.labelKey)}
      </motion.button>
    ))}
  </div>
);
