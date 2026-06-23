import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';

interface SubViewProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  isDark: boolean;
}

export const SubView = ({ title, onBack, children, isDark }: SubViewProps) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="w-full flex-1 flex flex-col min-h-0"
  >
    <div className="flex items-center gap-3 mb-6 shrink-0 pt-2">
      <button onClick={onBack} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"}`}>
        <ChevronLeft size={18} className={isDark ? "text-white" : "text-slate-800"} />
      </button>
      <h2 className={`font-sans text-xl font-bold tracking-wide ${isDark ? "text-white" : "text-slate-800"}`}>
        {title}
      </h2>
    </div>
    <div className={`w-full flex-1 overflow-y-auto pr-1 pb-4 flex flex-col gap-6 ${isDark ? "scrollbar-dark" : "scrollbar-light"}`}>
      {children}
    </div>
  </motion.div>
);