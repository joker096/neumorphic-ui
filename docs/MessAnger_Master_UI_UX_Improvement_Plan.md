# Mess&Anger — Master UI/UX Improvement & Visual Refinement Plan

> Назначение: полный технический план визуального UI/UX-рефакторинга Mess&Anger с устранением перегруженности, чрезмерных размеров элементов, наложений окон, несогласованности компонентов и проблем адаптивности.
>
> Статус: UI/UX Improvement Blueprint
>
> Версия: 1.0
>
> Принцип: сначала создать единую Design System, затем привести к ней базовые компоненты, после чего последовательно переработать каждый экран и только потом выполнять финальный визуальный QA.

---

# 0. Цели UI/UX

Mess&Anger должен выглядеть как цельный коммерческий продукт, а не набор отдельно разработанных экранов.

Основные цели:

- уменьшить визуальную перегруженность;
- убрать чрезмерно большие кнопки и контролы;
- устранить наложения окон;
- установить единую систему размеров;
- установить единую систему отступов;
- установить единую систему радиусов;
- установить единую типографику;
- установить единый масштаб и визуальную плотность;
- сделать все состояния компонентов предсказуемыми;
- обеспечить корректный responsive;
- исключить переполнение viewport;
- исключить конфликтующие scroll-контейнеры;
- стандартизировать z-index;
- стандартизировать модальные и всплывающие элементы;
- улучшить читаемость;
- сократить количество визуального шума;
- обеспечить единый UX на всех экранах.

Главный принцип:

```text
Design System
      ↓
Base Components
      ↓
Composite Components
      ↓
Screens
      ↓
Responsive
      ↓
Visual QA
```

---

# 1. Текущий класс проблем

План должен устранить следующие классы дефектов.

## 1.1. Размеры

Проблемы:

- слишком большие кнопки;
- чрезмерная высота input;
- слишком крупные icon buttons;
- чрезмерные padding;
- слишком большие заголовки;
- большие карточки при небольшом количестве информации;
- избыточная высота строк;
- несогласованные размеры элементов.

Правило:

> Размер компонента определяется его функцией и плотностью экрана, а не желанием визуально увеличить кликабельность.

---

# 2. Design Tokens

Все размеры должны задаваться через централизованные токены.

## 2.1. Spacing

Рекомендуемая базовая шкала:

```text
2
4
6
8
10
12
16
20
24
32
40
48
64
```

Основные значения:

```text
xs   = 4px
sm   = 8px
md   = 12px
lg   = 16px
xl   = 24px
2xl  = 32px
3xl  = 48px
```

Не использовать произвольные значения без необходимости.

---

# 3. Control Sizes

Единая шкала контролов:

```text
XS = 28px
SM = 32px
MD = 36px
LG = 40px
XL = 44px
```

Основной размер:

```text
MD = 36px
```

Крупные элементы:

```text
LG = 40px
XL = 44px
```

Не использовать 48–56px как стандартную высоту обычных кнопок.

Большие размеры допустимы только для:

- primary CTA;
- mobile-specific controls;
- accessibility-specific targets;
- отдельных hero actions.

---

# 4. Border Radius System

Базовая система:

```text
2px
4px
6px
8px
10px
12px
16px
20px
24px
9999px
```

Назначение:

```text
input          = 8px
button         = 8px
small control  = 6px
card           = 12px
modal          = 16px
drawer         = 16px
pill           = 9999px
avatar         = 50%
```

Не смешивать большое количество разных радиусов на одном экране.

---

# 5. Typography

Создать единый типографический scale.

```text
Display      32–40px
H1           28px
H2           24px
H3           20px
Body         14–16px
Body Small   13px
Caption      11–12px
Button       13–14px
Label        12–13px
```

Основной UI-текст:

```text
14px
```

Основной текст сообщений:

```text
14–15px
```

Не использовать разные размеры одного назначения на разных экранах.

---

# 6. Font Weight

```text
Regular      400
Medium       500
Semibold     600
Bold         700
```

Основной UI:

```text
400 / 500
```

Заголовки:

```text
600
```

Не использовать Bold повсеместно.

---

# 7. Color System

Создать семантические токены:

```text
background
surface
surface-secondary
surface-tertiary
border
border-subtle
text-primary
text-secondary
text-muted
text-disabled
primary
primary-hover
primary-active
success
warning
danger
info
```

Все компоненты должны использовать семантические цвета, а не hardcoded цвета.

---

# 8. Elevation

Минимизировать количество теней.

```text
Level 0  = no shadow
Level 1  = subtle
Level 2  = floating
Level 3  = modal
Level 4  = critical overlay
```

Не использовать сильные тени для обычных карточек.

---

# 9. Icon System

Все иконки должны иметь единую визуальную систему.

Размеры:

```text
12px
14px
16px
18px
20px
24px
28px
32px
```

Основные UI icons:

```text
16px
18px
20px
```

Не смешивать outline, filled и разные stroke-width без системного правила.

---

# 10. Button System

Кнопки необходимо переработать полностью.

## 10.1. Primary

Назначение:

- главное действие;
- подтверждение;
- отправка;
- сохранение.

Параметры:

```text
height: 36px
padding-x: 14px
gap: 8px
radius: 8px
font: 14px / 500
icon: 16–18px
```

## 10.2. Secondary

```text
height: 36px
padding-x: 12px
radius: 8px
```

Использовать для вторичных действий.

## 10.3. Ghost

Минимальный визуальный вес.

Использовать:

- toolbar;
- secondary navigation;
- вспомогательные действия.

## 10.4. Icon Button

```text
28px  — compact
32px  — standard
36px  — comfortable
40px  — mobile / prominent
```

Не превращать каждую иконку в большую кнопку.

## 10.5. Danger

Использовать только для разрушительных действий.

Примеры:

```text
Delete
Remove
Leave
Disconnect
Reset
```

## 10.6. Compact

Для:

- chat toolbar;
- filters;
- dense tables;
- message actions.

```text
height: 28–32px
```

## 10.7. Floating Action

Использовать только когда действие действительно должно постоянно находиться поверх интерфейса.

---

# 11. Button States

Каждая кнопка обязана иметь:

```text
DEFAULT
HOVER
ACTIVE
FOCUS
DISABLED
LOADING
SELECTED
ERROR
```

Не допускается наличие только default-state.

---

# 12. Button Rules

Запрещается:

```text
❌ все кнопки делать XL
❌ использовать одинаковый размер для всех действий
❌ помещать длинный текст в icon button
❌ использовать несколько primary buttons рядом
❌ использовать danger без подтверждения для критических действий
❌ менять размеры кнопки между экранами без причины
```

Правило:

```text
1 экран
1 основное действие
несколько вторичных
остальные — tertiary / icon
```

---

# 13. Inputs

Стандарт:

```text
height: 36px
padding-x: 12px
radius: 8px
font: 14px
```

Состояния:

```text
default
hover
focus
filled
disabled
error
success
readonly
```

---

# 14. Select

Не использовать разные визуальные select на разных страницах.

Поддержать:

```text
single
multi
searchable
async
disabled
error
```

Dropdown должен автоматически выбирать направление открытия в зависимости от viewport.

---

# 15. Checkbox / Radio / Switch

Все контролы должны иметь:

```text
default
hover
focus
checked
disabled
error
```

Switch не должен быть чрезмерно большим.

Рекомендуемый диапазон:

```text
width: 36–40px
height: 20–24px
```

---

# 16. Tabs

Tabs должны быть компактными.

Запрещается:

- делать tabs высотой как большие buttons;
- использовать чрезмерный padding;
- смешивать несколько визуальных вариантов tabs.

Состояния:

```text
default
hover
active
disabled
```

---

# 17. Tooltips

Tooltip:

- не перекрывает источник информации;
- автоматически помещается в viewport;
- имеет ограничение ширины;
- появляется с небольшой задержкой;
- исчезает при уходе курсора;
- не блокирует клики.

---

# 18. Dropdown

Dropdown должен:

```text
stay inside viewport
avoid clipping
avoid overlap
align to trigger
support keyboard navigation
support scrolling
```

Если места снизу недостаточно:

```text
open upward
```

Если места справа недостаточно:

```text
align to opposite side
```

---

# 19. Context Menu

Контекстное меню:

- открывается рядом с точкой действия;
- не выходит за viewport;
- не перекрывает критически важные элементы;
- закрывается по Escape;
- закрывается при клике вне меню;
- поддерживает keyboard navigation.

---

# 20. Modal Architecture

Все модальные окна должны использовать единый компонент.

Структура:

```text
Overlay
 └── Modal
      ├── Header
      ├── Content
      └── Footer
```

---

# 21. Modal Sizes

```text
XS = 320px
SM = 420px
MD = 560px
LG = 720px
XL = 960px
FULL = viewport-based
```

Не создавать уникальную ширину для каждого modal.

---

# 22. Modal Rules

Modal обязан:

- иметь максимальную высоту;
- иметь внутренний scroll;
- сохранять header/footer;
- блокировать background interaction;
- корректно работать с keyboard;
- закрываться по Escape, если действие не требует обязательного подтверждения;
- не выходить за viewport.

---

# 23. Nested Modals

Не использовать цепочку:

```text
Modal
 ↓
Modal
 ↓
Modal
```

Предпочтительно:

```text
Modal
 ↓
Drawer / Step / Inline confirmation
```

Если вложенность неизбежна:

```text
z-index
focus
scroll
escape
```

должны быть централизованы.

---

# 24. Drawer

Drawer использовать для:

- профиля;
- дополнительных параметров;
- фильтров;
- контекстной информации;
- mobile navigation.

Drawer не должен превращаться в ещё один полноценный экран без необходимости.

---

# 25. Popover

Popover предназначен для небольших контекстных действий.

Не использовать popover для больших форм.

---

# 26. Z-Index Architecture

Создать централизованную шкалу:

```text
Base             0
Sticky           10
Header           20
Dropdown         100
Popover          200
Tooltip          300
Drawer           400
Modal            500
Modal nested     600
Toast            700
Critical         800
```

Не использовать:

```text
z-index: 999999
z-index: 9999999
```

без системной причины.

---

# 27. Stacking Context

Проверить все:

```text
transform
filter
opacity
position
isolation
overflow
```

которые создают неожиданные stacking contexts.

Цель:

> z-index должен работать предсказуемо независимо от места, где компонент используется.

---

# 28. Overflow Architecture

Каждый scroll должен иметь владельца.

Правило:

```text
Application
 ├── Sidebar scroll
 ├── Chat scroll
 └── Context panel scroll
```

Не создавать бесконечную цепочку:

```text
body scroll
  ↓
page scroll
  ↓
panel scroll
  ↓
modal scroll
  ↓
content scroll
```

---

# 29. App Shell

Главный shell:

```text
┌──────────────────────────────────────┐
│ Header                               │
├────────────┬─────────────────────────┤
│ Sidebar    │ Main                    │
│            │                         │
│            │                         │
└────────────┴─────────────────────────┘
```

Shell должен занимать viewport.

Не допускать горизонтального overflow.

---

# 30. Sidebar

Проверить:

- ширину;
- плотность;
- avatar size;
- unread badges;
- active state;
- hover;
- search;
- sections;
- collapse;
- context menu.

Рекомендуется компактная информационная плотность.

---

# 31. Chat List

Каждый chat item:

```text
Avatar
Name
Last message
Timestamp
Unread
Status
```

Не перегружать каждый элемент всеми возможными metadata.

Высота должна быть адаптивной:

```text
compact: 56px
standard: 64px
```

---

# 32. Chat Header

Header должен содержать только действительно необходимые элементы.

Приоритет:

```text
Back
Avatar
Name / status
Primary actions
More
```

Не превращать header в панель из 15 кнопок.

Вторичные действия:

```text
More menu
```

---

# 33. Message Bubble

Проверить:

- максимальную ширину;
- padding;
- line-height;
- timestamp;
- status;
- reactions;
- attachments;
- reply preview.

Не делать bubble визуально тяжелее самого сообщения.

---

# 34. Message Actions

Основные действия:

```text
Reply
React
Forward
Copy
Edit
Delete
More
```

Показывать контекстно.

Не держать все действия постоянно видимыми.

---

# 35. Composer

Composer должен быть:

- компактным;
- устойчивым к длинному тексту;
- адаптивным;
- с правильным overflow;
- с отдельной зоной attachments;
- с явной кнопкой отправки;
- с voice/action state.

Высота должна расти только при необходимости.

---

# 36. Attachments

Предпросмотр:

```text
image
video
file
audio
link
```

должен иметь единый card component.

Не использовать разные карточки для одинаковых типов вложений.

---

# 37. Reply / Forward

Reply preview должен быть компактным.

Не повторять полное сообщение.

Структура:

```text
accent
author
short preview
close
```

---

# 38. Reactions

Reactions:

- компактные;
- одинакового размера;
- не должны увеличивать bubble чрезмерно;
- selected-state должен быть очевиден.

---

# 39. Profile

Разделить:

```text
Identity
Status
Contact data
Media
Shared content
Actions
```

Не помещать всю информацию в одну огромную карточку.

---

# 40. Contacts

Контакты:

- компактный список;
- понятные секции;
- быстрый поиск;
- фильтрация;
- action menu;
- selection mode.

---

# 41. Groups

Проверить:

- group header;
- members;
- roles;
- permissions;
- media;
- actions;
- invite;
- leave;
- delete.

---

# 42. Channels

Проверить:

- channel identity;
- subscriber count;
- post layout;
- reactions;
- comments;
- pinned content;
- channel actions.

---

# 43. Calls

Call UI должен иметь отдельную визуальную систему:

```text
Connecting
Ringing
Active
Muted
Camera off
Screen sharing
Reconnecting
Ended
Failed
```

---

# 44. Media Viewer

Media viewer должен:

- использовать весь доступный viewport;
- не создавать body scroll;
- поддерживать keyboard;
- иметь navigation;
- иметь metadata;
- иметь download/share/actions;
- корректно работать с portrait/landscape media.

---

# 45. Emoji Picker

Emoji picker:

- ограниченная высота;
- внутренний scroll;
- search;
- categories;
- recent;
- responsive.

Не позволять picker выходить за viewport.

---

# 46. Sticker Picker

Та же архитектура:

```text
Header
Search
Categories
Scrollable content
Footer / tabs
```

---

# 47. Notifications

Разделить:

```text
Toast
In-app notification
System notification
Unread indicator
```

Toast не должен перекрывать основные controls.

---

# 48. Settings

Settings построить через:

```text
Category
Section
Setting row
Control
Description
```

Каждый Setting Row должен иметь одинаковую структуру.

---

# 49. Empty States

Создать единую систему:

```text
Illustration/Icon
Title
Description
Primary action
Secondary action
```

Не использовать огромные изображения там, где достаточно небольшой иконки.

---

# 50. Loading States

Использовать:

```text
Skeleton
Spinner
Progress
Inline loading
Button loading
```

Skeleton должен повторять реальную структуру контента.

---

# 51. Error States

Каждая ошибка должна иметь:

```text
What happened
Why
What to do
Retry
```

Не показывать технический stack trace пользователю.

---

# 52. Success States

Success должен быть ненавязчивым.

Использовать:

```text
check
toast
inline status
```

Не создавать огромные success-модалки для обычных действий.

---

# 53. Desktop

Цель:

- высокая информационная плотность;
- минимальный пустой space;
- стабильная sidebar;
- комфортная ширина chat;
- контекстные панели.

---

# 54. Tablet

При ограничении ширины:

```text
secondary panels → drawer
sidebar → compact / collapsible
```

---

# 55. Mobile

Основные правила:

- touch target не меньше комфортного размера;
- secondary actions → menus;
- sidebars → drawers;
- multi-column → single-column;
- modal → bottom sheet, где это уместно;
- header должен оставаться компактным.

---

# 56. Small Mobile

Проверить:

```text
320px
360px
375px
390px
```

Обязательно:

- no horizontal scroll;
- no clipped text;
- no overlapping;
- buttons fit;
- dialogs fit;
- composer fit.

---

# 57. Responsive Breakpoints

Определить централизованно:

```text
XS
SM
MD
LG
XL
2XL
```

Не создавать breakpoint для отдельного компонента без необходимости.

---

# 58. Animation System

Базовые duration:

```text
fast     100–150ms
normal   150–220ms
slow     220–320ms
```

Использовать easing system.

Не анимировать всё подряд.

---

# 59. Micro-interactions

Добавить:

```text
hover feedback
press feedback
focus ring
button loading
message sent
message received
selection
drag
drop
modal open
modal close
drawer open
toast enter/exit
```

---

# 60. Accessibility

Обязательные требования:

- keyboard navigation;
- visible focus;
- достаточный contrast;
- semantic labels;
- aria-label для icon-only controls;
- reduced motion;
- достаточная touch area;
- понятные disabled states.

---

# 61. Component Architecture

Базовая структура:

```text
ui/
├── Button
├── IconButton
├── Input
├── Select
├── Checkbox
├── Radio
├── Switch
├── Slider
├── Tabs
├── Badge
├── Avatar
├── Tooltip
├── Dropdown
├── Popover
├── Modal
├── Drawer
├── Toast
├── Skeleton
├── Spinner
└── Progress
```

Composite:

```text
ChatItem
MessageBubble
MessageComposer
ProfileCard
ContactCard
SettingsRow
NotificationItem
MediaCard
```

---

# 62. Component Rules

Каждый компонент должен иметь:

```text
API
variants
sizes
states
responsive behavior
accessibility
```

Не создавать отдельный компонент только ради изменения одного padding.

---

# 63. Visual Consistency

Проверить глобально:

```text
buttons
inputs
icons
avatars
cards
dialogs
menus
tabs
badges
labels
text
spacing
```

Одинаковые элементы должны выглядеть одинаково.

---

# 64. Screen Audit

Каждый экран проходит:

```text
1. Layout
2. Spacing
3. Typography
4. Colors
5. Components
6. States
7. Overflow
8. Scroll
9. Z-index
10. Responsive
11. Accessibility
12. Animation
```

---

# 65. Overlay Audit

Проверить все комбинации:

```text
dropdown + modal
popover + drawer
tooltip + dropdown
context menu + modal
emoji picker + composer
sticker picker + composer
media viewer + toast
nested dialog
mobile keyboard + modal
```

---

# 66. Overflow Audit

Искать:

```text
horizontal overflow
vertical overflow
clipped content
double scrollbar
hidden content
fixed element overflow
mobile viewport overflow
```

---

# 67. Button Audit

Найти все buttons в проекте.

Для каждого определить:

```text
component
variant
size
purpose
state
screen
responsive behavior
```

Заменить ad-hoc buttons системными.

---

# 68. Modal Audit

Найти все modal/dialog implementations.

Удалить дублирующие реализации.

Привести к:

```text
Modal
Drawer
BottomSheet
Popover
```

с единым layer manager.

---

# 69. Layer Manager

Создать централизованный механизм:

```text
openOverlay()
closeOverlay()
bringToFront()
registerLayer()
unregisterLayer()
```

Он отвечает за:

- z-index;
- focus;
- Escape;
- body scroll lock;
- nested overlays.

---

# 70. Scroll Manager

Централизовать:

```text
body lock
modal lock
drawer lock
chat scroll
list scroll
```

Цель:

> пользователь всегда понимает, какая область сейчас прокручивается.

---

# 71. UI State Matrix

Для каждого интерактивного компонента создать matrix:

```text
             Default Hover Active Focus Disabled Loading Selected
Button          ✓      ✓      ✓      ✓       ✓       ✓       ✓
Input           ✓      ✓      -      ✓       ✓       -       -
Select          ✓      ✓      ✓      ✓       ✓       ✓       ✓
Switch          ✓      ✓      ✓      ✓       ✓       -       ✓
Checkbox        ✓      ✓      ✓      ✓       ✓       -       ✓
```

---

# 72. Design Token Migration

Этап:

```text
hardcoded styles
      ↓
tokens
      ↓
component variants
      ↓
screen migration
```

Не пытаться переписать все экраны одновременно.

---

# 73. Refactoring Order

Рекомендуемый порядок:

```text
1. Design tokens
2. Typography
3. Colors
4. Spacing
5. Radius
6. Icons
7. Buttons
8. Inputs
9. Selects
10. Tabs
11. Dropdown
12. Popover
13. Modal
14. Drawer
15. Toast
16. Layout shell
17. Sidebar
18. Chat list
19. Chat
20. Composer
21. Profile
22. Contacts
23. Groups
24. Channels
25. Calls
26. Media
27. Emoji
28. Stickers
29. Notifications
30. Settings
31. Responsive
32. Accessibility
33. Animation
34. QA
```

---

# 74. Priority System

Использовать:

```text
P0 — блокирует использование
P1 — серьёзная UX проблема
P2 — заметная визуальная проблема
P3 — улучшение
P4 — polish
```

Примеры P0:

```text
window overlap
content inaccessible
broken scrolling
mobile layout broken
button action inaccessible
```

P1:

```text
oversized controls
inconsistent navigation
bad modal behavior
incorrect responsive
```

P2:

```text
spacing inconsistencies
wrong typography
visual noise
```

P3/P4:

```text
micro-animation
fine shadows
pixel-level polish
```

---

# 75. Phase 1 — Foundation

```text
[ ] Design tokens
[ ] Typography
[ ] Colors
[ ] Spacing
[ ] Radius
[ ] Shadows
[ ] Icons
[ ] Breakpoints
[ ] Z-index
[ ] Overflow rules
```

---

# 76. Phase 2 — Core Components

```text
[ ] Button
[ ] IconButton
[ ] Input
[ ] Select
[ ] Checkbox
[ ] Radio
[ ] Switch
[ ] Tabs
[ ] Badge
[ ] Avatar
[ ] Tooltip
[ ] Dropdown
[ ] Popover
[ ] Modal
[ ] Drawer
[ ] Toast
[ ] Skeleton
[ ] Spinner
```

---

# 77. Phase 3 — Overlay System

```text
[ ] Layer Manager
[ ] Focus Manager
[ ] Scroll Lock
[ ] Escape handling
[ ] Viewport collision detection
[ ] Dropdown positioning
[ ] Popover positioning
[ ] Modal positioning
[ ] Drawer behavior
[ ] Nested overlay rules
```

---

# 78. Phase 4 — Messenger

```text
[ ] App Shell
[ ] Sidebar
[ ] Chat List
[ ] Chat Header
[ ] Message Bubble
[ ] Message Actions
[ ] Reply
[ ] Forward
[ ] Reactions
[ ] Attachments
[ ] Composer
[ ] Voice UI
```

---

# 79. Phase 5 — Product Screens

```text
[ ] Profile
[ ] Contacts
[ ] Groups
[ ] Channels
[ ] Calls
[ ] Settings
[ ] Notifications
[ ] Media Viewer
[ ] Emoji Picker
[ ] Sticker Picker
```

---

# 80. Phase 6 — Responsive

```text
[ ] Desktop
[ ] Laptop
[ ] Tablet
[ ] Mobile
[ ] Small Mobile
[ ] Landscape
[ ] Touch behavior
[ ] Virtual keyboard behavior
```

---

# 81. Phase 7 — Accessibility

```text
[ ] Keyboard
[ ] Focus
[ ] Contrast
[ ] Labels
[ ] ARIA
[ ] Reduced motion
[ ] Touch targets
```

---

# 82. Phase 8 — Visual Polish

```text
[ ] Hover animations
[ ] Press animations
[ ] Transitions
[ ] Skeleton polish
[ ] Empty states
[ ] Error states
[ ] Success states
[ ] Shadows
[ ] Borders
[ ] Icon alignment
[ ] Pixel-level spacing
```

---

# 83. Visual QA

Каждый экран проверять минимум в:

```text
1280×720
1440×900
1920×1080
1024×768
768×1024
390×844
375×812
360×800
320×568
```

---

# 84. QA Checklist

```text
[ ] нет наложения окон
[ ] нет выхода элементов за viewport
[ ] нет горизонтального overflow
[ ] нет двойных scrollbar
[ ] нет обрезанного текста
[ ] нет слишком больших buttons
[ ] нет чрезмерных padding
[ ] единая высота controls
[ ] единые радиусы
[ ] единая typography
[ ] единые icons
[ ] единый spacing
[ ] корректный z-index
[ ] корректный focus
[ ] корректный hover
[ ] корректный active
[ ] корректный disabled
[ ] корректный loading
[ ] корректный error
[ ] корректный responsive
```

---

# 85. Regression Rules

После изменения базового компонента обязательно проверить все места его использования.

Например:

```text
Button change
   ↓
Search
Profile
Settings
Chat
Modal
Notifications
```

Нельзя считать изменение готовым, пока не проверены все consumers.

---

# 86. Definition of Done — Component

Компонент готов, если:

```text
[ ] есть Design Token integration
[ ] есть variants
[ ] есть sizes
[ ] есть states
[ ] есть responsive behavior
[ ] нет overflow
[ ] нет layout shift
[ ] есть accessibility
[ ] нет duplicate implementation
[ ] визуально согласован с Design System
```

---

# 87. Definition of Done — Screen

Экран готов, если:

```text
[ ] layout стабилен
[ ] spacing стабилен
[ ] typography стабилизирована
[ ] controls стандартизированы
[ ] overlays работают
[ ] scroll работает
[ ] overflow отсутствует
[ ] responsive работает
[ ] keyboard navigation работает
[ ] states реализованы
[ ] loading реализован
[ ] error реализован
[ ] empty state реализован
[ ] visual QA пройден
```

---

# 88. Commercial Product Definition of Done

Mess&Anger считается визуально готовым к коммерческому использованию, когда:

```text
[ ] вся UI система унифицирована
[ ] нет ad-hoc компонентов
[ ] нет случайных размеров
[ ] нет конфликтующих z-index
[ ] нет проблем с overflow
[ ] нет перекрывающихся окон
[ ] кнопки имеют правильную иерархию
[ ] интерфейс имеет правильную плотность
[ ] mobile UX полноценный
[ ] desktop UX полноценный
[ ] все состояния компонентов предусмотрены
[ ] accessibility проверена
[ ] визуальная регрессия проверена
[ ] Design System документирована
```

---

# 89. Что НЕ делать

```text
❌ не увеличивать все кнопки ради "удобства"
❌ не создавать отдельный стиль для каждой страницы
❌ не использовать random padding
❌ не использовать random border-radius
❌ не использовать random z-index
❌ не создавать бесконечные nested modals
❌ не делать каждый action primary
❌ не показывать все message actions постоянно
❌ не использовать body scroll внутри сложного app shell
❌ не исправлять overlap увеличением z-index без поиска причины
❌ не решать responsive через десятки локальных media queries
❌ не создавать duplicate components
❌ не использовать разные icon systems без причины
❌ не делать огромные карточки без информационной необходимости
❌ не добавлять анимации ради анимации
```

---

# 90. Главный принцип исправления наложений

Нельзя исправлять:

```text
element overlaps
      ↓
z-index: +100000
```

Сначала определить:

```text
1. кто создаёт stacking context
2. кто владеет позиционированием
3. кто владеет scroll
4. какой элемент должен быть выше
5. должен ли элемент вообще находиться в этом DOM layer
```

Только после этого менять z-index.

---

# 91. Главный принцип исправления больших элементов

Нельзя просто:

```text
button width: smaller
```

Необходимо определить:

```text
Purpose
Priority
Density
Content
Icon
Screen
Device
State
```

После этого выбрать:

```text
XL
LG
MD
SM
XS
```

---

# 92. UX Hierarchy

На каждом экране должна существовать визуальная иерархия:

```text
Primary information
      ↓
Secondary information
      ↓
Primary action
      ↓
Secondary actions
      ↓
Utility actions
```

Если все элементы визуально одинаково заметны — экран считается перегруженным.

---

# 93. Information Density

Для каждого экрана определить:

```text
Content density
Control density
Whitespace
Visual emphasis
```

Цель:

> максимально полезная информация при минимальном визуальном шуме.

---

# 94. Component Inventory

Перед рефакторингом создать inventory:

```text
[ ] все buttons
[ ] все inputs
[ ] все selects
[ ] все checkboxes
[ ] все switches
[ ] все tabs
[ ] все cards
[ ] все modals
[ ] все drawers
[ ] все popovers
[ ] все dropdowns
[ ] все tooltips
[ ] все toasts
[ ] все avatars
[ ] все badges
[ ] все message components
```

Каждый найденный компонент сопоставить с Design System.

---

# 95. Duplicate Component Elimination

Если существуют:

```text
Button.tsx
CustomButton.tsx
PrimaryButton.tsx
ActionButton.tsx
SmallButton.tsx
```

необходимо определить:

```text
base component
variants
sizes
```

и сократить дублирование.

---

# 96. CSS / Styling Rules

Не допускать:

```text
random inline styles
duplicate magic numbers
duplicate colors
duplicate radii
duplicate shadows
```

Использовать:

```text
tokens
variables
variants
shared utilities
```

---

# 97. Layout Rules

Предпочтительно:

```text
flex
grid
container
gap
max-width
min-width
```

Осторожно использовать:

```text
absolute
fixed
negative margins
hardcoded positions
```

Особенно внутри responsive UI.

---

# 98. Final Audit Matrix

Для каждого экрана создать:

```text
Screen
Component
Problem
Severity
Current behavior
Expected behavior
Design token
Required change
Responsive rule
State coverage
QA status
```

---

# 99. Final Implementation Order

```text
1. Audit existing UI
2. Inventory components
3. Create Design Tokens
4. Normalize typography
5. Normalize colors
6. Normalize spacing
7. Normalize radius
8. Normalize icons
9. Rebuild buttons
10. Rebuild inputs
11. Rebuild controls
12. Rebuild overlay system
13. Fix z-index
14. Fix overflow
15. Fix scrolling
16. Refactor app shell
17. Refactor sidebar
18. Refactor chat
19. Refactor message UI
20. Refactor composer
21. Refactor profile
22. Refactor contacts
23. Refactor groups
24. Refactor channels
25. Refactor calls
26. Refactor media viewer
27. Refactor emoji/stickers
28. Refactor notifications
29. Refactor settings
30. Responsive pass
31. Accessibility pass
32. Animation pass
33. Visual QA
34. Regression QA
35. Final Design System freeze
```

---

# 100. Final Result

После реализации Mess&Anger должен перейти от:

```text
разрозненные компоненты
+
разные размеры
+
большие кнопки
+
случайные отступы
+
конфликтующие окна
+
overflow
+
разные стили
```

к:

```text
                 MESS&ANGER UI SYSTEM
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       TOKENS        COMPONENTS      LAYOUT
          │              │              │
     Typography      Buttons        App Shell
     Colors          Inputs         Sidebar
     Spacing         Controls       Chat
     Radius          Overlays       Panels
     Shadows         Cards          Mobile
     Icons            Messages      Desktop
          │              │              │
          └──────────────┼──────────────┘
                         │
                  CONSISTENT UX
                         │
                  RESPONSIVE UI
                         │
                   VISUAL QA
                         │
                COMMERCIAL PRODUCT
```

Ключевой результат:

> Mess&Anger должен иметь одну визуальную систему, в которой кнопка, окно, меню, input, карточка, сообщение или любой другой компонент ведут себя одинаково предсказуемо на любом экране и любом размере устройства.

---

# 101. Final Audit Checklist

```text
FOUNDATION
[ ] Design tokens
[ ] Typography
[ ] Colors
[ ] Spacing
[ ] Radius
[ ] Shadows
[ ] Icons
[ ] Breakpoints

CONTROLS
[ ] Buttons
[ ] Icon buttons
[ ] Inputs
[ ] Selects
[ ] Checkbox
[ ] Radio
[ ] Switch
[ ] Slider
[ ] Tabs
[ ] Badges

OVERLAYS
[ ] Tooltip
[ ] Dropdown
[ ] Popover
[ ] Context menu
[ ] Modal
[ ] Drawer
[ ] Bottom sheet
[ ] Toast
[ ] Layer manager
[ ] Focus manager
[ ] Scroll lock

MESSENGER
[ ] Sidebar
[ ] Chat list
[ ] Chat header
[ ] Messages
[ ] Reactions
[ ] Replies
[ ] Forward
[ ] Attachments
[ ] Composer
[ ] Voice

PRODUCT
[ ] Profile
[ ] Contacts
[ ] Groups
[ ] Channels
[ ] Calls
[ ] Settings
[ ] Notifications
[ ] Media viewer
[ ] Emoji picker
[ ] Sticker picker

RESPONSIVE
[ ] Desktop
[ ] Laptop
[ ] Tablet
[ ] Mobile
[ ] Small mobile
[ ] Landscape
[ ] Keyboard

QUALITY
[ ] Accessibility
[ ] Animation
[ ] Empty states
[ ] Loading states
[ ] Error states
[ ] Success states
[ ] Overflow audit
[ ] Z-index audit
[ ] Regression audit
[ ] Final visual QA
```

---

# 102. Итоговая цель

Не просто сделать интерфейс "красивее".

Цель:

```text
LESS VISUAL NOISE
+
BETTER INFORMATION HIERARCHY
+
COMPACT CONTROLS
+
CONSISTENT COMPONENTS
+
PREDICTABLE OVERLAYS
+
CORRECT SCROLL
+
NO OVERFLOW
+
RESPONSIVE BEHAVIOR
+
ACCESSIBILITY
+
MICRO-INTERACTIONS
=
PROFESSIONAL MESSENGER UI/UX
```

Этот документ является master-планом визуального рефакторинга. Реализация должна выполняться сверху вниз: Design System → компоненты → overlay/layout infrastructure → экраны → responsive → QA. Не следует исправлять отдельные страницы вручную до стабилизации базовой системы.
