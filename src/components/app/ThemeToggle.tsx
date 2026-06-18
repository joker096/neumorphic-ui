import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";

type Translate = (key: string, options?: any) => string;

type ThemeToggleProps = {
  isDark: boolean;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  t: Translate;
};

export const ThemeToggle = ({ isDark, theme, setTheme, t }: ThemeToggleProps) => (
  <div
    onClick={() => setTheme(isDark ? "light" : "dark")}
    title={isDark ? t("common.switchToLight") : t("common.switchToDark")}
    className={`w-[72px] h-10 rounded-full flex items-center p-1 cursor-pointer backdrop-blur-md transition-colors ${
      isDark
        ? "bg-[#11141c]/80 border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.6)] hover:bg-[#11141c]"
        : "bg-[#e2e8f0]/80 border border-black/5 shadow-[inset_0_2px_10px_rgba(165,175,190,0.3)] hover:bg-[#e2e8f0]"
    }`}
  >
    <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
      <Moon size={14} className={isDark ? "text-transparent" : "text-slate-400/50"} />
      <Sun size={14} className={isDark ? "text-gray-600/50" : "text-transparent"} />
    </div>
    <motion.div
      className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 ${
        isDark
          ? "bg-gradient-to-br from-[#2a2d36] to-[#1f222a] text-orange-400 border border-white/5 shadow-[0_4px_12px_rgba(0,0,0,0.8),_inset_0_2px_2px_rgba(255,255,255,0.1)]"
          : "bg-gradient-to-br from-white to-[#f8fafc] text-orange-500 border border-black/5 shadow-[0_4px_12px_rgba(165,175,190,0.4),_inset_0_2px_2px_rgba(255,255,255,1)]"
      }`}
      initial={false}
      animate={{ x: isDark ? 32 : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 360 : 0 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        {isDark ? (
          <Moon size={16} className="drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
        ) : (
          <Sun size={16} className="drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
        )}
      </motion.div>
    </motion.div>
  </div>
);
