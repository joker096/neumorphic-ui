import React from 'react';
import { Plus } from 'lucide-react';

export const GlowingPlusLight: React.FC = () => (
  <div className="relative flex items-center justify-center p-1 w-6 h-6 shrink-0">
    <div className="absolute inset-0 bg-orange-400/50 blur-[14px] rounded-full scale-[2.2]" />
    <Plus
      size={20}
      strokeWidth={2}
      className="relative z-10 text-orange-50 drop-shadow-[0_0_4px_rgba(249,115,22,0.9)]"
    />
  </div>
);
