import React, { useState } from 'react';

interface SettingsToggleProps {
  theme: 'light' | 'dark';
  label: string;
  initialActive?: boolean;
  onToggle?: (active: boolean) => void;
}

export const SettingsToggle: React.FC<SettingsToggleProps> = ({
  theme,
  label,
  initialActive = false,
  onToggle,
}) => {
  const [active, setActive] = useState(initialActive);
  const isDark = theme === 'dark';

  const toggle = () => {
    const newActive = !active;
    setActive(newActive);
    if (onToggle) onToggle(newActive);
  };

  return (
    <div
      className={`w-full h-[64px] px-6 rounded-[32px] flex items-center justify-between cursor-pointer transition-all duration-300 select-none mb-4 ${
        isDark
          ? 'bg-[#13151b] shadow-[0_6px_12px_rgba(0,0,0,0.3),_inset_0_1.5px_2px_rgba(255,255,255,0.04),_inset_0_-2px_4px_rgba(0,0,0,0.5)] border border-white/[0.02] hover:scale-[1.02] active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] active:scale-100'
          : 'bg-[#eaeff4] shadow-[-4px_-4px_10px_rgba(255,255,255,0.9),_6px_8px_16px_rgba(165,175,190,0.4),_inset_1.5px_1.5px_2px_rgba(255,255,255,1)] border border-white/50 hover:scale-[1.02] active:shadow-[inset_3px_3px_6px_rgba(165,175,190,0.3)] active:scale-100'
      }`}
      onClick={toggle}
    >
      <span
        className={`text-[14.5px] font-semibold tracking-wide ${isDark ? 'text-[#e8ecf2]' : 'text-slate-700'}`}
      >
        {label}
      </span>

      {/* Toggle Track */}
      <div
        className={`relative w-12 h-[26px] rounded-full transition-colors duration-300 shadow-inner ${
          active
            ? isDark
              ? 'bg-orange-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),_0_0_8px_rgba(249,115,22,0.3)]'
              : 'bg-orange-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),_0_2px_6px_rgba(249,115,22,0.3)]'
            : isDark
              ? 'bg-[#0a0b0e] shadow-[inset_0_3px_6px_rgba(0,0,0,0.9)]'
              : 'bg-[#ced6e0] shadow-[inset_2px_2px_5px_rgba(165,175,190,0.6)]'
        }`}
      >
        {/* Toggle Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full transition-all duration-300 ${
            active ? 'left-[calc(100%-23px)]' : 'left-[3px]'
          } ${
            isDark
              ? 'bg-[#e8ecf2] shadow-[0_2px_4px_rgba(0,0,0,0.5)]'
              : 'bg-white shadow-[0_2px_4px_rgba(0,0,0,0.15)]'
          }`}
        />
      </div>
    </div>
  );
};
