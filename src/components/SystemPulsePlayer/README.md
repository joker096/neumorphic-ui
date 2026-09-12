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
| `usePlayerState.ts` | Zustand store for player state |
| `utils.ts` | Audio utilities (Web Audio API helpers) |
| `VideoOverlay.tsx` | Video overlay for audio visualization |

## Color System

Player colors use CSS custom properties defined in `src/styles/tokens.css` under the `--player-*` namespace (both `[data-theme="dark"]` and `[data-theme="light"]` blocks):

- Green spectrum — radio mode (`--player-green`, `--player-green-dark`, `--player-green-deep`, ...)
- Orange/brown spectrum — music mode (`--player-orange`, `--player-orange-dark`, `--player-orange-deep`, ...)
- Theme-aware surfaces — `--player-panel-bg`, `--player-list-active`, `--player-station-modal`

Usage:
```tsx
className="bg-[var(--player-green)]"
```
