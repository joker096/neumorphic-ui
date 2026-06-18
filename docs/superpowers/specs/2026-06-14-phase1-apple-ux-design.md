# Phase 1: Full Apple Experience — Design Spec

> **Project:** Mess&Anger (neumorphic-ui)
> **Date:** 2026-06-14
> **Status:** Approved
> **Focus:** iOS/macOS/iPad-native UX perfection

---

## 1. Design Foundation

### 1.1 Typography

Replace Google Fonts `Roboto` with Apple system font stack:

```css
--font-system: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
  "Helvetica Neue", "Inter", ui-sans-serif, system-ui, sans-serif;
```

Implement iOS 17 type scale as Tailwind CSS theme extensions:

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `--fs-large-title` | 34px | Bold | Hub screen title |
| `--fs-title-1` | 28px | Bold | Screen titles |
| `--fs-title-2` | 22px | Bold | Section headers |
| `--fs-title-3` | 20px | Semibold | Card titles |
| `--fs-headline` | 17px | Semibold | List item titles |
| `--fs-body` | 17px | Regular | Message text |
| `--fs-callout` | 16px | Regular | Secondary text |
| `--fs-subheadline` | 15px | Regular | Subtitles |
| `--fs-footnote` | 13px | Regular | Captions |
| `--fs-caption-1` | 12px | Regular | Timestamps |
| `--fs-caption-2` | 11px | Regular | Badges |

### 1.2 Color System

Define CSS custom properties for iOS system colors:

```css
:root {
  --system-blue: #007AFF;
  --system-green: #34C759;
  --system-orange: #FF9500;
  --system-red: #FF3B30;
  --system-yellow: #FFCC00;
  --system-teal: #5AC8FA;
  --system-purple: #AF52DE;
  --system-pink: #FF2D55;
  --system-gray: #8E8E93;
  --system-gray-2: #AEAEB2;
  --system-gray-3: #C7C7CC;
  --system-gray-4: #D1D1D6;
  --system-gray-5: #E5E5EA;
  --system-gray-6: #F2F2F7;
}
```

Background colors (Dark/Light via `light-dark()` or separate `[data-theme]`):

| Token | Light | Dark |
|-------|-------|------|
| `--system-background` | #FFFFFF | #000000 |
| `--secondary-system-bg` | #F2F2F7 | #1C1C1E |
| `--tertiary-system-bg` | #FFFFFF | #2C2C2E |
| `--grouped-bg` | #F2F2F7 | #000000 |
| `--separator` | rgba(60,60,67,0.12) | rgba(84,84,88,0.36) |

### 1.3 Spacing (8pt Grid)

Replace arbitrary px values with 8pt multiples:

- `--space-1`: 8px
- `--space-2`: 16px
- `--space-3`: 24px
- `--space-4`: 32px
- `--space-5`: 40px
- `--space-6`: 48px
- `--space-7`: 56px
- `--space-8`: 64px

Minimum tappable area: 44×44pt (per iOS HIG).

### 1.4 System Appearance

- Add `prefers-color-scheme` detection
- 3 modes: `.light` / `.dark` / `.system`
- System mode follows OS setting in real time via `matchMedia` listener
- Persist choice in localStorage as `app_theme_mode` (`'light'`, `'dark'`, `'system'`)
- Apply `data-theme` attribute on `<html>`

### 1.5 Material / Blur

Predefined backdrop classes:

| Class | Backdrop | Background Alpha |
|-------|----------|-----------------|
| `.material-ultra-thin` | `backdrop-blur-3xl` | `bg-white/10` or `bg-black/30` |
| `.material-thin` | `backdrop-blur-2xl` | `bg-white/30` or `bg-black/40` |
| `.material-regular` | `backdrop-blur-xl` | `bg-white/50` or `bg-black/50` |
| `.material-thick` | `backdrop-blur-lg` | `bg-white/70` or `bg-black/70` |

---

## 2. Animations & Gestures

### 2.1 Spring Animation Presets

Extract to `src/lib/animation/presets.ts`:

```ts
export const springs = {
  soft: { type: "spring", stiffness: 200, damping: 25, mass: 1 },
  snappy: { type: "spring", stiffness: 400, damping: 30, mass: 0.8 },
  bouncy: { type: "spring", stiffness: 150, damping: 15, mass: 1 },
  gentle: { type: "spring", stiffness: 120, damping: 20, mass: 1 },
}
```

iOS default curve for CSS: `cubic-bezier(0.25, 0.1, 0.25, 1)`.

### 2.2 Swipe Gestures

Create `useSwipeGesture` hook in `src/lib/gestures/useSwipeGesture.ts`:

- **Swipe to go back**: left-edge gesture detects `touchstart` within 30px of left edge, tracks horizontal movement > 80px → triggers `onBack`
- **Swipe on chat item**: horizontal swipe reveals action buttons (archive/delete/pin) with spring animation
- **Swipe to dismiss sheet**: downward swipe on sheet grabber → dismisses with spring

### 2.3 Long Press

Create `useLongPress` hook:

- Trigger after 500ms hold
- Visual feedback: scale(0.97) + slight opacity reduction
- On release without cancel: show context menu

### 2.4 Pull to Refresh

- iOS-style with spinning indicator (custom `UIRefreshControl` replica)
- Trigger: overscroll beyond threshold (60px)
- Refresh callback passed as prop

### 2.5 Page Transitions

- Push: slide from right (iOS default)
- Pop: slide to right
- Modal present: slide up + scale(1.02 → 1.0)
- Modal dismiss: slide down
- Settings sub-views: slide from right (uses AnimatePresence, already partially implemented)

---

## 3. Navigation System

### 3.1 Stack Navigation

Create `NavigationStack` hook + provider:

```ts
interface NavRoute {
  name: string;
  params?: Record<string, any>;
}

interface NavigationStack {
  push: (route: NavRoute) => void;
  pop: () => void;
  popToRoot: () => void;
  current: NavRoute;
  canGoBack: boolean;
}
```

- Wraps AnimatePresence for push/pop transitions
- Tracks full stack (for deep linking / back button chain)
- Replaces current flat `setView()` pattern in `App.tsx`

### 3.2 Navigation Bar

- Large title style (34px bold) when scroll position is at top
- Collapses to inline title (17px semibold) on scroll (iOS 13+ behavior)
- Left: back button with chevron (if `canGoBack`)
- Right: optional action buttons
- Uses `IntersectionObserver` or scroll event for title collapse

### 3.3 Tab Bar

Optional iOS-style tab bar as alternative to Hub:

- 5 tabs: Chats, Channels, Contacts, Settings
- SF Symbols-like icons (lucide-react)
- Active: filled variant; inactive: outline
- Tab bar has `.material-regular` blur background
- Height: 50px + safe-area-bottom

### 3.4 Hub (RadialMenu) Retention

- Keep Hub as an alternative navigation (accessible via toggle)
- When Hub is active, hide tab bar
- RadialMenu animation polish: spring-based entrance

### 3.5 Deep Linking

- Handle `messanger://chat/{id}` via URL handler
- Push notification tap → navigate to specific screen

---

## 4. Components

### 4.1 Sheet (Bottom Sheet)

Generic `Sheet` component:

- Grabber: 5×36px rounded pill at top center
- Detents: `.medium` (50vh), `.large` (92vh)
- Drag to dismiss with spring animation
- Backdrop: `.material-thin` overlay
- iOS 15+ style: rounded top corners (16px), no bottom corners
- Props: `isOpen`, `onClose`, `detent`, `children`

Replace existing modals:
- `CreateChannelModal` → Sheet
- `EditChannelModal` → Sheet
- `CreateBotModal` → Sheet  
- `AdvancedFilterModal` → Sheet
- `FolderManagerModal` → Sheet
- `ContactProfileModal` → Sheet (use `.medium` detent)
- `SlideUpPreview` → Sheet (use `.large` detent)

### 4.2 Search Bar

Unified `SearchBar` component:

- iOS 17 style: rounded rectangle with capsule shape
- Cancel button ("Cancel") animates in on focus
- Scope bar (optional filter tabs below)
- Placeholder text: "Search" or custom
- Dark/light adaptation

### 4.3 Toggle Switch

iOS 17 style:

- Track: 51×31px, rounded-full
- Thumb: 27×27px circle, white with subtle shadow
- ON color: `#34C759` (system green) or custom accent
- OFF color: light gray / dark gray
- Motion: spring animation on toggle
- Haptic simulation: brief scale(0.9) on touch down

### 4.4 Context Menu

iOS-style (UIMenu replica):

- Triggered by long press (500ms) on messages, contacts, chat items
- Menu items with: icon, title, optional subtitle
- Destructive items in red
- Separator lines between sections
- Dismiss on tap outside or selection
- Animated: scale from touch point + blur backdrop

### 4.5 Action Sheet

iOS UIAlertController-style:

- **Alert**: centered card for confirm/cancel
- **ActionSheet**: bottom sheet with button list
- Cancel button separated (bold)
- Destructive button in red
- Spring entrance animation

### 4.6 Activity Indicator

Custom iOS-style spinner:

- 20×20px spinning circle
- Colors: system gray for light, white for dark
- Uses CSS `conic-gradient` + `rotate` animation
- Optional with large (37px) variant

---

## 5. Mac & Keyboard

### 5.1 Keyboard Shortcuts

Register global `keydown` listener in `useKeyboardShortcuts` hook:

| Modifier | Key | Action |
|----------|-----|--------|
| Cmd | N | New chat (focus contact search) |
| Cmd | , | Open settings |
| Cmd | F | Focus chat search |
| Cmd | Shift | F | Advanced filter modal |
| Cmd | K | Command palette |
| Cmd | Enter | Send message |
| Cmd | Shift | M | Toggle mute |
| Escape | — | Go back / close sheet |
| Cmd | W | Close active chat |
| Cmd | Up | Previous chat in list |
| Cmd | Down | Next chat in list |
| Space | — | Scroll down / play voice note |

- Show shortcut hints in tooltips (`⌘N`)
- Command palette (Cmd+K): fuzzy search over actions (like Slack)

### 5.2 Hover States

- Add `@media (hover: hover)` queries for desktop-optimized hover effects
- More pronounced shadows on hover (Mac users see cursor)
- Text selection: `user-select: text` on message content

### 5.3 Right-Click Context Menu

- Intercept `onContextMenu` event
- Render custom positioned menu with:
  - Icons + labels
  - Keyboard shortcut hints
  - Separators
  - Submenu support
- Dismiss on click outside or Esc

### 5.4 Window Management

- Min window width: 360px
- Max content width: 820px (chat readability)
- Resize handler for sidebar width (iPad/Mac)

---

## 6. Responsive / iPad

### 6.1 Three-Column Layout (1024px+)

```
┌──────────┬────────────────┬──────────────────────┐
│ Sidebar  │   Chat List    │   Chat Detail        │
│ 68px     │   320px        │   flex-1             │
│ Icons    │   Filtered     │   Messages + Input   │
│ only     │   chats        │                      │
└──────────┴────────────────┴──────────────────────┘
```

- Sidebar: compact hub icons (vertical stack, 68px wide)
- List: conversation list (320px fixed)
- Detail: active chat (fills remaining space)

### 6.2 Keyboard Avoidance

- Use `VisualViewport` API to detect keyboard on mobile Safari
- Adjust input bar position based on visual viewport height
- CSS: `viewport-fit=cover` + `env(safe-area-inset-bottom)`

### 6.3 Safe Areas

```css
padding-top: env(safe-area-inset-top, 0px);
padding-bottom: env(safe-area-inset-bottom, 0px);
padding-left: env(safe-area-inset-left, 0px);
padding-right: env(safe-area-inset-right, 0px);
padding-top: constant(safe-area-inset-top, 0px);
padding-bottom: constant(safe-area-inset-bottom, 0px);
```

### 6.4 Orientation

- Portrait: stack navigation (default)
- Landscape (iPad): show sidebar + list, detail on right
- Listen to `orientationchange` + `matchMedia('(orientation: landscape)')`

---

## Implementation Order

1. **Foundation** — CSS variables, fonts, spacing, system appearance mode
2. **Animations** — Spring presets, migrate existing motion variants
3. **Navigation** — Stack hook, nav bar, back gesture
4. **Components** — Sheet, search bar, toggle, context menu, action sheet
5. **Mac** — Keyboard shortcuts, right-click menu, hover
6. **iPad** — Three-column layout, safe areas, keyboard avoidance
7. **Polish** — Migrate existing modals to Sheets, audit all transitions

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/animation/presets.ts` | Spring animation presets |
| `src/lib/animation/variants.ts` | Shared motion variants (fade, slide, scale) |
| `src/lib/gestures/useSwipeGesture.ts` | Swipe gesture hook |
| `src/lib/gestures/useLongPress.ts` | Long press hook |
| `src/lib/gestures/usePullToRefresh.ts` | Pull to refresh hook |
| `src/lib/navigation/NavigationStack.ts` | Stack navigation hook + provider |
| `src/lib/navigation/NavBar.tsx` | Large title navigation bar |
| `src/lib/navigation/TabBar.tsx` | iOS-style tab bar |
| `src/lib/navigation/useKeyboardShortcuts.ts` | Keyboard shortcuts hook |
| `src/components/ui/Sheet.tsx` | Bottom sheet component |
| `src/components/ui/SearchBar.tsx` | Unified search bar |
| `src/components/ui/Toggle.tsx` | iOS 17 toggle switch |
| `src/components/ui/ContextMenu.tsx` | Long press context menu |
| `src/components/ui/ActionSheet.tsx` | Alert / action sheet |
| `src/components/ui/ActivityIndicator.tsx` | iOS spinner |

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Replace font, add iOS colors, 8pt grid, material classes, safe areas |
| `src/App.tsx` | Replace `setView` with `NavigationStack`, add keyboard shortcuts, safe area layout |
| `src/components/SettingsView.tsx` | Use new Sheet, SearchBar, Toggle components |
| `src/components/ChatListPanel.tsx` | Swipe gestures on items, iOS search bar, pull-to-refresh |
| `src/components/ChatPreviewLayer.tsx` | Context menu on messages, swipe-to-back |
| `src/components/ChatInputBar.tsx` | Keyboard avoidance, Mac shortcuts |
| All modal components | Convert to Sheet usage |

---

## Acceptance Criteria

1. App uses system font on Apple devices, gracefully degrades on others
2. All modals are replaceable with draggable bottom sheets
3. Swipe-to-back works on chat detail view
4. Keyboard shortcuts function on Mac/desktop
5. Three-column layout renders correctly on iPad (1024px+)
6. System appearance mode follows OS setting in real time
7. All animations use spring physics (not linear transitions)
8. Right-click shows context menu on desktop
9. Search bar shows iOS-style cancel button on focus
10. Safe areas respected on iPhone X+ / iPad
