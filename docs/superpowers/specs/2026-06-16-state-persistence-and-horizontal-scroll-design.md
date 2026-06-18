# State Persistence & Horizontal Scroll Design

## Problem 1: State Lost on Navigation

When navigating from Hub to any subview and back, RadialMenu remounts and loses all state.
Affected states:

| State | Location | Current |
|-------|----------|---------|
| `volume` | RadialMenu (`App.tsx:1063`) | `useState(65)` |
| `dnd` | RadialMenu (`App.tsx:1064`) | `useState(false)` |
| `proxy` | RadialMenu (`App.tsx:1065`) | `useState(true)` |
| `energy` | RadialMenu (`App.tsx:1066`) | `useState(false)` |
| `isOpen` | RadialMenu (`App.tsx:1060`) | `useState(false)` |
| `enabled`, `volume` | `SoundContext.tsx` | `useState` (Provider unused) |

Also: `SoundSettings.tsx` uses local `useState` duplicates.

## Solution: Zustand Store

Add new fields to existing `AppState` in `src/store/index.ts`:

```typescript
// Sound
soundEnabled: boolean;
soundVolume: number;

// Radial Hub states
radialDnd: boolean;
radialProxy: boolean;
radialEnergy: boolean;

// Setters
setSoundEnabled: (enabled: boolean) => void;
setSoundVolume: (volume: number) => void;
setRadialDnd: (dnd: boolean) => void;
setRadialProxy: (proxy: boolean) => void;
setRadialEnergy: (energy: boolean) => void;
```

RadialMenu reads from store instead of local useState. SoundContext also reads from store.
SettingsView's `soundEnabled` localStorage hook replaced with store read/write.

## Problem 2: Horizontal Scroll Not Working with Wheel/Trackpad

8 `overflow-x-auto` containers lack `onWheel` handler:

| File | Line | Container |
|------|------|-----------|
| App.tsx | 735 | Dialpad call filter tabs |
| App.tsx | 1700 | Stories AvatarRow |
| App.tsx | 2162 | Chat media tabs bar |
| App.tsx | 2225 | Chat media items |
| App.tsx | 3783 | Top tab bar (stories/chats/channels/bots) |
| ContactsView.tsx | 146 | Contacts tabs (all/favorites/recent) |
| RecordingsScreen.tsx | 260 | Recordings sort options |
| AvatarRow.tsx | 31 | AvatarRow component (unused) |

### Solution

Add to each container's className:
```tsx
onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}
```

This converts vertical wheel/trackpad scroll to horizontal scroll on these containers.
Already works correctly on 2 existing usages (lines 2996, 3809 in App.tsx).

## Problem 3: Contact Local Fields

Per existing spec `2026-06-13-contact-local-fields-design.md`:

### Data Model (already in `src/types/contact.ts`)
- `ContactField` with `{ phone, email, telegram, whatsapp, signal, custom }`
- `Contact.localFields` — NOT included in share

### Storage
- Move contacts from `useState` in App.tsx to Zustand store
- Wire `contacts`/`setContacts` to store (already encrypted persist)

### UI Changes
- `ContactCreateEditModal`: Add "Local Info" section with field rows
- Type dropdown: Phone / Email / Telegram / + Custom
- Phone subtype dropdown: Mobile / Work / Home / Main
- Each field: delete, "+ Add Field" button
- `ContactProfileModal`: Display local fields with type icons
- Share Identity (QR/ID): unchanged — localFields excluded

## Implementation Order
1. Add new Zustand store fields (sound + radial states)
2. Wire RadialMenu to store, remove local useState
3. Wire SoundContext to store (or replace with direct store reads)
4. Wire SettingsView sound toggle to store
5. Add onWheel to all overflow-x-auto containers
6. Move contacts to Zustand store
7. Add local fields UI to ContactCreateEditModal
8. Display local fields in ContactProfileModal
9. Add localization strings
