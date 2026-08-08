import React from "react";
import { NAV_ITEMS } from "../../config/navigation";
import { NavItemButton } from "./NavItemButton";
import { Tooltip } from "../Tooltip";

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
        isDark ? "bg-[var(--bg-primary)] border-r-white/[0.06]" : "bg-[var(--bg-primary)] border-r-black/[0.06]"
      }`}
    >
      <nav className="flex-1 flex flex-col gap-1 px-2 mt-6">
          {filteredItems.map((item) => {
          const isActive = activeView === item.id;
          const badgeCount = BADGE_ITEM_IDS.has(item.id)
            ? item.id === "chats"
              ? unreadCount
              : companyUnreadCount ?? 0
            : 0;
          const label = t(item.label);
          return (
            <Tooltip key={item.id} content={label} position="right" theme={isDark ? "dark" : "light"}>
              <NavItemButton
                variant="sidebar"
                icon={item.icon}
                label={label}
                active={isActive}
                badgeCount={badgeCount}
                isDark={isDark}
                onClick={() => onNavigate(item.id)}
              />
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
});



