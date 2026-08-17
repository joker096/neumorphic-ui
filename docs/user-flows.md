# User Flows — MessAndanger

> Артефакт по брифу `docs/telegram_like_chat.md` §18.1 (user-flows.md).
> Покрыты ключевые сценарии брифа §14.

## 1. Открытие приложения → список чатов (§14.1)

`lock/unlock` → `hub` (ChatListView) →
- кэш чатов из `localStorage`/`idb`
- unread badge (per chat + folder)
- folder tabs: `all | personal | work | channels | bots | archived`
- search entry (`ChatListSearchHeader`)
- FAB «новое сообщение»

## 2. Открытие диалога и отправка (§14.2)

`ChatListView` tap chat → `ChatMessageList` + `ChatInputOverlay` →
- ввод текста, emoji picker, attach menu
- send → optimistic `queued → sending → sent → delivered → read` (бриф §9.1)
- ошибка → `failed` + retry

## 3. Reply (§14.3)

long-press message → context menu → Reply →
- reply preview bar в input
- tap по цитате → scroll к исходному сообщению

## 4. Edit (§14.4)

context menu → Edit → edit bar → `edited` label

## 5. Forward (§14.5)

selection mode (long-press) → Forward → forward sheet → выбор чата → `forwarded`

## 6. Delete (§14.6)

context menu → Delete → destructive confirm → placeholder + undo (`useUndoDelete.ts`)

## 7. Управление уведомлениями (§14.7)

chat list swipe / context menu → Mute/Unmute → badge update; exceptions в `SettingsView → Notifications`

## 8. Поиск (§14.8)

- Global: `GlobalSearch.tsx` (чаты/контакты/сообщения)
- ❌ In-chat: search по сообщениям внутри диалога — НЕ РЕАЛИЗОВАНО

## 9. Профиль (§14.9)

`ChatProfileView.tsx` → media/files/links tabs, notifications, block/report/leave, system modules (если применимо)

## 10. Системная фича (§14.10)

placement из `feature-mapping.json` → нативное размещение → loading/error/success

## 11. Offline (бриф §9.5)

- просмотр кэша, запись в очередь (`messageQueue.ts`)
- offline banner, auto-retry при онлайне

## 12. Звонок (§5.8)

`calls` → incoming overlay / active call (`call/*`, `FloatingCallWidget.tsx`) → PiP, mute/speaker/video/end
