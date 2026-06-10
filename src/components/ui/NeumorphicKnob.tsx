import React from 'react';

interface NeumorphicKnobProps {
  className?: string;
}

export const NeumorphicKnob: React.FC<NeumorphicKnobProps> = ({ className = '' }) => (
  <div className={`w-[18px] h-[18px] rounded-full bg-[#eaeff4] shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),_2px_2px_5px_rgba(165,175,190,0.5),_inset_1px_1px_2px_rgba(255,255,255,0.8),_inset_-1px_-1px_2px_rgba(165,175,190,0.1)] shrink-0 ${className}`} />
);
