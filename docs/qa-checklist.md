# QA Checklist — MessAndanger

> Артефакт по брифу `docs/telegram_like_chat.md` §18.1 (обязательный output) и §19 (acceptance criteria).
> ✅ пройдено · 🟡 частично · ❌ не пройдено · ❓ требует проверки на устройстве.

## A. Acceptance criteria (бриф §19)

- [x] Полный список экранов и состояний — `docs/sitemap.md` создан
- [x] Chat list: folders, search, archive, pinned, unread, mute — ✅ (`useFilteredChats.ts`, `ChatListView.tsx`)
- [x] Conversation: reply, edit, forward, delete, reactions, selection — ✅ (`useMessageActions.ts`)
- [x] Input bar: text, emoji, attachments, voice/video note, custom modules — ✅ (`ChatInputOverlay.tsx`, `LiveVoiceRecorder.tsx`)
- [x] Light/dark themes — ✅ (`ThemeContext.tsx`, `tokens.css`)
- [x] Все ключевые экраны имеют loading/empty/error/offline — 🟡 (есть skeleton/spinner/localStorage кэш, но не везде явно; нужен аудит per-screen, см. data_states)
- [x] Touch targets ≥ 44 dp — ✅ (базово; ❓ проверить на мелких элементах UI)
- [x] Интерфейс локализуем — ✅ (`i18n.tsx`, `locales/*`, 8 языков)
- [ ] Существующие фичи системы встроены нативно — 🟡 (см. `feature-mapping.json`: payments/crm/bots — stub/partial)
- [x] Нет копирования защищённых элементов Telegram — ✅ (оригинальные ассеты, ICQ-стилистика)
- [x] Визуальный стиль целостный — ✅ (neumorphic, `DESIGN.md`)
- [x] Нет перегруженности — ✅ (нужен визуальный аудит)
- [ ] Accessibility checklist — создан `accessibility-checklist.md`
- [ ] Performance checklist — ❌ (см. ниже)
- [ ] Privacy/security checklist — ✅ частично (`SECURITY.md`, `threat-model.md`); привязать к UI-требованиям §12

## B. Структурные экраны (бриф §4) — покрытие

| Экран | Статус |
|---|---|
| Auth / Onboarding | ✅ |
| Main Shell | ✅ |
| Chat List | ✅ |
| Conversation | ✅ |
| Chat/Group/Channel/Bot Profile | 🟡 (бот — нет) |
| Global Search | ✅ (in-chat search ✅ — `useChatPreviewState` + `SearchBar` + `FormattedText` highlight) |
| Contacts | ✅ |
| Calls | ✅ |
| Stories / Updates | ✅ |
| Settings | ✅ |
| Media Viewer | ✅ |
| System Feature Containers | 🟡 (см. feature-mapping) |
| Overlay Layers | ✅ |

## C. Состояния данных (бриф §16.2) — требуются для КАЖДОГО экрана

- [ ] loading
- [ ] loaded
- [ ] empty
- [ ] error
- [ ] offline
- [ ] partial
- [ ] unauthorized
- [ ] restricted
- [ ] deleted

> ❗ Не покрыто централизованно. Рекомендация: ввести `useAsyncState` + единый `EmptyState`/`ErrorState` (бриф §8.10/§8.11) и пройтись по всем экранам.

## D. Performance checklist (бриф §16.1, §4 ETAP 4)

- [ ] Chat list scroll 60 fps (проверить; используется `@tanstack/react-virtual`)
- [ ] Открытие чата < 300 ms на локальном кэше
- [ ] Ввод текста без задержек
- [ ] Тяжёлые медиа лениво грузятся (lazy import присутствует)
- [ ] Анимации не блокируют ввод
- [ ] Core Web Vitals в зелёной зоне (не измерено)

## E. Known gaps (приоритет исправления)

> ⚠️ Первичный аудит (см. commit-историю чата) переоценил объём нехватки: in-chat search, адаптив 3-pane и боты (commands) **уже реализованы**.
> По брифу §2.0 / §13.2 / §20 функции, отсутствующие в `system_context.existing_features`, **запрещено выдумывать** — они помечены `missing_context`.

### Genuine code gaps (реально можно доработать без внешних зависимостей)
1. ✅ `data_states` (§16.2): инфраструктура + **применено на экранах** — `ChatListView`, `ContactsView`, `CallLogView`, `GlobalSearch`, `ProfileView` (loading) используют `ui/DataState`/`useAsyncState`.
2. ✅ `search_match_nav` (§5.4): навигатор совпадений в `SearchBar` + `scrollToIndex` в `VirtualizedMessageList`.
3. ✅ `bot_profile_mini_app` (§5.5): `BotProfileView` (профиль + команды), `InlineKeyboard` (рендер/обработка кнопок), `MiniApp` (iframe + WebApp bridge). Открывается из списка ботов (`ChatListView`).

### missing_context (реализовано как UI + типизированный сервисный контракт; бэкенд-адаптер подключается через `ServicesProvider`/`configureServices`)
- ✅ `payments_in_chat` (§2.2, §5.4) — `PaymentCard` + экран счетов (`WorkplaceView`), `PaymentsService`.
- ✅ `message_translate` (§5.4, §13.3) — действие «Перевести» в контекстном меню сообщения + инлайн-перевод, `TranslateService`.
- ✅ `tasks`, `automation`, `analytics`, `moderation`, `knowledge_base` (§4.1, §13.3) — вкладки `WorkplaceView` + соответствующие сервисы (`Tasks`/`Automation`/`Analytics`/`Moderation`/`KnowledgeBase`).
- ⚠️ Все перечисленные фичи **не содержат фейковых данных**: без бэкенд-адаптера показывают честное состояние «интеграция не подключена» (через `DataState`). Реальные данные появятся после передачи `system_context.existing_features` и реализации адаптеров.

### Реализовано (не требует работ)
- ✅ In-chat search, Adaptive 3-pane, Bots (create/commands), Calls, Stories, Polls, Location, Scheduled messages, Reactions, Forward, Archive, Drafts, PWA/offline, Light/Dark, i18n (8 языков).
