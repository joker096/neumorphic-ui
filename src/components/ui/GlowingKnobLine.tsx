import React from 'react';

interface GlowingKnobLineProps {
  count?: number;
  isDark?: boolean;
}

export const GlowingKnobLine: React.FC<GlowingKnobLineProps> = ({ count, isDark = false }) => (
  <div className={`w-[20px] h-[20px] rounded-full shrink-0 flex items-center justify-center relative ${isDark ? "bg-[#1a1d24] shadow-[0_0_15px_rgba(251,146,60,0.6),0_4px_8px_rgba(0,0,0,0.6),_inset_0_1px_2px_rgba(255,255,255,0.06),_inset_0_-1px_2px_rgba(0,0,0,0.5)]" : "bg-[#eaeff4] shadow-[0_0_15px_rgba(255,160,80,0.8),_-2px_-2px_5px_rgba(255,255,255,0.9),_2px_2px_5px_rgba(165,175,190,0.5),_inset_1px_1px_2px_rgba(255,255,255,0.8)]"}`}>
    <div className={`absolute inset-0 rounded-full opacity-90 shadow-[inset_0_-2px_4px_rgba(234,88,12,0.5)] ${isDark ? "bg-gradient-to-tr from-orange-500 via-orange-400 to-amber-400" : "bg-gradient-to-tr from-orange-300 via-orange-400 to-orange-200"}`} />
    {count && (
      <span className={`relative z-10 text-[10px] font-bold pb-[0.5px] pr-[0.5px] ${isDark ? "text-orange-100" : "text-orange-950"}`}>
        {count}
      </span>
    )}
  </div>
);
