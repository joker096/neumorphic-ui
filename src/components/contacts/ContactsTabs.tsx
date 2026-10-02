import { useMemo } from "react";
import { motion } from "motion/react";
import { Users, Star, Clock, UserX } from "lucide-react";
import { SearchInput } from "../ui/SearchInput";
import type { Contact } from "../../types/contact";

export type TabOption = "all" | "favorites" | "recent" | "blocked";

type T = (key: string, options?: any) => string;

interface ContactsTabsProps {
  contacts: Contact[];
  filteredCount: number;
  searchQuery: string;
  activeTab: TabOption;
  isDark: boolean;
  t: T;
  onSearchChange: (value: string) => void;
  onTabChange: (tab: TabOption) => void;
}
export function ContactsTabs({ contacts, filteredCount, searchQuery, activeTab, isDark, t, onSearchChange, onTabChange }: ContactsTabsProps) {
  const tabs = useMemo(() => [
    { key: "all" as TabOption, label: t("contacts.allTab", { count: contacts.length }), icon: <Users size={12} /> },
    { key: "favorites" as TabOption, label: t("contacts.favoritesTab", { count: contacts.filter(c => c.isFavorite).length }), icon: <Star size={12} /> },
    { key: "recent" as TabOption, label: t("contacts.recentTab"), icon: <Clock size={12} /> },
    { key: "blocked" as TabOption, label: t("contacts.blockedTab", { count: contacts.filter(c => c.isBlocked).length }), icon: <UserX size={12} /> },
  ], [contacts, t]);

  return (
    <div className="w-full mb-4">
      <div className="mb-3">
        <SearchInput value={searchQuery} onChange={onSearchChange}
          placeholder={t('contacts.searchPlaceholder')} isDark={isDark} shape="pill" />
      </div>

      <div className={`flex rounded-full p-1 overflow-x-auto scrollbar-none ${isDark ? "bg-white/5" : "bg-black/5"}`} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        {tabs.map(tab => (
          <motion.button key={tab.key} whileTap={{ scale: 0.95 }}
            onClick={() => onTabChange(tab.key)} aria-pressed={activeTab === tab.key}
            className={`group min-h-11 min-w-11 p-1 flex items-center justify-center rounded-full shrink-0 cursor-pointer ${
              activeTab === tab.key
                ? (isDark ? 'bg-white/10 shadow-sm' : 'bg-white shadow-sm')
                : ''
            }`}>
            <span className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? (isDark ? 'text-[var(--text-primary)]' : 'text-slate-800')
                : (isDark ? 'text-gray-400 group-hover:text-gray-300' : 'text-slate-500 group-hover:text-slate-700')
            }`}>
              {tab.icon}
              {tab.label}
            </span>
          </motion.button>
        ))}
      </div>

      {searchQuery && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className={`text-xs mt-2 px-1 ${isDark ? "text-gray-500" : "text-slate-500"}`}>
          {t('contacts.foundResults', { count: filteredCount, total: contacts.length })}
        </motion.div>
      )}
    </div>
  );
}
