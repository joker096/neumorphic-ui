import React, { useState } from "react";
import { useI18n } from "../../lib/i18n";
import { SearchInput } from "../ui/SearchInput";
import {
  getICQEmojiPath,
  getICQStickerSrc,
  ICQ_EMOJI_MAP,
} from "../../lib/icqEmojis";

const STICKER_PACKS = [
  { id: 'default', name: 'Default', stickers: ['👍', '❤️', '😂', '🔥', '😢', '🎉', '👋', '💀', '👑', '🔻', '😎', '🥳'] },
  { id: 'animals', name: 'Animals', stickers: ['🐱', '🐶', '🐾', '🦋', '🐮', '🐸'] },
  { id: 'nature', name: 'Nature', stickers: ['🌸', '🌿', '🌺', '🍃', '🌻', '🍀'] },
  { id: 'food', name: 'Food', stickers: ['🍕', '🍔', '🍱', '🍷', '☕', '🍯'] },
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
    ...STICKER_PACKS,
    { id: 'emoji', name: t('stickers.emoji'), stickers: STICKER_EMOJI },
  ];

  const filteredPacks = activeTab === 'all' ? allPacks : allPacks.filter(p => p.id === activeTab);
  const visiblePacks = search ? filteredPacks.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : filteredPacks;

  return (
    <div className="w-full max-w-full flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        {[{ id: 'all', label: t('stickers.all') }, { id: 'icq', label: t('stickers.icq') }, { id: 'default', label: t('stickers.default') }, { id: 'animals', label: t('stickers.animals') }].map(tab => (
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

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t('stickers.searchPlaceholder')}
        isDark={isDark}
      />

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