import React from 'react';
import { Plus } from 'lucide-react';
import { useI18n } from '../../lib/i18n';

interface AvatarRowProps {
  theme: 'light' | 'dark';
  onStoryClick?: (story: any) => void;
}

interface ContactData {
  id: number;
  name: string;
  color: string;
}

export const AvatarRow: React.FC<AvatarRowProps> = ({ theme, onStoryClick }) => {
  const { t } = useI18n();
  const isDark = theme === 'dark';
  
  const CONTACTS: ContactData[] = [
    { id: 1, name: 'Alice', color: 'from-rose-400 to-red-500' },
    { id: 2, name: 'Bob', color: 'from-blue-400 to-indigo-400' },
    { id: 3, name: 'Charlie', color: 'from-amber-400 to-orange-400' },
    { id: 4, name: 'Diana', color: 'from-purple-400 to-fuchsia-400' },
    { id: 5, name: 'Eve', color: 'from-teal-400 to-emerald-400' },
  ];

  return (
    <div className="flex flex-col w-full overflow-visible mb-2 pt-2 pb-1 bg-transparent shrink-0">
      <div className={`px-4 mb-2 font-mono text-[9px] uppercase tracking-widest font-bold ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{t('header.stories')}</div>
      <div className="flex items-center gap-4 px-3 overflow-x-auto pb-2 scrollbar-none shrink-0">
        <div className="flex flex-col items-center gap-2 group cursor-pointer shrink-0">
          <div className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 active:scale-95 ${
            isDark ? 'bg-[#1f222a] border border-white/5 border-dashed' : 'bg-[#f4f7f9] border border-black/10 border-dashed'
          }`}>
            <Plus size={24} className={isDark ? 'text-gray-400 group-hover:text-white' : 'text-slate-500 group-hover:text-black'} />
          </div>
          <span className={`text-[10px] font-semibold tracking-wide transition-colors ${isDark ? 'text-gray-400 group-hover:text-gray-200' : 'text-slate-500 group-hover:text-slate-800'}`}>
            {t('header.myStory')}
          </span>
        </div>

        {CONTACTS.map((c) => (
          <div
            key={c.id}
            onClick={() => onStoryClick && onStoryClick(c)}
            className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
          >
            <div
              className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 active:scale-95 ${
                isDark
                  ? 'bg-[#13151b] shadow-[0_6px_12px_rgba(0,0,0,0.3),_inset_0_1.5px_2px_rgba(255,255,255,0.05),_inset_0_-2px_4px_rgba(0,0,0,0.6)] border-[2px] border-orange-500/50'
                  : 'bg-[#eaeff4] shadow-[4px_4px_8px_rgba(165,175,190,0.3),_-4px_-4px_8px_rgba(255,255,255,0.8),_inset_1.5px_1.5px_2px_rgba(255,255,255,1)] border-[2px] border-orange-400'
              }`}
            >
              <div className="w-[85%] h-[85%] rounded-full shadow-inner overflow-hidden p-[2px]">
                <div
                  className={`w-full h-full rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white font-bold text-lg`}
                >
                  {c.name.charAt(0)}
                </div>
              </div>
            </div>
            <span
              className={`text-[10px] font-semibold tracking-wide transition-colors ${isDark ? 'text-gray-400 group-hover:text-gray-200' : 'text-slate-500 group-hover:text-slate-800'}`}
            >
              {c.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
