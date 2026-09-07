# Test Coverage Matrix

> Живой артефакт TEST_CYCLE.md (Этап 2). Обновляется на каждом проходе.
> **Приоритеты:** P0 = крипто/ключи/storage/auth/store/lib-ядро · P1 = user flows · P2 = визуальное/edge.
> **Статусы:** ✅ покрыто · ⚠️ partial · ❌ gap · (нет) = нет модуля.
> Последняя полная ревизия: 2026-08-20 (pass 1).

---

## 1. Ядро: crypto / identity / keys — P0

| Модуль | Экспорты | Тесты | Статус |
|--------|----------|-------|--------|
| `src/lib/crypto/cryptoCore.ts` | X25519, sign/verify, base64/hex, HKDF | `src/lib/cryptoCore.test.ts`, `tests/crypto-core.test.ts` | ✅ |
| `src/lib/crypto/ed25519.ts` | keyPair, sign, verify | `tests/crypto.test.ts` (покрыто через crypto) | ⚠️→✅ pass1 |
| `src/lib/crypto/channelSigning.ts` | generateChannelKeypair, sign/verify | — | ❌→✅ pass1 |
| `src/lib/crypto/safetyNumber.ts` | computeSafetyNumber, verification level/color | — | ❌→✅ pass1 |
| `src/lib/crypto/postKeyManager.ts` | generatePostKey | — | ❌→✅ pass1 |
| `src/lib/crypto/index.ts` | re-exports | (через модули) | ✅ |
| `src/lib/identity/masterKey.ts` | seed, derive, store, get | — | ❌→✅ pass1 |
| `src/lib/identity/deviceKeys.ts` | generate/verify device key | — | ❌→✅ pass1 |
| `src/lib/identity/devicePairing.ts` | QR data create/parse/verify | — | ❌→✅ pass1 |
| `src/lib/p2p/HMACAuth.ts` | HMAC auth | `tests/hmac-auth.test.ts` | ✅ |
| `src/lib/p2p/MeshDHT.ts` | DHT | `src/lib/p2p/MeshDHT.test.ts` | ✅ |
| `src/lib/p2p/MeshRouter.ts` | router | `src/lib/p2p/MeshRouter.test.ts` | ✅ |
| `src/lib/p2p/P2PTransport.ts` | transport | `src/lib/p2p/P2PTransport.test.ts` | ✅ |
| `src/lib/p2p/identityPin.ts` | pin | `src/lib/p2p/identityPin.test.ts` | ✅ |
| `src/lib/secureStorage.ts` | secureSet/Get/RemoveItem | — | ❌→✅ pass1 |
| `src/lib/recovery/MnemonicGenerator.ts` | mnemonic | `tests/mnemonic-generator.test.ts` | ✅ |
| `src/lib/recovery/RecoveryManager.ts` | recovery | `src/lib/recovery/RecoveryManager.test.ts` | ✅ |

## 2. Ядро: lib / utils / retry / errors — P0

| Модуль | Тесты | Статус |
|--------|-------|--------|
| `src/lib/retry.ts` | — | ❌→✅ pass1 |
| `src/lib/errorHandling.ts` | — | ❌→✅ pass1 |
| `src/lib/utils.ts` | (частично через consumers) | ⚠️ |
| `src/lib/gracefulDegradation.ts` | — | ⚠️ P1 |
| `src/lib/messageQueue.ts` | (через messaging) | ⚠️ |
| `src/lib/messaging/MessageEnvelope.ts` | `MessageEnvelope.test.ts` | ✅ |
| `src/lib/messaging/MessageQueue.ts` | (через MessageQueue consumer) | ⚠️ |
| `src/lib/call/CallManager.ts` | `CallManager.test.ts` | ✅ |
| `src/lib/signaling/manager.ts` | `manager.test.ts` | ✅ |
| `src/lib/transport/obfuscator.ts` | `obfuscator.test.ts` | ✅ |
| `src/lib/transport/wsTunnel.ts` | `wsTunnel.test.ts` | ✅ |
| `src/lib/deviceSecurity.ts` | `deviceSecurity.test.ts` | ✅ |
| `src/lib/i18n.tsx` | `i18n.test.ts`, `i18n-consistency.test.ts` | ✅ |
| `src/utils/chatUtils.ts` | `chatUtils.test.ts` | ✅ |
| `src/utils/riskShell.ts` | `riskShell.test.ts` | ✅ |

## 3. Store slices — P0

| Slice | Тесты | Статус |
|-------|-------|--------|
| `store/index.ts` | `src/store/index.test.ts` | ✅ |
| `store/slices/companySlice.ts` | `companySlice.test.ts` | ✅ |
| `store/slices/crmSlice.ts` | `crmSlice.test.ts` | ✅ |
| `store/slices/settingsSlice.ts` | — | ❌→✅ pass1 |
| `store/slices/chatSlice.ts` | — | ❌→✅ pass1 |
| `store/slices/callSlice.ts` | — | ❌→✅ pass1 |
| `store/slices/connectionSlice.ts` | — | ❌ P1 (pass2) |
| `store/slices/profileSlice.ts` | — | ❌ P1 (pass2) |
| `store/slices/deviceSlice.ts` | — | ❌ P1 (pass2) |
| `store/slices/cloudSyncSlice.ts` | — | ❌ P1 (pass2) |
| `store/slices/syncSlice.ts` | — | ❌ P1 (pass2) |
| `store/slices/pollsSlice.ts` | — | ❌ P2 (pass3) |
| `store/slices/locationsSlice.ts` | — | ❌ P2 (pass3) |

## 4. Server (routes / middleware / csp) — P0

| Модуль | Тесты | Статус |
|--------|-------|--------|
| `server/db.ts` | `__tests__/db.test.ts` | ✅ |
| `server/auth.ts` | `__tests__/auth.test.ts` | ✅ |
| `server/routes/ads.ts` | `__tests__/ads.test.ts` | ✅ (v2: через handleAdRoute) |
| `server/routes/stats.ts` | `__tests__/stats.test.ts` | ✅ |
| `server/routes/auth.ts` | (через `auth.test.ts` sign/verify) | ⚠️ P1 (pass2: handleAuthRoute) |
| `server/routes/admin.ts` | — | ❌→✅ pass1 |
| `server/middleware/auth.ts` | — | ❌→✅ pass1 (requireAuth) |
| `server/middleware/rateLimit.ts` | — | ❌→✅ pass1 (checkRateLimit) |
| `server/csp.ts` | — | ⚠️ P1 (pass2) |
| `server/signaling-server.ts` | (интегр. через e2e) | ⚠️ P2 |

## 5. Hooks — P1

Покрыто: `useAppLock`, `useAppView`, `useCall`, `useDebounce`, `useFilteredChats`, `useGlobalErrorHandler`, `useLocalStorage`, `useScheduledMessages`, `useScreenshotProtection`, `useUndoDelete`.

Gap (P1, pass2): `useAppConnection`, `useAppNavigation`, `useAppSettings`, `useAsyncState`, `useHealthCheck`, `useIdentityAuth`, `useUnreadCount`, `useMessageActions`.

Gap (P2, pass3): `useChatListActions`, `useChatListWorkspace`, `useChatPreviewState`, `useChatPreviewTyping`, `useChatMessageActions`, `useChatInteraction`, `useKeyboardScroll`, `useMediaQuery`, `useMeshPeers`, `useProfileActions`, `useRefMessageActions`, `useVoiceWaveformAudio`, `useAppEffects`, `useActiveChatWorkspace`.

## 6. Компоненты — P1/P2

Покрыто (выбор): `chat-preview/*` (majority), `chat/*`, `company/*` (majority), `contacts/ContactItem`, `crmSlice`, `call/*` (majority), `settings/*` (majority), `ui/*` (majority), `lock/*`, `navigation/*`, `resilience/*`, `status/*`, `landing/*`, `features/FeatureViews`, `app/*` (majority), `huddle/*`.

Gap (P1, pass2): `CreateChannelModal`, `CreateBotModal`, `ContactCreateEditModal`, `MediaViewer`, `SafetyNumberModal`, `SettingsMainMenu`, `ProfileSection`-часть, `CallLogView`, `CallControls`, `CallMediaStage`, `ChatMessage`, `ChatInputArea`.

Gap (P2, pass3): `stories/*` (все), `SystemPulsePlayer/hooks/*`, `recordings/*`, `crm/*` (views), `features/bot/*`, `features/workplace/*`, `ecochat/*`, `MeshRadar`, `MorseDecoder`, `QrCode`, `GlobalSearch`, `ProfileView`, `ChatListView`, `ChatMessageList`, `FloatingCallWidget`, `ChannelCommentsView`, `ChatProfileView`, `AppChrome`.

## 7. User flows (e2e) — P1

| # | Сценарий | Spec | Статус |
|---|----------|------|--------|
| F1 | Запуск, тема, нет error boundary | `basic.spec.ts` | ✅ |
| F2 | Навигация 5 табов, round-trip | `navigation.spec.ts` | ✅ |
| F3 | Чат-список: поиск/фильтры/папки | `chat-list.spec.ts` | ✅ |
| F4 | Чат-окно: история/media/voice/composer | `chat-window.spec.ts` | ✅ |
| F5 | Отправка сообщения | `chat-window.spec.ts` | ✅ |
| F6 | Reply/edit/delete + undo | reply ✅ / edit·delete ❌ | ⚠️ (pass2: edit/delete) |
| F7 | Schedule/sticker/search/reactions | `chat-window.spec.ts` | ✅ |
| F8 | Контакты CRUD + QR | `contacts.spec.ts` | ✅ |
| F9 | Вызовы: история/поиск/clear | `calls.spec.ts` | ✅ |
| F10 | Настройки все секции | `settings.spec.ts` | ✅ |
| F11 | Компания workspace CRUD | `additional-scenarios` (loads) | ⚠️ (pass2: CRUD) |
| F12 | Stories compose/view | `additional-scenarios` (loads) | ⚠️ (pass2: compose) |
| F13 | Recordings player | `settings.spec` (empty) | ⚠️ (pass3: player) |
| F14 | Admin auth (login/2FA/rate) | unit ✅ / e2e ❌ | ⚠️ (pass2: e2e) |
| F15 | App auth (login/registration) | screens untested | ⚠️ (pass2: e2e) |
| F16 | Offline/resilience/error boundary | `resilience.spec.ts` | ✅ |
| F17 | Адаптив 320px/zoom/touch | `usability.spec.ts` | ✅ |
| F18 | Тема/язык/font size | `settings.spec.ts` | ✅ |
| F19 | Цикл настроек: все switch/cycle-row/select/инпуты + персист | `settings-feature-cycle.spec.ts` | ✅ |

## 8. Visual — P2

`visual.spec.ts` (snapshots: chat list dark/light, conversation, contacts, calls, settings, mobile). ✅

---

## Итог pass 1

- P0 crypto/identity: закрыто (channelSigning, safetyNumber, postKeyManager, masterKey, deviceKeys, devicePairing, ed25519, secureStorage, retry, errorHandling).
- P0 store: settingsSlice, chatSlice, callSlice закрыто.
- P0 server: admin routes, middleware auth + rateLimit закрыто.
- Осталось в backlog: connectionSlice/profileSlice/deviceSlice/cloudSyncSlice/syncSlice (P1), csp (P1), routes/auth handle (P1), edit/delete e2e (F6), company CRUD (F11), stories compose (F12), admin e2e (F14), app auth e2e (F15).
