// Root lib/ files
export { useFocusTrap, useReducedMotion } from './a11y';
export { AccountManager, accountManager } from './accountManager';
export type { Account } from './accountManager';
export { deviceSecurity } from './deviceSecurity';
export { logError } from './errorHandling';
export { I18nContext, useI18n, detectBrowserLanguage, I18nProvider } from './i18n';
export { getICQEmojiPath, getICQStickerSrc, getICQEmojiUrl, ICQ_EMOJI_MAP } from './icqEmojis';
export type { ICQEmoji } from '../types/emoji';
export { set, get, del, clear, keys, saveChat, getAllChats, deleteChat, clearChats, saveContact, getAllContacts, saveChannel, getAllChannels, saveBot, getAllBots, deleteBot, addScheduledMessage, removeScheduledMessage, getAllScheduledMessages, clearScheduledMessages, saveRecording, deleteRecording, getAllRecordings, clearRecordings, addCallHistoryEntry, getAllCallHistory, clearCallHistory, addCompanyMessage, getAllCompanyMessages, clearAll, reset } from './idb';
export { FeatureViews } from './lazyViews';
export { queueMessage, getPendingMessages, markMessageSent, retryMessage, clearPendingMessages, removeQueuedMessage, pruneExpiredQueuedMessages, QUEUE_MAX_AGE_MS, MAX_QUEUE_RETRIES, MAX_QUEUE_ITEMS } from './messageQueue';
export { MOCK_DATA_ENABLED } from './mockDataFlag';
export { recordingStorage } from './recordingStorage';
export { retry } from './retry';
export type { RetryOptions } from './retry';
export { secureSetItem, secureGetItem, secureRemoveItem } from './secureStorage';

// Extra exports from cryptoCore bridge (not already covered by crypto/)
export { b64encode, b64decode } from './cryptoCore';

// Subdirectories with their own index.ts
export * from './crypto';
export * from './identity';
export * from './recovery';
export * from './sounds';
