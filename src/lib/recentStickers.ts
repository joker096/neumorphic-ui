import { STORAGE_KEYS } from '../constants/storage';

/** How many stickers the "Recent" row keeps — two rows of the picker. */
export const RECENT_STICKER_LIMIT = 12;

/**
 * Recently sent stickers, newest first.
 *
 * Values are exactly what the composer receives (`"icq:<id>"` for the ICQ pack,
 * the raw emoji otherwise), so the row can re-send a sticker without knowing
 * which pack it came from. Storage is best-effort: a blocked or corrupted
 * `localStorage` must degrade to "no recent stickers", never to a crash.
 */
export function getRecentStickers(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT_STICKERS);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
      .slice(0, RECENT_STICKER_LIMIT);
  } catch {
    return [];
  }
}

/**
 * Records a sent sticker and returns the new recent list (newest first,
 * de-duplicated, capped). The previous placement is dropped so re-sending an
 * old sticker moves it to the front instead of duplicating it.
 */
export function pushRecentSticker(value: string): string[] {
  const sticker = String(value ?? '').trim();
  if (!sticker) return getRecentStickers();
  const next = [sticker, ...getRecentStickers().filter((s) => s !== sticker)].slice(
    0,
    RECENT_STICKER_LIMIT,
  );
  try {
    localStorage.setItem(STORAGE_KEYS.RECENT_STICKERS, JSON.stringify(next));
  } catch {
    // Quota/private-mode failure: the picker still shows the value for this
    // session, it just will not survive a reload.
  }
  return next;
}
