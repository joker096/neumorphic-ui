import { Plus } from "lucide-react";
import { ONLINE_CONTACTS } from "../../constants/mockData";

interface AvatarRowProps {
  theme: "light" | "dark";
  onStoryClick: (story: any) => void;
  t: (key: string, options?: any) => string;
}

export const AvatarRow = ({ theme, onStoryClick, t }: AvatarRowProps) => {
  const isDark = theme === "dark";
  return (
    <div className="flex flex-col w-full overflow-visible mb-2 pt-2 pb-1 bg-transparent shrink-0">
      <div className={`px-4 mb-2 font-mono text-[9px] uppercase tracking-widest font-bold ${isDark ? "text-gray-400" : "text-slate-400"}`}>{t("header.stories")}</div>
      <div className="flex items-center gap-3 sm:gap-4 px-2 sm:px-3 overflow-x-auto pb-2 scrollbar-none shrink-0" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        <div className="flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer shrink-0">
          <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-transform duration-200 active:scale-95 ${isDark ? "bg-[#1f222a] border border-[var(--border-color)] border-dashed" : "bg-[var(--bg-primary)] border border-[var(--border-color)] border-dashed"}`}>
            <Plus size={20} className={isDark ? "text-gray-300 group-hover:text-[var(--text-primary)]" : "text-slate-500 group-hover:text-[var(--text-secondary)]"} />
          </div>
          <span className={`text-[9px] sm:text-[10px] font-semibold tracking-wide transition-colors ${isDark ? "text-gray-300 group-hover:text-gray-100" : "text-slate-500 group-hover:text-slate-800"}`}>
            {t("header.myStory")}
          </span>
        </div>
        {ONLINE_CONTACTS.map((c) => (
          <div
            key={c.id}
            onClick={() => onStoryClick && onStoryClick(c)}
            className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
          >
            <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-transform duration-200 active:scale-95 ${isDark ? "bg-[var(--bg-tertiary)] shadow-[0_2px_8px_rgba(0,0,0,0.3)] border border-[var(--border-color)]" : "bg-[var(--bg-secondary)] shadow-[4px_4px_8px_rgba(165,175,190,0.3),_-4px_-4px_8px_rgba(255,255,255,0.8),_inset_1.5px_1.5px_2px_rgba(255,255,255,1)] border border-[var(--border-color)]"}`}>
              <div className="w-[85%] h-[85%] rounded-full overflow-hidden p-[2px]">
                <div className={`w-full h-full rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-[var(--text-primary)] font-bold text-lg`}>
                  {c.name.charAt(0)}
                </div>
              </div>
            </div>
            <span className={`text-[9px] sm:text-[10px] font-semibold tracking-wide transition-colors ${isDark ? "text-gray-300 group-hover:text-gray-100" : "text-slate-500 group-hover:text-slate-800"}`}>
              {c.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};




