import React from "react";
import { motion } from "motion/react";
import type { ComponentType } from "react";

type NavIcon = ComponentType<{ size?: number; strokeWidth?: number }>;

type NavItemButtonProps = {
  active: boolean;
  badgeCount?: number;
  isDark?: boolean;
  label: string;
  icon: NavIcon;
  onClick: () => void;
  variant: "bottom" | "sidebar";
};

export const NavItemButton = React.memo(
  ({ active, badgeCount = 0, isDark = false, label, icon: Icon, onClick, variant }: NavItemButtonProps) => {
    const showBadge = badgeCount > 0;
    const isBottom = variant === "bottom";

    const buttonClassName = isBottom
      ? `relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5
         transition-all duration-200 active:scale-[0.98] focus-visible:outline-none
         focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-0
         ${active
           ? isDark
             ? "text-orange-400"
             : "text-orange-600"
           : isDark
             ? "text-gray-500 hover:text-gray-300"
             : "text-slate-400 hover:text-slate-600"}`
      : `flex min-h-11 items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold
         transition-all duration-200 active:scale-[0.99] focus-visible:outline-none
         focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-0
         ${active
           ? isDark
             ? "bg-orange-500/15 text-orange-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
             : "bg-orange-500/10 text-orange-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
           : isDark
             ? "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
             : "text-slate-500 hover:text-slate-800 hover:bg-black/[0.03]"}`;

    const badgeClassName = isBottom
      ? `absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center
         ${isDark
           ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"
           : "bg-orange-500 shadow-[0_2px_4px_rgba(249,115,22,0.4)]"}`
      : `absolute -top-1.5 -right-2 min-w-[14px] h-3.5 px-1 rounded-full flex items-center justify-center
         ${isDark
           ? "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]"
           : "bg-orange-500 shadow-[0_1px_3px_rgba(249,115,22,0.3)]"}`;

    return (
      <button
        type="button"
        aria-current={active ? "page" : undefined}
        aria-label={label}
        onClick={onClick}
        className={buttonClassName}
      >
        <div className="relative">
          <Icon size={isBottom ? 22 : 20} strokeWidth={active ? 2.5 : 1.75} />
          {showBadge && (
            <div className={badgeClassName}>
              <span className={isBottom ? "text-[9px]" : "text-[8px]"} aria-hidden="true">
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            </div>
          )}
        </div>
        <span className={isBottom ? `text-[11px] font-bold uppercase tracking-wider ${active ? "opacity-100" : "opacity-60"}` : ""}>
          {label}
        </span>
        {isBottom && active && (
          <motion.div
            layoutId="bottomNavActive"
            className={`absolute -top-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full ${
              isDark ? "bg-orange-500" : "bg-orange-600"
            }`}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </button>
    );
  },
);
