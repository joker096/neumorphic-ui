import { motion } from "motion/react";
import { MessageCircle, Phone, Settings, Users } from "lucide-react";

type BottomNavProps = {
  activeView: string;
  isDark: boolean;
  unreadCount: number;
  onNavigate: (view: string) => void;
  t: (key: string) => string;
};

const NAV_ITEMS = [
  { id: "chats", label: "nav.chats", icon: MessageCircle },
  { id: "contacts", label: "nav.contacts", icon: Users },
  { id: "calls", label: "nav.calls", icon: Phone },
  { id: "settings", label: "nav.settings", icon: Settings },
];

export const BottomNav = ({ activeView, isDark, unreadCount, onNavigate, t }: BottomNavProps) => (
  <nav
    className={`fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)] pt-2 md:hidden ${
      isDark
        ? "bg-[#0d1017]/90 backdrop-blur-xl border-t border-white/[0.06]"
        : "bg-[#eaeff4]/90 backdrop-blur-xl border-t border-black/[0.06]"
    }`}
    style={{ height: "calc(56px + env(safe-area-inset-bottom, 0px))" }}
  >
    {NAV_ITEMS.map((item) => {
      const Icon = item.icon;
      const isActive = activeView === item.id;
      return (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`relative flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-200 ${
            isActive
              ? isDark
                ? "text-orange-400"
                : "text-orange-600"
              : isDark
                ? "text-gray-500 hover:text-gray-300"
                : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <div className="relative">
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
            {item.id === "chats" && unreadCount > 0 && (
              <div className={`absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center ${
                isDark
                  ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                  : "bg-orange-500 shadow-[0_2px_4px_rgba(249,115,22,0.4)]"
              }`}>
                <span className="text-[9px] font-bold text-white leading-none">{unreadCount > 99 ? "99+" : unreadCount}</span>
              </div>
            )}
          </div>
          <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? "opacity-100" : "opacity-60"}`}>
            {t(item.label)}
          </span>
          {isActive && (
            <motion.div
              layoutId="bottomNavActive"
              className={`absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full ${isDark ? "bg-orange-500" : "bg-orange-600"}`}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      );
    })}
  </nav>
);
