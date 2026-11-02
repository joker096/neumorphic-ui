# Components — MessAndanger

> Артефакт по брифу `docs/telegram_like_chat.md` §18.1 (components.md) и §8 (компонентная библиотека).
> Соответствие брифу §8 указано как `brief §8.x`.
> Таблица отражает **только существующие файлы**; отсутствующие по брифу компоненты вынесены в §3 с пометкой ❌,
> чтобы не выдавать нереализованное за готовое.

## 1. UI-примитивы (`src/components/ui/`)

| Компонент | brief | Файл (строк) | Статус | Назначение |
|---|---|---|---|---|
| `Avatar` | §8.1 | `ui/Avatar.tsx` (64) | ✅ | аватар с presence/verified/muted/archive badges |
| `Button` | — | `ui/Button.tsx` (78) | ✅ | базовая кнопка (варианты размера/тона/иконки) |
| `IconButton` | — | `ui/IconButton.tsx` (64) | ✅ | квадратная иконная кнопка, хит-зона ≥44px |
| `BackButton` / `CloseButton` | — | `ui/BackButton.tsx` (54), `ui/CloseButton.tsx` (34) | ✅ | навигация «назад» / закрытие оверлея |
| `Modal` | §8.8 | `ui/Modal.tsx` (136) + `ui/modalShared.tsx` (141) | ✅ | портал, focus-trap, Escape, `modalOverlay` для 25 модалок |
| `FormModal` / `ConfirmDialog` | §8.9 | `ui/FormModal.tsx` (103), `ui/ConfirmDialog.tsx` (79) | ✅ | форма в модалке / подтверждение действия |
| `AppModal` / `InviteQRModal` | — | `ui/AppModal.tsx` (42), `ui/InviteQRModal.tsx` (100) | ✅ | обёртка модалки / QR приглашения |
| `FormField` / `FormActions` | §8.5 | `ui/FormField.tsx` (113), `ui/FormActions.tsx` (66) | ✅ | поле формы с подписью и ошибкой / футер кнопок |
| `SearchInput` | §8.7 | `ui/SearchInput.tsx` (172) | ✅ | поле поиска; список чатов использует `ChatListSearchHeader` |
| `SettingsRow` | §8.3 | `ui/SettingsRow.tsx` (146) | ✅ | строка настроек + `SettingsToggleRow` (stopPropagation на тумблере) |
| `ToggleSwitch` | — | `ui/ToggleSwitch.tsx` (56) | ✅ | тумблер (трек `--color-success` / `--text-tertiary`) |
| `SubView` | — | `ui/SubView.tsx` (41) | ✅ | подэкран настроек с заголовком и «назад» |
| `DataState` | §16.2 | `ui/DataState.tsx` (163) | ✅ | единый компонент для 9 состояний (loading/loaded/empty/error/offline/partial/unauthorized/restricted/deleted) |
| `States` | §8.10, §8.11 | `ui/States.tsx` (81) | ✅ | `EmptyState` / `ErrorState` (message/retry/code) |
| `Skeleton` | §8.12 | `ui/Skeleton.tsx` (22) | 🟡 | скелетон строк; **покрытие неполное** — используется только в рабочем месте (`features/workplace/tabs.tsx` ×5, `WorkplaceView.tsx`), в списке чатов и профиле нет `loading`-ветки (данные берутся синхронно из стора) |
| `Toast` | §5.12 | `ui/Toast.tsx` (38) | ✅ | тосты; основной механизм — `sonner` (35 вызовов) |
| `Tooltip` | — | `Tooltip.tsx` | ✅ | портал-тултип с `role="tooltip"`, `aria-describedby`, авто-флипом и Escape |
| `QrCode` | — | `QrCode.tsx` | ✅ | генерация QR (без внешней либы) |
| `OnboardingPanel` | — | `ui/OnboardingPanel.tsx` (79) | ✅ | первый запуск |
| `SwipeDismissPanel` | — | `ui/SwipeDismissPanel.tsx` (71) | ✅ | свайп-закрытие нижних панелей |

## 2. Доменные компоненты

| Компонент | brief | Файл (строк) |
|---|---|---|
| `MessageBubble` | §8.4 | `chat-preview/ChatMessage.tsx` (297), состояние бабла — `message/useMessageBubble.ts` |
| `InputBar` | §8.5 | `chat-preview/ChatInputArea.tsx` (297) + `DmComposerRow` / `ChannelComposer` / `ComposerToolbar` / `ChatAttachLayer` |
| `ChatListView` | §5.3 | `ChatListView.tsx` (276) + `chat-list/ChatListPinnedSection` / `ChatListDialogs` |
| `ChatMessageList` | §5.4 | `ChatMessageList.tsx` (144) + `message/useMessageBubble.ts` |
| `ChatProfileView` | §5.5 | `chat-profile/ChatProfileView.tsx` (249) + `ChatProfileHeader` / `ChatProfileBody` |
| `GlobalSearch` | §5.6 | `GlobalSearch.tsx` (169) + `search/SearchResults.tsx` (221) |
| `ContactsView` | §5.7 | `ContactsView.tsx` (258) |
| `CallLogView` / Call UI | §5.8 | `call/*`, `FloatingCallWidget.tsx` |
| `MediaViewer` | §5.11 | `MediaViewer.tsx` (253) + `useMediaViewerGestures` / `MediaViewerVideoOverlay` / `MediaViewerActionBar` |
| `Stories` | §5.9 | `features/stories/*` (просмотрщик, композер, лента) |
| `SettingsView` | §5.10 | `SettingsView.tsx` (13) — тонкая обёртка над `settings/SettingsSectionContent` |
| `LiveVoiceRecorder` | §5.4 | `LiveVoiceRecorder.tsx` (214) |
| `SystemPulsePlayer` | §4.1 | `SystemPulsePlayer/*` |

## 3. Отсутствующие по брифу примитивы (НЕ реализованы как отдельные компоненты)

| Компонент | brief | Фактическое состояние |
|---|---|---|
| `Badge` | §8.2 | ❌ отдельного компонента нет. Бейджи непрочитанного/упоминаний — CSS-класс `.badge` / `.badge.unread` / `.badge-muted` в `styles/messenger.css` |
| `ListItem` | §8.3 | ❌ отдельного компонента нет. Строки списков — `chat-list/*` и общие класс-константы `LIST_ROW_CLASS` / `PADDED_ROW_CLASS` (`ui/rowClasses.ts`), `ChatListItemSwipeActions` для свайп-ящиков |
| `TopBar` | §8.6 | ❌ как UI-примитив отсутствует. Заголовки экранов собираются на месте (`ChatHeader`, заголовки разделов настроек); `SystemPulsePlayer/TopBar.tsx` — шапка плеера, не общий компонент |
| `ActionSheet` / BottomSheet | §8.8 | ❌ отдельных компонентов нет. Нижние шторки — ветки внутри `ChatContextMenu` / `MessageContextMenu` и `modalShared` |

> Выносить эти четыре примитива в код имеет смысл только при появлении второго-третьего потребителя;
> сейчас каждый из них заменён класс-константами или локальной разметкой, и выделение компонентов
> добавило бы слой без выгоды (§1.2 — атомарность по факту переиспользования, а не формально).

## 4. Рекомендации (бриф §1.2)

- ~~Вынести `MessageBubble`, `InputBar`, `Avatar`, `Badge`, `ListItem` в атомарные компоненты `< 300 строк`~~ —
  **выполнено**: все модули проекта < 300 строк (`component-audit` oversize 0), `ChatListView` 276,
  `ChatMessageList` 144, `ChatMessage` 297, `ChatInputArea` 297.
- Унифицировать `Skeleton` по всем экранам (бриф §8.12, §15.1) — **открыто**, см. §1: нужен `loading`-путь
  там, где данные станут асинхронными; сейчас единственная асинхронная поверхность — рабочее место.
- Документировать props/states каждого компонента (JSDoc/TSDoc) — **частично**: JSDoc есть у хуков и
  класс-констант, у крупных доменных компонентов документируются только нестандартные решения.
