import React, { useState } from "react";
import { Search } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import {
  getICQEmojiPath,
  getICQStickerSrc,
  ICQ_EMOJI_MAP,
  CAVEMAN_STICKERS,
  RACOON_STICKERS,
} from "../../lib/icqEmojis";

const STICKER_PACKS = [
  { id: 'default', name: 'Default', stickers: ['👍', '❤️', '😂', '🔥', '😢', '🎉', '👋', '💀', '👑', '🔻', '😎', '🥳'] },
  { id: 'animals', name: 'Animals', stickers: ['🐱', '🐶', '🐾', '🦋', '🐮', '🐸'] },
  { id: 'nature', name: 'Nature', stickers: ['🌸', '🌿', '🌺', '🍃', '🌻', '🍀'] },
  { id: 'food', name: 'Food', stickers: ['🍕', '🍔', '🍱', '🍷', '☕', '🍯'] },
  { id: 'caveman', name: 'Caveman', stickers: CAVEMAN_STICKERS.map(sticker => `caveman:${sticker.id}`) },
  { id: 'raccoon', name: 'Raccoon', stickers: RACOON_STICKERS.map(sticker => `raccoon:${sticker.id}`) },
];
const STICKER_EMOJI = ['😀', '😂', '🤣', '🤔', '😍', '😎', '🤖', '🥺', '😱', '🤯', '🫡', '🥳'];

interface StickerPickerProps {
  theme: 'light' | 'dark';
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export const StickerPicker = ({ theme, onSelect, onClose }: StickerPickerProps) => {
  const { t } = useI18n();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const allPacks = [
    { id: 'icq', name: t('stickers.icq'), stickers: ICQ_EMOJI_MAP.map(e => e.id) },
    ...STICKER_PACKS.filter(p => ['caveman', 'raccoon'].includes(p.id)),
    { id: 'emoji', name: t('stickers.emoji'), stickers: STICKER_EMOJI },
  ];

  const filteredPacks = activeTab === 'all' ? allPacks : allPacks.filter(p => p.id === activeTab);
  const visiblePacks = search ? filteredPacks.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : filteredPacks;

  return (
    <div className="w-full max-w-full flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        {[{ id: 'all', label: t('stickers.all') }, { id: 'icq', label: t('stickers.icq') }, { id: 'caveman', label: t('stickers.caveman') }, { id: 'raccoon', label: t('stickers.raccoon') }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors shrink-0 ${
              activeTab === tab.id
                ? (isDark ? 'bg-orange-500 text-white' : 'bg-orange-500 text-white')
                : (isDark ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-slate-500')
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('stickers.searchPlaceholder')}
          className={`w-full pl-7 pr-4 py-2 rounded-xl text-[12px] outline-none ${isDark ? 'bg-white/5 text-white' : 'bg-black/5 text-slate-800'}`}
        />
      </div>

      <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
        {visiblePacks.map(pack => (
          <div key={pack.id} className="flex flex-col gap-1">
            <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{pack.name}</div>
            <div className="flex gap-1 flex-wrap">
              {pack.stickers.map((st, idx) => {
                const stickerSrc = pack.id === 'icq' ? getICQEmojiPath(st, theme) : getICQStickerSrc(st, theme);
                return (
                  <button
                    key={`${pack.id}-${idx}`}
                    onClick={() => { onSelect(pack.id === 'icq' ? `icq:${st}` : st); onClose(); }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl hover:scale-110 transition-transform ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                  >
                    {stickerSrc ? (
                      <img src={stickerSrc} alt={st} className="w-7 h-7 object-contain" loading="lazy" decoding="async" />
                    ) : (
                      st
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};