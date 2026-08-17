---
doc_type: ai_agent_brief
project: messenger_2026
reference_class: telegram_like_messenger
version: 1.0.0
date: 2026-06-15
language: ru
owner: product_system
goal: >
  Спроектировать мессенджер, который по ощущению, плотности, сценариям и качеству UX
  максимально близок к классу современного Telegram-подобного мессенджера,
  но является оригинальным продуктом с собственными фичами, уже существующими в системе.
priority_rules:
  - existing_system_features_first
  - original_assets_only
  - usability_and_speed
  - visual_similarity_by_pattern_not_copy
  - accessibility_and_privacy
---

# Бриф для ИИ-агента: мессенджер 2026, визуально близкий к Telegram, но с собственными функциями

## 0. Роль ИИ-агента

Ты — продуктовый ИИ-агент, UI/UX-архитектор, дизайн-системный инженер и frontend-специалист.

Твоя задача — понять, что пользователь хочет получить мессенджер, который:

- визуально и поведенчески ощущается как современный, быстрый, чистый мессенджер уровня Telegram;
- имеет похожую логику экранов, списков, чатов, профилей, настроек, медиа, звонков, папок, поиска и вложенных сценариев;
- не является копией защищенных элементов Telegram: логотипов, фирменных иконок, проприетарных иллюстраций, стикеров, точных анимаций, звуков, текстов и фирменных ассетов;
- обязательно использует собственные особенности системы, которые уже существуют или описаны в контексте проекта.

Если возникает конфликт:

1. Сначала соблюдай юридическую и продуктовую безопасность: не копируй охраняемые элементы.
2. Затем используй уже существующие фичи системы.
3. Затем обеспечивай удобство, скорость и целостность UX.
4. Только потом добивайся визуальной близости к референсному классу.

---

## 1. Что значит “такой же визуально”

Фразу “такой же абсолютно мессенджер визуально” агент должен интерпретировать так:

### Нужно воспроизвести не бренд, а класс продукта

Ожидается:

- высокий уровень плотности интерфейса;
- чистые списки без лишнего визуального шума;
- аккуратные аватары, бейджи, статусы, время, галочки;
- пузырьковые сообщения;
- удобная лента чатов;
- быстрый переход в диалог и обратно;
- минималистичные панели и шторки;
- ощущение легкого, быстрого и понятного мессенджера;
- поддержка светлой и темной темы;
- крупные зоны нажатия;
- понятные жесты и контекстные действия.

### Нельзя копировать

Запрещено:

- копировать логотип Telegram;
- использовать название Telegram как название продукта;
- копировать фирменные иконки, стикеры, иллюстрации, звуки;
- воспроизводить один в один проприетарные ассеты;
- копировать тексты микророк один в один, если они не являются общепринятыми UI-паттернами;
- создавать дизайн, который может быть ошибочно принят за официальный продукт Telegram.

### Правильная формулировка цели

> Сделать оригинальный мессенджер, который по уровню UX, структуре и визуальному ощущению относится к тому же классу, что и Telegram, но имеет собственный бренд, собственные фичи и собственные дизайн-токены.

---

## 2. Входные данные, которые агент должен получить из системы

Агент должен ожидать от системы контекст в формате JSON или аналогичного источника.

Если данных нет, агент не должен выдумывать несуществующие функции. Вместо этого он должен пометить их как `missing_context` или запросить у пользователя.

### 2.1. Обязательные входные данные

```json
{
  "system_context": {
    "product_name": "string",
    "brand": {
      "logo": "asset_url_or_id",
      "primary_color": "string",
      "font_family": "string",
      "tone_of_voice": "string"
    },
    "platforms": [
      "ios",
      "android",
      "web",
      "desktop"
    ],
    "existing_features": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "enabled": true,
        "placements": [
          "chat_list.item_action",
          "chat.context_menu",
          "chat.input.toolbar",
          "side_menu.item",
          "settings.section",
          "profile.action"
        ],
        "ui_type": "button | card | sheet | modal | inline_message | tab | context_action",
        "permissions": [],
        "api_route": "string"
      }
    ],
    "design_tokens": {
      "light": {},
      "dark": {}
    }
  }
}
```

### 2.2. Если особенности уже есть в системе

Агент обязан:

1. Найти `existing_features`.
2. Не создавать дублирующие заглушки.
3. Встроить существующие функции в подходящие места интерфейса.
4. Сохранить единый визуальный стиль.
5. Если функция не подходит в конкретное место — предложить альтернативное размещение.

Пример:

```json
{
  "existing_features": [
    {
      "id": "ai_assistant",
      "title": "ИИ-ассистент",
      "enabled": true,
      "placements": [
        "chat.input.toolbar",
        "chat.context_menu",
        "side_menu.item"
      ],
      "ui_type": "sheet"
    },
    {
      "id": "payments",
      "title": "Платежи",
      "enabled": true,
      "placements": [
        "chat.attach_menu",
        "message.context_menu",
        "profile.action"
      ],
      "ui_type": "modal"
    },
    {
      "id": "crm_cards",
      "title": "CRM-карточки",
      "enabled": true,
      "placements": [
        "profile.section",
        "chat.context_menu"
      ],
      "ui_type": "card"
    }
  ]
}
```

---

## 3. Общая продуктовая идея

Нужно спроектировать мессенджер со следующими характеристиками:

- быстрый запуск;
- мгновенный переход между списками и чатами;
- минимальное количество лишних экранов;
- понятная навигация;
- мощная работа с чатами, группами, каналами, медиа и поиском;
- поддержка личных и рабочих сценариев;
- возможность расширения через модули системы;
- визуально чистый, современный интерфейс 2026 года.

### Ключевые качества

| Качество | Как должно ощущаться |
|---|---|
| Скорость | Все открывается быстро, без лишних задержек |
| Чистота | Мало визуального шума, много контента |
| Плотность | Интерфейс информативный, но не перегруженный |
| Контроль | Пользователь легко управляет чатами, уведомлениями, приватностью |
| Расширяемость | Собственные фичи системы встроены нативно |
| Доступность | Крупные зоны нажатия, хороший контраст, поддержка screen reader |
| Адаптивность | Телефон, планшет, web, desktop |

---

## 4. Полная структурная карта мессенджера

Ниже — целевая структура мессенджера класса Telegram. Агент должен использовать ее как основу IA.

### 4.1. Верхнеуровневая карта

```text
App
├── Auth / Onboarding
├── Main Shell
│   ├── Chat List
│   │   ├── Folders / Tabs
│   │   ├── Search Entry
│   │   ├── Archive
│   │   ├── Pinned Chats
│   │   ├── Unread Section
│   │   ├── New Chat / New Message
│   │   └── Chat Preview
│   │
│   ├── Conversation Screen
│   │   ├── Header
│   │   ├── Messages Feed
│   │   ├── Date Separators
│   │   ├── Unread Divider
│   │   ├── Pinned Message Bar
│   │   ├── Reply / Edit Bar
│   │   ├── Input Bar
│   │   ├── Attachment Menu
│   │   ├── Emoji / Sticker / Custom Modules
│   │   ├── Voice / Video Message Recorder
│   │   ├── Bot / Mini App UI
│   │   ├── Inline Actions
│   │   ├── Selection Mode
│   │   ├── Forward Panel
│   │   └── In-Chat Search
│   │
│   ├── Chat Profile
│   │   ├── User Profile
│   │   ├── Group Profile
│   │   ├── Channel Profile
│   │   ├── Bot Profile
│   │   ├── Media Gallery
│   │   ├── Files
│   │   ├── Links
│   │   ├── Voice / Video Notes
│   │   ├── Groups In Common
│   │   ├── Notifications Settings
│   │   ├── Privacy / Permissions
│   │   ├── Admin Tools
│   │   └── Custom System Modules
│   │
│   ├── Global Search
│   │   ├── Recent
│   │   ├── Chats
│   │   ├── Contacts
│   │   ├── Messages
│   │   ├── Media
│   │   ├── Files
│   │   ├── Links
│   │   └── System Features Search
│   │
│   ├── Contacts
│   │   ├── Contact List
│   │   ├── Add Contact
│   │   ├── Invite
│   │   └── Contact Profile
│   │
│   ├── Calls
│   │   ├── Calls List
│   │   ├── Audio Call
│   │   ├── Video Call
│   │   ├── Call Controls
│   │   ├── PiP Mode
│   │   └── Call History
│   │
│   ├── Stories / Updates
│   │   ├── Stories Carousel
│   │   ├── Story Viewer
│   │   ├── Story Composer
│   │   ├── Privacy Settings
│   │   └── Reactions
│   │
│   ├── Settings
│   │   ├── Profile
│   │   ├── Account
│   │   ├── Privacy & Security
│   │   ├── Devices / Sessions
│   │   ├── Notifications
│   │   ├── Data & Storage
│   │   ├── Appearance
│   │   ├── Language
│   │   ├── Chats Settings
│   │   ├── Folders
│   │   ├── Payments / System Features
│   │   ├── Bots / Mini Apps
│   │   ├── Backup / Export
│   │   └── Help / Support
│   │
│   ├── Media Viewer
│   │   ├── Photo Viewer
│   │   ├── Video Player
│   │   ├── Document Preview
│   │   ├── Audio Player
│   │   └── Share / Save Actions
│   │
│   └── System Feature Containers
│       ├── AI Assistant
│       ├── Payments
│       ├── Tasks / CRM
│       ├── Moderation
│       ├── Analytics
│       ├── Automation
│       └── Other Existing Modules
│
└── Overlay Layers
    ├── Context Menus
    ├── Action Sheets
    ├── Modals
    ├── Toasts
    ├── Snackbars
    ├── Alerts
    ├── Loading States
    ├── Error States
    └── Empty States
```

---

## 5. Ключевые экраны и их поведение

## 5.1. Auth / Onboarding

### Назначение

Вход, регистрация, восстановление доступа, первичная настройка.

### Основные элементы

- логотип продукта;
- краткое описание ценности;
- вход по номеру телефона / email / внешнему ID;
- подтверждение кода;
- запрос разрешений;
- первичная настройка профиля;
- выбор темы;
- импорт контактов при согласии;
- объяснение приватности.

### UX-требования

- минимум шагов;
- крупные поля ввода;
- понятные ошибки;
- поддержка автозаполнения;
- возможность вернуться назад;
- состояние загрузки на кнопке;
- offline-ошибка аккуратно.

### Состояния

| Состояние | Поведение |
|---|---|
| Loading | spinner / skeleton на кнопке |
| Error | inline message, не блокировать весь экран |
| Success | переход в Main Shell |
| No network | показать аккуратную ошибку и retry |

---

## 5.2. Main Shell / App Frame

### Назначение

Главный контейнер приложения.

### Варианты layout

#### Mobile

- один основной стек навигации;
- список чатов как домашний экран;
- нижние шторки для действий;
- контекстные меню по long press.

#### Tablet

- двухпанельный режим:
  - слева список чатов;
  - справа открытый диалог.

#### Desktop

- трехпанельный режим:
  - узкая навигация слева;
  - список чатов;
  - область переписки;
  - опциональная правая панель с профилем/медиа.

### Обязательные элементы

- глобальный поиск;
- доступ к настройкам;
- доступ к контактам;
- доступ к звонкам;
- доступ к архиву;
- доступ к папкам;
- кнопка нового сообщения;
- область существующих фич системы.

---

## 5.3. Chat List / Список чатов

Это один из самых важных экранов. Он должен ощущаться быстрым, плотным и чистым.

### Структура экрана

```text
Chat List Screen
├── Top Area
│   ├── Search Bar
│   └── Optional Quick Filters
├── Folder Tabs
│   ├── All
│   ├── Personal
│   ├── Work
│   ├── Channels
│   ├── Bots
│   ├── Custom Folders
│   └── Edit Mode
├── Stories Row (optional)
├── Pinned Chats
├── Chat Items
├── Archive Entry
├── Empty State
└── New Message FAB
```

### Элементы строки чата

Каждый чат в списке должен содержать:

- аватар;
- имя или название;
- превью последнего сообщения;
- время;
- бейдж непрочитанных;
- иконку mute при отключенных уведомлениях;
- иконку pin при закреплении;
- статус онлайн / typing / recording при необходимости;
- verified badge для каналов/организаций, если есть;
- иконку ошибки отправки, если последняя ошибка критична;
- кастомный бейдж системной функции, если это задано в системе.

### Визуальные параметры

| Параметр | Рекомендация |
|---|---|
| Высота строки | 72–84 dp |
| Аватар | 48–56 dp |
| Имя | 15–17 sp, medium/semibold |
| Превью | 14–15 sp, one line |
| Время | 12–13 sp |
| Unread badge | pill, min width 20–24 dp |
| Horizontal padding | 12–16 dp |
| Vertical spacing | 0–4 dp, компактно |

### Состояния строки

- default;
- unread;
- muted;
- pinned;
- selected;
- draft;
- typing;
- recording;
- failed;
- archived;
- verified;
- mention;
- reaction preview;
- custom system badge.

### Жесты и действия

| Жест | Действие |
|---|---|
| Tap | открыть чат |
| Long press | контекстное меню / selection mode |
| Swipe left | быстрые действия: mute, read/unread, pin, delete |
| Swipe right | archive / read / custom action |
| Pull down | обновить / показать архив / story row |
| Drag | reorder pinned chats / folders |

### Контекстное меню чата

- Read / Unread
- Mute / Unmute
- Pin / Unpin
- Archive / Unarchive
- Mark as read
- Add to folder
- Delete
- Select
- Custom system actions

### Папки

Поддержка:

- All;
- Personal;
- Work;
- Channels;
- Groups;
- Bots;
- Unread;
- Custom;
- Archive.

Функции папок:

- создание;
- переименование;
- удаление;
- сортировка;
- выбор включаемых типов чатов;
- исключения;
- badge behavior: total unread / mentions only / custom.

### Search entry

Поле поиска должно быть:

- заметным, но не доминирующим;
- с placeholder типа `Поиск`;
- с быстрым доступом к global search;
- с историей недавних запросов;
- с подсказками по чатам, контактам, сообщениям и системным функциям.

### Empty states

- нет чатов;
- нет результатов;
- папка пуста;
- архив пуст;
- ошибка загрузки.

---

## 5.4. Conversation Screen / Экран диалога

Главный экран общения. Должен быть максимально быстрым, читаемым и функциональным.

### Структура

```text
Conversation Screen
├── Top Bar
│   ├── Back
│   ├── Avatar
│   ├── Title
│   ├── Status / Typing / Members / Subscribers
│   ├── Call Actions
│   ├── Search
│   └── Menu
├── Pinned Message Bar (optional)
├── Messages Feed
│   ├── Date Separators
│   ├── Unread Divider
│   ├── Message Bubbles
│   ├── System Messages
│   ├── Action Messages
│   ├── Bot Messages
│   ├── Media Messages
│   ├── Cards
│   └── Custom Feature Messages
├── Scroll To Bottom Button
├── Reply / Edit Bar
├── Input Bar
│   ├── Attach
│   ├── Text Input
│   ├── Emoji / Stickers / Modules
│   ├── Voice / Video Note
│   └── Send Button
├── Attachment Sheet
├── Context Menu Layer
├── Selection Mode Layer
└── Forward Panel
```

### Верхняя панель

Элементы:

- back;
- avatar;
- title;
- subtitle/status;
- video call action;
- audio call action;
- search;
- overflow menu.

Состояния subtitle:

- online;
- last seen;
- typing…;
- recording audio…;
- selecting sticker…;
- N members;
- N subscribers;
- bot;
- channel;
- custom system status.

### Лента сообщений

Обязательные возможности:

- бесконечная подгрузка вверх;
- быстрый scroll to bottom;
- unread divider;
- date separators;
- grouping by sender;
- compact mode;
- reaction picker;
- context menu;
- selection;
- forward;
- delete;
- edit;
- copy;
- reply;
- translate if system feature exists;
- save to collection if system feature exists;
- report;
- pin;
- custom system actions.

### Типы сообщений

Нужно поддерживать следующие типы:

| Тип | Описание |
|---|---|
| text | обычное текстовое сообщение |
| reply | сообщение с цитированием |
| forwarded | пересланное сообщение |
| edited | измененное сообщение |
| deleted placeholder | сообщение удалено |
| image | фото |
| video | видео |
| file | документ |
| voice | голосовое |
| video_note | видеосообщение |
| location | локация |
| contact | контакт |
| link_preview | превью ссылки |
| poll | опрос |
| invoice | платежная карточка |
| bot_message | сообщение бота |
| bot_keyboard | inline keyboard |
| story_share | репост story |
| system_event | сервисное событие |
| custom_card | карточка системной функции |
| ai_card | ответ ИИ/ассистента |
| task_card | задача / CRM / workflow |
| payment_card | платеж |
| moderation_card | модерация / жалоба |

### Message bubble

Параметры:

| Параметр | Рекомендация |
|---|---|
| Max width mobile | 75–85% экрана |
| Max width desktop | 420–560 px |
| Padding | 8–12 px |
| Radius | 16–20 px |
| Grouped radius | уменьшать один из углов у соседних сообщений |
| Tail | опционально, лучше использовать упрощенную форму без сложного хвоста |
| Text size | 15–17 sp |
| Meta size | 11–13 sp |

### Bubble meta

Внутри пузыря должны быть:

- время;
- статус отправки;
- edited label;
- sender name в группах;
- reply preview;
- forward source;
- reactions;
- signature для каналов, если включено;
- view count для каналов, если включено;
- custom badges.

### Статусы сообщений

| Статус | Иконка/поведение |
|---|---|
| queued | clock / pending |
| sending | spinner / subtle progress |
| sent | single check |
| delivered | double check |
| read | colored double check |
| failed | error icon + retry |
| edited | label |
| scheduled | calendar icon |

### Input Bar

Нижняя панель ввода — ключевой узел.

Состояния:

- пустой ввод: показывать voice / video note;
- есть текст: показывать send;
- режим reply: показывать reply preview;
- режим edit: показывать edit bar;
- режим attachment: показывать attachment sheet;
- режим bot command: показывать подсказки;
- режим custom feature: показывать дополнительные кнопки системы.

Элементы:

```text
[Attach] [Text Input] [Emoji / Modules] [Voice / Send]
```

Функции:

- multiline;
- auto-expand;
- mention autocomplete;
- hashtag autocomplete;
- slash commands;
- formatting;
- draft autosave;
- character counter only if needed;
- attachment entry;
- emoji picker;
- sticker picker;
- custom system module picker;
- voice recording;
- video note recording;
- lock recording by swipe up;
- cancel recording by swipe out;
- send by tap;
- optional send by Enter on desktop.

### Attachment Menu

Структура attachment sheet:

- Photo / Video Library
- Camera
- File / Document
- Location
- Contact
- Poll
- Payment (если есть системная функция)
- Task / CRM (если есть системная функция)
- AI Action (если есть системная функция)
- Custom system actions

Требования:

- крупные иконки;
- grid 3–4 columns;
- быстрый доступ к недавним медиа;
- поддержка drag-and-drop на desktop;
- возможность кастомных модулей системы.

### Context Menu сообщения

Обязательные действия:

- Reply
- Copy
- Forward
- Edit (если доступно)
- Delete
- Pin
- Select
- Translate (если есть)
- Add to Saved / Collection (если есть)
- Report
- Custom system actions

Опциональные действия:

- Assign task
- Create CRM entity
- Save to knowledge base
- Summarize with AI
- Remind me
- Schedule follow-up
- Moderate

### Selection Mode

Функции:

- мультивыбор сообщений;
- счетчик выбранных;
- select all;
- clear selection;
- forward selected;
- delete selected;
- export selected if allowed;
- custom batch actions from system.

### Pinned Messages

- pinned bar сверху;
- tap открывает сообщение;
- swipe/long press unpins;
- список пинов доступен отдельно;
- поддержка нескольких пинов в группах/каналах, если включено.

### In-Chat Search

- поиск по сообщениям;
- фильтр по медиа/файлам/ссылкам;
- подсветка результатов;
- переход к сообщению;
- поддержка поиска по дате.

### Scroll behavior

- scroll-to-bottom button;
- unread count badge on scroll button;
- smooth auto-scroll при новых сообщениях, если пользователь внизу;
- не автоскроллить, если пользователь читает выше;
- new messages divider.

---

## 5.5. Group / Channel / Bot Profile

Профиль должен быть единым компонентом с вариантами.

### Общие секции

```text
Profile
├── Header
│   ├── Avatar
│   ├── Title
│   ├── Status / Info
│   └── Actions: Message / Call / More
├── Info
│   ├── Username
│   ├── Phone
│   ├── Bio
│   ├── Links
│   └── Custom System Fields
├── Notifications Settings
├── Media Tabs
│   ├── Media
│   ├── Files
│   ├── Links
│   ├── Voice
│   ├── Groups
│   └── Custom
├── Members / Admins
├── Permissions
├── Privacy
├── Custom System Modules
└── Footer Actions: Block / Leave / Report / Delete
```

### User profile

- имя;
- username;
- статус онлайн;
- телефон, если разрешен;
- bio;
- общие группы;
- медиа;
- настройки уведомлений;
- действия: message, call, block, add to contacts, custom.

### Group profile

- название;
- описание;
- участники;
- администраторы;
- разрешения;
-slow mode;
- anti-spam / moderation если есть;
- topics, если группа поддерживает topics;
- join requests;
- invite links;
- pinned messages;
- admin tools.

### Channel profile

- название;
- описание;
- подписчики;
- admins;
- discussion link;
- view count;
- reactions settings;
- signatures;
- invite links;
- analytics if system provides.

### Bot profile

- описание;
- команды;
- privacy notice;
- settings;
- open mini app if supported;
- restart bot;
- custom bot actions.

---

## 5.6. Global Search

### Назначение

Быстрый поиск по всему контенту и функциям.

### Структура

```text
Global Search
├── Search Input
├── Recent
├── Suggested
├── Chats
├── Contacts
├── Messages
├── Media
├── Files
├── Links
├── Channels / Groups
├── Bots
├── System Features
└── Empty / Error States
```

### UX

- мгновенные подсказки;
- debounce 150–300 ms;
- история недавних запросов;
- быстрые фильтры;
- результаты с аватарами;
- подсветка совпадений;
- переход к сообщению с сохранением контекста;
- поддержка поиска по username, имени, тексту, файлам, ссылкам.

---

## 5.7. Contacts

### Структура

```text
Contacts
├── Search
├── System Contacts
├── App Contacts
├── Invites
├── Add Contact
└── Contact Actions
```

### Возможности

- импорт контактов;
- синхронизация с разрешения;
- добавление по username/phone;
- invite flow;
- быстрые действия: message, call, share contact;
- privacy notice.

---

## 5.8. Calls

### Структура

```text
Calls
├── Calls List
├── Incoming Call Overlay
├── Active Call Screen
├── PiP / Floating Mode
└── Call Settings
```

### Типы звонков

- audio call;
- video call;
- group audio, если поддерживается системой;
- group video, если поддерживается системой.

### Экран звонка

Элементы:

- avatar / video preview;
- name;
- status: connecting / ringing / encrypted / duration;
- mute;
- speaker;
- video toggle;
- screen share if supported;
- end call;
- chat;
- add participant if group;
- network quality indicator.

### UX

- быстрый ответ;
- минимальные задержки;
- PiP режим;
- background audio;
- аккуратные разрешения;
- история звонков;
- missed / declined / outgoing / incoming icons.

---

## 5.9. Stories / Updates

Если система поддерживает stories, реализовать как опциональный модуль.

### Структура

```text
Stories
├── Stories Row in Chat List
├── Story Viewer
├── Story Composer
├── Privacy Settings
├── Replies / Reactions
└── Story Archive
```

### Story Viewer

- прогресс-бары;
- авто-advance;
- tap left/right navigation;
- long press pause;
- reply input;
- reactions;
- share;
- more menu;
- view count for own stories;
- privacy control.

### Story Composer

- camera;
- gallery;
- text overlay;
- drawing;
- caption;
- audience selection;
- expiration;
- hide from contacts;
- custom audience.

---

## 5.10. Settings

### Структура

```text
Settings
├── Profile
├── Account
├── Privacy & Security
├── Devices / Sessions
├── Notifications
├── Data & Storage
├── Appearance
├── Language
├── Chat Settings
├── Folders
├── Payments / Billing
├── Bots / Mini Apps
├── System Features
├── Backup / Export
├── Help & Support
└── About
```

### Profile

- имя;
- username;
- photo;
- bio;
- phone;
- QR / share profile;
- premium/system status if exists.

### Privacy & Security

- phone number visibility;
- last seen / online;
- profile photo visibility;
- calls permission;
- groups invite permission;
- blocked users;
- passcode / biometric;
- two-step verification;
- login alerts;
- active sessions;
- data export;
- delete account.

### Notifications

- private chats;
- groups;
- channels;
- mentions;
- in-app sounds;
- preview;
- exceptions;
- badge behavior;
- quiet hours;
- custom notification tones.

### Data & Storage

- media auto-download;
- storage usage;
- cache control;
- clear cache;
- network type settings: mobile / Wi-Fi / roaming;
- autoplay media;
- data saver.

### Appearance

- theme: light / dark / auto;
- accent color;
- font scale;
- chat wallpaper;
- bubble style if customizable;
- app icon if supported;
- reduce motion;
- compact mode.

### System Features section

Если в системе есть собственные модули, агент обязан добавить отдельный раздел:

- AI Assistant;
- Payments;
- CRM;
- Tasks;
- Automation;
- Moderation;
- Analytics;
- Integrations;
- API keys / connections if applicable.

Каждый модуль должен иметь:

- title;
- description;
- enabled toggle;
- entry point;
- permissions;
- settings;
- status.

---

## 5.11. Media Viewer

### Назначение

Полноэкранный просмотр медиа.

### Поддерживаемые типы

- photo;
- video;
- GIF;
- document preview;
- audio player.

### UX

- swipe down to close;
- pinch to zoom;
- double tap zoom;
- share;
- save;
- forward;
- delete;
- set as profile photo if applicable;
- playback speed for audio/video;
- background playback if applicable;
- custom actions from system.

---

## 5.12. Overlay Layers

Все overlay-слои должны быть едиными.

### Context Menu

- появляется по long press;
- blur / dim background;
- preview item if appropriate;
- actions horizontally or vertically;
- haptic feedback;
- cancel by tap outside or swipe down.

### Action Sheet

- bottom sheet;
- крупные действия;
- destructive action red;
- cancel отдельно;
- drag to dismiss.

### Modal

- centered on desktop/tablet;
- bottom sheet on mobile;
- clear primary/secondary actions;
- close on ESC/desktop;
- do not overload with fields.

### Toast / Snackbar

- короткие сообщения;
- 2–4 секунды;
- одно действие максимум;
- не перекрывать критичные элементы.

---

## 6. UI/UX-принципы 2026

### 6.1. Визуальный стиль

- clean, airy, content-first;
- мягкие тени или их отсутствие;
- тонкие разделители только там, где нужны;
- большие аватары в профилях;
- компактные строки в списках;
- скругленные карточки;
- аккуратные пузыри;
- минимальное использование лишних границ;
- акцентный цвет для действий, ссылок, своих сообщений, badge.

### 6.2. Контент важнее интерфейса

Интерфейс не должен спорить с контентом. Сообщения, медиа и файлы — главные.

### 6.3. Скорость

- skeleton states только если реальная задержка > 200 ms;
- оптимистичные обновления;
- локальный кэш списков;
- плавные переходы без лишних анимаций;
- отсутствие блокирующих загрузок там, где можно показать контент частично.

### 6.4. Предсказуемость

- одинаковые жесты в похожих местах;
- одинаковые кнопки;
- единые правила контекстных меню;
- одинаковые empty/error/loading states.

### 6.5. Персонализация

- темы;
- папки;
- уведомления;
- privacy;
- виджеты;
- настройка системных модулей.

---

## 7. Дизайн-токены

Ниже — стартовый набор токенов. Агент должен заменить их на бренд-токены системы, если они переданы. Если бренд-токенов нет — использовать эти значения как дефолтные.

### 7.1. Цвета

#### Light

| Token | Value | Назначение |
|---|---:|---|
| bg.canvas | `#F7F9FB` | фон приложения |
| bg.surface | `#FFFFFF` | карточки, списки |
| bg.elevated | `#FFFFFF` | модалки, sheet |
| bg.subtle | `#EEF2F6` | вторичные поверхности |
| text.primary | `#111418` | основной текст |
| text.secondary | `#6C7883` | вторичный текст |
| text.tertiary | `#98A4B3` | placeholder, meta |
| accent.primary | `#2F80ED` | основной акцент |
| accent.hover | `#2468C7` | hover |
| accent.press | `#1D57A8` | press |
| bubble.in | `#FFFFFF` | входящие сообщения |
| bubble.out | `#D8EBFF` | исходящие сообщения |
| bubble.text.out | `#111418` | текст исходящих |
| badge.unread | `#2F80ED` | unread badge |
| border.subtle | `#E4E9EF` | тонкие разделители |
| success | `#2FA36B` | успех |
| warning | `#E5A23C` | предупреждение |
| danger | `#E5484D` | ошибки / destructive |
| overlay.scrim | `rgba(15, 20, 25, 0.45)` | затемнение |

#### Dark

| Token | Value | Назначение |
|---|---:|---|
| bg.canvas | `#0E1114` | фон приложения |
| bg.surface | `#151A20` | карточки, списки |
| bg.elevated | `#1B222B` | модалки, sheet |
| bg.subtle | `#10151B` | вторичные поверхности |
| text.primary | `#F2F5F8` | основной текст |
| text.secondary | `#98A4B3` | вторичный текст |
| text.tertiary | `#6C7883` | placeholder, meta |
| accent.primary | `#5AA7FF` | основной акцент |
| accent.hover | `#79B8FF` | hover |
| accent.press | `#8EC4FF` | press |
| bubble.in | `#1D2530` | входящие сообщения |
| bubble.out | `#274A6D` | исходящие сообщения |
| bubble.text.out | `#F2F5F8` | текст исходящих |
| badge.unread | `#5AA7FF` | unread badge |
| border.subtle | `#232B36` | тонкие разделители |
| success | `#46C98A` | успех |
| warning | `#F0B45A` | предупреждение |
| danger | `#FF6369` | ошибки / destructive |
| overlay.scrim | `rgba(0, 0, 0, 0.55)` | затемнение |

### 7.2. Типографика

Использовать системный шрифт или открытую гарнитуру, например Inter, Manrope, Golos, Roboto Flex — в зависимости от платформы и бренда.

| Token | Size / Line | Weight | Использование |
|---|---:|---:|---|
| display.xl | 28 / 34 | 700 | крупные заголовки onboarding |
| title.lg | 22 / 28 | 700 | заголовки экранов |
| title.md | 18 / 24 | 650 | заголовки профилей |
| body.lg | 17 / 24 | 400/450 | сообщения |
| body.md | 15 / 22 | 400/450 | список чатов, настройки |
| body.sm | 14 / 20 | 400/450 | вторичный контент |
| caption.md | 13 / 18 | 500 | время, статусы |
| caption.sm | 12 / 16 | 500 | badges, meta |
| mono.md | 14 / 20 | 450 | коды, ID, links |

### 7.3. Spacing

Использовать шкалу:

```text
2, 4, 8, 12, 16, 20, 24, 32, 40, 56
```

### 7.4. Radius

| Token | Value | Использование |
|---|---:|---|
| radius.sm | 8 px | chips, small controls |
| radius.md | 12 px | buttons, inputs |
| radius.lg | 16 px | cards |
| radius.xl | 20 px | bubbles, sheets |
| radius.full | 999 px | avatars, badges, pills |

### 7.5. Elevation

| Token | Использование |
|---|---|
| elevation.0 | flat lists |
| elevation.1 | cards, FAB |
| elevation.2 | sheets, dropdowns |
| elevation.3 | modals, context menus |
| elevation.4 | call overlay, media viewer |

### 7.6. Motion

| Token | Duration | Использование |
|---|---:|---|
| motion.fast | 120 ms | hover, press, small toggles |
| motion.normal | 180–220 ms | переходы, меню |
| motion.slow | 280–320 ms | sheets, modals |
| motion.spring | low bounce | появление bubble, reaction |

Easing:

```text
standard: cubic-bezier(0.2, 0.0, 0.0, 1.0)
emphasized: cubic-bezier(0.2, 0.0, 0.0, 1.2)
exit: cubic-bezier(0.4, 0.0, 1.0, 1.0)
```

### 7.7. Hit targets

- минимальная зона нажатия: 44×44 dp / pt;
- для desktop допускается 32 px визуально, но pointer area должна быть достаточной;
- не размещать важные действия слишком близко к краю экрана.

---

## 8. Компонентная библиотека

Агент должен проектировать не только экраны, но и переиспользуемые компоненты.

### 8.1. Avatar

Props:

- image;
- fallback initials;
- size: xs / sm / md / lg / xl;
- presence;
- badge;
- verified;
- muted;
- archived.

Sizes:

| Size | Use |
|---|---|
| 24 | inline mention, small meta |
| 36 | list compact |
| 48 | chat list |
| 56 | chat header |
| 72–96 | profile |

### 8.2. Badge

- unread count;
- mention;
- muted;
- error;
- custom system badge.

### 8.3. ListItem

Используется для:

- chats;
- contacts;
- settings;
- members;
- files;
- calls.

States:

- default;
- hover;
- pressed;
- selected;
- dragging;
- disabled.

### 8.4. MessageBubble

Props:

- message type;
- isOutgoing;
- isEdited;
- isFailed;
- isForwarded;
- replyPreview;
- reactions;
- showAvatar;
- showSenderName;
- mediaPayload;
- customCardPayload.

### 8.5. InputBar

Props:

- mode: idle / reply / edit / search / recording;
- text;
- attachmentsAvailable;
- emojiAvailable;
- customModulesAvailable;
- sendDisabledReason.

### 8.6. TopBar

Props:

- title;
- subtitle;
- avatar;
- backAction;
- actions;
- loading;
- connectionState.

### 8.7. SearchBar

Props:

- query;
- placeholder;
- recent;
- suggestions;
- filters;
- loading;
- error.

### 8.8. ActionSheet / BottomSheet

Props:

- title;
- items;
- destructiveItem;
- cancel;
- draggable;
- snapPoints.

### 8.9. ContextMenu

Props:

- targetPreview;
- items;
- inlineReactions;
- destructiveZone;
- haptic.

### 8.10. EmptyState

Props:

- icon;
- title;
- description;
- action.

### 8.11. ErrorState

Props:

- message;
- retryAction;
- supportAction;
- code.

### 8.12. Skeleton

- list skeleton;
- chat skeleton;
- media skeleton;
- profile skeleton;
- settings skeleton.

---

## 9. Поведение сообщений и состояний

### 9.1. Отправка

1. Пользователь нажимает send.
2. Сообщение появляется локально со статусом `queued`.
3. При наличии сети меняется на `sending`.
4. После ACK сервера — `sent`.
5. При доставке — `delivered`.
6. При прочтении — `read`.
7. При ошибке — `failed` с retry.

### 9.2. Черновики

- draft сохраняется локально;
- отображается в списке чатов как `Draft:` если есть;
- не теряется при выходе;
- очищается после отправки.

### 9.3. Typing indicators

Поддержка:

- typing…
- recording audio…
- selecting sticker…
- choosing file…
- custom system presence, если система это предоставляет.

### 9.4. Read receipts

- показывать только если это разрешено privacy;
- поддерживать мутual visibility rules;
- не показывать точное время прочтения, если это не требуется продуктом.

### 9.5. Offline

- можно просматривать кэш;
- можно писать сообщения в очередь;
- показывать аккуратный offline banner;
- retry automatically when online;
- не блокировать весь интерфейс.

---

## 10. Навигация и жесты

### Mobile

| Жест | Назначение |
|---|---|
| Swipe from left edge | back |
| Swipe message | quick reply / custom |
| Long press message | context menu |
| Long press chat | context menu |
| Swipe chat row | quick actions |
| Pull down | refresh / archive / stories |
| Tap scroll button | scroll to bottom |

### Desktop

| Input | Назначение |
|---|---|
| Click | primary action |
| Right click | context menu |
| Hover | reveal secondary actions |
| Enter | send / submit |
| Shift+Enter | new line |
| Esc | close modal / cancel selection |
| Cmd/Ctrl+F | search |
| Cmd/Ctrl+K | global quick search if applicable |

---

## 11. Доступность

Обязательно:

- контраст текста не ниже WCAG AA;
- поддержка dynamic type / font scale;
- VoiceOver / TalkBack labels;
- логичный focus order;
- focus visible на desktop;
- reduced motion mode;
- крупные hit targets;
- текстовые альтернативы для иконок;
- подписи к media;
- достаточная ширина строк;
- не полагаться только на цвет.

---

## 12. Приватность и безопасность в UI

UI должен явно показывать:

- кто видит профиль;
- кто видит телефон;
- кто может звонить;
- кто может добавлять в группы;
- заблокированные контакты;
- активные сессии;
- двухфакторную защиту;
- passcode/biometric;
- локальный статус E2EE, если система это поддерживает;
- экспорт/удаление данных.

Принцип:

> Пользователь должен быстро понимать, кто имеет доступ к его данным, и легко менять это.

---

## 13. Как агент должен встраивать уже существующие особенности системы

### 13.1. Источники размещения

Агент должен использовать `placements` из `existing_features`.

Рекомендуемые placement-ключи:

```text
chat_list.top_action
chat_list.item_badge
chat_list.context_menu
chat.header_menu
chat.message_context_menu
chat.input.toolbar
chat.attach_menu
chat.empty_state
profile.action
profile.section
settings.section
side_menu.item
global_search.result_type
media_viewer.action
call_screen.action
```

### 13.2. Правила встраивания

- Не добавлять функцию, если она не указана в `existing_features`.
- Если функция включена, но нет подходящего UI, создать минимально нативное размещение.
- Если функция имеет несколько размещений, выбирать самые контекстные.
- Если функция деструктивная или платная, явно показывать статус и подтверждение.
- Если функция требует разрешений, показывать понятный permission request.
- Если функция асинхронная, показывать progress, success и error.

### 13.3. Пример mapping

| Feature ID | Best placements | UI pattern |
|---|---|---|
| ai_assistant | chat.input.toolbar, chat.message_context_menu, side_menu.item | sheet, inline card |
| payments | chat.attach_menu, message.context_menu, profile.action | payment card, modal |
| tasks | message.context_menu, chat_list.context_menu, profile.section | task card |
| crm | profile.section, chat.message_context_menu | entity card |
| moderation | group.admin_panel, message.context_menu | report sheet |
| analytics | channel.profile, settings.section | dashboard card |
| automation | settings.section, chat.attach_menu | flow builder entry |
| knowledge_base | message.context_menu, global_search.result_type | saved item |

---

## 14. Обязательные сценарии, которые агент должен покрыть

### 14.1. Пользователь открывает приложение и видит чаты

- есть кэш;
- есть unread badges;
- есть folders;
- есть search;
- есть new message action.

### 14.2. Пользователь открывает диалог и пишет сообщение

- текст вводится;
- emoji доступны;
- attachment доступны;
- send работает;
- статусы обновляются;
- ошибка показывает retry.

### 14.3. Пользователь отвечает на сообщение

- reply preview появляется;
- цитата видна;
- cancel reply работает;
- tap по цитате скроллит к исходному сообщению.

### 14.4. Пользователь редактирует сообщение

- edit bar появляется;
- измененное сообщение помечается;
- отмена работает;
- история редактирования не обязательна, но состояние должно быть ясным.

### 14.5. Пользователь пересылает сообщение

- selection mode;
- forward sheet;
- выбор чата;
- подтверждение;
- статус forwarded.

### 14.6. Пользователь удаляет сообщение

- destructive confirmation;
- undo если возможно;
- placeholder если нужно;
- синхронизация состояния.

### 14.7. Пользователь управляет уведомлениями

- mute/unmute из chat list;
- exceptions;
- badge update;
- in-app preview settings.

### 14.8. Пользователь ищет сообщение

- global search;
- in-chat search;
- переход к сообщению;
- подсветка результата.

### 14.9. Пользователь открывает профиль

- видны media/files/links;
- есть настройки уведомлений;
- есть действия block/report/leave;
- есть системные модули, если относятся к контакту/чату.

### 14.10. Пользователь использует системную функцию

- функция появляется в правильном месте;
- она визуально не выглядит чужеродной;
- есть loading/error/success;
- есть история действия, если нужно.

---

## 15. Требования к визуальному качеству

### 15.1. Списки

- ровные отступы;
- одна линия превью;
- аккуратные бейджи;
- нет случайных границ;
- hover/pressed только там, где нужно;
- skeleton не должен мигать.

### 15.2. Сообщения

- хорошая читаемость;
- контраст времени внутри bubble;
- media не ломает layout;
- длинные слова переносятся;
- link preview не слишком тяжелое;
- реакции не перекрывают текст.

### 15.3. Формы

- крупные поля;
- понятные placeholder;
- ошибки inline;
- primary action заметен;
- secondary action не конкурирует.

### 15.4. Пустые состояния

- не оставлять пустой экран без смысла;
- давать действие;
- объяснять пользу;
- не использовать скучные технические тексты.

Примеры:

- `Нет сообщений. Напишите первым.`
- `Ничего не найдено по запросу...`
- `Папка пуста. Добавьте чаты в эту папку.`
- `Нет медиа в этом чате.`

---

## 16. Технические требования к интерфейсу

### 16.1. Производительность

- chat list scroll: 60 fps;
- открытие чата: target < 300 ms при локальном кэше;
- ввод текста без задержек;
- тяжелые медиа лениво загружать;
- анимации не должны блокировать ввод.

### 16.2. Состояния данных

Для каждого экрана нужны:

- loading;
- loaded;
- empty;
- error;
- offline;
- partial;
- unauthorized;
- restricted;
- deleted.

### 16.3. Локализация

- поддержка LTR/RTL;
- переводы строк;
- plural forms;
- даты/числа по локали;
- поддержка длинных слов.

### 16.4. Платформы

- iOS Human Interface Guidelines;
- Material You / Android conventions;
- Web responsive;
- Desktop keyboard support;
- Tablet adaptive.

---

## 17. Структура данных для агента

Агент должен использовать упрощенную модель данных для проектирования UI.

```ts
type UserId = string;
type ChatId = string;
type MessageId = string;

interface User {
  id: UserId;
  name: string;
  username?: string;
  avatarUrl?: string;
  online?: boolean;
  lastSeen?: string;
  phone?: string;
  bio?: string;
  verified?: boolean;
  isBot?: boolean;
}

interface Chat {
  id: ChatId;
  type: "private" | "group" | "channel" | "bot" | "saved" | "custom";
  title: string;
  avatarUrl?: string;
  lastMessage?: MessagePreview;
  unreadCount: number;
  mentionCount?: number;
  muted: boolean;
  pinned: boolean;
  archived: boolean;
  verified?: boolean;
  draft?: string;
  folderIds: string[];
  typingState?: "typing" | "recording_audio" | "recording_video" | "selecting_media" | null;
}

interface MessagePreview {
  id: MessageId;
  text: string;
  senderName?: string;
  mediaType?: MediaType;
  timestamp: string;
  state: MessageState;
}

type MessageState =
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "edited";

type MediaType =
  | "photo"
  | "video"
  | "voice"
  | "video_note"
  | "file"
  | "location"
  | "contact"
  | "poll"
  | "link"
  | "custom_card";

interface Message {
  id: MessageId;
  chatId: ChatId;
  senderId?: UserId;
  type: MessageType;
  text?: string;
  createdAt: string;
  editedAt?: string;
  replyToId?: MessageId;
  forwardedFrom?: string;
  media?: MediaPayload;
  reactions?: Reaction[];
  state: MessageState;
  customFeaturePayload?: unknown;
}

type MessageType =
  | "text"
  | "media"
  | "voice"
  | "video_note"
  | "file"
  | "location"
  | "contact"
  | "poll"
  | "system"
  | "bot"
  | "custom_card";

interface Reaction {
  emoji: string;
  count: number;
  me: boolean;
}

interface Folder {
  id: string;
  title: string;
  includeFilters: string[];
  excludeFilters: string[];
  unreadMode: "all" | "mentions" | "none";
}

interface SystemFeature {
  id: string;
  title: string;
  description?: string;
  enabled: boolean;
  placements: string[];
  uiType: "button" | "card" | "sheet" | "modal" | "inline_message" | "tab" | "context_action";
  permissions?: string[];
  apiRoute?: string;
}
```

---

## 18. Пример ожидаемого результата от агента

Агент должен вернуть не просто текст, а структурированный результат.

### 18.1. Обязательный output

1. `sitemap.md` — полная карта экранов.
2. `user-flows.md` — ключевые сценарии.
3. `design-tokens.json` — токены цвета, типографики, spacing, radius, motion.
4. `components.md` — компоненты и их props/states.
5. `screens/*.md` — спецификация экранов.
6. `feature-mapping.json` — mapping существующих функций системы.
7. `accessibility-checklist.md` — проверка доступности.
8. `qa-checklist.md` — критерии приемки.

### 18.2. Формат ответа агента

```markdown
## 1. Sitemap
...

## 2. User Flows
...

## 3. Design Tokens
```json
{}
```

## 4. Components
...

## 5. Feature Mapping
```json
{}
```

## 6. QA Checklist
...
```

---

## 19. Acceptance criteria

Продукт считается готовым к дальнейшей реализации, если:

- [ ] Есть полный список экранов и состояний.
- [ ] Chat list поддерживает folders, search, archive, pinned, unread, mute.
- [ ] Conversation screen поддерживает reply, edit, forward, delete, reactions, selection.
- [ ] Input bar поддерживает text, emoji, attachments, voice/video note, custom modules.
- [ ] Поддерживаются light/dark themes.
- [ ] Все ключевые экраны имеют loading, empty, error, offline states.
- [ ] Touch targets не меньше 44 dp.
- [ ] Интерфейс локализуем.
- [ ] Существующие фичи системы встроены нативно.
- [ ] Нет копирования защищенных элементов Telegram.
- [ ] Визуальный стиль целостный.
- [ ] Нет перегруженности.
- [ ] Есть accessibility checklist.
- [ ] Есть performance checklist.
- [ ] Есть privacy/security checklist.

---

## 20. Запрещенные паттерны

Агент не должен:

- делать интерфейс перегруженным;
- прятать базовые действия слишком глубоко;
- использовать слишком много акцентных цветов;
- делать сообщения нечитаемыми;
- копировать чужие брендовые элементы;
- создавать фейковые функции, если их нет в системе;
- делать destructive actions без подтверждения;
- показывать приватные данные без явного разрешения;
- использовать слишком маленькие зоны нажатия;
- полагаться только на hover без mobile fallback;
- игнорировать offline и error states.

---

## 21. Приоритет при принятии решений

Если агент сталкивается с конфликтом, использовать следующий порядок:

1. Безопасность, приватность, юридическая чистота.
2. Фактические возможности системы.
3. Ясность и скорость UX.
4. Доступность.
5. Визуальная близость к референсному классу.
6. Декоративность.

---

## 22. Короткий системный промпт для агента

Скопируй и используй:

```text
Ты проектируешь мессенджер 2026 года, который по структуре, плотности и UX относится к классу современных Telegram-подобных мессенджеров.

Твоя задача:
- создать оригинальный интерфейс без копирования защищенных элементов Telegram;
- сохранить быстрые, чистые, компактные и понятные паттерны мессенджера;
- использовать существующие фичи системы из system_context.existing_features;
- если фича не указана в системе, не выдумывай ее;
- обязательно покрывай loading, empty, error, offline, unauthorized states;
- поддерживай light/dark, accessibility, localization, mobile/tablet/desktop;
- приоритет: безопасность > существующие функции системы > UX > визуальная близость.

Ключевые модули:
Auth, Main Shell, Chat List, Folders, Conversation, Message Composer, Chat Profile, Global Search, Contacts, Calls, Stories, Settings, Media Viewer, Overlay Layers, System Feature Containers.
```

---

## 23. Финальная инструкция

Агент должен воспринимать этот документ как главный бриф.

Если пользователь говорит:

> “Сделай как Telegram”

агент должен понимать:

> “Сделай мессенджер того же уровня, с той же базовой структурой и тем же качеством UX, но оригинальный, с нашими фичами и без копирования защищенных элементов.”

Если пользователь говорит:

> “У меня уже есть особенности в системе”

агент должен:

1. Найти `existing_features`.
2. Встроить их в UI.
3. Не создавать дублирующие модули.
4. Сохранить единый стиль.
5. Проверить, что каждая системная функция имеет понятное место в интерфейсе.