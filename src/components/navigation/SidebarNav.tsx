import React from "react";
import { NAV_ITEMS } from "../../config/navigation";
import { NavItemButton } from "./NavItemButton";

type SidebarNavProps = {
  activeView: string;
  isDark?: boolean;
  unreadCount: number;
  companyUnreadCount?: number;
  onNavigate: (view: string) => void;
  t: (key: string) => string;
  hideCompany?: boolean;
};

const BADGE_ITEM_IDS = new Set(["chats", "company"]);

export const SidebarNav = React.memo(({ activeView, isDark = false, unreadCount, companyUnreadCount, onNavigate, t, hideCompany = false }: SidebarNavProps) => {
  const filteredItems = NAV_ITEMS.filter(item => !(item.id === "company" && hideCompany));

  return (
    <aside
      className={`hidden md:flex flex-col w-16 h-[100dvh] shrink-0 border-r ${
        isDark ? "bg-[var(--bg-primary)] border-r-white/[0.05]" : "bg-[var(--bg-primary)] border-r-black/[0.05]"
      }`}
      style={isDark ? {} : { background: "linear-gradient(180deg, #eef1f7 0%, #f5f7fa 100%)" }}
    >
      {/* Logo / app mark */}
      <div className="flex items-center justify-center h-16 shrink-0 border-b border-transparent">
        <div
          className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm select-none ${
            isDark
              ? "bg-gradient-to-br from-[#6f7fff] to-[#965dff] text-white shadow-[0_4px_14px_rgba(111,127,255,0.35)]"
              : "bg-gradient-to-br from-[#6f7fff] to-[#965dff] text-white shadow-[0_3px_10px_rgba(111,127,255,0.3)]"
          }`}
          style={{ fontSize: 13, letterSpacing: "-0.02em" }}
          aria-hidden="true"
        >
          M
        </div>
      </div>

      {/* Divider */}
      <div className={`mx-3 h-px ${isDark ? "bg-white/[0.05]" : "bg-black/[0.05]"}`} />

      <nav className="flex-1 flex flex-col gap-1.5 px-2 mt-3" role="navigation">
          {filteredItems.map((item) => {
          const isActive = activeView === item.id;
          const badgeCount = BADGE_ITEM_IDS.has(item.id)
            ? item.id === "chats"
              ? unreadCount
              : companyUnreadCount ?? 0
            : 0;
          const label = t(item.label);
          return (
            <div key={item.id} className="relative rounded-xl">
              {/* Active pill indicator */}
              {isActive && (
                <span
                  className={`absolute left-0 inset-y-1.5 w-[3px] rounded-full ${
                    isDark
                      ? "bg-gradient-to-b from-[#6f7fff] to-[#965dff]"
                      : "bg-gradient-to-b from-[#6f7fff] to-[#965dff]"
                  }`}
                  aria-hidden="true"
                />
              )}
              <NavItemButton
                variant="sidebar"
                icon={item.icon}
                label={label}
                active={isActive}
                badgeCount={badgeCount}
                isDark={isDark}
                onClick={() => onNavigate(item.id)}
              />
            </div>
          );
        })}
      </nav>

      {/* Bottom user section */}
      <div className={`mx-3 mb-4 mt-auto h-px ${isDark ? "bg-white/[0.05]" : "bg-black/[0.05]"}`} />
      <div className="flex items-center justify-center pb-4">
        <div
          className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${
            isDark
              ? "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-[inset_0_1px_3px_rgba(255,255,255,0.08)]"
              : "bg-white text-slate-500 hover:text-slate-700 shadow-[0_1px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)]"
          }`}
          aria-hidden="true"
        >
          ?
        </div>
      </div>
    </aside>
  );
});



