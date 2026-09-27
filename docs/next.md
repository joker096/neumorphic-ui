# Что дальше (roadmap)

> Статус-аннотация 2026-09-21 (сверено с `CHANGELOG.md`).
> «закрыто» = есть подтверждающая запись в CHANGELOG; «частично» / «открыто» = подтверждения нет либо остаётся остаток.

Критично

Настоящие P2P-звонки — закрыто (P2, 2026-09-15).

Сейчас CallManager частично симулирует соединение.
Нужно связать звонки с реальным WebRTC/P2P transport.
Добавить reconnect, смену сети, peer media и проверку identity.
Адресная доставка — закрыто (P3, 2026-09-15).

Сейчас p2pNetwork.broadcast() отправляет frames всем подключенным peer.
ACK/read receipts должны идти конкретному получателю, а не broadcast-группе.
Добавить targetPeerId и адресную маршрутизацию.
Обязательная криптографическая identity-проверка — закрыто (P4, 2026-09-15).

Запретить handshake без подписанного ephemeral DH key.
Связать publicKey, identity key и peer session.
Добавить fingerprint verification и предупреждение о неизвестном peer.
Защита от legacy frames — закрыто (P5, 2026-09-15).

Сейчас frames без sequence/context еще принимаются.
После периода миграции включить strict mode и отклонять старый формат.
Anti-replay для всех типов данных — закрыто (P5, 2026-09-15).

Сейчас защита в основном покрывает data channel.
Нужно добавить sequence/context для metadata, call-control и file-transfer frames.
Надежность сообщений
Полноценный ACK pipeline — закрыто (2026-09-15).

queued → sending → sent → delivered → read → failed.
Retry с exponential backoff.
Максимальное количество попыток и понятная причина ошибки.
Стабильная дедупликация — закрыто.

Использовать wire-level messageId для всех сообщений, файлов и ACK.
Сейчас часть file frames все еще зависит от transport-generated IDs.
Проверка порядка и пропусков — закрыто (2026-09-15).

Отслеживать gaps в sequence counters.
Запрашивать повторную передачу отсутствующих frames.
— Примечание (2026-09-15): канал данных — SCTP ordered/reliable (`ordered: true`), gaps в seq невозможны структурно; повторная передача уже есть (ACK pipeline retry/backoff). Реальный баг был в порядке: поздний retransmit рендерился после свежих сообщений — исправлено вставкой по числовому id (время отправки) на ingress (`useP2PMessages.insertBySendTime`).
Offline queue — закрыто (2026-09-15).

Добавить срок хранения сообщений.
Ограничить размер очереди.
Добавить отмену, retry и очистку неотправленных сообщений.
Не переводить сообщения в delivered без peer ACK.
File transfer
Строгая валидация входящих файлов — закрыто (overflow 2, 2026-09-15).

Проверять transferId, chunk index, total chunks, размер base64 и общий размер.
Отклонять дубликаты chunks.
Добавить timeout и очистку незавершенных transfer.
Проверка целостности на receive — закрыто (overflow 2, 2026-09-15).

После сборки повторно вычислять SHA-256.
При несовпадении удалять файл и показывать ошибку.
Защита от storage exhaustion — закрыто (overflow 3, 2026-09-15).

Лимит общего объема IndexedDB.
Лимит количества одновременных transfer.
Автоматический garbage collection.
Безопасность хранения
Убрать plaintext fallback для master seed — закрыто (H1/S3, 2026-09-14).

При отказе device-bound encryption приложение должно fail closed.
Использовать recovery phrase или явный passphrase, но не plaintext IndexedDB.
Атомарное сохранение TOTP и TURN credentials — закрыто (P6, 2026-09-15).

Не писать секрет сначала в plaintext, а шифровать потом.
Шифровать до первой записи.
При ошибке шифрования отменять сохранение.
OS secure storage — закрыто (2026-09-15): web-аналог = WebCrypto неэкстрактный device-bound wrapping key. Неэкстрактные CryptoKey не сериализуются — master key по необходимости экстрактный (persist raw wrapped at rest; overwrap уже реализован H1/P6). Живой Android Keystore / iOS Keychain остаётся для нативных сборок (Capacitor `preferences` `secure: true`) — вне web-радиуса.

Android Keystore.
iOS Keychain.
Windows Credential Manager/DPAPI для desktop.
Ротация секретов — частично (operator action, P1/C1).
Device-bound KDF как не-public fingerprint — открыто, нужен продуктовый выбор (P1-3 partial, 2026-09-26): `deviceSecurity.getDeviceBoundKey()` выводит wrapping key из публичного browser fingerprint (canvas/WebGL/shape/мобильные сигнатуры), поэтому он защищает от случайного чтения IndexedDB, но не от целенаправленного локального сбора этой же телеметрии. Схема «PIN → KEK» (Argon2id/scrypt по PIN с солью на устройстве) сделала бы ключи невыводимыми из fingerprint, но **забытый PIN = необратимая потеря локальной идентичности и данных** (recovery-phrase восстанавливает identity, но не at-rest данные). Требуется решение владельца продукта; до него — см. `docs/security-guide.md` и threat model §3.4.1.

В DEPLOY.md присутствуют реальные/похожие административные credentials.
Их нужно немедленно ротировать, удалить из документации и истории, заменить placeholders.
Приватность
Минимизировать metadata leakage — частично (P5).

Не передавать display name там, где достаточно peer/contact ID.
Добавить encrypted metadata envelopes.
Не использовать name matching как основной механизм маршрутизации.
Typing/presence/read receipts — закрыто (2026-09-15).

Адресная доставка.
Настройки приватности должны реально блокировать отправку presence/typing/read.
Не отправлять read receipt при preview, background или неактивной вкладке.
Self-destruct: таймер самоуничтожения только скрывал пузырь — закрыто (2026-09-26): `useSelfDestructSweep` реально удаляет сообщение из `chats`/`channels` (и из персист-снимка), из активного открытого чата, из saved-messages, стирает голосовой blob и file-transfer chunks/metas и вычищает текстовую копию из `replyTo` цитат. Дедлайны, истёкшие при закрытом приложении, снимаются при старте.
Self-destruct по wire — закрыто (2026-09-26): все message-creating фреймы (`chat-text`, `chat-location`, `chat-article`, `chat-audio-meta`, `ftr1:` meta, `abm1:` manifest) несут опциональный `ttlMs` = остаток duration (не абсолютный дедлайн — рассинхрон часов иначе убивает или делает вечным сообщение у получателя). Приём клампится в [1s, 24h] (`wireSelfDestructTtl`/`resolveInboundSelfDestruct`), истёкший outbound-дедлайн клампится вверх, мусорный TTL → «без таймера» (сообщение не теряется). Покрытие таймера расширено с текста на geo/article/file/album. Остаток: legacy-peer без `ttlMs` → сообщение без дедлайна (старые клиенты не форсируются), plaintext-копия в offline-очереди живёт до flush/eviction (`QUEUE_MAX_AGE_MS`).
Relay visibility — закрыто (2026-09-20).

Проверить, какие signaling metadata видит сервер — закрыто: документировано (security-guide.md, «Signaling Visibility»): publicKey + IP/UA в connections-логе (с retention), SDP/ICE = обязательный WebRTC plaintext (E2E-signaling не реализован — документированный limitation), metadata только {isTyping}/{online} без имён, topic pub/sub company-комнаты серверно-читаемы by design.
Убрать plaintext payloads из signaling, где это возможно — закрыто: публичный /health больше не отдаёт live count (был unauthed presence oracle; счётчики — через auth-gated /api/stats/overview); connections-логи автоматически стареют (CONNECTION_LOG_RETENTION_DAYS, дефолт 30).
Добавить documented relay-only mode — закрыто: security-guide.md «Documented Relay-Only Mode» (VITE_RELAY_PROXY_URL + relayBackend; relay видит только signaling + addressed forwarding, data-plane E2E сохраняется).
P2P-сеть
Рабочее peer discovery — закрыто (P7, 2026-09-15).

broadcastRaw() и DHT discovery требуют полноценного production-пути.
Сейчас часть mesh-архитектуры выглядит как заготовка.
Reconnect и peer lifecycle — закрыто (P7 + S4, 2026-09-14/15).

Повторное подключение после offline.
Очистка stale peers.
Ограничение количества соединений.
Backoff и circuit breaker.
TURN/STUN hardening — закрыто (P6+P7, 2026-09-15).

Проверить шифрование и хранение TURN credentials.
Добавить fallback-серверы.
Отображать пользователю relay/direct состояние — закрыто (2026-09-15): TransportIndicator показывает Relay + легенду, когда transportBackend != 'direct'; остальные статусы (Direct/Connecting/Offline/Degraded/Error) сохранены.
UX
Честные состояния соединения — закрыто.

Показать Direct, Relay, Connecting, Offline, Degraded.
Разделить «зашифровано», «отправлено», «доставлено», «прочитано».
Call UX

Разрешения камеры/микрофона — закрыто.
Ошибки устройств — закрыто.
Переключение audio/video — закрыто.
Bluetooth/speaker/earpiece — закрыто: setSinkId-маршрутизация вывода (speaker/earphone) + devicechange hot-plug (2026-09-15).
Входящий звонок при заблокированном экране — закрыто (2026-09-15): ринг/принятие поверх AppLockScreen (PIN/TOTP), CallOverlay вынесен из AppAuthGate (всегда смонтирован, поверх лока); ответ без разблокировки (Telegram-паттерн). OS-lock (экран устройства) = нативный кейс (Capacitor/TWA), вне web-радиуса.
Минимизация и возврат в чат без потери состояния — закрыто.
Mobile testing — частично: 320–375 px / zoom 200% / offline-online автоматизированы (ui-audit 14/14, usability 23/23, offline e2e); реальные Android/iOS устройства, background-foreground, OS-lock-вызовы, медленная сеть/потеря peer = operator (нужен девайс).

Реальные Android/iOS устройства.
320–375 px.
Offline/online switching.
Background/foreground.
Вызовы при заблокированном экране.
Медленная сеть и потеря peer.
Тесты и эксплуатация

E2E-тесты для: — закрыто (2026-09-21): security unit-набор (P8); браузерные dual-peer + reconnect + inbound dial-back (M021) — см. ниже; остальные браузерные P2P-векторы покрыты unit-набором (ACK/read receipt/replay/out-of-order/file corruption/call), браузерный дубль опционален.

два браузера/два peer — закрыто (2026-09-21): `e2e/dual-peer.spec.ts` спавнит реальный signaling-сервер (tsx, WS 8971/REST 8766, temp `data/e2e-dual-peer.db`), два независимых browser context'а доходят до `Connection: Direct` через Vite `/ws` proxy (token fetch → JWT-guarded WS → origin check); Playwright `beforeAll` без timeout-аргумента → `test.setTimeout(90_000)` в хуках; Vite-прокси `/ws` добавлен в `vite.config.ts`. Транспорт-только: Direct = WS открыт, полный P2P data channel не проверяется.

M021 (2026-09-21): — закрыто: inbound dial-back реализован. `useAppConnection` подписывается на `SignallingManager.onMessage` и форвардит offer → `p2pNetwork.acceptInboundOffer` (новый transport, дедуп по peerId). Root cause двух багов: (1) серверный verify падал всегда — `import * as nacl from 'tweetnacl'` в Node ESM (tsx) кладёт CJS module.exports в `.default`, `nacl.sign` undefined → исправлено default-fallback; (2) `wsTunnel.onMessage` раздаёт сырые строки, а app-хендлеры ждали объекты → offer-forward мёртв, `registerMainIdentity` висел до таймаута; исправлено парсингом JSON в `SignallingManager.onMessage`. E2E `e2e/dual-peer.spec.ts` «idle B answers an inbound offer over a dial-back transport» — зелёный (оба контекста Direct, B создаёт dial-back transport, pcState=connected).
message ACK;
read receipt;
reconnect; — закрыто (2026-09-21): `e2e/reconnect.spec.ts` — спавн реального сервера, kill mid-session (пилюля → `Connection: Offline`), респавн на тех же портах (пилюля → `Connection: Direct` через auto-reconnect backoff). Питфолл: per-restart `JWT_SECRET` ломает reconnect — клиентский relay-токен (45-мин TTL) невалиден, сервер 1008 «Authentication required» → pool markFailed → пилюля паркуется в Degraded (blocked); в проде секрет фиксированный. Spec пинит один секрет на весь тест.
duplicate/replay;
out-of-order frames;
file corruption;
call connection.
Security test suite: — закрыто (P8, 2026-09-15).

tampered HMAC;
wrong peer identity;
wrong chat ID;
stale sequence;
oversized frame;
malicious file metadata.
Обновить документацию: — закрыто (2026-09-20): README счётчики актуальны, схема синкана (CallOverlay — sibling после AppAuthGate, 2026-09-15), доверительная модель/signaling-visibility/локальное хранение/direct-vs-relay/recovery/retention подтверждены — security-guide.md «Signaling Visibility» (см. выше) покрывает trust model, что видит сигнальный сервер, retention, relay-only mode.

фактическая модель trust;
что видит signaling server;
какие данные хранятся локально;
direct vs relay режим;
recovery после потери устройства;
политика удаления очереди и файлов — recovery/локальное хранение/удаление очереди описаны в существующих разделах security-guide; до отдельной сводной секции не выделено (опционально).
Приоритет реализации

Ротация секретов из документации. — частично (operator action).
Реальные P2P-звонки. — закрыто (P2).
Адресные ACK/read receipts. — закрыто (P3).
Обязательная peer identity verification. — закрыто (P4).
Strict frame validation и anti-replay для всех каналов. — закрыто (P5).
Безопасное хранение master seed/TOTP/TURN. — закрыто (H1/S3/P6).
Production peer discovery/reconnect. — закрыто (P7).
Полный E2E/security тестовый контур. — закрыто (2026-09-21): security unit-набор P8; браузерные dual-peer + reconnect + inbound dial-back (M021); остальные браузерные векторы (ACK/read receipt/replay/out-of-order/file corruption/call) — unit-покрытие, браузерный дубль опционален.
