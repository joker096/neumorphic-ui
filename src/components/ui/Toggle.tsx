import { motion } from 'motion/react';

interface ToggleProps {
  isOn: boolean;
  onToggle: () => void;
  isDark?: boolean;
}

export function Toggle({ isOn, onToggle, isDark }: ToggleProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 flex items-center px-[2px] touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
        isOn ? 'bg-[var(--system-green)]' : isDark ? 'bg-[#39393D]' : 'bg-[#E9E9EA]'
      }`}
      role="switch"
      aria-checked={isOn}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 1 }}
        className="w-[27px] h-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.1)] flex-shrink-0"
        style={{ marginLeft: isOn ? 'auto' : undefined, marginRight: isOn ? undefined : 'auto' }}
      />
    </button>
  );
}
