import { ChevronRight } from "lucide-react";

type Translate = (key: string, options?: any) => string;

type ContentViewHeaderProps = {
  title: string;
  isDark: boolean;
  t: Translate;
  onBack: () => void;
};

export const ContentViewHeader = ({ title, isDark, t, onBack }: ContentViewHeaderProps) => (
  <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-8 py-3 sm:py-4 mb-2 sm:mb-4">
    <button
      onClick={onBack}
      title={t("chat.goBack")}
      aria-label={t("chat.goBack")}
      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
        isDark
          ? "bg-[#1a1d24] border border-white/10 hover:bg-white/10"
          : "bg-[#f4f7f9] border border-black/10 hover:bg-white shadow-md"
      }`}
    >
      <ChevronRight size={22} className="rotate-180" />
    </button>
    <h2 className="text-xl sm:text-2xl font-sans tracking-wide capitalize truncate flex-1 min-w-0">
      {title}
    </h2>
  </div>
);
