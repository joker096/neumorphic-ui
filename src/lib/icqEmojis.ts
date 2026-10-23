import { ICQ_EMOJI_MAP as ICQ_EMOJI_DATA } from '../data/emojis/icq';
import { preloadICQTheme, getCachedEmoji } from './emojiCache';

const UNICODE_TO_ICQ: Record<string, string> = {};

export function getICQEmojiPath(emojiId: string, theme: 'light' | 'dark'): string {
  const skin = theme === 'dark' ? 'hd_dark_skin' : 'hd_light_skin';
  return `/ICQ/${skin}/${emojiId}.gif`;
}

export function getICQStickerSrc(sticker: string, theme: 'light' | 'dark'): string | null {
  if (!sticker) return null;
  if (sticker.startsWith('icq:')) return getICQEmojiPath(sticker.slice(4), theme);
  const icqId = UNICODE_TO_ICQ[sticker];
  return icqId ? getICQEmojiPath(icqId, theme) : null;
}

/** The whole ICQ set — available to every tier, not gated behind premium. */
export function getIcqStickerIds(_premium?: boolean): string[] {
  return ICQ_EMOJI_DATA.map(e => e.id);
}

export { ICQ_EMOJI_DATA as ICQ_EMOJI_MAP };
export { preloadICQTheme, getCachedEmoji };
