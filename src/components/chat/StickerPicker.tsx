import React, { useMemo, useState } from "react";
import { Crown } from "lucide-react";
import { toast } from "../ui/Toast";
import { useI18n } from "../../lib/i18n";
import { useAppStore } from "../../store";
import { SearchInput } from "../ui/SearchInput";
import { CAPS_TERTIARY_CLASS } from "../ui/textClasses";
import {
  getICQEmojiPath,
  getICQStickerSrc,
  getIcqStickerIds,
} from "../../lib/icqEmojis";
import { getRecentStickers, pushRecentSticker } from "../../lib/recentStickers";

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
  /** Navigates to Settings → Premium (locked-pack upsell). Falls back to a toast when absent. */
  onOpenPremium?: () => void;
}

export const StickerPicker = ({ theme, onSelect, onClose, onOpenPremium }: StickerPickerProps) => {
  const { t } = useI18n();
  const premium = useAppStore(s => s.premiumEntitlement.premium);
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState<string[]>(() => getRecentStickers());

  const icqStickers = useMemo(() => getIcqStickerIds(), []);
  /** Upsell wording for the generic locked packs (ICQ is fully unlocked now). */
  const unlockLabelFor = (_packId: string) => t('premium.stickerLocked', 'This sticker pack is available with Premium');

  const allPacks = [
    ...(recent.length > 0 ? [{ id: 'recent', name: t('stickers.recent'), stickers: recent }] : []),
    { id: 'icq', name: t('stickers.icq'), stickers: icqStickers },
    ...STICKER_PACKS,
    { id: 'emoji', name: t('stickers.emoji'), stickers: STICKER_EMOJI },
  ];

  const tabs = [
    { id: 'all', label: t('stickers.all') },
    ...(recent.length > 0 ? [{ id: 'recent', label: t('stickers.recent') }] : []),
    { id: 'icq', label: t('stickers.icq') },
    { id: 'default', label: t('stickers.default') },
    { id: 'animals', label: t('stickers.animals') },
  ];

  const filteredPacks = activeTab === 'all' ? allPacks : allPacks.filter(p => p.id === activeTab);
  const visiblePacks = search ? filteredPacks.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : filteredPacks;

  return (
    <div className="w-full max-w-full flex flex-col gap-3 px-2 sm:px-3 pb-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="group min-h-11 min-w-11 p-1 flex items-center justify-center rounded-full cursor-pointer transition-all shrink-0 active:scale-95"
          >
            <span className={`flex items-center px-3 py-0.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--accent)] text-[var(--text-primary)]'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] group-hover:bg-black/10 dark:group-hover:bg-white/10'
            }`}>
              {tab.label}
            </span>
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
            <div className="flex items-center justify-between gap-2">
              <div className={CAPS_TERTIARY_CLASS}>{pack.name}</div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {pack.stickers.map((st, idx) => {
                const stickerSrc = pack.id === 'icq' ? getICQEmojiPath(st, theme) : getICQStickerSrc(st, theme);
                return (
                  <button
                    key={`${pack.id}-${idx}`}
                    onClick={() => {
                      // Recent entries already carry the pack prefix.
                      const value = pack.id === 'icq' ? `icq:${st}` : st;
                      setRecent(pushRecentSticker(value));
                      onSelect(value);
                      onClose();
                    }}
                    className={`min-w-11 min-h-11 rounded-full flex items-center justify-center text-xl transition-transform active:scale-95 hover:bg-[var(--bg-elevated)]`}
                  >
                    {stickerSrc ? (
                      <img src={stickerSrc} alt={st} className="w-7 h-7 object-contain" loading="lazy" decoding="async" />
                    ) : (
                      st
                    )}
                  </button>
                );
              })}
              {/* Recent and ICQ (fully unlocked) are views, not locked packs. */}
              {!premium && pack.id !== 'recent' && pack.id !== 'icq' && (
                <button
                  onClick={() => {
                    if (onOpenPremium) {
                      onOpenPremium();
                      onClose();
                      return;
                    }
                    toast(unlockLabelFor(pack.id));
                  }}
                  aria-label={unlockLabelFor(pack.id)}
                  className="min-w-11 min-h-11 rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                >
                  <Crown size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
