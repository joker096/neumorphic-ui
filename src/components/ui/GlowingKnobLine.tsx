import React from 'react';
import { Plus } from 'lucide-react';

interface GlowingKnobLineProps {
  count?: number;
}

export const GlowingKnobLine: React.FC<GlowingKnobLineProps> = ({ count }) => (
  <div className="w-[20px] h-[20px] rounded-full bg-[#eaeff4] shadow-[0_0_15px_rgba(255,160,80,0.8),_-2px_-2px_5px_rgba(255,255,255,0.9),_2px_2px_5px_rgba(165,175,190,0.5),_inset_1px_1px_2px_rgba(255,255,255,0.8)] shrink-0 flex items-center justify-center relative">
    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-300 via-orange-400 to-orange-200 opacity-90 shadow-[inset_0_-2px_4px_rgba(234,88,12,0.5)]" />
    {count && (
      <span className="relative z-10 text-[10px] font-bold text-orange-950 pb-[0.5px] pr-[0.5px]">
        {count}
      </span>
    )}
  </div>
);
