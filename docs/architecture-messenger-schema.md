# Messenger Architecture Schema

## Purpose

This schema describes the current messenger client structure after the modular refactor. It is the map to use for future UI, resilience, and performance work.

## High-Level Flow

```text
src/main.tsx
  -> ErrorBoundary
  -> I18nProvider
  -> App
      -> AppAuthGate
          -> AppShell
              -> AppSideList
              -> AppMainContent
                  -> ChatWorkspace | FeatureViews | ContentView
          -> AppOverlays
      -> CallOverlay
```

`CallOverlay` mounts as a sibling AFTER `AppAuthGate` (not inside it): the incoming-call ring must keep rendering above the app lock screen (`AppLockScreen`) so calls can be answered without unlocking (2026-09-15).

## State Ownership

### `src/App.tsx`

Owns application state and orchestration only:

- theme and language state
- boot-time appearance sync (`useAppearanceEffects` → `documentElement`: accent/chat-bg/density/radius/animation; `useAppSettings` mirrors `data-font-size`)
- current view and active chat
- message input, draft, reply, schedule, voice, sticker, and filter state
- contact profile and edit modal state
- derived lists and hub badge counts
- message send/update/profile handlers

`App.tsx` should not grow with new UI blocks. New screens should become components and be wired into `FeatureViews`, `ChatWorkspace`, or `AppOverlays`.

### `src/config/*` + `src/constants/*` (config layer)

Static, app-wide values live outside components so they are not hardcoded in JSX/hooks:

- `src/config/app.ts` — public-surface URLs (`APP_HOME_URL`, `MESSENGER_WEB_BASE`, `INVITE_SHORT_BASE`, `EMBED_WIDGET_URL`, `channelInviteLink`, `groupInviteUrl`)
- `src/config/paymento.ts` — payments backend base + gateway URLs
- `src/config/signalling.ts` — signalling seed URLs
- `src/config/integrations.ts` — `/api/v1/integrations` path builder
- `src/constants/*` — UI/font/company/crm/landing/chat/settings constants and deadline-stage tables
- `src/constants.ts` — barrel re-exporting storage keys, mock data, language/sticker tables, DND/priority helpers

### `src/store/index.ts`

Zustand store owns persisted app data:

- chats, channels, bots, contacts
- archived state and receipts
- call state
- radial menu toggles and sound volume
- encrypted IndexedDB storage

### `src/lib/i18n.tsx`

Owns localization:

- language detection
- locale loading
- translation hook
- language persistence

## UI Modules

### `src/components/app/*`

Owns top-level layout and shell pieces:

- `AppShell.tsx` - root shell (grid layout, side list, main content, overlays)
- `AppChrome.tsx` - toasts (sonner), transport indicator, dark glow
- `AppAuthGate.tsx` - auth/registration gate wrapping the app
- `AppLockScreen.tsx` - PIN app-lock screen
- `AppMainContent.tsx` - main content scroll container
- `AppSideList.tsx` - sidebar chat/contact list
- `AppOverlays.tsx` - modals, floating call widget, contact editor
- `CallOverlay.tsx` - active call overlay
- `ContentView.tsx` - non-hub screen shell
- `AdvancedFilterModal.tsx` - advanced chat-filter modal

The barrel `src/components/AppChrome.tsx` (components root) re-exports `AdvancedFilterModal`, `StoryViewer`, `StoryComposer`.

Known F2 limitation: `StoryViewer.sendReply` (`src/components/stories/StoryViewer.tsx:178-182`, wired via `StoryFooter` at `src/components/stories/StoryViewer.tsx:247`) is toast-only — it clears the local reply state and shows `story.replySent`, but does not persist a story reply to idb/store. Documented accepted limitation for this audit pass.

### `src/components/chat/*`

Owns chat list and active chat composition:

- `ChatWorkspace.tsx` - chooses list or active chat
- `ChatListWorkspace.tsx` - list view adapter
- `ActiveChatWorkspace.tsx` - active chat adapter for preview and input overlay

### `src/components/features/*`

Owns feature screen routing and feature modules:

- `FeatureViews.tsx` - switch over `profile`, `settings` (subviews: recordings, callLog, radar), `contacts`, `calls` (callLog), `company`, `bot`, `miniApp`, `workplace`
- `workplace/*` - `WorkplaceView.tsx` team workspace (tasks, automation, analytics, moderation, knowledge base, payments) — routed via `case "workplace"` in `FeatureViews`
- `bot/*` - bot mini-app surfaces: `MiniAppView`, `BotProfileView`, `InlineKeyboard`, `BotCommandList`

### `src/components/ui/*`

Owns reusable visual primitives:

- buttons and icon buttons
- avatars
- modals, dialogs, and forms
- settings rows and toggles
- search inputs
- skeletons, data/empty states, toasts
- waveform and glow primitives

### `src/components/resilience/*`

Owns runtime failure containment:

- `ErrorBoundary.tsx` - safe render wrapper
- `SafeRender.tsx` - reusable boundary around risky sections

### `src/components/chat-preview/*`

Owns chat-preview layer internals: `ChatHeader`, `ChatListItem`, `ChatListBots`, `ChatMessage`, `ChatInputArea` (reply/schedule/voice-error parts), message actions/reactions/context menus, pinned/saved/scheduled bars, `NotificationCenter`, search, view tabs.

### `src/components/auth/*`

Login and registration screens.

### `src/components/call/*`

Call screen, call controls and top bar, group participants, incoming-call sheet, call log.

### `src/components/company/*`

Company profile, members, departments, invites, team inbox.

### `src/components/contacts/*`

Contact item and contact form fields.

### `src/components/crm/*`

CRM view: deals, tasks, people, roles, import/export.

### `src/components/ecochat/*`

Eco sidebar navigation.

### `src/components/embed/*`

Embeddable widget.

### `src/components/huddle/*`

Huddle widget.

### `src/components/integrations/*`

Integrations panels: connect form, health, logs, mapping, conflicts.

### `src/components/landing/*`

Landing page sections (hero, features, CTA, footer).

### `src/components/lock/*`

Lock screen.

### `src/components/navigation/*`

Bottom nav and sidebar nav.

### `src/components/payments/*`

Payment request cards and payment chat picker.

### `src/components/recordings/*`

Recording player.

### `src/components/settings/*`

Settings sections: profile, security, devices, storage, network, spam, premium, backups.

### `src/components/status/*`

Offline banner and transport indicator.

### `src/components/stories/*`

Story viewer and composer.

### `src/components/SystemPulsePlayer/*`

System Pulse radio player: top bar, playlist, stations, video overlay.

### Components root (`src/components/*.tsx`)

Cross-cutting views not yet grouped into a folder: `ChatPreviewLayer`, `ChatProfileView`, `ChatListView`, `ChatMessageList`, `ChatPreviewOverlays`, `ContactProfileModal`, `ContactsView`, `CompanyContactsView`, `ContactCreateEditModal`, `CreateBotModal`, `CreateChannelModal`, `CreateGroupModal`, `GlobalSearch`, `MediaViewer`, `MeshRadar`, `MorseDecoder`, `ProfileView`, `RecordingsScreen`, `SettingsView`, `SystemPulsePlayer`, `SafetyNumberModal`, `FloatingCallWidget`, `ChannelCommentsView`, `LiveVoiceRecorder`, `QrCode`, `Tooltip`.

## Feature Interaction Rules

1. Feature screens receive state and callbacks from `App.tsx`.
2. Feature screens must not directly import `App.tsx`.
3. Shared app state changes go through `App.tsx` handlers or `useAppStore`.
4. Modals stay in `AppOverlays` unless they are local to one feature.
5. New top-level routes go into `FeatureViews`.
6. New chat-specific UI goes into `src/components/chat/*`.
7. New layout/chrome UI goes into `src/components/app/*`.

## Runtime Resilience

- Root render is wrapped in `ErrorBoundary`.
- Hub, chat workspace, and feature views are wrapped in `SafeRender`.
- `main.tsx` installs `window.error` and `unhandledrejection` guards.
- Recoverable storage decrypt failures return `null` and create a fresh session instead of stopping the app.

## Performance Direction

- Keep `App.tsx` as orchestration, not UI implementation.
- Keep feature components small and route-specific.
- Split large files when one file owns multiple unrelated UI blocks.
- Prefer direct imports for heavy modules to avoid circular chunk warnings.
- Keep global controls fixed and out of document flow.
- Keep mobile-specific spacing in layout components, not inside feature internals.
