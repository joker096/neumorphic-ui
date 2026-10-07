import { motion } from "motion/react";

const TABS = [
  { id: "chats", labelKey: "chat.tabs.chats" },
  { id: "channels", labelKey: "chat.tabs.channels" },
  { id: "bots", labelKey: "chat.tabs.bots" },
];

interface ViewTabsProps {
  view: string;
  isDark: boolean;
  onSelect: (id: string) => void;
  t: (key: string, options?: any) => string;
}

export const ViewTabs = ({ view, isDark, onSelect, t }: ViewTabsProps) => (
  <div className={`flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 px-1 border-b pb-3 overflow-x-auto scrollbar-none shrink-0 ${"border-[var(--border-color)]"}`} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
    {TABS.map((tab) => (
      <div
        key={tab.id}
        onClick={() => onSelect(tab.id)}
        className={`text-xs sm:text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors relative shrink-0 ${view === tab.id ? (isDark ? "text-orange-500" : "text-orange-600") : (isDark ? "text-[var(--text-secondary)] hover:text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]")}`}
      >
        {t(tab.labelKey)}
        {view === tab.id && (
          <motion.div layoutId="messengerTab" className={`absolute -bottom-[13px] left-0 right-0 h-[2px] rounded-full ${isDark ? "bg-orange-500" : "bg-orange-600"}`} />
        )}
      </div>
    ))}
  </div>
);

