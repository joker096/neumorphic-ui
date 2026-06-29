/**
 * UI configuration and settings constants
 */
export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇭🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국语', flag: '🇰🇷' },
];

export const STICKER_PACKS = [
  { id: 'default', name: 'Default', stickers: ['👍', '❤️', '😂', '🔥', '😢', '🎉', '👋', '💀', '👑', '🔻', '😎', '🥳'] },
  { id: 'animals', name: 'Animals', stickers: ['🐱', '🐶', '🐾', '🦋', '🐮', '🐸'] },
  { id: 'nature', name: 'Nature', stickers: ['🌸', '🌿', '🌺', '🍃', '🌻', '🍀'] },
  { id: 'food', name: 'Food', stickers: ['🍕', '🍔', '🍱', '🍷', '☕', '🍯'] },
];

export const STICKER_EMOJI = ['😀', '😂', '🤣', '🤔', '😍', '😎', '🤖', '🥺', '😱', '🤯', '🫡', '🥳'];

export const MENTION_PATTERN = /@(\w+)/g;

export const parseMentions = (text: string): { text: string; mentions: { name: string; index: number }[] } => {
  const mentions: { name: string; index: number }[] = [];
  let match;
  const regex = new RegExp(MENTION_PATTERN);
  while ((match = regex.exec(text)) !== null) {
    mentions.push({ name: match[1], index: match.index });
  }
  return { text, mentions };
};

/**
 * Check if DND mode is active based on localStorage settings
 */
export const isDNDEnabled = (): boolean => {
  try {
    const dndEnabled = localStorage.getItem('app_dnd_enabled') === 'true';
    const dndFrom = localStorage.getItem('app_dnd_from') || '22:00';
    const dndTo = localStorage.getItem('app_dnd_to') || '08:00';
    if (!dndEnabled) return false;
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;
    const [fromH, fromM] = dndFrom.split(':').map(Number);
    const [toH, toM] = dndTo.split(':').map(Number);
    const fromMinutes = fromH * 60 + fromM;
    const toMinutes = toH * 60 + toM;
    if (fromMinutes <= toMinutes) {
      return currentMinutes >= fromMinutes && currentMinutes <= toMinutes;
    } else {
      return currentMinutes >= fromMinutes || currentMinutes <= toMinutes;
    }
  } catch {
    return false;
  }
};

/**
 * Check if contact is in priority list
 */
export const isPriorityContact = (contactName: string): boolean => {
  try {
    const priorityStr = localStorage.getItem('app_priority_contacts');
    if (!priorityStr) return false;
    const names = JSON.parse(priorityStr);
    return names.some((n: string) =>
      contactName.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(contactName.toLowerCase())
    );
  } catch {
    return false;
  }
};
