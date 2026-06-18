# Messenger Architecture Schema

## Purpose

This schema describes the current messenger client structure after the modular refactor. It is the map to use for future UI, resilience, and performance work.

## High-Level Flow

```text
src/main.tsx
  -> ErrorBoundary
  -> I18nProvider
  -> App
      -> GlobalControls
      -> HubView or ContentView
          -> ChatWorkspace
          -> FeatureViews
      -> AppOverlays
```

## State Ownership

### `src/App.tsx`

Owns application state and orchestration only:

- theme and language state
- current view and active chat
- message input, draft, reply, schedule, voice, sticker, and filter state
- contact profile and edit modal state
- derived lists and hub badge counts
- message send/update/profile handlers

`App.tsx` should not grow with new UI blocks. New screens should become components and be wired into `FeatureViews`, `ChatWorkspace`, or `AppOverlays`.

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

- `GlobalControls.tsx` - fixed theme and language controls
- `HubView.tsx` - radial hub and account switcher
- `ContentView.tsx` - non-hub screen shell
- `ContentViewHeader.tsx` - back button and screen title
- `AppOverlays.tsx` - modals, floating call widget, contact editor
- `ThemeToggle.tsx`, `LanguageSelector.tsx`, `HomeButton.tsx`, `RadialMenu.tsx`, `StoryViewerOverlay.tsx`, `AdvancedFilterModal.tsx` - focused chrome components

### `src/components/chat/*`

Owns chat list and active chat composition:

- `ChatWorkspace.tsx` - chooses list or active chat
- `ChatListWorkspace.tsx` - list view adapter
- `ActiveChatWorkspace.tsx` - active chat adapter for preview and input overlay

### `src/components/features/*`

Owns feature screen routing:

- `FeatureViews.tsx` - switch for pulse, radar, calls, settings, recordings, contacts

### `src/components/ui/*`

Owns reusable visual primitives:

- buttons
- pills
- search bars
- toggles
- modals
- waveform primitives

### `src/components/resilience/*`

Owns runtime failure containment:

- `ErrorBoundary.tsx` - safe render wrapper
- `SafeRender.tsx` - reusable boundary around risky sections

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
