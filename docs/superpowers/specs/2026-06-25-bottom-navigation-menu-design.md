# Bottom Navigation Menu (Telegram-like)

## Summary
Replace the radial menu with an adaptive bottom navigation bar (mobile) / sidebar (desktop) inspired by Telegram's UI. Fix swipe-to-click conflict in chat list items.

## Motivation
The radial menu is visually impressive but impractical for daily use — items are hard to reach, require two taps to navigate, and don't scale well. A Telegram-style bottom/side navigation is more ergonomic, familiar, and faster.

## Design

### Layout
- **Mobile (<768px)**: Bottom tab bar fixed at the bottom of the screen with 4 items: Chats, Contacts, Calls, Settings.
- **Desktop (≥768px)**: Left sidebar with the same 4 items, plus app logo/branding at top.
- Both layouts use `AnimatePresence` for smooth transitions between views.
- The `view` state is preserved; the nav bar highlights the active tab.

### 4 Main Tabs
| Tab | Icon | View | Notes |
|-----|------|------|-------|
| Chats | `MessageCircle` | Chat list (chats/channels/bots) | Same as current `view='chats'` |
| Contacts | `Users` | ContactsView | Same as current `view='contacts'` |
| Calls | `Phone` | Dialpad + call history | Same as current `view='calls'` |
| Settings | `Settings` | SettingsView | Same as current `view='settings'` |

### Other Sections (moved into Settings)
- Channels, Metropulse, Radar, Recordings, Bots remain accessible from within the Settings view or via their existing FeatureViews routes when navigated to directly.

### Navigation Changes
- **No more `HubView` / `RadialMenu`** — the app starts directly on the Chats tab.
- The `HomeButton` (diamond icon floating button) is removed — the bottom nav replaces it.
- `ContentView` no longer needs `showHomeButton` or `onHome` — back navigation is handled by the tab bar and platform back button.
- The `view` state is simplified — tabs are the primary navigation mechanism.

### Swipe Fix (ChatListItem)
- Add `onDragStart` and `onDragEnd` state tracking in `ChatListItem`.
- Track whether the drag distance exceeded a threshold (e.g., 10px).
- `onClick` only fires if no significant drag occurred.
- Use `useRef` for drag state to avoid re-renders.

### Files to Modify
1. **DELETE** `src/components/app/HubView.tsx` — no longer needed
2. **DELETE** `src/components/app/RadialMenu.tsx` — no longer needed
3. **DELETE** `src/components/app/HomeButton.tsx` — no longer needed
4. **MODIFY** `src/components/app/index.ts` — remove HubView export
5. **MODIFY** `src/components/AppChrome.tsx` — remove RadialMenu, HomeButton exports
6. **MODIFY** `src/App.tsx` — remove HubView import, hubItems, hubBadges; change default view to 'chats'; remove HubView branch from AnimatePresence; remove HomeButton references
7. **MODIFY** `src/components/app/ContentView.tsx` — remove HomeButton usage
8. **MODIFY** `src/components/ChatListView.tsx` — fix swipe onClick conflict
9. **CREATE** `src/components/navigation/BottomNav.tsx` — bottom tab bar (mobile)
10. **CREATE** `src/components/navigation/SidebarNav.tsx` — sidebar (desktop)
11. **CREATE** `src/components/navigation/index.ts` — exports

### Component Details

#### BottomNav (mobile)
- Fixed at bottom: `fixed bottom-0 left-0 right-0`
- Height: ~64px with safe-area padding
- Background: blurred glass effect matching theme
- 4 tabs, each with icon + label
- Active tab highlighted with accent color
- Unread badges on Chats (and optionally Calls)
- Uses `lucide-react` icons
- Transitions between views use `AnimatePresence`

#### SidebarNav (desktop)
- Fixed on left: `fixed left-0 top-0 bottom-0 w-64`
- App logo/title at top
- 4 nav items with icon + label
- Active item highlighted
- Renders content to the right of sidebar
- Responsive: hidden on mobile, visible on desktop

### States
- **Loading**: Skeleton for sidebar/bottom nav
- **Empty**: No special state — nav always shows
- **Error**: If navigation fails, fallback to current view
- **Edge cases**: Safe area insets for notched phones; landscape orientation

## Verification
1. Build and visually inspect bottom nav on mobile viewport
2. Build and visually inspect sidebar on desktop viewport
3. Click each tab and verify it navigates to correct section
4. Swipe a chat item left and verify onClick does NOT fire
5. Click a chat item without swiping and verify onClick fires normally
6. Verify Settings still contains Channels, Metropulse, Radar, Recordings, Bots sections
7. Check dark/light theme appearance
8. Run existing tests
