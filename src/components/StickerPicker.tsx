import { useI18n } from '../lib/i18n';
import React, { useState } from "react";
import { Search } from "lucide-react";
import { STICKER_PACKS, STICKER_EMOJI } from "../constants";
import { ICQEmojiPicker } from "./ICQEmojiPicker";

export const StickerPicker = ({ theme, onSelect, onClose }: { theme: 'light' | 'dark'; onSelect: (emoji: string) => void; onClose: () => void }) => {
  const isDark = theme === 'dark';
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const allPacks = [...STICKER_PACKS, { id: 'emoji', name: 'Emoji', stickers: STICKER_EMOJI }];
  const filteredPacks = activeTab === 'all' ? allPacks : allPacks.filter(p => p.id === activeTab);
  const visiblePacks = search ? filteredPacks.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : filteredPacks;

  return (
    <div className="w-full max-w-full flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        {[{ id: 'all', label: t('stickers.all') }, { id: 'emoji', label: t('stickers.emoji') }, { id: 'icq', label: t('stickers.icq') }, ...STICKER_PACKS.map(p => ({ id: p.id, label: p.name }))].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors shrink-0 ${activeTab === tab.id ? (isDark ? 'bg-orange-500 text-white' : 'bg-orange-500 text-white') : (isDark ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-slate-500')}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'icq' ? (
        <ICQEmojiPicker theme={theme} onSelect={onSelect} onClose={onClose} />
      ) : (
        <>
          <div className="relative">
            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('stickers.search')}
              className={`w-full pl-7 pr-4 py-2 rounded-xl text-[12px] outline-none ${isDark ? 'bg-white/5 text-white' : 'bg-black/5 text-slate-800'}`}
            />
          </div>

          <div className={`flex flex-col gap-2 max-h-[200px] overflow-y-auto ${isDark ? 'scrollbar-ios' : 'scrollbar-ios'}`}>
            {visiblePacks.map(pack => (
              <div key={pack.id} className="flex flex-col gap-1">
                <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{pack.name}</div>
                <div className="flex gap-1 flex-wrap">
                  {pack.stickers.map((st, idx) => (
                    <button
                      key={`${pack.id}-${idx}`}
                      onClick={() => { onSelect(st); onClose(); }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xl hover:scale-110 transition-transform ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
