## Conversation Screen

- **View/Route:** overlay/content при `activeChat` (`ChatMessageList.tsx` + `ChatInputOverlay.tsx`)
- **Purpose:** Переписка: чтение, отправка, управление сообщениями.
- **Elements:**
  - TopBar: back, avatar, title, status (online/typing/members), call actions, search, menu
  - `ChatMessageList`: date separators, unread divider, grouped bubbles, reactions
  - Scroll-to-bottom button с unread badge
  - Reply/Edit bar
  - `ChatInputOverlay`: attach, text (multiline auto-expand), emoji/modules, voice/video note, send
  - Attachment sheet, ContextMenu, Selection mode, Forward panel
- **Message types (бриф §5.4):** text/reply/forwarded/edited/image/video/file/voice/video_note/location/contact/link_preview/poll/bot/custom_card — 🟡 (часть через store types; проверить рендер всех)
- **Send lifecycle (бриф §9.1):** queued → sending → sent → delivered → read → failed+retry ✅
- **States:** loading / loaded / empty / error / offline (queue) / partial
- **A11y:** 🟡 focus, reduced-motion ✅
- **Gaps (бриф §5.4):** ✅ in-chat search (фильтр+подсветка+типы+дата); ❌ per-message translate (missing_context: нет сервиса); 🟡 bot keyboard / mini-app (нет runtime); 🟡 saved/collection
