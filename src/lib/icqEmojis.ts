import { ICQ_EMOJI_MAP as ICQ_EMOJI_DATA } from '../data/emojis/icq';
import { preloadICQTheme, getCachedEmoji } from './emojiCache';
import { ICQ_FREE_STICKER_COUNT } from '../config/premium';

export interface ICQEmoji {
  id: string;
  name: string;
  file: string;
}

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

export function getICQEmojiUrl(emoji: ICQEmoji, theme: 'light' | 'dark'): string {
  return getICQEmojiPath(emoji.file.replace('.gif', ''), theme);
}

export function getIcqStickerIds(premium: boolean): string[] {
  const source = premium ? ICQ_EMOJI_DATA : ICQ_EMOJI_DATA.slice(0, ICQ_FREE_STICKER_COUNT);
  return source.map(e => e.id);
}

export { ICQ_EMOJI_DATA as ICQ_EMOJI_MAP };

export { preloadICQTheme, getCachedEmoji };
