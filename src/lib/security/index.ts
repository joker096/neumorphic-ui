// Security Module - Exports all security-related functionality

export { securityLogger } from './securityLogger';
export type { SecurityEventType, SecurityLogEntry } from './securityLogger';

export { rateLimiter } from './rateLimiter';

export {
  escapeHtml,
  stripHtml,
  sanitizeText,
  isSafeUrl,
  toPlainText,
  sanitizeInput,
  validateLink,
  sanitizeData,
} from './sanitizer';

export { spamDetector } from './spamDetector';
export type { SpamReport } from './spamDetector';

export { deviceSecurity } from './deviceSecurity';
