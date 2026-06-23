import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface LightPillButtonProps {
  title: string;
  subtitle?: string;
  icon?: any;
  badge?: string;
}

export const LightPillButton: React.FC<LightPillButtonProps> = ({ title, subtitle, icon: Icon, badge }) => {
  const [active, setActive] = useState(false);
  return (
    <div
      onClick={() => setActive(!active)}
      className={`relative w-[260px] h-[66px] rounded-[33px] pl-6 pr-5 py-3 flex items-center justify-between cursor-pointer transition-all duration-300 select-none group border ${
        active
          ? "bg-[#e2e8f0] shadow-[inset_4px_4px_8px_rgba(165,175,190,0.25),_inset_-2px_-2px_6px_rgba(255,255,255,1)] border-black/5"
          : "bg-[#eaeff4] shadow-[-10px_-10px_22px_rgba(255,255,255,0.9),_14px_18px_32px_rgba(165,175,190,0.55),_inset_1.5px_1.5px_2.5px_rgba(255,255,255,1)] hover:scale-[1.03] active:scale-[0.97] border-white/80"
      }`}
    >
      {active && (
        <>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-3 bg-orange-400 rounded-full blur-[10px] opacity-70 pointer-events-none" />
          <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-10 h-[2px] bg-white rounded-full blur-[1px] opacity-60 pointer-events-none" />
        </>
      )}
      <div className="flex flex-col -space-y-[1px] mt-0.5 mt-1 pointer-events-none overflow-hidden pr-3">
        <span
          className={`text-[14.5px] font-semibold tracking-tight truncate w-full transition-colors ${active ? "text-orange-600" : "text-[#1a1a1b] group-hover:text-orange-600"}`}
        >
          {title}
        </span>
        <span className="text-[11.5px] font-medium text-[#88909e] truncate w-full">
          {subtitle}
        </span>
      </div>
      <div className="flex items-center justify-center shrink-0">
        {badge ? (
          <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-tr from-orange-400 to-orange-300 shadow-[0_4px_8px_rgba(249,115,22,0.4),_inset_0_-2px_4px_rgba(249,115,22,0.5)] shrink-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-orange-950 pb-[0.5px] pr-[0.5px]">
              {badge}
            </span>
          </div>
        ) : Icon ? (
          <Icon
            size={20}
            strokeWidth={1.75}
            className={`transition-all duration-300 ${active ? "text-orange-500 scale-110" : "text-[#4b5563] group-hover:text-orange-500/70"}`}
          />
        ) : null}
      </div>
    </div>
  );
};
