# App.tsx Component Extraction Design

**Date:** 2026-06-08
**File:** src/App.tsx (4140 lines)
**Goal:** Reduce App.tsx to the main App component, extract all inline components into dedicated files.

## Current State

- App.tsx is 4140 lines with ~3000+ lines of inline components
- Some components already extracted to `src/components/ui/` (13 files) and `src/components/` (many views)
- `src/components/RadialMenu.tsx` and `src/components/HubView.tsx` exist but are stubs

## Components Still Inline in App.tsx

### Small (lines ~75-150)
- `CustomDiamondIcon` - SVG diamond icon
- `NeumorphicKnob` - small neumorphic knob
- `GlowingKnobLine` - glowing knob with line
- `GlowingPlusLight` - glowing plus button

### Medium (~lines 120-410)
- `LightPillButton` - neumorphic pill button (light theme)
- `DarkPillButton` - neumorphic pill button (dark theme)
- `LightSearchBar` - search bar with neumorphic styling
- `DarkSearchBar` - search bar (dark theme)
- `ActionCircleButton` - circular toggle button with theme support
- `PillButton` - versatile pill/button with glow effects

### Large (~lines 520-1447)
- `Dialpad` - messenger dial pad with contacts, recent calls, grid keypad
- `HubToggleIcon` - toggle icon for central hub
- `RadialMenu` - SVG-based radial menu with volume control, hub, bubble nodes (1200+ lines)
- `ChatPreviewLayer` - full chat preview with messages, media, stickers, search, filters
- `ChatListItem` - swipeable chat list item with archive gesture
- `AvatarRow` - story/avatars row with P2P stories

### Data & State
- `MOCK_CALLS`, `MOCK_CHATS`, `MOCK_CHANNELS`, `ONLINE_CONTACTS` - mock data
- `StickerPicker` - sticker picker component
- Various helper functions and types

## Extraction Strategy

### Phase 1: Small UI Components
Move to `src/components/ui/`:
- CustomDiamondIcon, NeumorphicKnob, GlowingKnobLine, GlowingPlusLight

### Phase 2: Medium Components
Move to `src/components/ui/`:
- LightPillButton, DarkPillButton, LightSearchBar, DarkSearchBar, ActionCircleButton, PillButton

### Phase 3: Large Components
- `Dialpad` → `src/components/Dialpad.tsx`
- `RadialMenu` → `src/components/RadialMenu/RadialMenu.tsx` (expand existing stub)
- `ChatPreviewLayer` → `src/components/chat/ChatPreviewLayer.tsx`
- `ChatListItem` → `src/components/chat/ChatListItem.tsx`
- `AvatarRow` → `src/components/chat/AvatarRow.tsx`

### Phase 4: Data & Utilities
- Mock data → `src/data/mocks.ts`
- StickerPicker → `src/components/StickerPicker.tsx`
- Helper functions → `src/lib/utils.ts` or keep inline if tightly coupled

### Phase 5: Final App
- Main App component reduced to ~800-1000 lines (view switching, state management, layout)
