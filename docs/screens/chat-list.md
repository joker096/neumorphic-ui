## Chat List

- **View/Route:** `hub`, `chats`, `channels`, `bots` (`useAppView.ts`)
- **Purpose:** Быстрый доступ к диалогам, каналам, ботам; навигация и действия.
- **Elements:**
  - `ChatListSearchHeader` — поиск (фильтр списка), create-channel/create-bot FAB
  - Folder tabs: All / Personal / Work / Channels / Bots / Archived (`useFilteredChats.ts`, `activeFolder`)
  - `AvatarRow` (stories) при `view=chats|stories`
  - `ListItem` строки чата: avatar, title, preview, time, unread badge, mute/pin/verified icons
  - Pinned section, Archive entry
- **States:** loading (lazy) / loaded / empty / error / offline (banner) / partial
- **Gestures:** tap → open; long-press → context menu; swipe row → quick actions (mute/read/archive)
- **A11y:** `aria-label` на search/actions; ❓ tab-order; 🟡 hit-targets
- **Data-source:** `useAppStore` chats/contacts/channels; localStorage кэш
- **Gaps (бриф §5.3):** verified badge для каналов ❓; drag-reorder pinned ❓; custom system badges 🟡
