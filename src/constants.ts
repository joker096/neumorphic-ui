/**
 * Shared constants and mock data - re-exports from modular files
 */
export { STORAGE_KEYS } from './constants/storage';

// Mock data
export { MOCK_CALLS, MOCK_CHATS, MOCK_CONTACTS, MOCK_CHANNELS, ONLINE_CONTACTS } from './constants/mockData';

// UI config
export { LANGUAGES, STICKER_PACKS, STICKER_EMOJI, MENTION_PATTERN, parseMentions, isDNDEnabled, isPriorityContact } from './constants/uiConfig';

// Type re-exports for backwards compatibility
export type { CompanyMember, CompanyChannel, CompanyMessage } from './types/constants';
