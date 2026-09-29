import React from "react";
import { NAV_ITEMS, isCompanyAdmin } from "../../config/navigation";
import { useAppStore } from "../../store";
import { NavItemButton } from "./NavItemButton";
import { TransportIndicator } from "../status/TransportIndicator";

type BottomNavProps = {
  activeView: string;
  isDark?: boolean;
  unreadCount: number;
  companyUnreadCount?: number;
  onNavigate: (view: string) => void;
  t: (key: string) => string;
  hideCompany?: boolean;
  connectionStatus?: "disconnected" | "connecting" | "connected" | "blocked" | "error";
  connectionError?: string | null;
};

const BADGE_ITEM_IDS = new Set(["chats", "company"]);

export const BottomNav = React.memo(({ activeView, isDark = false, unreadCount, companyUnreadCount, onNavigate, t, hideCompany = false, connectionStatus = "disconnected", connectionError = null }: BottomNavProps) => {
  const companyMembers = useAppStore((s) => s.companyMembers);
  const userProfile = useAppStore((s) => s.userProfile);
  const transportBackend = useAppStore((s) => s.transportBackend);
  const relayed = transportBackend !== undefined && transportBackend !== "direct";
  const admin = isCompanyAdmin(companyMembers, userProfile.id);
  const filteredItems = NAV_ITEMS.filter(
    item => !(item.id === "company" && hideCompany) && (!item.adminOnly || admin),
  );
  const profileLabel = userProfile.name || (userProfile.username ? `@${userProfile.username}` : t("settings.defaultUserName"));
  const isSettingsActive = activeView === "settings";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around pl-[calc(0.5rem+env(safe-area-inset-left,0px))] pr-[calc(0.5rem+env(safe-area-inset-right,0px))] pb-[env(safe-area-inset-bottom,0px)] pt-2 md:hidden bg-[var(--msg-bg-secondary)]/90 backdrop-blur-[var(--msg-glass-blur)] border-t border-[var(--msg-border-soft)]"
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
      <TransportIndicator status={connectionStatus} detail={connectionError} relayed={relayed} />
      <button
        type="button"
        aria-label={profileLabel}
        aria-current={isSettingsActive ? "page" : undefined}
        onClick={() => onNavigate("settings")}
        className={`flex h-full w-[44px] min-w-11 min-h-11 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40 ${
          isSettingsActive
            ? isDark
              ? "bg-white/[0.05]"
              : "bg-black/[0.05]"
            : isDark
              ? "hover:bg-white/[0.04]"
              : "hover:bg-black/[0.03]"
        }`}
      >
        <span
          className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] text-white text-xs font-bold ${
            isSettingsActive ? "ring-2 ring-[var(--accent)]" : ""
          }`}
        >
          {userProfile.avatar ? (
            <img
              src={userProfile.avatar}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            (userProfile.name || userProfile.username || "U").charAt(0).toUpperCase()
          )}
        </span>
      </button>
    </nav>
  );
});



