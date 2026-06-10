# Mess&Anger — План интеграции функций и безопасности

> Сравнение: `app/docs/functions_catalog.md` (предыдущий проект) vs `neumorphic-ui` (текущий)

## Статус текущей реализации

| Категория | Статус | Примечания |
|-----------|--------|------------|
| Криптография (CryptoCore, DoubleRatchet, X25519, KyberKEM) | ❌ Не реализована | Только `cryptoCore.ts` (stub), `deviceSecurity.ts` (PIN) |
| P2P сеть (p2pNetwork, Libp2pNode, PureP2PNetwork) | ❌ Не реализована | Нет файлов в `src/lib/p2p/` |
| Безопасность (rateLimiter, sanitizer, spamDetector) | ❌ Не реализована | Нет файлов в `src/lib/security/` |
| Резервное копирование (Cloud/P2P backup) | ⚠️ Частичально | Есть в `SettingsView.tsx` (backup import/export) |
| Боты (BotApi, BotFSM, BotWebhooks) | ⚤ Частичально | Нет реализации, только UI компоненты |
| Модерация (ChannelModerationService) | ❌ Не реализована | Нет |
| Кэширование (MultiLevelCache) | ❌ Не реализована | Нет |
| Платёжная система (CryptoPayments, Paymento) | ❌ Не реализована | Нет |
| Premium/Stars (premiumManager, starsManager) | ❌ Не реализована | Нет |
| Резилиентность (circuitBreaker, healthMonitor) | ❌ Не реализована | Нет |
| Транспорт и протоколы (MTProto, ObfuscatedTransport) | ❌ Не реализована | Нет |
| Утилиты (yieldToMain, processInChunks) | ❌ Не реализована | Нет |
| Accessibility (announce, useFocusTrap) | ⚤ Частичально | Есть `useAnnounce` в `src/lib/a11y.ts` (если есть) |
| Аккаунты (accountManager) | ⚤ Частичально | `store/index.ts` имеет store для аккаунтов |
| Интеграции (Bitrix24, Google Calendar) | ❌ Не реализована | Нет |
| МиниАппы (MiniAppSDK, PermissionManager) | ❌ Не реализована | Нет |
| Сигнализация (signaling, meshSignaling) | ❌ Не реализована | Нет |
| Huddle (групповые вызы) | ❌ Не реализована | Нет |
| Календарь | ❌ Не реализована | Нет |
| Хранирование (storageEncryption) | ⚤ Частичально | `idb-keyval` + `cryptoCore` частично |
| Звуки (sound system) | ✅ Реализована | `src/lib/sounds/` — полный модуль |

## Фазы реализации

### Фаза 1: Криптография и безопасность (критичная)

**Приоритет: 🔴 Критический**

1. `src/lib/crypto/cryptoCore.ts` — полная реализация:
   - `CryptoCore.initialize()`
   - `CryptoCore.generateIdentityKeys()` — classical + PQ (KyberKEM + X25519)
   - `CryptoCore.performHandshake()` — двойная рукопожатие (classical + PQ)
   - `CryptoCore.encryptMessage()` / `decryptMessage()` — AES-256 + ML-KEM-768
   - `CryptoCore.rotateKeys()` — ротация ключей

2. `src/lib/crypto/doubleRatchet.ts` — DoubleRatchet (Signal Protocol):
   - `DoubleRatchet.initialize()`
   - `DoubleRatchet.encrypt()` / `decrypt()`
   - `DoubleRatchet.trySkippedDecrypt()` — skipped key decrypt

3. `src/lib/security/rateLimiter.ts` — Rate Limiter:
   - `rateLimiter.checkLimit(identifier, limit, windowMs)`
   - `rateLimiter.resetLimit(identifier)`

4. `src/lib/security/sanitizer.ts` — Sanitizer:
   - `escapeHtml()`, `stripHtml()`, `sanitizeText()`, `isSafeUrl()`, `toPlainText()`

5. `src/lib/security/spamDetector.ts` — Spam Detector:
   - `spamDetector.checkSpam(data)`
   - `spamDetector.getMetrics()`

6. `src/lib/security/securityLogger.ts` — Security Logger:
   - `securityLogger.log(event)` — logging security events
   - `securityLogger.getLogs(filter)` — получение логов
   - `useSecurityLogs()` — React hook для логов

7. `src/lib/security/deviceSecurity.ts` — расширение:
   - `deviceSecurity.initSessionMasterKey()` — уже есть
   - `deviceSecurity.secureWipe()` — wipe all data

### Фаза 2: P2P сеть и резервное копирование

**Приоритет: 🟡 Высокий**

8. `src/lib/p2p/network.ts` — P2P Network:
   - `p2pNetwork.init(options)`
   - `p2pNetwork.connect(peerId)` / `disconnect(peerId)`
   - `p2pNetwork.broadcast(data)` / `onMessage(handler)`

9. `src/lib/p2p/fileSharing.ts` — P2P File Sharing:
   - `fileSharing.sendFile(file, peerId)`
   - `fileSharing.receiveFile(fileId)`

10. `src/lib/backup/cloudBackup.ts` — Cloud Backup:
    - `encryptBackupData(plaintext, passphrase)`
    - `decryptBackupData(encryptedJson, passphrase)`

11. `src/lib/backup/p2pBackup.ts` — P2P Backup:
    - `p2pBackup.createBackup(peerId)`
    - `p2pBackup.restoreBackup(peerId)`

### Фаза 3: Боты и интеграции

**Приоритет: 🟢 Средний**

12. `src/lib/bot/api.ts` — Bot API:
    - `botApi.send(botId, command, data)`
    - `botApi.receive(botId, handler)`

13. `src/lib/bot/fsm.ts` — Bot FSM:
    - `BotFSM` — конечная машина для ботов
    - `InMemoryFSMStorage`, `LocalStorageFSM`

14. `src/lib/bot/webhooks.ts` — Bot Webhooks:
    - `botWebhooks.addWebhook(config)`
    - `botWebhooks.verifySignature(payload, signature)`

15. `src/lib/bot/rankLimiter.ts` — Bot Rate Limiter:
    - `botRateLimiter.allowRequest(identifier)`

16. `src/lib/integrations/bitrix24.ts` — Bitrix24 Client:
    - `bitrix24Client.connect(config)`
    - `bitrix24Client.createTask(task)`

17. `src/lib/integrations/googleCalendar.ts` — Google Calendar Client:
    - `googleCalendarClient.connect(config)`
    - `googleCalendarClient.createEvent(event)`

### Фаза 4: Модерация и кэширование

**Приоритет: 🟢 Средний**

18. `src/lib/moderation/channel.ts` — Channel Moderation:
    - `channelModerationService.checkMessage(message, chatId)`
    - `channelModerationService.banUser(userId, chatId)`

19. `src/lib/cache/index.ts` — Multi-Level Cache:
    - `MultiLevelCache`, `MemoryCache`, `StorageCache`
    - `createCache()`, `clearAllCaches()`

### Фаза 5: Платёжная система и Premium

**Приоритет: 🟡 Высокий**

20. `src/lib/payments/crypto.ts` — Crypto Payments:
    - `cryptoPayments.createPayment(amount, currency)`
    - `cryptoPayments.confirmPayment(paymentId, txHash)`

21. `src/lib/payments/paymento.ts` — Paymento Service:
    - `paymentoService.createPayment(request)`
    - `paymentoService.getPaymentStatus(requestId)`

22. `src/lib/ads/premiumManager.ts` — Premium Manager:
    - `premiumManager.activate()` / `deactivate()`
    - `premiumManager.checkStatus()`

23. `src/lib/ads/starsManager.ts` — Stars Manager:
    - `starsManager.purchase(amount)`

24. `src/lib/ads/adEngine.ts` — Ad Engine:
    - `adEngine.selectAd(placement)`
    - `adEngine.recordImpression(adId)`

### Фаза 6: Резилиентность и транспорт

**Приоритет: 🟢 Средний**

25. `src/lib/resilience/circuitBreaker.ts` — Circuit Breaker:
    - `circuitBreaker.fire()` / `reset()`
    - `withRetry(fn, options)` — retry with backoff

26. `src/lib/resilience/healthMonitor.ts` — Health Monitor:
    - `healthMonitor.check()` — проверка здоровья системы
    - `healthMonitor.getStats()` — статистика

27. `src/lib/transport/obfuscator.ts` — Traffic Obfuscator:
    - `trafficObfuscator.obfuscate(data)` / `deobfuscate(data)`

28. `src/lib/transport/wsTunnel.ts` — WebSocket Tunnel:
    - `wsTunnel.connect(url)`
    - `wsTunnel.send(data)`

### Фаза 7: Accessibility, Утилиты, Сигнализация

**Приоритет: 🟡 Высокий**

29. `src/lib/a11y.ts` — Accessibility:
    - `announce(message, priority)` — озвучка событий
    - `useFocusTrap()` — trap focus в модальных окнах
    - `useReducedMotion()` — reduced motion preference

30. `src/lib/utils/yieldToMain.ts` — Yield to Main:
    - `yieldToMain()` — yield execution to main thread
    - `processInChunks(items, chunkSize, processor)` — chunked processing

31. `src/lib/signaling/index.ts` — Signaling:
    - `signaling.connect(url)` — WebSocket signaling connection
    - `signaling.send(message)` — отправка сообщений через signaling

32. `src/lib/huddle/index.ts` — Huddle (групповые вызы):
    - `huddleManager.createHuddle(chatId)`
    - `huddleManager.joinHuddle(huddleId)`
    - `huddleManager.sendMessage(huddleId, message)`

33. `src/lib/calendar/index.ts` — Calendar:
    - `calendarManager.createEvent(event)`
    - `calendarManager.listEvents(startDate, endDate)`

34. `src/lib/storage/index.ts` — Storage Encryption:
    - `initStorageEncryption()`
    - `encryptStorageData(data)`
    - `decryptStorageData(encryptedData)`

35. `src/lib/accountManager.ts` — Account Manager:
    - `accountManager.addAccount(account)`
    - `accountManager.switchAccount(accountId)`
    - `accountManager.createAccount(userId, name, publicKey)`

36. `src/lib/adapt/index.ts` — Data Adapter:
    - `adaptData(data, schema)` — адаптация данных
    - `validateData(data, schema)` — валидация

37. `src/lib/reserves/index.ts` — Reserves:
    - `checkReserves()` — проверка резервов
    - `reserves.getStorageSize()` — размер хранения
    - `reserves.clearStorage()` — очистка хранирования

## План внедрения звуков (завершение)

**Приоритет: ✅ Выполнено (частичально)**

Файлы звуков скопированы в `public/` — готовы к использованию.

Модуль звуков создаётся в `src/lib/sounds/`:
- `config.ts` — конфигурация звуков (маппинг событий → файлы)
- `player.ts` — SoundPlayer (класс, управление, cooldown, volume)
- `hooks.ts` — React hooks (`useSoundSettings`)
- `index.ts` — экспорт модуля

Звуки интегрируются в:
- `SystemPulsePlayer.tsx` — звуки при воспроизведении медиа
- `ContactsView.tsx` — звуки при получении сообщений
- `SettingsView.tsx` — настройки звука (вкл/выкл, громкость)

## Безопасность

1. **Шифрование хранирования** — `src/lib/storage/` — шифрование IndexedDB
2. **Rate limiting** — защита от DoS на клиенте
3. **Sanitizer** — защита от XSS атак
4. **Security Logger** — логирование инцидентов безопасности
5. **Spam Detector** — обнаружение спама
6. **Circuit Breaker** — защита от перегрузки сети
7. **Secure Wipe** — безопасная очистка данных

## Следующие шаги

1. Созть базовую структуру `src/lib/` с каталогами для каждой категории
2. Реализовать криптографию и безопасность (Фаза 1)
3. Реализовать P2P сеть (Фаза 2)
4. Реализовать боты и интеграции (Фаза 3)
5. Реализовать модерацию и кэширование (Фаза 4)
6. Реализовать платёжную систему и Premium (Фаза 5)
7. Реализовать резилиентность и транспорт (Фаза 6)
8. Реализовать Accessibility, Утилиты, Сигнализация (Фаза 7)
9. Интегрировать звуки в UI (SystemPulsePlayer, SettingsView)
10. Провести тестирование безопасности

## Примечания

- Все криптографические функции используют Web Crypto API
- P2P функции требуют инициализации через `p2pNetwork.init()`
- Security функции используют `securityLogger` для логирования
- Бот функции требуют авторизации через `BotToken`
- Звуки реализованы в `src/lib/sounds/` — готовы к использованию
