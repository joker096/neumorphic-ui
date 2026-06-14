import { motion } from 'motion/react';
import { springs } from '../../lib/animation/presets';

interface NeumorphicKnobProps {
  className?: string;
  isDark?: boolean;
}

export const NeumorphicKnob: React.FC<NeumorphicKnobProps> = ({ className = '', isDark = false }) => (
  <motion.div
    layout
    transition={springs.snappy}
    className={`w-[18px] h-[18px] rounded-full shrink-0 ${isDark ? "bg-[#1a1d24] shadow-[0_4px_8px_rgba(0,0,0,0.6),_inset_0_1px_2px_rgba(255,255,255,0.06),_inset_0_-1px_2px_rgba(0,0,0,0.5)]" : "bg-[#eaeff4] shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),_2px_2px_5px_rgba(165,175,190,0.5),_inset_1px_1px_2px_rgba(255,255,255,0.8),_inset_-1px_-1px_2px_rgba(165,175,190,0.1)]"} ${className}`} />
);
