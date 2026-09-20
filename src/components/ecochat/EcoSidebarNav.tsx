import type { NavItem } from "../../config/navigation";
import { NAV_ITEMS, isCompanyAdmin } from "../../config/navigation";
import { useAppStore } from "../../store";
import { AppIcon } from "../ui/AppIcon";
import { TransportIndicator } from "../status/TransportIndicator";

const BADGE_ITEM_IDS = new Set(["chats", "company"]);

/**
 * Icon-rail sidebar matching the premium dark messenger design.
 */
export const EcoSidebarNav = ({
  activeView,
  isDark = true,
  unreadCount = 0,
  companyUnreadCount = 0,
  onNavigate,
  hideCompany = false,
  connectionStatus = "disconnected",
  connectionError = null,
  t,
}: {
  activeView: string;
  isDark?: boolean;
  unreadCount?: number;
  companyUnreadCount?: number;
  onNavigate?: (view: string) => void;
  hideCompany?: boolean;
  connectionStatus?: "disconnected" | "connecting" | "connected" | "blocked" | "error";
  connectionError?: string | null;
  t?: (key: string, fallback?: string) => string;
}) => {
  const effectiveT = t || ((key: string, fallback?: string) => key);
  const userProfile = useAppStore((s) => s.userProfile);
  const companyMembers = useAppStore((s) => s.companyMembers);
  const transportBackend = useAppStore((s) => s.transportBackend);
  const relayed = transportBackend !== undefined && transportBackend !== "direct";
  const admin = isCompanyAdmin(companyMembers, userProfile.id);
  const items = NAV_ITEMS.filter(
    (item) => !(item.id === "company" && hideCompany) && (!item.adminOnly || admin),
  );

  const hoverBg = isDark ? "hover:bg-white/[0.04]" : "hover:bg-black/[0.04]";
  const footerStatusRing = isDark ? "#070a0f" : "#ffffff";

  const handleProfileClick = () => onNavigate?.("settings");

  return (
    <aside
      className="hidden md:flex ds-sidebar w-[76px] h-[100dvh] shrink-0 relative z-40"
    >
      {/* Navigation */}
      <nav className="flex w-full flex-1 flex-col px-2 space-y-2 overflow-y-auto">
        {items.map((item: NavItem) => {
          const isActive = activeView === item.id;
          const badgeCount = BADGE_ITEM_IDS.has(item.id)
            ? item.id === "chats"
              ? unreadCount
              : item.id === "company"
              ? companyUnreadCount ?? 0
              : unreadCount
            : 0;
          const label = effectiveT(item.label);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
              title={label}
              onClick={() => onNavigate?.(item.id)}
              className={`relative w-full flex flex-col items-center justify-center gap-1 min-h-12 rounded-xl py-2 px-1 transition-all duration-200 active:scale-[0.94] cursor-pointer ${
                isActive
                  ? "text-[var(--accent)]"
                  : `text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] ${hoverBg}`
              }`}
              style={
                isActive
                  ? {
                      background:
                        "linear-gradient(135deg, rgba(var(--accent-rgb),0.15) 0%, rgba(var(--accent2-rgb),0.08) 100%)",
                      boxShadow:
                        "0 0 12px rgba(var(--accent-rgb),0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
                    }
                  : undefined
              }
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[var(--accent)]"
                  style={{ boxShadow: "0 0 6px rgba(var(--accent-rgb),0.5)" }}
                />
              )}
              <span className="relative">
                <AppIcon icon={Icon} size={20} active={isActive} />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] text-white text-xs font-semibold flex items-center justify-center shadow-md" style={{ boxShadow: "0 0 8px rgba(var(--accent-rgb),0.4)" }}>
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer - Status + Profile */}
      <div className="w-full p-2 border-t border-[var(--border-color)] space-y-1">
        <div className="w-full flex justify-center">
          <TransportIndicator status={connectionStatus} detail={connectionError} relayed={relayed} />
        </div>
        <button
          type="button"
          aria-label={userProfile.name || (userProfile.username ? `@${userProfile.username}` : effectiveT("settings.defaultUserName", "User"))}
          onClick={handleProfileClick}
          className={`w-full flex items-center justify-center min-h-11 rounded-xl py-2 ${hoverBg} transition-all duration-200 active:scale-[0.96] cursor-pointer`}
        >
          <span className="relative inline-flex">
            {userProfile.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name ? `${userProfile.name} profile picture` : "Profile picture"}
                className="w-8 h-8 rounded-full object-cover shadow-lg"
                style={{ boxShadow: "0 0 10px rgba(var(--accent-rgb),0.25)" }}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{ boxShadow: "0 0 10px rgba(var(--accent-rgb),0.25)" }}>
                {(userProfile.name || userProfile.username || "U").charAt(0).toUpperCase()}
              </span>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--success)] border-2 rounded-full" style={{ borderColor: footerStatusRing }} />
          </span>
        </button>
      </div>
    </aside>
  );
};
