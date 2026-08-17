# Sitemap — MessAndanger (mess-andanger)

> Артефакт по брифу `docs/telegram_like_chat.md` §18.1.
> Источник истины: `src/hooks/useAppView.ts` (`AppView` union), `src/App.tsx`, `src/components/app/*`.
> Статусы: ✅ реализовано · 🟡 частично/заглушка · ❌ отсутствует.

## 0. Топ-уровень (AppView)

| View | Экран | Статус | Файл |
|---|---|---|---|
| `hub` | Главная оболочка / список чатов | ✅ | `app/AppShell.tsx`, `ChatListView.tsx` |
| `chats` | Лента чатов (private/groups) | ✅ | `ChatListView.tsx` |
| `channels` | Каналы | ✅ | `ChatListView.tsx` (view=channels) |
| `bots` | Боты | ✅ | `ChatListView.tsx` (view=bots) |
| `radar` | Mesh Radar (p2p/peers) | ✅ | `features/FeatureViews.tsx` |
| `pulse` | SystemPulsePlayer | ✅ | `SystemPulsePlayer/*` |
| `calls` | Журнал звонков | ✅ | `call/CallLogView.tsx` |
| `settings` | Настройки | ✅ | `SettingsView.tsx` |
| `profile` | Профиль пользователя | ✅ | `ProfileView.tsx` |
| `contacts` | Контакты | ✅ | `ContactsView.tsx` |
| `stories` | Сторис (лента) | ✅ | `stories/*`, `AvatarRow` |
| `recordings` | Записи звонков | ✅ | `recordings/*`, `RecordingsScreen.tsx` |
| `company` | Компания / B2B контакты | ✅ | `CompanyContactsView.tsx` |

## 1. Auth / Onboarding

| Экран | Статус | Файл |
|---|---|---|
| Вход / регистрация / lock | ✅ | `auth/*`, `lock/*`, `useAppLock.ts` |
| Passcode / biometric | ✅ | `lock/*`, `useIdentityAuth.ts` |

## 2. Conversation Screen (оверлей/контент)

- `ChatMessageList.tsx` — лента сообщений ✅
- `ChatInputOverlay.tsx` — поле ввода ✅
- `ChatProfileView.tsx` — профиль чата/группы/канала ✅
- Контекстное меню сообщения, reply/edit/forward/delete/reactions/selection ✅ (см. `useMessageActions.ts`)
- Scroll-to-bottom, unread divider, date separators ✅

## 3. Global Search

- `GlobalSearch.tsx` ✅ — глобальный поиск (чаты/контакты/сообщения)
- Поиск **внутри диалога** (in-chat message search) ✅ — `useChatPreviewState` + `SearchBar` + `FormattedText`

## 4. Media Viewer

- `MediaViewer.tsx` ✅ — photo/video/file/audio

## 5. Overlay Layers

- ContextMenu ✅ · ActionSheet/BottomSheet ✅ · Modal ✅ · Toast/Snackbar (`sonner`) ✅
- Loading/Error/Empty states — ✅ единый `ui/DataState` (§16.2) на ключевых экранах

## 6. Системные модули (System Feature Containers, бриф §4.1 / §13)

| Модуль | Статус | Заметка |
|---|---|---|
| AI Assistant (Nexus) | 🟡 | упоминается в mockData, полноценный UI-контейнер не найден |
| Payments | 🟡 | только `settings/PaymentsSection` (тумблеры), нет in-chat flow |
| CRM | 🟡 | только поля в `ContactFormFields` |
| Tasks | ❌ | отсутствует |
| Automation | ❌ | отсутствует |
| Analytics | ❌ | отсутствует (дашборд каналов) |
| Moderation | ❌ | отсутствует |
| Knowledge Base | ❌ | отсутствует |

## 7. Прочие экраны

- `ecochat/*` — отдельный эколоадер ✅
- `commercial/*`, `huddle/*` ✅
- `status/*` ✅

## 8. Адаптив (бриф §5.2)

- Mobile (1 панель) ✅
- Tablet (2 панели) ❓ требует проверки
- Desktop (3 панели) ❓ требует проверки
