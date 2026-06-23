import React, { useState } from 'react';

export const DarkPillButton: React.FC<{ title: string; subtitle?: string; icon?: any; badge?: string }> = ({ title, subtitle, icon: Icon, badge }) => {
  const [active, setActive] = useState(false);
  return (
    <div
      onClick={() => setActive(!active)}
      className={`relative group w-[260px] h-[66px] rounded-[33px] cursor-pointer transition-all duration-300 select-none ${!active && "hover:scale-[1.03] active:scale-[0.97]"} ${
        active
          ? "shadow-[inset_0_12px_24px_rgba(0,0,0,0.9),_inset_0_3px_6px_rgba(0,0,0,0.9)] bg-[#101216] border border-orange-500/20"
          : "shadow-[0_22px_38px_rgba(0,0,0,0.5),_0_10px_16px_rgba(0,0,0,0.35),_inset_0_1.5px_2px_rgba(255,255,255,0.08),_inset_0_-2px_4px_rgba(0,0,0,0.8)] bg-[#13151b] border border-white/[0.04]"
      }`}
    >
      {active && (
        <>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-20 h-3 bg-orange-500 rounded-full blur-[12px] opacity-100 pointer-events-none" />
          <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-12 h-[2px] bg-white rounded-full blur-[1px] opacity-80 pointer-events-none" />
          <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-5 h-[4px] bg-white rounded-full blur-[4px] opacity-100 pointer-events-none" />
        </>
      )}
      {!active && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-2 bg-orange-500/30 rounded-full blur-[8px] opacity-0 group-hover:opacity-60 pointer-events-none transition-opacity duration-300" />
      )}
      <div className="w-full h-full rounded-[33px] pl-6 pr-5 py-3 flex items-center justify-between pointer-events-none overflow-hidden relative z-10 transition-colors">
        <div className="flex flex-col -space-y-[1px] mt-0.5 mt-1">
          <span
            className={`text-[14.5px] font-semibold tracking-wide truncate w-full transition-colors ${active ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" : "text-[#e8ecf2]"}`}
          >
            {title}
          </span>
          <span className="text-[11.5px] font-medium text-[#7a8190] truncate w-full">
            {subtitle}
          </span>
        </div>
        <div className="flex items-center justify-center shrink-0">
          {badge ? (
            <div className="w-[22px] h-[22px] bg-gradient-to-tr from-orange-500 to-orange-400 rounded-full shadow-[0_0_12px_rgba(249,115,22,0.7),_inset_0_2px_3px_rgba(255,255,255,0.4)] border border-white/20 flex items-center justify-center">
              <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] pb-[0.5px] pr-[0.5px]">
                {badge}
              </span>
            </div>
          ) : Icon ? (
            <Icon
              size={20}
              strokeWidth={active ? 2 : 1.75}
              className={`transition-all duration-300 ${active ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)] scale-110" : "text-[#7a8190]"}`}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
