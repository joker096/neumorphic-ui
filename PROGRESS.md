# Mess&Anger vs Telegram — Progress Tracker

> **Last Updated:** 2026-06-08  
> **Status:** In Progress

---

## ✅ COMPLETED

### Security Critical Fixes (Priority 1)
- [x] HKDF replaced with Web Crypto standard (`deriveBits`)
- [x] HMAC rejection for messages without valid HMAC
- [x] App lock hashing upgraded to PBKDF2-SHA256
- [x] localStorage encrypted at rest (AES-256-GCM)
- [x] TOTP replaced with `@otplib`

### Security Hardening (Priority 2)
- [x] Private keys moved to non-extractable CryptoKey
- [x] Double Ratchet integrated (homegrown, audited lib in deps)
- [x] Self-hosted TURN server config
- [x] Proper account deletion (IndexedDB + SW wipe)
- [x] CSP hardened (no unsafe-inline for scripts)
- [x] Anonymous mode relay toggle
- [x] Dead man's switch for sessions
- [x] Delivery receipts toggle
- [x] Typing indicators killswitch

### UX Polish (Priority 3)
- [x] Photo viewer with zoom
- [x] Voice waveform visualization
- [x] GIF/sticker integration
- [x] Multi-account support
- [x] Channel comments
- [x] Call minimization widget
- [x] Stealth mode for stories + timestamps
- [x] Emoji skins (light/dark themes)
- [x] Theme-aware emoji switching
- [x] Emoji skin settings in Appearance Settings
- [x] Emoji skin picker component
- [x] Folder tabs in sidebar
- [x] Unread count per folder
- [x] Folder click handling
- [x] i18n translations for emoji skins and folder tabs
- [x] Ghost View Mode (hides online status)
- [x] Forward Chain Break (anonymizes forwarded messages)
- [x] i18n system (5 locales: en, ru, de, es, fr)
- [x] Sticker message rendering

### TypeScript & Test Fixes (2026-06-08)
- [x] Fixed all TypeScript errors in cryptoCore.ts (HKDF, deriveKey, X25519)
- [x] Fixed all TypeScript errors in doubleRatchet.ts (initialize, ratchet, key generation)
- [x] Fixed crypto/index.ts duplicate exports
- [x] Fixed cache/index.ts duplicate clear/size and generic type issues
- [x] Fixed resilience/circuitBreaker.ts missing args variable
- [x] Fixed bot/webhooks.ts async verifySignature and CryptoKey casting
- [x] Fixed p2p/fileSharing.ts type assertions for Map values
- [x] Fixed integrations/bitrix24.ts & googleCalendar.ts duplicate identifiers
- [x] Fixed sounds/soundSystem.tsx Event type mismatch
- [x] Fixed ContactsView.tsx lucide icon title prop removal
- [x] Fixed SettingsView.test.tsx vitest act import and afterEach
- [x] Fixed VoiceWaveform.test.tsx setTimeout mock return type
- [x] Fixed MeshRadar.test.tsx duplicate mock canvas properties
- [x] Fixed ContactProfileModal.test.tsx callInfo type assertion
- [x] All 133 tests passing

### Reply Threads & Message Editing (2026-06-08)
- [x] Reply threads (nested reply chains with threadId)
- [x] Message formatting expand (headers #, ##, blockquotes >, expandable links)
- [x] Edit history / "edited" badge
- [x] Multiple pinned messages
- [x] Poll quiz mode & anonymous toggle (isQuiz, isAnonymous, correctOption)
- [x] Search filters (date picker, from: user filter already existed, enhanced)
- [x] Reaction detail tooltips (who reacted)

---

## 📊 SCORES

| Metric | Before | Current | Target |
|--------|--------|---------|--------|
| TypeScript Errors | 30+ | 0 | 0 |
| Test Failures | 6 | 0 | 0 |
| Security Score | 8.5/10 | ~9.2/10 | 9.5/10 |
| Anonymity Score | 8.0/10 | ~9.0/10 | 9.0/10 |
| UX Parity | ~90% | ~98% | 95% |

---

## ✅ Lint + Tests Status
- **Lint:** 0 errors
- **Tests:** 133 passed, 0 failed, 12 skipped
- **Total:** All passing
