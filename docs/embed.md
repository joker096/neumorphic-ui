# Встраиваемый чат (embed widget)

Многоарендаторный виджет чата для сайтов: аналоги Intercom / JivoSite / Tawk / Chatwoot.
Виджет — `<iframe>` с отдельной React-сборкой (`embed-widget.html`), загрузчик — классический скрипт `widget.js`.
Бэкенд — REST + WebSocket в составе сервера мессенджера.

---

## 1. Установка

### 1.1 Сборка
`vite.config.ts` уже содержит вход `embed-widget` (`embed-widget.html`).
```
npx vite build
```
В `dist/` появятся:
- `dist/embed-widget.html` + `dist/assets/embed-widget-*.js|css` — сборка iframe;
- `dist/widget.js` — публичный загрузчик (копируется из `public/widget.js`).

### 1.2 Создание виджета
```
npm run embed:seed          # демо-виджет id="demo"
```
(скрипт `scripts/seed-embed-widget.mjs`, идемпотентен).
В реальной схеме виджет создаётся панелью оператора/администратора — записи в таблице `embed_widgets`.

### 1.3 Подключение на сайт
```html
<script src="https://<host>/widget.js"></script>
<script>
  window.MyMessengerChat?.init({
    widgetId: "demo",            // id виджета (обязательно)
    // position: "bottom-right"  // или bottom-left (переопределяет конфиг)
  });
</script>
```
Требования:
- скрипт можно ставить ДО `init` — вызовы буферизуются (`window.MyMessengerChat.q`) и проигрываются после загрузки;
- домен сайта должен быть в `website_domains` виджета (см. §4);
- `init` можно вызвать один раз (повторные вызовы игнорируются).

### 1.4 API виджета
| Метод | Назначение |
|---|---|
| `init(options)` | инициализация (widgetId, position) |
| `open()` / `close()` / `toggle()` | открыть/закрыть/переключить |
| `setVisitor({email, name| attributes})` | задать посетителя |
| `setAttributes(obj)` | дополнительные атрибуты |
| `sendMessage(text)` | отправить сообщение |

События iframe пробрасываются на `window` как CustomEvents с префиксом `mm:`:
`mm:ready` (виджет загружен), `mm:unread-count` (`detail.count`), `mm:open`/`mm:close`, `mm:message:sent`.

---

## 2. REST API (бэкенд)

Базовый путь: `/api/v1/embed`. Формат — JSON. Лимиты запросов — на IP и на сессию.

### 2.1 Конфигурация
`GET /api/v1/embed/widgets/:id/config`
```json
{
  "widget": {
    "id": "demo",
    "title": "Чат поддержки",
    "subtitle": "Мы на связи",
    "position": "bottom-right",
    "theme": { "primaryColor": "#2563eb" },
    "locale": "ru",
    "features": {
      "fileUpload": true, "emoji": true,
      "prechatForm": true, "offlineForm": true, "rating": true
    },
    "operators_online": true
  }
}
```

### 2.2 Сессия посетителя
`POST /api/v1/embed/widgets/:id/session`
```json
{ "name": "Иван", "email": "i@example.com", "attributes": { "utm_source": "blog" } }
```
Ответ: `{ "visitor_session_id": "…", "visitor_token": "…", "websocket_token": "…" }`.
`visitor_token` храните в `localStorage` — он используется для идентификации посетителя (upsert по `(widget_id, visitor_token)`).

### 2.3 Диалоги и сообщения (Bearer <visitor_token>)
- `POST /api/v1/embed/conversations` → `{ "conversation_id": "…" }`
  тело: `{ "visitor_session_id": "…", "context": {} }`
- `GET /api/v1/embed/conversations?session=<visitor_session_id>` — список диалогов
- `GET /api/v1/embed/conversations/:id/messages` — история
- `POST /api/v1/embed/conversations/:id/messages` — отправить (лимит 6/мин на сессию, тело до 4000 симв.)
  тело: `{ "type": "text", "body": "привет" }`
  ответ: `{ "message_id": "…" }`, затем событие `message:created` на канале реалтайма
- `POST /api/v1/embed/conversations/:id/typing` — индикатор набора
- `POST /api/v1/embed/conversations/:id/rating` — оценка, тело: `{ "rating": 5, "rating_comment": "…" }`
- `POST /api/v1/embed/upload` — файл (base64 JSON), тело:
  `{ "file_name": "a.png", "mime_type": "image/png", "data_base64": "…" }`
  ответ: `{ "attachment_id": "…", "url": "/uploads/<uuid>.png" }`

**Безопасность сообщений:** тело хранится как **текст** и должно рендериться как текст, никогда через `innerHTML` (XSS).

### 2.4 Идентифицированные пользователи (HMAC, §12.2)
У виджета может быть задан `hmac_secret` (колонка `embed_widgets.hmac_secret`).
Бэкенд сайта подписывает стабильный идентификатор пользователя и срок действия:
```
claim = `${uid}:${exp}`            // exp — Unix-секунды
signature = HMAC_SHA256(hmac_secret, claim)  // base64
```
При создании сессии передайте `identity`:
```json
{ "visitor_token": "…", "identity": { "uid": "user-42", "exp": 1750000000, "signature": "…" } }
```
Проверка: подпись сверяется через `timingSafeEqual`, `exp` не должен быть в прошлом (fail-closed — неверная подпись игнорируется, сессия не отклоняется). Ответ приобретает поля:
```json
{ "identified": true, "identity": { "uid": "user-42", "exp": 1750000000 } }
```
Идентичность видна оператору в списке диалогов (поле `visitor.identity`).

### 2.5 Операторская панель (Bearer <admin_token>)
Базовый путь `/api/v1/embed/operator`, авторизация — по административному JWT
(та же схема, что в других админ-роутах; лимиты: анонимные 30/мин на IP, оператор 120/мин).
- `GET /api/v1/embed/operator/widgets` — список виджетов
- `GET /api/v1/embed/operator/conversations?status=open|closed|all&widget=<id>` — диалоги с данными посетителя, `message_count`, `last_message`
- `GET /api/v1/embed/operator/conversations/:id/messages` — полная история
- `POST /api/v1/embed/operator/conversations/:id/messages` — ответ оператора, тело:
  `{ "type": "text", "body": "…" }`; `sender_type=operator`, публикует `message:created` на канале реалтайма; закрытый диалог автоматически переоткрывается
- `PATCH /api/v1/embed/operator/conversations/:id` — смена статуса/назначения, тело:
  `{ "status": "closed"|"open", "assignee_id": "…"|null }`

**Готовая UI-панель оператора** встроена в админ-SPA: `admin/src/pages/EmbedChats.tsx`
(пункт «Чаты сайта» в боковом меню; маршрут `/embed-chats`). Панель
потребляет перечисленные выше endpoints: список диалогов с фильтром
открытые/все/закрытые, просмотр истории, ответ оператора, закрытие/переоткрытие.
Тесты — `src/lib/admin-embed-chats-page.test.tsx` (4). Живое обновление: список и открытый тред авто-обновляются каждые 10 с (приостанавливаются при `document.hidden`) — входящие сообщения посетителя появляются без ручной перезагрузки.

---

## 3. Реалтайм (WebSocket)

Канал диалога — topic `embed:c:<conversationId>`.
Сервер публикует сообщения через `registeredEmbedRealtime.publishToTopic` (механизм `publishToTopic` в `signaling-server.ts`, rooms по topic).
Панель оператора в админ-SPA пока получает новые сообщения **поллингом** (каждые 10 с, с паузой при `document.hidden`) — подписка на WS-topic здесь не используется.

---

## 4. Безопасность

| Угроза | Защита |
|---|---|
| **«Чужой» сайт** подключает виджет | проверка origin: `Origin`/`Referer` должен совпадать с одним из `website_domains` (host или `www.<domain>`). localhost/127.0.0.1 разрешены для разработки. |
| **Подделка посетителя** | сессия привязана к `visitor_token`; сообщения/диалоги проверяются по `(conversation_id, visitor_token)` (join). |
| **Доступ к чужому диалогу** | `401` при неверном токене или несовпадении сессии. |
| **Спам** | лимиты: config 120/мин на IP, session 20/мин на IP, send 6/мин на сессию. |
| **Загрузка вредоносного файла** | белый список MIME (`image/jpeg,png,gif,webp`, `application/pdf,text/plain,application/json`), макс. 10 МБ. |
| **Path traversal** при отдаче `/uploads/` | запрещены `..`, `/`, `\` в имени. |
| **XSS через сообщение** | текст рендерится только как текст, без `innerHTML`. |
| **Подделка идентичности** | HMAC-подпись `uid:exp` на `hmac_secret` виджета, сравнение через `timingSafeEqual`, проверка срока действия (fail-closed). |
| **Неавторизованный оператор** | операторские endpoints требуют административный JWT (та же схема, что у прочих админ-роутов) + отдельные лимиты. |
| **Доступ к чужому диалогу (оператор)** | только по id диалога; утечки данных между виджетами нет — диалоги принадлежат конкретному `visitor_session_id`. |

Опционально для **идентифицированных пользователей** (ваш бэкенд знает email): подпишите payload ключом виджета (HMAC) — см. §12.2 и §2.4. Реализация присутствует: `hmac_secret` в `embed_widgets`, проверка в `handleSessionCreate`.

---

## 5. Темы и локализация

- Конфиг виджета содержит `theme` (`{ primaryColor, bubbleColor, … }`) и `locale` (`ru`/`en`/…).
- Iframe применяет акцентный цвет через CSS-переменную `--ec-accent` (из `theme.primaryColor`, по умолчанию `#2563eb`).
- Prechat/офлайн-формы включаются фичами `prechatForm`/`offlineForm` в конфиге.

---

## 6. Файлы

| Файл | Роль |
|---|---|
| `server/embed.ts` | REST-обработчик `/api/v1/embed/*` |
| `server/middleware/embedOrigin.ts` | проверка origin |
| `server/db.ts` | схема `embed_*` в `initSchema()` |
| `server/signaling-server.ts` | роутинг + `/uploads/` + `publishToTopic` |
| `embed-widget.html` + `src/embed-frame-entry.tsx` + `src/embed-frame.css` | сборка iframe |
| `public/widget.js` | публичный загрузчик |
| `public/demo.html` | демо-страница |
| `scripts/seed-embed-widget.mjs` | создание демо-виджета |
| `server/__tests__/embed.test.ts` | интеграционные тесты бэкенда (11) |
| `server/__tests__/embed-operator.test.ts` | тесты операторских endpoints и HMAC (10) |

---

## 7. Тесты

```
npx vitest run server/__tests__/embed.test.ts server/__tests__/embed-operator.test.ts
```
Покрытие: origin-403, конфиг, 404 (нет/выкл.), сессия (создание/переиспользование/обновление), диалог (201/401), список, отправка + persistance + publish, cross-visitor 401, typing, rating, белый список MIME, лимит 6/мин → 429.
Оператор: 401 без токена, список виджетов, список диалогов с посетителем, история, ответ оператора + publish + переоткрытие, status/assignee, 404. HMAC: валидная подпись → identified, подделка → fail-closed, истёкший exp → отказ.

**E2E** (Playwright) — `e2e/embed-widget.spec.ts`, сквозной прогон бэкенда и iframe-виджета:

```
npx vite build          # нужен dist/ (serves widget.js + embed-widget.html + assets)
npx playwright test e2e/embed-widget.spec.ts
```

Спека сама поднимает настоящий embed-бэкенд (`npx tsx server/signaling-server.ts`, `DB_PATH=data/test-embed-e2e.db`, REST/WS порты 8766/8765, `JWT_SECRET` ≥32 симв.) и проверяет: launcher виден и открывает iframe, `.ec-title` отображается, посетитель отправляет сообщение через композер (`.ec-msg-own`), оператор получает диалог с `last_message` в операторском списке, отвечает (возвращает 201) и в истории тред содержит оба сообщения. Единственное требование среды — собранный `dist/`.
