import React, { useState } from 'react';

export const ActionCircleButton: React.FC<{
  icon: any;
  theme: 'light' | 'dark';
  label: string;
  color?: string;
  isToggleable?: boolean;
}> = ({ icon: Icon, theme, label, color = "default", isToggleable = true }) => {
  const [active, setActive] = useState(false);
  const isDark = theme === "dark";

  let iconColor = isDark ? "text-white/70" : "text-slate-500";
  let hoverIconColor = isDark
    ? "group-hover:text-white"
    : "group-hover:text-slate-800";
  let activeIconColor = isDark
    ? "text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
    : "text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,1)]";

  if (color === "red") {
    iconColor = isDark ? "text-red-400/80" : "text-red-500";
    hoverIconColor = isDark
      ? "group-hover:text-red-300 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]"
      : "group-hover:text-red-600";
    activeIconColor = isDark
      ? "text-red-400 drop-shadow-[0_0_12px_rgba(248,113,113,0.8)] scale-105"
      : "text-red-600 drop-shadow-[0_2px_4px_rgba(220,38,38,0.3)] scale-105";
  } else if (color === "yellow") {
    iconColor = "text-amber-500";
    hoverIconColor = isDark
      ? "group-hover:text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
      : "group-hover:text-amber-400";
    activeIconColor = isDark
      ? "text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-105"
      : "text-amber-500 drop-shadow-[0_1px_1px_rgba(255,255,255,1)] scale-105";
  } else if (color === "green") {
    iconColor = isDark ? "text-teal-400" : "text-teal-600";
    hoverIconColor = isDark
      ? "group-hover:text-teal-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]"
      : "group-hover:text-teal-700";
    activeIconColor =
      "text-teal-400 drop-shadow-[0_0_12px_rgba(45,212,191,0.8)] scale-105";
  } else if (color === "blue") {
    iconColor = isDark ? "text-blue-400" : "text-blue-600";
    hoverIconColor = isDark
      ? "group-hover:text-blue-300 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]"
      : "group-hover:text-blue-700";
    activeIconColor = isDark
      ? "text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.8)] scale-105"
      : "text-blue-600 drop-shadow-[0_1px_1px_rgba(255,255,255,1)] scale-105";
  }

  // default blue/teal when active if no color specified
  if (active && color === "default") {
    activeIconColor = isDark
      ? "text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.8)] scale-105"
      : "text-orange-500 scale-105 drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)]";
  }

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
          className={`transition-all duration-300 ${active ? activeIconColor : `${iconColor} ${hoverIconColor} text-slate-800`}`}
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
