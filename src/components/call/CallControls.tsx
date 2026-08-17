import React from 'react';
import { motion } from 'motion/react';
import { CALL_CONTROL_SIZES } from '../../constants/callConstants';

/** Animated "connecting" indicator shown next to the call status label. */
export function StatusDots() {
  return (
    <span className="inline-flex gap-0.5 ml-1">
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
        className="w-1 h-1 rounded-full bg-white/60"
      />
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        className="w-1 h-1 rounded-full bg-white/60"
      />
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        className="w-1 h-1 rounded-full bg-white/60"
      />
    </span>
  );
}

interface ControlButtonProps {
  active?: boolean;
  activeColor?: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
}

/** Circular call action button with consistent sizing and active state. */
export function ControlButton({
  active,
  activeColor,
  icon: Icon,
  label,
  onClick,
  size = 'md',
}: ControlButtonProps) {
  const sizeConfig = CALL_CONTROL_SIZES[size];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      className={`relative ${sizeConfig.wrapper} rounded-full flex items-center justify-center transition-colors duration-200 ${
        active
          ? `neo-circle-pressed text-[var(--accent)]`
          : 'neo-circle text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }`}
      title={label}
      aria-label={label}
      aria-pressed={!!active}
    >
      <Icon size={sizeConfig.icon} strokeWidth={active ? 2.5 : 1.9} />
      {active && activeColor && (
        <motion.span
          layoutId="active-indicator"
          className={`absolute inset-0 rounded-full border-2 ${activeColor}`}
          initial={false}
        />
      )}
    </motion.button>
  );
}
