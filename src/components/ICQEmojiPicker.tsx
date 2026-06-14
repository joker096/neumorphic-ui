import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { ICQ_EMOJI_MAP } from "../lib/icqEmojis";

type Props = {
  theme: 'light' | 'dark';
  onSelect: (filename: string) => void;
  onClose: () => void;
};

const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i));

export const ICQEmojiPicker = ({ theme, onSelect, onClose }: Props) => {
  const { t } = useI18n();
  const isDark = theme === 'dark';
  const [search, setSearch] = useState('');
  const [activeLetter, setActiveLetter] = useState('all');

  const filtered = useMemo(() => {
    let result = ICQ_EMOJI_MAP;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q));
    }
    if (activeLetter !== 'all') {
      result = result.filter(e => e.id.startsWith(activeLetter));
    }
    return result;
  }, [search, activeLetter]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof ICQ_EMOJI_MAP> = {};
    for (const emoji of filtered) {
      const first = emoji.id.charAt(0).toLowerCase();
      if (!groups[first]) groups[first] = [];
      groups[first].push(emoji);
    }
    return groups;
  }, [filtered]);

  const emojiSkin = typeof window !== 'undefined' ? localStorage.getItem('icq_emoji_skin') : null;
  const effectiveDark = emojiSkin ? emojiSkin === 'dark' : isDark;
  const skinDir = effectiveDark ? 'hd_dark_skin' : 'hd_light_skin';

  return (
    <div className="w-full max-w-full flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        <button
          onClick={() => setActiveLetter('all')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors shrink-0 ${activeLetter === 'all' ? (isDark ? 'bg-orange-500 text-white' : 'bg-orange-500 text-white') : (isDark ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-slate-500')}`}
        >
          {t('stickers.all')}
        </button>
        {LETTERS.map(letter => (
          <button
            key={letter}
            onClick={() => setActiveLetter(letter)}
            className={`px-2 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors shrink-0 uppercase ${activeLetter === letter ? (isDark ? 'bg-orange-500 text-white' : 'bg-orange-500 text-white') : (isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-black/5 text-slate-500 hover:bg-black/10')}`}
          >
            {letter}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('stickers.search')}
          className={`w-full pl-7 pr-4 py-2 rounded-xl text-[12px] outline-none ${isDark ? 'bg-white/5 text-white placeholder:text-gray-500' : 'bg-black/5 text-slate-800 placeholder:text-slate-400'}`}
        />
      </div>

      <div className={`flex flex-col gap-4 max-h-[200px] overflow-y-auto ${isDark ? 'scrollbar-ios' : 'scrollbar-ios'}`}>
        {Object.entries(grouped).map(([letter, emojis]) => (
          <div key={letter}>
            <div className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
              {letter.toUpperCase()} ({emojis.length})
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
              {emojis.map(emoji => (
                <button
                  key={emoji.id}
                  onClick={() => { onSelect(emoji.file); onClose(); }}
                  title={emoji.name}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all hover:scale-105 active:scale-95 ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                >
                  <img
                    src={`/ICQ/${skinDir}/${emoji.file}`}
                    alt={emoji.name}
                    className="w-10 h-10 object-contain pointer-events-none"
                  />
                  <span className={`text-[8px] leading-tight text-center truncate w-full ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {emoji.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <div className={`text-xs text-center py-8 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
            {t('emoji.noIcqFound')}
          </div>
        )}
      </div>
    </div>
  );
};
