# Components — MessAndanger

> Артефакт по брифу `docs/telegram_like_chat.md` §18.1 (components.md) и §8 (компонентная библиотека).
> Соответствие брифу §8 указано как `brief §8.x`.

## UI-примитивы (`src/components/ui/`)

| Компонент | brief | Статус | Назначение |
|---|---|---|---|
| `Avatar` | §8.1 | ✅ | аватар с presence/verified/muted/archive badges |
| `Badge` | §8.2 | ✅ | unread/mention/muted/error |
| `ListItem` | §8.3 | ✅ | чаты/контакты/настройки/участники (states: default/hover/pressed/selected/dragging/disabled) |
| `TopBar` | §8.6 | ✅ | заголовок экрана (title/subtitle/avatar/actions/loading) |
| `SearchBar` | §8.7 | ✅ | `ChatListSearchHeader` (query/placeholder/loading) |
| `ActionSheet` / BottomSheet | §8.8 | ✅ | `ui/Sheet*` / `ActionSheet` |
| `ContextMenu` | §8.9 | ✅ | long-press меню сообщения/чата |
| `EmptyState` | §8.10 | ✅ | `ui/States` (icon/title/description/action) |
| `ErrorState` | §8.11 | ✅ | `ui/States` (message/retry/code) |
| `DataState` | §16.2 | ✅ | `ui/DataState` — единый компонент для всех 9 состояний (loading/loaded/empty/error/offline/partial/unauthorized/restricted/deleted) + `useAsyncState` hook |
| `Skeleton` | §8.12 | 🟡 | list/chat/profile скелетоны (покрытие неполное) |
| `Tooltip` | — | ✅ | `Tooltip.tsx` |
| `QrCode` | — | ✅ | `QrCode.tsx` |
| `Toast/Snackbar` | §5.12 | ✅ | `sonner` |

## Доменные компоненты

| Компонент | brief | Файл |
|---|---|---|
| `MessageBubble` | §8.4 | `chat/ChatMessage.tsx` |
| `InputBar` | §8.5 | `ChatInputOverlay.tsx` |
| `ChatListView` | §5.3 | `ChatListView.tsx` |
| `ChatMessageList` | §5.4 | `ChatMessageList.tsx` |
| `ChatProfileView` | §5.5 | `ChatProfileView.tsx` |
| `GlobalSearch` | §5.6 | `GlobalSearch.tsx` |
| `ContactsView` | §5.7 | `ContactsView.tsx` |
| `CallLogView` / Call UI | §5.8 | `call/*`, `FloatingCallWidget.tsx` |
| `MediaViewer` | §5.11 | `MediaViewer.tsx` |
| `Stories` | §5.9 | `stories/*`, `AvatarRow.tsx` |
| `SettingsView` | §5.10 | `SettingsView.tsx` + `settings/*` |
| `LiveVoiceRecorder` | §5.4 | `LiveVoiceRecorder.tsx` |
| `SystemPulsePlayer` | §4.1 | `SystemPulsePlayer/*` |

## Рекомендации (бриф §1.2)

- Вынести `MessageBubble`, `InputBar`, `Avatar`, `Badge`, `ListItem` в строго атомарные компоненты `< 300 строк` (сейчас `ChatListView.tsx`, `ChatMessageList.tsx` крупные — кандидаты на разбиение).
- Унифицировать `Skeleton` по всем экранам (бриф §8.12, §15.1).
- Документировать props/states каждого компонента (JSDoc/TSDoc).
