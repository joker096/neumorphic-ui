import React, { useState } from 'react';
import { getButtonTheme, ACTIVE_DEFAULT_COLOR } from '../../config/buttonThemes';
import type { ButtonColor } from '../../config/buttonThemes';

export const ActionCircleButton: React.FC<{
  icon: any;
  theme?: 'light' | 'dark';
  label: string;
  color?: ButtonColor;
  isToggleable?: boolean;
}> = ({ icon: Icon, theme = 'dark', label, color = "default", isToggleable = true }) => {
  const [active, setActive] = useState(false);
  const isDark = theme === "dark";

  const themeColors = getButtonTheme(isDark ? 'dark' : 'light', color);
  const activeIconColor = active
    ? color === 'default'
      ? ACTIVE_DEFAULT_COLOR[isDark ? 'dark' : 'light']
      : themeColors.activeIcon
    : '';

  return (
    <div
      className="flex flex-col items-center gap-3 group cursor-pointer w-[80px]"
      onClick={() => isToggleable && setActive(!active)}
    >
      <div
        className={`relative w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-300 ${!active ? "group-hover:scale-[1.05] active:scale-95" : "scale-95"} ${
          isDark
            ? active
              ? "bg-[#101216] shadow-[inset_0_12px_24px_rgba(0,0,0,0.9),_inset_0_3px_6px_rgba(0,0,0,0.9)] border border-orange-500/20"
              : "bg-[#13151b] shadow-[0_12px_24px_rgba(0,0,0,0.5),_inset_0_1.5px_2px_rgba(255,255,255,0.08),_inset_0_-2px_4px_rgba(0,0,0,0.8)] border border-white/[0.04]"
            : active
              ? "bg-[#e2e8f0] shadow-[inset_4px_4px_10px_rgba(165,175,190,0.4),_inset_-2px_-2px_6px_rgba(255,255,255,1)] border border-black/5"
              : "bg-[#eaeff4] shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),_8px_8px_16px_rgba(165,175,190,0.5),_inset_2px_2px_4px_rgba(255,255,255,1)] border border-white/80"
        }`}
      >
        {active && (
          <div className="absolute inset-0 rounded-full bg-orange-500/10 blur-[6px] animate-pulse" />
        )}
        <Icon
          size={24}
          strokeWidth={1.75}
          className={`transition-all duration-300 ${active ? activeIconColor : `${themeColors.icon} ${themeColors.hoverIcon}`}`}
        />
      </div>
      <span
        className={`text-[10.5px] font-bold uppercase tracking-wider text-center transition-colors ${active ? (isDark ? "text-orange-400" : "text-orange-600") : isDark ? "text-gray-500 group-hover:text-gray-300" : "text-slate-500 group-hover:text-slate-800"}`}
      >
        {label}
      </span>
    </div>
  );
};
