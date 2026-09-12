# MessAnger — Master UI/UX & Product Improvement Plan

## 0. Цель проекта

Довести существующий мессенджер до уровня современного коммерческого продукта.

Главная задача AI-агента:

> Не просто изменить внешний вид отдельных компонентов, а провести полный аудит приложения, устранить типичные ошибки разработки мессенджеров, привести все экраны и состояния к единой дизайн-системе и сделать взаимодействие быстрым, понятным и предсказуемым.

Агент не должен слепо переписывать приложение.

Перед изменением каждого блока необходимо:

1. Найти существующую реализацию.
2. Определить текущую логику.
3. Проверить связанные компоненты.
4. Проверить responsive-поведение.
5. Определить существующие состояния.
6. Только после этого вносить изменения.
7. Не ломать уже работающую функциональность.

---

# 1. Главный принцип дизайна

Мессенджер должен восприниматься как единый продукт, а не как набор отдельных страниц.

Необходимо исключить:

* случайные отступы;
* разные размеры одинаковых кнопок;
* разные радиусы;
* разные иконки для одинаковых действий;
* разную высоту элементов;
* несогласованные цвета;
* чрезмерно большие элементы;
* визуальный шум;
* чрезмерное количество границ;
* одинаковую визуальную тяжесть у второстепенных и основных действий;
* окна, которые перекрывают друг друга;
* модальные окна поверх модальных окон без необходимости;
* элементы, которые выглядят кликабельными, но не являются кнопками;
* элементы, которые выглядят неактивными, хотя доступны.

Дизайн должен быть:

* современным;
* минималистичным;
* быстрым визуально;
* аккуратным;
* предсказуемым;
* удобным на desktop;
* удобным на tablet;
* удобным на mobile;
* пригодным для длительного использования.

---

# 2. Главные ошибки, которые необходимо проверить

## 2.1. Слишком большие UI-элементы

Типичная ошибка:

* огромные кнопки;
* слишком высокая строка чата;
* большие аватары;
* чрезмерно крупные заголовки;
* слишком толстые панели.

Исправить:

* уменьшить визуальный шум;
* оставить крупными только основные CTA;
* сделать второстепенные элементы компактными;
* использовать плотность интерфейса как у профессионального рабочего инструмента.

---

# 3. Ошибки навигации

Проверить:

* можно ли понять, где находится пользователь;
* виден ли текущий раздел;
* можно ли быстро вернуться назад;
* не теряется ли контекст;
* не создаётся ли слишком глубокая вложенность экранов.

Основная навигация должна быть очевидной.

Например:

```text
Chats
Contacts
Calls
Groups
Channels
Settings
Profile
```

Но фактическую структуру определить по уже существующей архитектуре приложения.

Не создавать новую навигацию без необходимости.

---

# 4. Архитектура основного интерфейса

Основной layout должен поддерживать:

```text
┌─────────────────────────────────────────────┐
│ Header                                      │
├───────────────┬─────────────────────────────┤
│               │                             │
│ Chats / Nav   │        Active Chat          │
│               │                             │
│               │                             │
│               │                             │
├───────────────┴─────────────────────────────┤
│ optional bottom/navigation area             │
└─────────────────────────────────────────────┘
```

На desktop необходимо использовать многоколоночный интерфейс там, где это повышает эффективность.

На mobile:

```text
List → Chat → Details
```

с переходами назад.

---

# 5. Unified Design System

Создать единую систему компонентов.

## 5.1. Цвета

Определить:

```text
Primary
Primary Hover
Primary Active
Secondary
Background
Surface
Surface Elevated
Surface Hover
Border
Text Primary
Text Secondary
Text Muted
Success
Warning
Danger
Info
Unread
Online
Offline
```

Каждый цвет должен иметь назначение.

Запретить:

```text
#randomColor1
#randomColor2
```

для отдельных элементов без использования design tokens.

---

# 6. Типографика

Определить:

```text
Display
H1
H2
H3
Title
Body
Body Small
Caption
Label
Button
Monospace
```

У каждого уровня должен быть:

* размер;
* font-weight;
* line-height;
* letter-spacing.

Не использовать разные значения вручную в каждом компоненте.

---

# 7. Spacing System

Использовать единую шкалу:

```text
4
8
12
16
20
24
32
40
48
64
```

Все отступы должны базироваться на этой системе.

Не допускать:

```text
margin: 13px
padding: 17px
gap: 19px
```

если для этого нет веской причины.

---

# 8. Radius System

Определить:

```text
Small
Medium
Large
XL
Pill
Circle
```

Например:

```text
4px
8px
12px
16px
999px
50%
```

Одинаковые типы элементов должны иметь одинаковые радиусы.

---

# 9. Иконки

Использовать одну икон-систему.

Нельзя смешивать:

* разные icon packs;
* SVG одного стиля и PNG другого;
* outline и filled icons без системы.

Размеры:

```text
14
16
18
20
24
28
32
```

Использовать 24px для основных action icons только там, где это действительно необходимо.

---

# 10. Buttons

Создать:

```text
Primary
Secondary
Tertiary
Ghost
Danger
Icon
Icon + Text
Floating Action Button
```

Каждый тип должен иметь состояния:

```text
Default
Hover
Focus
Active
Pressed
Disabled
Loading
Success
```

Обязательно добавить keyboard focus.

---

# 11. Поля ввода

Input должен иметь:

```text
Default
Hover
Focus
Filled
Error
Disabled
Loading
Success
```

Нельзя сообщать ошибку только цветом.

Должны использоваться:

* icon;
* message;
* visual state.

---

# 12. Chat List

Список чатов — один из главных элементов приложения.

Каждый Chat Item должен поддерживать:

```text
Avatar
Name
Last message
Time
Unread count
Mute
Pinned
Online
Typing
Draft
Mention
Attachment indicator
Status
```

Состояния:

```text
Default
Hover
Selected
Unread
Muted
Pinned
Typing
Draft
Archived
```

Необходимо правильно расставить визуальные приоритеты.

Например:

```text
Name        ← наиболее важный
Message     ← вторичный
Time        ← третичный
Badge       ← action/status
```

---

# 13. Ошибки списка чатов

Обязательно исправить:

* слишком много текста;
* плохую визуальную иерархию;
* слишком маленькую область клика;
* невозможность быстро отличить непрочитанные сообщения;
* плохое отображение длинных имен;
* некорректное поведение при большом количестве чатов;
* скачки высоты строк;
* неправильное поведение при загрузке.

---

# 14. Chat Header

Header должен содержать:

```text
Back
Avatar
Name
Online / Status
Search
Call
Video
More
```

На desktop часть элементов может быть постоянно видимой.

На mobile второстепенные действия можно переносить в меню.

Не перегружать header.

---

# 15. Message Bubble

Каждое сообщение должно иметь:

```text
Text
Time
Status
Reply
Reaction
Attachment
Forward
Edit
Delete
Copy
More
```

Поддержать:

```text
Mine
Other
Sending
Sent
Delivered
Read
Failed
Edited
Forwarded
Reply
Pinned
Highlighted
Selected
```

---

# 16. Размер сообщений

Не делать bubble чрезмерно широким.

Оптимально ограничить максимальную ширину текста.

Поддержать:

* короткие сообщения;
* длинные сообщения;
* ссылки;
* code blocks;
* цитаты;
* emoji;
* изображения;
* документы.

---

# 17. Message Actions

При наведении / выборе сообщения:

```text
React
Reply
Forward
Copy
Edit
Delete
More
```

На mobile использовать context menu / bottom sheet.

Не показывать десятки кнопок постоянно.

---

# 18. Контекстное меню

Контекстное меню должно быть единообразным для всего приложения.

Пункты должны иметь:

```text
Icon
Label
Shortcut
Divider
Danger state
```

Например:

```text
Reply
Forward
Copy
Save
Pin
Translate
Edit
Delete
```

Для destructive actions использовать отдельную визуальную группу.

---

# 19. Reactions

Система reactions должна поддерживать:

* emoji;
* быстрый выбор;
* собственные reactions;
* список пользователей;
* количество;
* active state.

Не делать reaction interface слишком массивным.

---

# 20. Composer

Поле отправки сообщения — критически важная часть интерфейса.

Поддержать:

```text
Text
Emoji
Attachments
Files
Images
Voice
Reply
Editing
Draft
Mentions
Commands
Formatting
```

Composer должен:

* автоматически увеличиваться;
* иметь ограничение высоты;
* корректно работать с Enter;
* поддерживать Shift+Enter;
* показывать загрузку;
* сохранять draft;
* восстанавливаться после переключения чата.

---

# 21. Typing indicator

Использовать понятное состояние:

```text
Ivan is typing…
```

либо:

```text
Typing…
```

Не показывать анимацию там, где она не нужна.

---

# 22. Empty States

Пустой экран никогда не должен выглядеть как сломанное приложение.

Для каждого пустого состояния добавить:

```text
Illustration/Icon
Title
Description
Primary Action
Optional Secondary Action
```

Например:

```text
No conversations yet

Start a conversation with someone from your contacts.

[ New message ]
```

---

# 23. Loading States

Не использовать бесконечный spinner для всего приложения.

Использовать:

```text
Skeleton
Inline loader
Progress
Spinner
Optimistic UI
Placeholder
```

Skeleton должен повторять реальную структуру интерфейса.

---

# 24. Error States

Создать отдельные состояния:

```text
Network error
Server error
Permission error
Message send error
Upload error
Call error
Authentication error
Unknown error
```

Ошибка должна отвечать на три вопроса:

```text
Что произошло?
Почему?
Что делать дальше?
```

---

# 25. Offline Mode

Мессенджер обязан иметь явное состояние сети.

Например:

```text
Offline
Connecting…
Connected
Poor connection
Reconnecting…
```

Не заставлять пользователя гадать, почему сообщение не отправляется.

---

# 26. Message Sending Reliability

Отображать:

```text
Sending
Sent
Delivered
Read
Failed
Retry
```

При ошибке:

```text
Retry
Copy
Delete
```

Сообщение не должно просто исчезать.

---

# 27. Search

Необходимо реализовать нормальный поиск.

Искать:

```text
Messages
Users
Groups
Channels
Files
Links
Media
```

Добавить фильтры:

```text
From
Date
Chat
Media type
Links
Files
```

---

# 28. Profile

Profile screen должен содержать:

```text
Avatar
Name
Username
Status
Bio
Phone/email visibility
Privacy
Shared media
Groups
Mutual contacts
```

Информация должна быть структурирована.

---

# 29. Contacts

Контакты:

```text
Search
Favorites
Recent
All contacts
Groups
Invite
New contact
```

Должна быть возможность быстро открыть:

```text
Profile
Chat
Call
More
```

---

# 30. Groups

Group page:

```text
Cover / avatar
Name
Description
Members
Admins
Permissions
Media
Files
Links
Pinned messages
Notifications
```

Администраторские действия отдельно визуально обозначить.

---

# 31. Channels

Если продукт поддерживает каналы:

```text
Subscribers
Posts
Views
Reactions
Comments
Admins
Statistics
Permissions
```

Интерфейс channel не должен выглядеть просто как копия обычного chat.

---

# 32. Calls

Необходимо предусмотреть:

```text
Voice call
Video call
Incoming call
Outgoing call
Connecting
Connected
Muted
Camera off
Speaker
Screen sharing
Participants
Call ended
Missed call
```

Интерфейс звонка должен иметь чёткую визуальную иерархию.

---

# 33. Media Viewer

Отдельный полноценный viewer:

```text
Image
Video
Gallery
Next
Previous
Zoom
Download
Share
Forward
Save
Delete
Metadata
```

На desktop поддержать keyboard navigation.

---

# 34. Emoji Picker

Emoji picker должен:

* быстро открываться;
* запоминать recent;
* иметь категории;
* поддерживать поиск;
* не перекрывать composer;
* корректно работать на mobile.

---

# 35. Sticker / GIF system

Предусмотреть:

```text
Recent
Favorites
Search
Categories
Packs
GIF
Stickers
```

---

# 36. Notifications

Настройки:

```text
All
Mentions
Direct messages
Groups
Channels
Calls
Sounds
Desktop
Mobile
Preview
```

Также необходимо поддержать mute:

```text
1 hour
8 hours
1 day
Until enabled
```

---

# 37. Settings

Settings необходимо разбить на логические категории.

Например:

```text
Account
Profile
Privacy
Security
Notifications
Appearance
Chat
Media
Data
Calls
Devices
Language
Accessibility
About
```

Не делать одну длинную страницу.

---

# 38. Privacy UI

Пользователь должен понимать:

* кто видит его профиль;
* кто видит статус;
* кто может писать;
* кто может звонить;
* какие данные используются.

Privacy settings должны быть понятными человеку без технических знаний.

---

# 39. Security UI

Добавить:

```text
Active sessions
Devices
Login history
2FA
Passcode
Biometric lock
Session revoke
Security notifications
```

Опасные действия должны требовать подтверждение.

---

# 40. Notifications UI

Не использовать одинаковые уведомления для всего.

Типы:

```text
Success
Info
Warning
Error
Message
System
```

Toast должен иметь:

```text
Icon
Title/message
Optional action
Close
```

---

# 41. Modal System

Главная ошибка многих приложений — десятки разных модальных окон.

Создать единый Modal system:

```text
Small
Medium
Large
Fullscreen
Bottom Sheet
Confirmation
Danger
Form
```

Все должны иметь одинаковое поведение.

---

# 42. Не допускать перекрывания окон

Нельзя допускать:

```text
Modal
  ↓
Modal
  ↓
Modal
  ↓
Menu
```

без явной необходимости.

Использовать:

```text
Modal
Drawer
Sheet
Popover
Context Menu
```

для разных задач.

---

# 43. Drawer / Side panel

Для профиля, информации о чате, media и настроек использовать side panel там, где это удобнее полного перехода.

Пример:

```text
Chat
     → Details Drawer
```

Это сохраняет контекст.

---

# 44. Responsive Design

Проверить минимум:

```text
320px
375px
390px
430px
768px
1024px
1280px
1440px
1920px
```

Нельзя строить responsive только на:

```css
@media(max-width: 768px)
```

Нужно проверить промежуточные размеры.

---

# 45. Mobile UX

На mobile:

* минимизировать количество одновременно отображаемых элементов;
* увеличить touch target;
* использовать bottom sheets;
* избегать hover-only interaction;
* поддерживать back navigation;
* избегать маленьких иконок.

Минимальный комфортный touch target:

```text
~44px
```

---

# 46. Desktop UX

На desktop:

* использовать доступное пространство;
* поддерживать keyboard shortcuts;
* hover actions;
* context menus;
* multi-column layout;
* resizable panels, если это соответствует архитектуре приложения.

---

# 47. Accessibility

Обязательно проверить:

```text
Keyboard navigation
Focus states
ARIA labels
Screen reader compatibility
Contrast
Reduced motion
Font scaling
Color blindness
```

Нельзя использовать цвет как единственный способ показать состояние.

---

# 48. Animation System

Анимации должны быть минимальными и функциональными.

Использовать для:

```text
Open
Close
Transition
Message send
Typing
Loading
Notification
Selection
```

Не использовать декоративную анимацию без цели.

Добавить:

```text
prefers-reduced-motion
```

---

# 49. Microinteractions

Добавить качественные microinteractions:

```text
Button press
Message reaction
Copy success
Message sent
Upload complete
Call connected
Typing
Unread count
Online state
```

Но они не должны замедлять интерфейс.

---

# 50. Hover states

Каждый интерактивный элемент должен иметь hover, если устройство это поддерживает.

Проверить:

```text
Button
Chat
Message
Avatar
Icon
Menu
Tabs
List item
Settings row
```

---

# 51. Focus states

Все интерактивные компоненты должны быть доступны с клавиатуры.

Не удалять:

```css
outline: none;
```

без собственной полноценной focus-системы.

---

# 52. Scroll behavior

Проверить:

* список сообщений;
* список чатов;
* большие группы;
* media;
* settings.

В chat:

```text
Scroll up → load old messages
Scroll down → latest
New message → indicator
```

Если пользователь читает историю, интерфейс не должен внезапно отправлять его вниз.

---

# 53. New message indicator

Создать:

```text
↓ New messages
```

и корректно управлять им.

---

# 54. Pinned messages

Закреплённое сообщение должно быть:

* заметным;
* но не навязчивым.

Поддержать:

```text
Pinned count
Current pinned
Open
Navigate
Unpin
```

---

# 55. Draft system

Draft должен сохраняться:

```text
per conversation
```

При возвращении в чат текст должен восстанавливаться.

---

# 56. Optimistic UI

Для быстрых операций использовать optimistic updates:

```text
Reaction
Send message
Edit
Delete
Pin
Mute
Mark read
```

При ошибке делать rollback.

---

# 57. Performance

Проверить:

```text
Large chat list
Large message history
Thousands of messages
Large media
Many reactions
Large groups
Virtualization
Lazy loading
Image compression
Caching
```

UI не должен зависать из-за 1000+ сообщений.

---

# 58. Images

Все изображения должны иметь:

```text
Placeholder
Lazy loading
Error fallback
Aspect ratio
Blur preview
Compression
```

Не допускать layout shift.

---

# 59. Avatars

Avatar states:

```text
Image
Initials
Default
Loading
Broken
Online
Away
Offline
```

Online indicator нельзя делать слишком большим.

---

# 60. Empty / first-use experience

Первый запуск должен быстро объяснять:

```text
Что это за приложение?
Как найти контакт?
Как написать сообщение?
Как создать группу?
```

Не перегружать onboarding.

---

# 61. Onboarding

Проверить:

```text
Welcome
Account
Username
Avatar
Permissions
Contacts
Notifications
Security
```

Каждый шаг должен быть максимально коротким.

---

# 62. Login / Registration

Обязательно проверить:

```text
Loading
Invalid input
Network failure
Wrong code
Expired code
Resend
Too many attempts
Success
```

Не скрывать причину ошибки.

---

# 63. Проблема «слишком много всего»

Типичная ошибка разработчиков:

> Добавить функцию = добавить кнопку.

Так делать нельзя.

Каждая новая функция должна иметь:

```text
Entry point
UI
State
Loading
Error
Empty
Success
Permission
Mobile behavior
Desktop behavior
Accessibility
```

---

# 64. Компонентная архитектура UI

Создать / привести к единой системе:

```text
Button
Input
Avatar
Badge
Tooltip
Popover
Dropdown
Modal
Drawer
Toast
Tabs
Switch
Checkbox
Radio
Select
Slider
Menu
ContextMenu
Search
ChatItem
Message
Reaction
Composer
Attachment
MediaViewer
```

---

# 65. Tooltip

Tooltip нужен для:

* icon-only buttons;
* неочевидных функций;
* shortcut information.

Не показывать tooltip на элементах с очевидным текстом.

---

# 66. Keyboard shortcuts

Добавить систему:

```text
Ctrl/Cmd + K
Search

Ctrl/Cmd + Enter
Send

Esc
Close modal/menu

Arrow navigation
```

Но shortcut должны соответствовать реальной логике приложения.

---

# 67. Search UX

При поиске должна быть визуальная обратная связь:

```text
Searching…
No results
Results
Filters
Clear
```

Не оставлять пустой экран после поиска.

---

# 68. Command / Quick Actions

Рассмотреть быстрый command interface:

```text
New message
Create group
Search
Settings
Start call
```

Это особенно полезно для desktop.

---

# 69. Visual hierarchy

На каждом экране определить:

```text
Primary action
Secondary action
Tertiary action
Metadata
Danger action
```

Не делать все элементы одинаково яркими.

---

# 70. Устранение визуального шума

Уменьшить:

* лишние borders;
* лишние shadows;
* лишние backgrounds;
* лишние badges;
* лишние labels;
* лишние icons.

Главный принцип:

> Если элемент не помогает пользователю выполнить действие или понять состояние — он кандидат на удаление.

---

# 71. Cards

Не превращать весь интерфейс в набор карточек.

Cards использовать только там, где они действительно помогают группировать контент.

---

# 72. Glassmorphism

Если используется glassmorphism:

* не применять его ко всему;
* не ухудшать readability;
* не использовать чрезмерный blur;
* сохранять контраст;
* использовать его только для elevated surfaces.

---

# 73. Dark mode

Dark mode должен проектироваться отдельно, а не просто:

```text
background → black
text → white
```

Проверить:

```text
Contrast
Borders
Shadows
Images
Inputs
Selection
Unread
Disabled states
```

---

# 74. Light mode

Light mode должен сохранять ту же иерархию, но иметь адаптированную контрастность.

---

# 75. Theme tokens

Использовать:

```css
--color-bg
--color-surface
--color-surface-hover
--color-text
--color-text-secondary
--color-border
--color-primary
--color-success
--color-danger
```

а не хардкодить цвета по проекту.

---

# 76. Не ломать существующий backend

Перед UI-изменением определить:

```text
API
WebSocket
Auth
Database
State management
Routing
Uploads
Notifications
Calls
```

UI не должен менять backend без необходимости.

---

# 77. State management

Проверить, где находятся:

```text
User
Chats
Messages
Unread
Presence
Typing
Calls
Notifications
Settings
```

Не допускать дублирования состояния между компонентами.

---

# 78. Real-time states

Проверить:

```text
online
offline
typing
message received
read
reaction
edit
delete
call state
```

Все должны автоматически обновляться.

---

# 79. Skeleton system

Создать набор skeleton components:

```text
ChatListSkeleton
MessageSkeleton
ProfileSkeleton
SettingsSkeleton
MediaSkeleton
SearchSkeleton
```

---

# 80. Error boundary

Добавить глобальный UI для критических ошибок:

```text
Something went wrong

Reload
Go to chats
Report problem
```

Не оставлять пользователя на белом экране.

---

# 81. Offline-first UX

Если инфраструктура допускает:

```text
Local cache
Queued messages
Retry queue
Offline drafts
Cached conversations
```

Пользователь должен видеть, что приложение продолжает работать насколько это возможно.

---

# 82. Security UX

Security нельзя делать незаметным.

Должны быть понятные состояния:

```text
New login
New device
Session terminated
Security warning
Suspicious activity
```

---

# 83. Privacy UX

Пользователь должен легко изменить:

```text
Who can message me
Who can call me
Who sees my profile
Who sees my status
Who sees my last seen
```

Настройки должны быть объяснены человеческим языком.

---

# 84. Media and files

Attachments должны иметь:

```text
Uploading
Upload progress
Complete
Failed
Retry
Cancel
Preview
```

Для файлов:

```text
Icon
Filename
Size
Type
Progress
Download
```

---

# 85. Drag & Drop

На desktop поддержать:

```text
Image
Video
File
```

с отдельной зоной:

```text
Drop files here
```

---

# 86. Mobile gestures

При необходимости:

```text
Swipe back
Swipe actions
Long press
Pull to refresh
Pinch zoom
```

Не перегружать жестами.

---

# 87. Архив

Поддержать:

```text
Archive
Unarchive
Archived count
Search archived
```

---

# 88. Pin chats

Поддержать:

```text
Pinned
Reorder
Unpin
```

---

# 89. Mute

Mute должен быть доступен:

```text
Chat
Group
Channel
```

и иметь понятную визуальную индикацию.

---

# 90. Message selection mode

При выборе сообщений:

```text
Selected count
Reply
Forward
Copy
Delete
Save
```

Toolbar должна заменять обычный header.

---

# 91. Bulk operations

Для чатов и сообщений:

```text
Select multiple
Delete
Archive
Mark read
Mute
```

---

# 92. Confirmation dialogs

Подтверждение требуется для:

```text
Delete account
Delete conversation
Delete message
Leave group
Revoke session
Remove admin
```

Но не использовать confirmation для каждой мелочи.

---

# 93. Destructive actions

Danger actions должны:

* быть отделены;
* иметь понятный текст;
* не маскироваться под обычную кнопку.

Вместо:

```text
OK
```

использовать:

```text
Delete message
Delete account
Leave group
```

---

# 94. UX copy

Убрать:

```text
Error 400
Something went wrong
Operation failed
Invalid
```

если можно объяснить человеческим языком.

Пример:

```text
Couldn't send the message.
Check your connection and try again.
```

---

# 95. Локализация

Не делать UI, который ломается при длинных переводах.

Проверить:

```text
Russian
English
Long labels
Pluralization
Date/time
Numbers
```

Не хардкодить строки внутри компонентов.

---

# 96. Даты и время

Использовать:

```text
Now
5 min
Today 14:32
Yesterday
Mon 12:30
12 Sep 2026
```

в зависимости от контекста.

---

# 97. Accessibility labels

Icon-only кнопки должны иметь:

```text
aria-label
tooltip
keyboard access
```

---

# 98. QA каждого экрана

Для каждого экрана создать checklist:

```text
Desktop
Tablet
Mobile

Default
Loading
Empty
Error
Success
Disabled
Hover
Focus
Active
Dark mode
Light mode
Keyboard
Accessibility
```

---

# 99. AI-Agent Workflow

AI-агент должен работать строго поэтапно.

## Phase 1 — Audit

Найти:

```text
Pages
Components
Routes
Modals
Popups
Navigation
State
API
WebSocket
Styles
Themes
Responsive CSS
```

Составить карту проекта.

---

## Phase 2 — UI inventory

Создать список всех UI-компонентов:

```text
Component
Location
Purpose
Current state
Problems
Priority
```

---

## Phase 3 — Design system

Сначала привести к единому виду:

```text
Colors
Typography
Spacing
Radius
Shadows
Icons
Buttons
Inputs
Modals
Menus
```

Только после этого исправлять страницы.

---

# 100. Приоритеты исправлений

## P0 — Critical

Исправлять в первую очередь:

```text
Broken layout
Overlapping windows
Unusable navigation
Broken mobile
Broken message composer
Unread messages problems
Send failures
Critical errors
Authentication problems
Accessibility blockers
```

---

## P1 — High

Затем:

```text
Chat list
Message UI
Search
Profile
Contacts
Settings
Notifications
Responsive
Loading
Error states
Empty states
```

---

## P2 — Medium

Затем:

```text
Animations
Microinteractions
Keyboard shortcuts
Advanced filters
Visual polish
Media viewer
Advanced personalization
```

---

## P3 — Nice to have

После основного продукта:

```text
Advanced themes
Experimental UI
Advanced animations
Extra customization
Power-user features
```

---

# 101. Что AI-агенту запрещено делать

Нельзя:

1. Переписывать всё приложение без анализа.
2. Удалять рабочую функциональность ради дизайна.
3. Создавать дублирующие компоненты.
4. Добавлять новый UI framework без необходимости.
5. Использовать разные стили для одинаковых компонентов.
6. Хардкодить цвета по всему проекту.
7. Делать огромные кнопки.
8. Добавлять бесконечные модальные окна.
9. Использовать анимации ради анимаций.
10. Ломать mobile ради desktop.
11. Ломать desktop ради mobile.
12. Игнорировать loading/error/empty states.
13. Показывать пользователю технические ошибки backend.
14. Удалять accessibility.
15. Убирать keyboard support.
16. Делать UI только для красивого screenshot.
17. Менять backend без необходимости.
18. Переименовывать API без проверки зависимостей.
19. Создавать новый компонент, если существующий можно качественно переиспользовать.
20. Завершать задачу фразой «UI готов», если не пройдены все состояния.

---

# 102. Definition of Done

Работа считается завершённой только если:

```text
[ ] Все страницы проверены
[ ] Все компоненты унифицированы
[ ] Design tokens внедрены
[ ] Responsive исправлен
[ ] Mobile исправлен
[ ] Desktop исправлен
[ ] Loading states есть
[ ] Empty states есть
[ ] Error states есть
[ ] Success states есть
[ ] Hover states есть
[ ] Focus states есть
[ ] Disabled states есть
[ ] Accessibility проверена
[ ] Keyboard navigation проверена
[ ] Dark mode проверен
[ ] Light mode проверен
[ ] Chat UX проверен
[ ] Message UX проверен
[ ] Search проверен
[ ] Settings проверены
[ ] Profile проверен
[ ] Calls проверены
[ ] Media проверена
[ ] Notifications проверены
[ ] Performance проверен
[ ] Не осталось overlapping UI
[ ] Не осталось случайных отступов
[ ] Не осталось несогласованных кнопок
[ ] Не осталось разных визуальных стилей
[ ] Не сломана существующая логика
```

---

# 103. Финальный принцип

Главный критерий качества:

> Пользователь не должен задумываться, как пользоваться интерфейсом.

Он должен:

```text
увидеть
→ понять
→ нажать
→ получить результат
```

без лишнего когнитивного усилия.

MessAnger должен ощущаться не как «сайт с чатами», а как полноценный продукт уровня современного desktop/mobile messenger.

Главный приоритет:

```text
Clarity
→ Speed
→ Consistency
→ Reliability
→ Accessibility
→ Visual polish
```

Красивый интерфейс без удобства — плохой интерфейс.

Функциональный интерфейс без визуальной системы — незаконченный продукт.

Цель — объединить оба направления в единую систему.
