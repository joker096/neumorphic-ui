/**
 * Shared constants and mock data - re-exports from modular files
 */
export { STORAGE_KEYS } from './constants/storage';
// UI config
export { parseMentions, isDNDEnabled, isPriorityContact } from './constants/uiConfig';
// Type re-exports for backwards compatibility
export type { CompanyMember, CompanyChannel, CompanyMessage } from './types/constants';
