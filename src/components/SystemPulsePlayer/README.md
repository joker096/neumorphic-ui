# SystemPulsePlayer

Audio player component with neumorphic UI design.

## Files

| File | Purpose |
|---|---|
| `SystemPulsePlayer.tsx` | Main player component (entry point) |
| `PlayerView.tsx` | Visual player with VU meter and rotating spectrum |
| `EqualizerPanel.tsx` | 5-band equalizer with volume slider |
| `PlaylistView.tsx` | Track and radio station list |
| `TopBar.tsx` | Top bar with file/folder import, EQ, playlist controls |
| `AddStationModal.tsx` | Modal for adding radio station URLs |
| `colors.ts` | Centralized color constants for player UI |
| `usePlayerState.ts` | Zustand store for player state |
| `utils.ts` | Audio utilities (Web Audio API helpers) |
| `VideoOverlay.tsx` | Video overlay for audio visualization |

## Color System

All player colors are centralized in `colors.ts` and organized by category:

- `radio` — Radio mode colors (green spectrum)
- `music` — Music mode colors (orange/brown spectrum)
- `dark` — Dark theme specific colors

Usage:
```tsx
import { playerColors } from './colors';
className={`bg-[${playerColors.radio.main}]`
```
