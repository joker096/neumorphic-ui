# Immersive Layout — Removing Headers for Maximum Content Area

## Goal
Remove outer `ContentViewHeader` completely and reduce the active-chat header to a minimal thin bar, freeing ~60-80px of vertical space for chat list and message areas across all views.

## Changes

### 1. ContentViewHeader (removed)
- File: `src/components/app/ContentViewHeader.tsx` — removed entirely
- The title (e.g. "Chats", "Contacts") is no longer displayed as a header; sidebar icon highlighting + bottom nav label suffice for orientation

### 2. ContentView (padding reduced)
- File: `src/components/app/ContentView.tsx`
- `pt-4 sm:pt-8` → `pt-2 sm:pt-2` (compensates for removed header)
- Remove `<ContentViewHeader ... />` invocation
- Remove `onBack` prop (no longer needed at this level)

### 3. ChatListView (padding reduced)
- File: `src/components/ChatListView.tsx`
- `p-6 mb-8` → `p-4 mb-4` (+~40px for list items)

### 4. ChatPreviewLayer header (minimal thin bar)
- File: `src/components/ChatPreviewLayer.tsx`
- Header padding: `p-5 pb-4` → `px-3 py-2` (thin bar, ~32px)
- Keep: back button (smaller, `w-8 h-8`), avatar mini, chat name + online status
- Remove: action buttons (search, call, video, bookmark, trash, filter)
- No "More" menu — actions are fully removed from header

### 5. ActiveChatWorkspace (top margin reduced)
- File: `src/components/chat/ActiveChatWorkspace.tsx`
- `mt-6` → `mt-2`

### 6. App.tsx (prop cleanup)
- Remove `onBack` from `<ContentView>` props
- `handleBack` function can remain for potential future use or be removed

## Files Affected
| File | Change |
|------|--------|
| `src/components/app/ContentViewHeader.tsx` | Delete |
| `src/components/app/ContentView.tsx` | Reduce padding, remove header usage |
| `src/components/ChatListView.tsx` | Reduce padding p-6→p-4, mb-8→mb-4 |
| `src/components/ChatPreviewLayer.tsx` | Minimal header bar, remove action buttons |
| `src/components/chat/ActiveChatWorkspace.tsx` | Reduce mt-6→mt-2 |
| `src/App.tsx` | Remove onBack prop from ContentView |

## Verification
- `npm run build` — must compile without errors
- Visual check: desktop + mobile, all views (chats, channels, bots, contacts, calls, settings)
- Active chat: back button visible and functional, header is thin, messages area fills available space
- Chat list: no outer header, search + tabs remain, list items start higher
