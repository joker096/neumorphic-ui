import React from 'react';

interface HubToggleIconProps {
  active: boolean;
  onClick?: (e: React.MouseEvent) => void;
  icon: React.ComponentType<any>;
  color: string;
  isDark: boolean;
  title?: string;
}

export const HubToggleIcon: React.FC<HubToggleIconProps> = ({ active, onClick, icon: Icon, color, isDark, title }) => {
  let activeColor = "";
  if (color === "purple")
    activeColor = isDark
      ? "text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]"
      : "text-purple-600 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]";
  if (color === "blue")
    activeColor = isDark
      ? "text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.8)]"
      : "text-orange-600 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]";
  if (color === "green")
    activeColor = isDark
      ? "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]"
      : "text-emerald-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]";

  const idleColor = isDark ? "text-gray-500" : "text-slate-400";

  return (
    <div
      onClick={(e) => onClick?.(e)}
      title={title}
      className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:[transform:scale(1.05)_translateZ(15px)] active:[transform:scale(0.95)_translateZ(0px)] ${
        active
          ? isDark
            ? "bg-[#1a1d24] shadow-[inset_0_4px_8px_rgba(0,0,0,0.8),_inset_0_-1px_2px_rgba(255,255,255,0.05)] border border-white/5"
            : "bg-[#eaeff4] shadow-[inset_3px_3px_6px_rgba(165,175,190,0.5),_inset_-2px_-2px_4px_rgba(255,255,255,1)] border border-black/5"
          : isDark
            ? "hover:bg-white/5 border border-transparent shadow-[0_4px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_12px_rgba(0,0,0,0.5)] bg-[#13151b]"
            : "hover:bg-white border border-transparent shadow-[0_2px_6px_rgba(165,175,190,0.3)] hover:shadow-[0_4px_8px_rgba(165,175,190,0.4)] bg-[#f4f7f9]"
      }`}
    >
      <Icon
        size={18}
        className={`transition-all duration-300 ${active ? activeColor : idleColor}`}
        strokeWidth={active ? 2 : 1.75}
      />
    </div>
  );
};