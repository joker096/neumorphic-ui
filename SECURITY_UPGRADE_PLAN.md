# Security & Feature Upgrade Plan

Сравнение старого проекта `mess.cvr.name/app/docs` с текущим `neumorphic-ui`.

## Статус по фазам — ✅ ВСЕ ВЫПОЛНЕНО

### P0 — Critical Security ✅
- [x] ML-KEM-768: заменена заглушка на `@noble/post-quantum` (реальный пост-квантум KEM)
- [x] CSP: перенесён из `<meta>` в HTTP-заголовки (vite dev server + server/csp.ts)

### P1 — Security Hardening ✅
- [x] Safety Numbers UI: компонент верификации ключей в ContactProfileModal
- [x] Screenshot Protection: CSS blur через `useScreenshotProtection` hook
- [x] Bot Permissions: типизированная `BotPermissions`, runtime enforcement, sandbox
- [x] Rate Limiting App Lock: экспоненциальный backoff (3->30s->1m->2m->5m->15m->permanent)

### P2 — UX улучшения ✅
- [x] CallHistorySheet: компонент истории звонков
- [x] Photo Editor: canvas-based crop/draw/text
- [x] GIF Search: Tenor API интеграция
- [x] Undo Delete: snackbar с отменой удаления

### P3 — Архитектура ✅
- [x] Web Workers для crypto (AES-GCM, HMAC, PBKDF2, SHA-256)

### P4 — Performance ✅
- [x] Code Splitting: manualChunks в vite.config.ts (vendor, crypto, motion, app, chat, features, call, i18n, ui)

## Созданные/изменённые файлы

### Новые файлы
| Файл | Назначение |
|------|------------|
| `src/lib/crypto/safetyNumber.ts` | Вычисление Safety Numbers |
| `src/hooks/useScreenshotProtection.ts` | CSS blur при visibilitychange |
| `src/lib/bot/sandbox.ts` | Sandbox для ботов (localStorage/fetch/XHR) |
| `src/components/call/CallHistorySheet.tsx` | История звонков |
| `src/components/PhotoEditor.tsx` | Canvas photo editor |
| `src/components/GifSearch.tsx` | GIF search (Tenor API) |
| `src/hooks/useUndoDelete.ts` | Хук undo для удаления |
| `src/components/UndoDeleteSnackbar.tsx` | Snackbar undo |
| `src/lib/crypto/crypto.worker.ts` | Web Worker для crypto |
| `src/lib/crypto/cryptoWorkerClient.ts` | Клиент Web Worker |

### Изменённые файлы
| Файл | Изменения |
|------|-----------|
| `src/lib/crypto/cryptoCore.ts` | ML-KEM-768: real `@noble/post-quantum` |
| `vite.config.ts` | CSP headers + crypto chunk для noble |
| `server/csp.ts` | Исправлена слишком строгая политика |
| `src/store/index.ts` | BotPermissions, callHistory, DEFAULT_BOT_PERMISSIONS |
| `src/components/ContactProfileModal.tsx` | Safety Numbers UI |
| `src/components/CreateBotModal.tsx` | DEFAULT_BOT_PERMISSIONS |
| `src/lib/bot/api.ts` | Permission checking |
| `src/App.tsx` | Screenshot protection hook + rate limiting app lock |
| `index.html` | CSP meta tag kept as fallback |
