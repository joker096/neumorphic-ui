import React from "react";
import { motion } from "motion/react";
import type { ComponentType } from "react";

type NavIcon = ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;

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
      ? `relative flex h-full min-w-[56px] min-h-[48px] flex-1 flex-col items-center justify-center cursor-pointer
         transition-all duration-200 active:scale-[0.98] focus-visible:outline-none
         focus-visible:ring-2 focus-visible:ring-[#6f7fff]/40
         ${active
           ? isDark
             ? "text-[#6f7fff]"
             : "text-[#6f7fff]"
           : isDark
             ? "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
             : "text-slate-400 hover:text-slate-600"}`
      : variant === "eco"
        ? `flex min-h-[44px] items-center gap-3 rounded-2xl px-3 py-3
           transition-all duration-300 cursor-pointer relative
           ${active
             ? "bg-white text-emerald-800 shadow-[0_4px_15px_rgba(0,0,0,0.15)]"
             : "text-white/90 hover:bg-white/10"}`
         : `flex min-h-[44px] items-center justify-center rounded-xl px-3 py-2.5 cursor-pointer
            transition-all duration-200 active:scale-[0.97] focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-[#6f7fff]/40
           ${active
             ? isDark
               ? "bg-gradient-to-br from-[#6f7fff]/20 to-[#965dff]/15 text-[#6f7fff] shadow-[0_4px_16px_rgba(111,127,255,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]"
               : "bg-gradient-to-br from-[#6f7fff]/12 to-[#965dff]/8 text-[#6f7fff] shadow-[0_2px_10px_rgba(111,127,255,0.15),inset_0_1px_0_rgba(255,255,255,0.9)]"
             : isDark
               ? "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.05] active:bg-white/[0.08]"
               : "text-slate-500 hover:text-slate-800 hover:bg-black/[0.04] active:bg-black/[0.07]"}`;

    const badgeClassName = isBottom
      ? `absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center
         ${isDark
           ? "bg-[#6f7fff] shadow-[0_0_8px_rgba(111,127,255,0.6)]"
           : "bg-[#6f7fff] shadow-[0_2px_4px_rgba(111,127,255,0.4)]"}`
      : variant === "eco"
        ? `absolute -top-1 -right-1 min-w-[18px] h-4 px-1 rounded-full flex items-center justify-center bg-emerald-500`
         : `absolute top-[6px] right-[6px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center
            ${isDark
              ? "bg-gradient-to-br from-[#6f7fff] to-[#965dff] shadow-[0_2px_8px_rgba(111,127,255,0.45)]"
              : "bg-gradient-to-br from-[#6f7fff] to-[#965dff] shadow-[0_1px_5px_rgba(111,127,255,0.35)]"}`;

    return (
      <button
        type="button"
        aria-current={active ? "page" : undefined}
        aria-label={label}
        onClick={onClick}
        className={buttonClassName}
      >
        <Icon className="w-[1.25rem] h-[1.25rem] flex-shrink-0" strokeWidth={active ? 2.5 : 1.75} />
        {variant === "eco" && (
          <span className="font-medium whitespace-nowrap">{label}</span>
        )}
        {showBadge && (
          <div className={badgeClassName}>
            <span className={variant === "eco" ? "text-[9px]" : "text-[8px]"} aria-hidden="true">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          </div>
        )}
      </button>
    );
  },
);
