import { motion } from "motion/react";

const TABS = [
  { id: "stories", labelKey: "chat.tabs.stories" },
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
  <div className={`flex items-center gap-3 sm:gap-5 mb-4 sm:mb-6 px-1 border-b pb-3 overflow-x-auto scrollbar-none shrink-0 ${isDark ? "border-white/5" : "border-black/5"}`} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
    {TABS.map((tab) => (
      <div
        key={tab.id}
        onClick={() => onSelect(tab.id)}
        className={`text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors relative shrink-0 ${view === tab.id ? (isDark ? "text-orange-500" : "text-orange-600") : (isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600")}`}
      >
        {t(tab.labelKey)}
        {view === tab.id && (
          <motion.div layoutId="messengerTab" className={`absolute -bottom-[13px] left-0 right-0 h-[2px] rounded-full ${isDark ? "bg-orange-500" : "bg-orange-600"}`} />
        )}
      </div>
    ))}
  </div>
);
