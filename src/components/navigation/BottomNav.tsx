import React from "react";
import { NAV_ITEMS } from "../../config/navigation";
import { NavItemButton } from "./NavItemButton";

type BottomNavProps = {
  activeView: string;
  isDark?: boolean;
  unreadCount: number;
  companyUnreadCount?: number;
  onNavigate: (view: string) => void;
  t: (key: string) => string;
  hideCompany?: boolean;
};

const BADGE_ITEM_IDS = new Set(["chats", "company"]);

export const BottomNav = React.memo(({ activeView, isDark = false, unreadCount, companyUnreadCount, onNavigate, t, hideCompany = false }: BottomNavProps) => {
  const filteredItems = NAV_ITEMS.filter(item => !(item.id === "company" && hideCompany));

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)] pt-2 md:hidden ${
        isDark
          ? "bg-[var(--bg-primary)]/90 backdrop-blur-xl border-t border-[var(--border-color)]"
          : "bg-[var(--bg-secondary)]/90 backdrop-blur-xl border-t border-black/[0.06]"
      }`}
      style={{ height: "calc(56px + env(safe-area-inset-bottom, 0px))" }}
    >
      {filteredItems.map((item) => {
        const isActive = activeView === item.id;
        const badgeCount = BADGE_ITEM_IDS.has(item.id)
          ? item.id === "chats"
            ? unreadCount
            : companyUnreadCount ?? 0
          : 0;
        return (
          <NavItemButton
            key={item.id}
            variant="bottom"
            icon={item.icon}
            label={t(item.label)}
            active={isActive}
            badgeCount={badgeCount}
            isDark={isDark}
            onClick={() => onNavigate(item.id)}
          />
        );
      })}
    </nav>
  );
});



