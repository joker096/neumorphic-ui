import type { NavItem } from "../../config/navigation";
import { NAV_ITEMS } from "../../config/navigation";
import { useAppStore } from "../../store";

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
  t,
}: {
  activeView: string;
  isDark?: boolean;
  unreadCount?: number;
  companyUnreadCount?: number;
  onNavigate?: (view: string) => void;
  hideCompany?: boolean;
  t?: (key: string, fallback?: string) => string;
}) => {
  const effectiveT = t || ((key: string, fallback?: string) => key);
  const userProfile = useAppStore((s) => s.userProfile);
  const items = NAV_ITEMS.filter((item) => !(item.id === "company" && hideCompany));

  const surfaceBg = isDark
    ? "linear-gradient(180deg, rgba(7,10,15,0.98) 0%, rgba(13,18,25,0.98) 100%)"
    : "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,246,249,0.98) 100%)";
  const hoverBg = isDark ? "hover:bg-white/[0.04]" : "hover:bg-black/[0.04]";
  const footerStatusRing = isDark ? "#070a0f" : "#ffffff";

  const handleProfileClick = () => onNavigate?.("settings");

  return (
    <aside
      className="hidden md:flex flex-col w-[76px] h-[100dvh] shrink-0 relative z-40 border-r border-[var(--border-color)]"
      style={{
        background: surfaceBg,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-2 space-y-1 overflow-y-auto">
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
              onClick={() => onNavigate?.(item.id)}
              className={`relative w-full flex flex-col items-center justify-center gap-1 min-h-[44px] rounded-xl py-2.5 px-1 transition-all duration-200 cursor-pointer ${
                isActive
                  ? "text-[var(--accent)]"
                  : `text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] ${hoverBg}`
              }`}
              style={
                isActive
                  ? {
                      background:
                        "linear-gradient(135deg, rgba(111,127,255,0.15) 0%, rgba(150,93,255,0.08) 100%)",
                      boxShadow: "0 0 12px rgba(111,127,255,0.15)",
                    }
                  : undefined
              }
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[var(--accent)]"
                  style={{ boxShadow: "0 0 6px rgba(111,127,255,0.5)" }}
                />
              )}
              <span className="relative">
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.25 : 1.75} />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-br from-[#6f7fff] to-[#965dff] text-white text-[9px] font-semibold flex items-center justify-center shadow-md" style={{ boxShadow: "0 0 8px rgba(111,127,255,0.4)" }}>
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium leading-none truncate max-w-full px-0.5">
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer - Profile */}
      <div className="p-2 border-t border-[var(--border-color)] space-y-1">
        <button
          type="button"
          aria-label={userProfile.name || effectiveT("settings.defaultUserName", "User")}
          onClick={handleProfileClick}
          className={`w-full flex items-center justify-center min-h-[44px] rounded-xl py-2 ${hoverBg} transition-all cursor-pointer`}
        >
          <span className="relative inline-flex">
            {userProfile.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name ? `${userProfile.name} profile picture` : "Profile picture"}
                className="w-8 h-8 rounded-full object-cover shadow-lg"
                style={{ boxShadow: "0 0 10px rgba(111,127,255,0.25)" }}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6f7fff] to-[#965dff] flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{ boxShadow: "0 0 10px rgba(111,127,255,0.25)" }}>
                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : "U"}
              </span>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--success)] border-2 rounded-full" style={{ borderColor: footerStatusRing }} />
          </span>
        </button>
      </div>
    </aside>
  );
};
