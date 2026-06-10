# App.tsx Extraction Map

**Source:** `src/App.tsx` - 4140 lines
**Goal:** Extract inline components to separate files to reduce App.tsx to ~800 lines

## Extraction Map

### Small Components (lines ~75-120)
| Component | Lines | Target |
|-----------|-------|--------|
| `CustomDiamondIcon` | 75-91 | Already extracted to `ui/CustomDiamondIcon.tsx` |
| `NeumorphicKnob` | 95-97 | Already extracted to `ui/NeumorphicKnob.tsx` |
| `GlowingKnobLine` | 99-108 | Already extracted to `ui/GlowingKnobLine.tsx` |
| `GlowingPlusLight` | 110-119 | Already extracted to `ui/GlowingPlusLight.tsx` |

### Medium Components (lines ~120-410)
| Component | Lines | Target |
|-----------|-------|--------|
| `LightPillButton` | 121-159 | Already extracted to `ui/LightPillButton.tsx` |
| `LightSearchBar` | 161-214 | Already extracted to `ui/LightSearchBar.tsx` |
| `DarkPillButton` | 218-267 | Already extracted to `ui/DarkPillButton.tsx` |
| `DarkSearchBar` | 269-318 | Already extracted to `ui/DarkSearchBar.tsx` |
| `ActionCircleButton` | 321-408 | Already extracted to `ui/ActionCircleButton.tsx` |
| `PillButton` | 412-521 | No extraction - used in Dialpad only |

### Large Components (lines ~520-1450)
| Component | Lines | Target |
|-----------|-------|--------|
| `Dialpad` | 523-987 | Create `components/Dialpad.tsx` |
| `HubToggleIcon` | 991-1028 | Merge into `RadialMenu.tsx` |
| `RadialMenu` | 1032-1447 | Update `components/RadialMenu.tsx` |
| `AvatarRow` | 1662-1712 | Create `components/AvatarRow.tsx` |
| `ChatListItem` | 1714-1837 | Create `components/ChatListItem.tsx` |
| `ChatPreviewLayer` | 1839-2648 | Create `components/chat/ChatPreviewLayer.tsx` |

### Utility Components (lines ~2650-2986)
| Component | Lines | Target |
|-----------|-------|--------|
| `SettingsToggle` | 2650-2693 | Already extracted to `ui/SettingsToggle.tsx` |
| `VideoPlayerOverlay` | 2695-2777 | Create `components/VideoPlayerOverlay.tsx` |
| `StickerPicker` | 2933-2986 | Create `components/StickerPicker.tsx` |
| `NotificationMockup` | 2789-2857 | Create `components/NotificationMockup.tsx` |

### Data & Constants
| Item | Lines | Target |
|------|-------|--------|
| `MOCK_CALLS` | 1449-1473 | Create `data/mocks.ts` |
| `MOCK_CHATS` | 1475-1609 | Create `data/mocks.ts` |
| `MOCK_CHANNELS` | 1611-1652 | Create `data/mocks.ts` |
| `ONLINE_CONTACTS` | 1654-1660 | Create `data/mocks.ts` |
| `LANGUAGES` | 2990-2999 | Create `data/constants.ts` |
| `STICKER_PACKS`, `STICKER_EMOJI` | 2925-2931 | Create `data/constants.ts` |

### Utility Functions
| Function | Lines | Target |
|----------|-------|--------|
| `parseMentions` | 2879-2887 | Create `lib/utils.ts` |
| `isDNDEnabled` | 2889-2911 | Create `lib/utils.ts` |
| `isPriorityContact` | 2913-2923 | Create `lib/utils.ts` |
| `formatTime` | 2779-2784 | Create `lib/utils.ts` |
| `Mention pattern` | 2877 | Create `lib/utils.ts` |

### Main App Component
- `export default function App()` - lines 3001-4140
- After extraction: ~800 lines (view switching, state management, layout)

### Summary of Changes
| Category | Lines Before | Lines After |
|----------|-------------|-------------|
| App.tsx (small/medium) | ~300 | -300 |
| App.tsx (large components) | ~1400 | -1400 |
| App.tsx (utilities) | ~300 | -300 |
| App.tsx (mock data) | ~150 | -150 |
| App.tsx (constants) | ~20 | -20 |
| **New files** | | ~12 files |
