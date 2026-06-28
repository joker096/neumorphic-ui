import { MessageCircle, Phone, Settings, Users } from "lucide-react";
import { CustomDiamondIcon } from "../app/CustomDiamondIcon";

type SidebarNavProps = {
  activeView: string;
  isDark: boolean;
  unreadCount: number;
  companyUnreadCount?: number;
  onNavigate: (view: string) => void;
  t: (key: string) => string;
};

const NAV_ITEMS = [
  { id: "chats", label: "nav.chats", icon: MessageCircle },
  { id: "calls", label: "nav.calls", icon: Phone },
  { id: "contacts", label: "nav.contacts", icon: Users },
  { id: "settings", label: "nav.settings", icon: Settings },
];

export const SidebarNav = ({ activeView, isDark, unreadCount, companyUnreadCount, onNavigate, t }: SidebarNavProps) => (
  <aside
    className={`hidden md:flex flex-col w-64 h-[100dvh] shrink-0 border-r ${
      isDark ? "bg-[#0d1017] border-r-white/[0.06]" : "bg-[#f0f2f5] border-r-black/[0.06]"
    }`}
  >
    <div className="flex items-center gap-3 px-6 pt-8 pb-6">
      <CustomDiamondIcon
        className={`w-8 h-8 ${
          isDark
            ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]"
            : "text-orange-600 drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)]"
        }`}
      />
      <span className={`text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-slate-800"}`}>
        Mess&Anger
      </span>
    </div>

    <nav className="flex-1 flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        const showBadge = (item.id === "chats" && unreadCount > 0) || (item.id === "company" && companyUnreadCount > 0);
        const badgeCount = item.id === "chats" ? unreadCount : companyUnreadCount;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
              isActive
                ? isDark
                  ? "bg-orange-500/15 text-orange-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  : "bg-orange-500/10 text-orange-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                : isDark
                  ? "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                  : "text-slate-500 hover:text-slate-800 hover:bg-black/[0.03]"
            }`}
          >
            <div className="relative">
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              {showBadge && (
                <div className={`absolute -top-1.5 -right-2 min-w-[14px] h-3.5 px-1 rounded-full flex items-center justify-center ${
                  isDark
                    ? "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]"
                    : "bg-orange-500 shadow-[0_1px_3px_rgba(249,115,22,0.3)]"
                }`}>
                  <span className="text-[8px] font-bold text-white leading-none">{badgeCount > 99 ? "99+" : badgeCount}</span>
                </div>
              )}
            </div>
            <span>{t(item.label)}</span>
          </button>
        );
      })}
    </nav>
  </aside>
);
