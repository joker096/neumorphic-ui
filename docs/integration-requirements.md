# Требования к интеграции бэкенд-сервисов (Integration Requirements)

> **Статус:** черновик требований. Реализует точку интеграции для фич, помеченных в `feature-mapping.json`
> как `missing_context` / `bot_profile_mini_app`. Бэкенд-контекст (`system_context.existing_features`) не передан,
> поэтому в коде реализован **только UI + типизированный контракт**. Реальные данные появятся после реализации
> адаптеров согласно этому документу. Фейковые/мок-данные в проде не используются (бриф §2.0/§13.2/§20).

---

## 1. Как подключить адаптеры

Все сервисы пробрасываются через React-контекст. Точка подключения — `ServicesProvider` в `src/App.tsx`:

```tsx
import { ServicesProvider } from './services';

<ServicesProvider services={{
  bot: realBotAdapter,
  payments: realPaymentsAdapter,
  translate: realTranslateAdapter,
  tasks: realTasksAdapter,
  automation: realAutomationAdapter,
  analytics: realAnalyticsAdapter,
  moderation: realModerationAdapter,
  kb: realKnowledgeBaseAdapter,
}}>
  {/* ...дерево приложения... */}
</ServicesProvider>
```

- Если адаптер не передан — метод бросает `ServiceNotConfiguredError`, UI показывает `DataState` «интеграция не подключена».
- Каждый адаптер должен реализовать интерфейс из `src/services/types.ts` (см. ниже). Методы — `async` (Promise).
- Передавать в адаптеры только реальные данные из бэкенда/внешних API. Никаких sample/демо-данных в проде.

---

## 2. Контракты по фичам

### 2.1 Боты — `BotService` (бриф §4.1, §5.5) — `bot_profile_mini_app`
Где используется: `src/components/features/bot/BotProfileView.tsx` (профиль, inline keyboard, mini-app).

| Метод | Назначение | Возвращает |
|---|---|---|
| `getBotProfile(botId)` | Профиль бота (имя, username, описание, аватар, команды, флаг mini-app) | `BotProfile` |
| `getInlineKeyboard(botId, messageId)` | Inline-клавиатура сообщения (массив рядов кнопок) | `InlineKeyboardButton[][]` |
| `handleInlineButton(botId, messageId, button)` | Обработка нажатия кнопки (callback-запрос к боту) | `void` |
| `getMiniApp(botId)` | Дескриптор mini-app (url + имя) для iframe/WebApp | `MiniAppDescriptor \| null` |

Типы:
```ts
interface BotProfile { id; name; username?; description?; avatarColor?; avatarUrl?; verified?; commands: {command; description}[]; canOpenMiniApp: boolean }
interface InlineKeyboardButton { text; data?; url? }
interface MiniAppDescriptor { name; url }
```

### 2.2 Платежи — `PaymentsService` (бриф §2.2, §5.4) — `payments_in_chat`
Где используется: `PaymentCard` + `PaymentsTab` в `WorkplaceView.tsx`.

| Метод | Назначение | Возвращает |
|---|---|---|
| `getInvoices()` | Список счетов/инвойсов пользователя | `Invoice[]` |
| `createInvoice(input)` | Создать счёт (title, amount, currency, description?) | `Invoice` |
| `payInvoice(invoiceId)` | Оплатить счёт | `Invoice` |

Тип: `Invoice { id; title; amount; currency; description?; status: 'pending'|'paid'|'failed' }`

> UI-карточка `PaymentCard` готова к встраиванию в чат (in-chat payment card). Требуется платёжный бэкенд (шлюз/провайдер).

### 2.3 Перевод сообщений — `TranslateService` (бриф §5.4, §13.3) — `message_translate`
Где используется: действие «Перевести» в контекстном меню `ChatMessage.tsx` + инлайн-перевод.

| Метод | Назначение | Возвращает |
|---|---|---|
| `detectLang(text)` | Определить исходный язык | `string` (код, напр. `"en"`) |
| `translate(text, from, to)` | Перевести текст | `string` |

> Требуется внешний сервис перевода (напр. облачный translation API). Без адаптера — toast «Перевод не подключён».

### 2.4 Задачи — `TasksService` (бриф §4.1, §13.3) — `tasks`
Где используется: `TasksTab` в `WorkplaceView.tsx`.

| Метод | Назначение | Возвращает |
|---|---|---|
| `listTasks(filter?)` | Список задач (фильтр по `done`) | `Task[]` |
| `createTask(input)` | Создать задачу (title, due?, assignee?) | `Task` |
| `updateTask(id, patch)` | Обновить задачу (напр. `done`) | `Task` |

Тип: `Task { id; title; done; due?; assignee? }`

### 2.5 Автоматизация — `AutomationService` (бриф §4.1, §13.3) — `automation`
Где используется: `AutomationTab` в `WorkplaceView.tsx`.

| Метод | Назначение | Возвращает |
|---|---|---|
| `listRules()` | Список правил автоматизации | `AutomationRule[]` |
| `toggleRule(id, enabled)` | Вкл/выкл правило | `AutomationRule` |

Тип: `AutomationRule { id; name; trigger; action; enabled }`

### 2.6 Аналитика — `AnalyticsService` (бриф §4.1, §13.3) — `analytics`
Где используется: `AnalyticsTab` в `WorkplaceView.tsx` (бары метрик канала).

| Метод | Назначение | Возвращает |
|---|---|---|
| `getChannelMetrics(channelId)` | Метрики канала (подписки, охват, сообщения…) | `MetricPoint[]` |

Тип: `MetricPoint { label; value }`

### 2.7 Модерация — `ModerationService` (бриф §4.1, §13.3) — `moderation`
Где используется: `ModerationTab` в `WorkplaceView.tsx`.

| Метод | Назначение | Возвращает |
|---|---|---|
| `listQueue()` | Очередь жалоб/репортов | `ModerationItem[]` |
| `resolve(id)` | Закрыть item модерации | `ModerationItem` |

Тип: `ModerationItem { id; type: 'message'|'user'|'report'; summary; status: 'open'|'resolved' }`

### 2.8 База знаний — `KnowledgeBaseService` (бриф §13.3) — `knowledge_base`
Где используется: `KbTab` в `WorkplaceView.tsx` (поиск + статьи).

| Метод | Назначение | Возвращает |
|---|---|---|
| `search(query)` | Поиск статей по запросу | `KbArticle[]` |
| `getArticle(id)` | Получить статью по id | `KbArticle` |

Тип: `KbArticle { id; title; body; tags: string[] }`

---

## 3. Чек-лист реализации адаптеров (для исполнителя)

- [ ] `bot` — профиль бота, команды, inline keyboard, mini-app URL
- [ ] `payments` — список/создание/оплата счетов (платёжный шлюз)
- [ ] `translate` — детект языка + перевод (translation API)
- [ ] `tasks` — CRUD задач
- [ ] `automation` — список/переключение правил
- [ ] `analytics` — метрики каналов
- [ ] `moderation` — очередь/резолв жалоб
- [ ] `kb` — поиск/чтение статей
- [ ] Все адаптеры передать в `<ServicesProvider services={...} />` в `src/App.tsx`
- [ ] Убедиться, что UI перестал показывать «интеграция не подключена» (заменить `ServiceNotConfiguredError` на реальные данные)

---

## 4. Примечания

- Контракты — единственный источник правды: `src/services/types.ts`.
- Хранить секреты/ключи API **только на бэкенде**; фронт вызывает адаптер, адаптер ходит на бэкенд.
- Не реализовывать «демо/мок» данные в проде — это нарушает бриф. Для локального просмотра допустим отдельный,
  явно помеченный demo-адаптер, не попадающий в прод-сборку.
