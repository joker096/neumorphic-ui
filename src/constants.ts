/**
 * Shared constants and mock data - re-exports from modular files
 */
export { STORAGE_KEYS } from './constants/storage';
// Mock data
export { MOCK_CALLS, MOCK_CHATS, MOCK_CONTACTS, MOCK_CHANNELS } from './constants/mockData';
// UI config
export { parseMentions, isDNDEnabled, isPriorityContact } from './constants/uiConfig';
// Type re-exports for backwards compatibility
export type { CompanyMember, CompanyChannel, CompanyMessage } from './types/constants';
