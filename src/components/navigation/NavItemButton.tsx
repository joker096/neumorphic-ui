import React from "react";
import { AppIcon, type AppIconSource } from "../ui/AppIcon";

type NavIcon = AppIconSource;

type NavItemButtonProps = {
  active: boolean;
  badgeCount?: number;
  isDark?: boolean;
  label: string;
  icon: NavIcon;
  onClick: () => void;
  variant: "bottom" | "sidebar" | "eco";
};

export const NavItemButton = React.memo(
  ({ active, badgeCount = 0, isDark = false, label, icon: Icon, onClick, variant }: NavItemButtonProps) => {
    const showBadge = badgeCount > 0;
    const isBottom = variant === "bottom";

    const buttonClassName = isBottom
      ? `relative flex h-full min-w-11 min-h-11 flex-1 flex-col items-center justify-center cursor-pointer
         transition-all duration-200 active:scale-[0.98] focus-visible:outline-none
         focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40
${active
           ? "text-[var(--accent)]"
           : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"}`
       : variant === "eco"
        ? `flex min-h-11 items-center gap-3 rounded-2xl px-3 py-3
           transition-all duration-300 cursor-pointer relative
           ${active
             ? "bg-white text-emerald-800 shadow-[0_4px_15px_rgba(0,0,0,0.15)]"
             : "text-white/90 hover:bg-white/10"}`
         : `flex min-h-11 items-center justify-center rounded-xl px-3 py-2.5 cursor-pointer
            transition-all duration-200 active:scale-[0.97] focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40
           ${active
             ? isDark
               ? "bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent2)]/15 text-[var(--accent)] shadow-[0_4px_16px_rgba(var(--accent-rgb),0.25),inset_0_1px_0_rgba(255,255,255,0.1)]"
               : "bg-gradient-to-br from-[var(--accent)]/12 to-[var(--accent2)]/8 text-[var(--accent)] shadow-[0_2px_10px_rgba(var(--accent-rgb),0.15),inset_0_1px_0_rgba(255,255,255,0.9)]"
             : isDark
               ? "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.05] active:bg-white/[0.08]"
               : "text-slate-500 hover:text-slate-800 hover:bg-black/[0.04] active:bg-black/[0.07]"}`;

    const badgeClassName = isBottom
           ? `absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center
         ${isDark
           ? "bg-[var(--accent)] shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]"
           : "bg-[var(--accent)] shadow-[0_2px_4px_rgba(var(--accent-rgb),0.4)]"}`
       : variant === "eco"
         ? `absolute -top-1 -right-1 min-w-[18px] h-4 px-1 rounded-full flex items-center justify-center bg-emerald-500`
         : `absolute top-[6px] right-[6px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center
            ${isDark
              ? "bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] shadow-[0_2px_8px_rgba(var(--accent-rgb),0.45)]"
              : "bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] shadow-[0_1px_5px_rgba(var(--accent-rgb),0.35)]"}`;

    return (
      <button
        type="button"
        aria-current={active ? "page" : undefined}
        aria-label={label}
        onClick={onClick}
        className={buttonClassName}
      >
        <AppIcon icon={Icon} size={20} active={active} className="flex-shrink-0" />
        {variant === "eco" && (
          <span className="font-medium whitespace-nowrap">{label}</span>
        )}
        {showBadge && (
          <div className={badgeClassName}>
            <span className={variant === "eco" ? "text-xs" : "text-xs"} aria-hidden="true">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          </div>
        )}
      </button>
    );
  },
);
