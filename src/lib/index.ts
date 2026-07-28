// Root lib/ files
export { announce, useFocusTrap, useReducedMotion } from './a11y';
export type { AccessibilityPriority } from './a11y';
export { AccountManager, accountManager } from './accountManager';
export type { Account } from './accountManager';
export { callRecorderService } from './callRecorderService';
export type { CallRecording } from './callRecorderService';
export { deviceSecurity } from './deviceSecurity';
export { ErrorSeverity, generateErrorId, classifyError, logError, getErrorLog, clearErrorLog, subscribeToErrors, getErrorStats } from './errorHandling';
export type { ErrorRecord } from './errorHandling';
export { trackComponentMount, safeSet, retryableWrite, safeRead, retryWithFallback, initWithFallback, safeAsync } from './gracefulDegradation';
export { preloadLocales, getTranslation, getTranslationWithFallback, I18nContext, useI18n, detectBrowserLanguage, I18nProvider } from './i18n';
export { getICQEmojiPath, getICQStickerSrc, getICQEmojiUrl, ICQ_EMOJI_MAP } from './icqEmojis';
export type { ICQEmoji } from '../types/emoji';
export { set, get, del, clear, keys, saveChat, getAllChats, deleteChat, clearChats, saveContact, getAllContacts, saveChannel, getAllChannels, saveBot, getAllBots, addScheduledMessage, removeScheduledMessage, getAllScheduledMessages, clearScheduledMessages, saveRecording, deleteRecording, getAllRecordings, clearRecordings, addCallHistoryEntry, getAllCallHistory, clearCallHistory, addCompanyMessage, getAllCompanyMessages, clearAll, reset } from './idb';
export { lazyWithFallback } from './lazy';
export { FeatureViews } from './lazyViews';
export { queueMessage, getPendingMessages, markMessageSent, retryMessage, clearPendingMessages } from './messageQueue';
export { MOCK_DATA_ENABLED } from './mockDataFlag';
export { recordingStorage } from './recordingStorage';
export { retry, retrySync } from './retry';
export type { RetryOptions } from './retry';
export { secureSetItem, secureGetItem, secureRemoveItem } from './secureStorage';

// Extra exports from cryptoCore bridge (not already covered by crypto/)
export { b64encode, b64decode } from './cryptoCore';

// Subdirectories with their own index.ts
export * from './backup';
export * from './crypto';
export * from './gestures';
export * from './identity';
export * from './recovery';
export * from './signaling';
export * from './sounds';
