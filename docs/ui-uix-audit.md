# UI/UX Audit — Gap Analysis vs `docs/ui-uix.md`

> **Дата:** 2026-09-11  
> **Метод:** статический аудит (tokens.css, index.css, DESIGN.md, ключевые компоненты) + делегированный сквозной скан (чат/композер/состояния/токены).  
> **База:** план `docs/ui-uix.md` (§102 DoD, §100 приоритеты).  
> **Статус P0:** 0 findings — бэкенд-слои (offline queue, P2P, ErrorBoundary, DataState, 44px токены, focus-visible) уже закрыты предыдущими циклами.

Найденные проблемы отсортированы по приоритету плана. Каждый пункт: файл:строка — проблема → фикс. Проверенная валидность: `[✓]` подтверждено чтением кода, `[—]` требует проверки при фиксе.

---

## P1 — Core screens / ключевая функциональность

| # | file:line | Проблема | Фикс |
|---|-----------|----------|------|
| 1 | `src/lib/messageQueue.ts:88` + `src/hooks/useMessageActions.ts` | **Нет состояния "failed" у сообщений.** `retryMessage` существует, но вызывается только из тестов (`lib/index.ts` — реэкспорт) — ни один UI-контрол его не дёргает. `queueMessage(...).catch(() => {})` глотает ошибки. Сообщение, не доставленное при онлайне, вечно висит `sent` (или `queued` → `sent` без ack). §26/§100 «Send failures» не закрыт. [✓] | При отказе отправки / таймауте delivered-ack переводить статус в `failed`; рендерить на бабл аффорданс Retry/Copy/Delete; Retry → `retryMessage` + ресенд. |
| 2 | `src/App.tsx:75,119` + `useActiveChatWorkspace.ts` | **Drafts мёртвые.** `draftTextByChat` персистится, но при открытии чата не сидится в `messageText`, при вводе не пишется, при переключении чата текст остаётся и улетает в новый чат. §55 per-conversation draft не работает. [✓] | Effect на `activeChat.id` → `setMessageText(draftTextByChat[id] ?? "")`; onChange → запись в `setDraftTextByChat`. |
| 3 | `src/components/chat-preview/messageMenuActions.tsx:100-101` + `useChatMessageActions.ts:54-76` | **Delete одного сообщения из контекст-меню без подтверждения** (сразу `onDelete`, только тост). §92/§93 требуют ConfirmDialog для деструктива. [✓] | `ConfirmDialog` (danger, «Delete message») перед `handleDeleteMessage`. |
| 4 | `src/hooks/useChatMessageActions.ts:140-159` | Bulk Delete в `MessageSelectionBar` удаляет всё без подтверждения. [✓] | ConfirmDialog с кол-вом выбранных перед `handleDeleteSelected`. |
| 5 | `SystemPulsePlayer/*.tsx` (PlayerView:48-130, PlaylistView:100-149, EqualizerPanel:73,103, TopBar:62, AddStationModal:57,85) | **~50+ raw hex** (#5cc25c, #c25c34, #2a3036…) в className/style минуя `var(--…)`. §75/DESIGN.md «design tokens everywhere». [✓] | Определить `--player-*` токены, заменить hex. |
| 6 | `src/components/chat-preview/ChatListItem.tsx:171-391` | Raw hex в dark-ветках (#2b2f42, #38d69a, #51d7ff…). [✓] | Токены `--chat-action-bg`, `--chat-online-dot`, `--chat-unread-badge`. |
| 7 | `GlobalSearch.tsx:304`; `stories/StoryViewer.tsx:212-216`; `MediaViewer.tsx:130-137` | Fullscreen-overlay без `useBodyScrollLock` — фон скроллится. §41-42. [✓] | `useBodyScrollLock(…)` как в `Modal.tsx`/`FormModal.tsx`. |
| 8 | `src/components/chat-preview/ChatInputArea.tsx:336-354` | **Композер однострочный + Shift+Enter = silent no-op** (Pass log 09-10 заявлял «Shift+Enter=newline», но `<input type="text">` не умеет перенос). §20: auto-grow, cap ~120px, Shift+Enter=новая строка. [✓] | `<textarea rows={1}>` с авто-ростом; Enter (без Shift) = send, Shift+Enter = перенос. |

---

## P2 — Polish / консистентность

| # | file:line | Проблема | Фикс |
|---|-----------|----------|------|
| 9 | `src/components/ChatListView.tsx:182` | `active={false}` захардкожено; `activeChatId` (стр. 33) объявлен, не используется — открытый чат не подсвечен. §12 Selected state. [✓] | `active={chat.id === activeChatId}`. |
| 10 | `src/components/ChatPreviewLayer.tsx:277` | `removePinnedMessage(id)` без `chatId` → отпин того же id во всех чатах. `chatSlice.removePinnedMessage(id, chatId?)` (chatSlice.ts:221) поддерживает scope; ChatProfileView.tsx:334 делает правильно. [✓] | `removePinnedMessage(p.id, chat.id)`. |
| 11 | `src/components/chat-preview/MessageTimestamp.tsx:29-33` | Нет ветки `failed` — сообщение со статусом failed отрисовалось бы одной галочкой как ушедшее. §15. [✓] | Ветка `status === 'failed'` → красная/alert-иконка до условия sent. |
| 12 | `src/components/chat-preview/ChatMessage.tsx:187` | Бабл `w-full max-w-full` на mobile, `md:max-w-[80%]` — на <768px слишком широкий. §16. [✓] | Base `max-w-[85%]`, затем `md:max-w-[80%]`. |
| 13 | `src/components/chat-preview/ChatListItem.tsx:368-378` | Нет индикаторов draft / attachment / my-status (failed). §12. [✓] | Превью draft, иконка attachment, failed-иконка на моём последнем. |
| 14 | `src/components/chat-preview/MessageSelectionBar.tsx:26-48` | Selection toolbar рендерится ниже живого `ChatHeader`, нет Copy/Save. §90 (заменяет шапку). [✓] | Скрыть ChatHeader в selectionMode; добавить Copy + Save. |
| 15 | `src/components/SystemPulsePlayer/PlaylistView.tsx:115` | `size={28}` — единственное off-scale значение иконок (бан {9,10,11,13,15,22,26,28,30,36}). §9/DESIGN.md. [✓] | `size={32}` или `size={24}`. |
| 16 | `GlobalSearch.tsx:63` (`rounded-[3px]`); `chat-preview/AttachmentMedia.tsx:96,113` (`rounded-[14px]`) | Radius off-scale (шкала 4/8/12/16/20/24/full). §8. [✓] | `rounded-[4px]` / `rounded-[16px]`. |
| 17 | `chat-preview/MessageReactions.tsx:43`; `SystemPulsePlayer/PlaylistView.tsx:173` | `role="button"` с `focus-visible:outline-none` и только `opacity` вместо focus-индикации — невидимый keyboard focus. §47. [✓] | `focus-visible:ring-2` (как остальные интерактивы). |
| 18 | `navigation/SidebarNav.tsx:25`, `landing/LandingPage.tsx:53,160`, `chat-preview/AvatarRow.tsx:27`, `embed/EmbedWidget.tsx:88`, `chat-preview/ChatInputArea.tsx:325` (text-slate-500/700) | Raw hex/слаговые цвета вне токенов. §75. [✓] | Токены/neutral-классы темы. |
| 19 | `src/components/chat-preview/ChatHeader.tsx` (шапка чата; Fix применялся к шапке, не к `ChatInputArea.tsx`) | На 320px: back + avatar + 3 icon-кнопки в шапке — тесно. §14. [✓] | Вторичные действия (Phone/Video/Search) свёрнуты в overflow-меню «More» (`chat.more`) на <sm; на desktop инлайн. |

---

## P3 — Второстепенное (pervasive, низкий риски)

| # | file:line | Проблема | Фикс |
|---|-----------|----------|------|
| 20 | ~216 half-step классов в src/ | `gap-1.5` (73), `mt-0.5` (25), `px-1.5` (19), `py-2.5` (18), `py-1.5` (15), `gap-0.5` (7), `m-0.5` (7), `px-2.5` (6), `my-1.5` (6), `p-1.5` (5) + прочие — вне шкалы §7 (4,8,12,16,20,24,32,40,48,64). Pervasive, но визуально незаметно. [✓] | Батч-замена `.5`-шагов на ближайшие 4/8/12/16 (контекстно). |
| 21 | 10 arbitrary px (PlayerView ×6: `p-[35px]`, `p-[45px]`, `gap-[3px]`; `ViewTabs m-[13px]`; `AvatarRow p-[2px]`; `ChatListItem p-[2px]+mb-[2px]`; `NavItemButton p-[6px]`; `Avatar m-[1px]`; `GlobalSearch px-[2px]`; FeaturesSection/LandingPage `p-[1px]`) | Произвольные значения вне шкалы. §7. [✓] | Замена на токены spacing. |
| 22 | `crm/CrmDeals.tsx:78-79`; `company/ChannelList.tsx:23-27` | Empty-состояние — raw `<div>` текст, не `DataState`. §22 (консистентность с CrmPeople/CrmTasks). [✓] | `<DataState status="empty" …>`. |
| 23 | `src/components/chat-preview/BulkActionsBar.tsx:13-35` | Bulk chat-ops нет Mute. §91. [✓] | Mute/unmute bulk toggle. |

---

## Статусы (зелёные зоны — не трогать)

- **P0:** оверлеи/modals с фокус-трапом + backdrop (§41), offline queue (§25), ErrorBoundary/SafeRender (§24), 44px touch targets, focus-visible CSS, DataState 9 состояний.
- **i18n:** все 8 локалей полные; a11y-локали на месте.
- **Анимации** (`motion`, reduced-motion, tw-animate-css): соответствуют §57.
- **Скролл-позиция, pinned bar, jumpto-bottom** (§52-54): реализованы.

---

## Рекомендуемый порядок работ

1. **P1 #1 (failed/retry)** + **#2 (drafts)** — логика отправки, связаны с композером.
2. **#3/#4 confirm-диалоги** delete — dep-cy P0 безопасность UX.
3. **#8 textarea-композер** — после draft фикса.
4. **#5-#7 tokens + scroll-lock** — косметика, но нагрузка на дизайн-систему.
5. P2 батчом (механика: строковая замена, тест-регресс рядом, CHANGELOG `### Fixed`).
6. P3 — опционально, батчем CODEMOD.