import { motion } from "motion/react";

export function KeyButton({ num, letters, isDark, onPress }: {
  num: string; letters: string; isDark: boolean; onPress: (n: string) => void;
}) {
  return (
    <motion.button
      onClick={() => onPress(num)}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      className={`w-[76px] h-[76px] rounded-[22px] flex flex-col items-center justify-center cursor-pointer select-none transition-colors ${
        isDark
          ? "bg-[#13151b] border border-white/[0.06] active:bg-[#1e2129] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          : "bg-[#eaeff4] border border-white/60 active:bg-[#dce2ea] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
      }`}
    >
      <span className={`text-[28px] font-semibold leading-none ${isDark ? "text-gray-200" : "text-slate-700"}`}>
        {num}
      </span>
      {letters.trim() && (
        <span className="text-[8px] mt-[2px] font-bold tracking-[0.15em] text-orange-500/70">
          {letters}
        </span>
      )}
    </motion.button>
  );
}
