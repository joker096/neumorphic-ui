import { CustomDiamondIcon } from "./CustomDiamondIcon";

type HomeButtonProps = {
  isDark: boolean;
  onClick: () => void;
};

export const HomeButton = ({ isDark, onClick }: HomeButtonProps) => (
  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center group pointer-events-auto z-50">
    <div
      onClick={onClick}
      title="Return to Hub"
      className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 ${
        isDark
          ? "bg-[#1a1d24] border border-white/10 shadow-[0_12px_24px_rgba(0,0,0,0.8),_inset_0_2px_4px_rgba(255,255,255,0.08)] hover:bg-[#1f222a]"
          : "bg-gradient-to-b from-[#f4f7f9] to-[#e2e8f0] border border-white/90 shadow-[0_12px_24px_rgba(165,175,190,0.6),_inset_2px_2px_4px_rgba(255,255,255,1)] hover:shadow-xl"
      }`}
    >
      <CustomDiamondIcon
        className={`${
          isDark
            ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]"
            : "text-orange-600 drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)]"
        } group-hover:scale-110 transition-transform`}
      />
    </div>
    <span
      className={`text-[9px] uppercase tracking-widest mt-2 font-bold ${
        isDark ? "text-gray-500 group-hover:text-orange-400" : "text-slate-400 group-hover:text-orange-600"
      } transition-colors`}
    >
      Hub
    </span>
  </div>
);
