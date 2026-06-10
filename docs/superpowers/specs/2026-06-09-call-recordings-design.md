# Call Recordings Feature — Design Spec

## Overview

Add automatic call recording (audio/video) for all call types in the Mess&Anger messenger. Recordings are stored locally in IndexedDB and accessible via a new Recordings screen. A dictaphone icon on the Hub radial menu provides access to the recordings library and quick voice recording.

## Recording Types Covered

- 1-on-1 audio calls
- 1-on-1 video calls
- Group audio/video calls (up to 5 participants)
- Huddles (audio-only Slack-style)

## Data Model

### `CallRecording` (new interface in `types/call.ts`)

```typescript
export interface CallRecording {
  id: string;
  callId: string;
  callType: 'audio' | 'video' | 'group_audio' | 'group_video' | 'huddle' | 'voice_memo';
  participants: {
    userId: string;
    displayName: string;
    avatar?: string;
  }[];
  title?: string;
  startedAt: number;           // call start timestamp (ms)
  duration: number;            // total call duration (seconds)
  recordingDuration: number;   // recorded duration (seconds)
  fileSize: number;            // bytes
  mimeType: string;            // 'audio/webm' | 'video/webm'
  blobId: string;              // IndexedDB key
  isFavorite: boolean;
  tags: string[];
  createdAt: number;           // when recording was saved (ms)
}
```

### `AppSection` (updated in `types/common.ts`)

Add `'recordings'` to the union:
```typescript
export type AppSection = 'chats' | 'contacts' | 'calls' | 'channels' | 'settings'
  | 'bots' | 'miniapps' | 'payments' | 'archive' | 'stories' | 'mesh' | 'folders'
  | 'recordings';
```

### Store — new Zustand slice

**File:** `app/src/store/slices/recordingsSlice.ts`

```typescript
interface RecordingsSlice {
  recordings: CallRecording[];
  searchQuery: string;
  sortBy: 'date' | 'duration' | 'type' | 'name';
  sortOrder: 'asc' | 'desc';

  addRecording: (recording: CallRecording) => void;
  deleteRecording: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateRecording: (id: string, updates: Partial<CallRecording>) => void;
  clearRecordings: () => void;
  setSearchQuery: (q: string) => void;
  setSortBy: (sort: RecordingsSlice['sortBy']) => void;
  toggleSortOrder: () => void;
}
```

Integrated into main store via `createRecordingsSlice` in `app/src/store/index.ts`.

## Architecture

### 1. CallRecorderService (`app/src/lib/callRecorderService.ts`)

Singleton class that manages recording across all call types.

```
CallRecorderService
├── attachTo1on1Call(callManager: CallManager)
├── attachToGroupCall(groupCallManager: GroupCallManager)
├── attachToHuddle(huddleManager: HuddleManager)
├── startRecording(type, callId, localStream, remoteTracks[])
├── stopRecording() → { blobId, metadata }
├── discardRecording()
├── isRecording: boolean
└── onStateChange: (recording: boolean) => void
```

**Auto-record flow:**
1. `startCall`/`startGroupCall`/`joinHuddle` → service auto-starts `startRecording()`
2. `endCall`/`leaveGroupCall`/`leaveHuddle` → service auto-stops `stopRecording()`
3. On stop: blob → IndexedDB, metadata → Zustand store

**Stream mixing for 1-on-1:**
- Use `AudioContext.createMediaStreamDestination()` to mix local + remote audio tracks
- For video: use a single `MediaStream` combining mixed audio + remote video track
- For group/huddle: same as existing `groupCallManager.startRecording()` — collect all remote tracks

**MIME type selection:**
- Audio: prefer `audio/webm;codecs=opus`, fallback `audio/webm`
- Video: prefer `video/webm;codecs=vp9`, fallback `video/webm`

### 2. RecordingStorage (`app/src/lib/recordingStorage.ts`)

IndexedDB wrapper for blob storage.

- **DB name:** `mess-anger-recordings`
- **Object store:** `blobs` (key = recording ID, value = Blob)
- **Methods:** `open()`, `saveBlob(id, blob)`, `getBlob(id)`, `deleteBlob(id)`, `clear()`, `getStorageInfo()`

Storage estimation via `navigator.storage.estimate()` for quota warnings.

### 3. UI Components

#### Hub Icon (App.tsx)

New item in `hubItems`:
```typescript
{ id: 'recordings', angle: 270, title: 'Recordings', subtitle: 'Call Logs', icon: Mic }
```

Icon: `Mic` from `lucide-react` (already available).

#### RecordingsScreen (`app/src/screens/RecordingsScreen.tsx`)

| Element | Description |
|---------|-------------|
| Header | Title, search bar, "New Recording" button |
| Sort bar | Toggle pills: Date ↓, Duration ↓, Type, Name |
| RecordingList | Virtualized list (reuse VirtualizedList pattern from CallsScreen) |
| RecordingItem | Icon, title/participants, date, duration, favorite star, play button |
| Empty state | Illustration + "No recordings yet" text |
| RecordingPlayer | Bottom-sheet overlay with full playback controls |

Routed when `section === 'recordings'` in `App.tsx` → `DesktopLayout`/`DesktopMainContent`.

#### RecordingPlayer (`app/src/components/recordings/RecordingPlayer.tsx`)

Features:
- `<audio>` or `<video>` element for playback
- Play/Pause, seek bar, current time / total time
- Skip -15s / +15s buttons
- Volume slider
- Playback speed: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
- Context menu (via long-press or "..." button):
  - Delete (confirmation dialog)
  - Export/Download (save to disk)
  - Share (via Web Share API or file download)
  - Call Info (participants, duration, date)
  - Toggle Favorite
  - Rename
  - Manage Tags

#### New Voice Recording (from New Recording button)

Uses existing `useVoiceRecorder` hook (`app/src/hooks/useVoiceRecorder.ts`). On stop, saves as `CallRecording` with `callType: 'voice_memo'`.

#### FloatingCallWidget Update

Extend red "REC" indicator (currently only for group calls `isRecording`) to show for all call types when `callRecorderService.isRecording === true`.

#### Settings

Add toggle in Call Settings (or Data Storage Settings):
- **Auto-record calls** (on/off) — default: on
- **Recording quality:** Standard / High (controls bitrate)
- **Storage:** show estimated usage, "Clear all recordings" button

## Files to Create

| File | Purpose |
|------|---------|
| `app/src/lib/callRecorderService.ts` | Core recording service |
| `app/src/lib/recordingStorage.ts` | IndexedDB blob storage |
| `app/src/store/slices/recordingsSlice.ts` | Zustand slice for metadata |
| `app/src/screens/RecordingsScreen.tsx` | Main recordings list screen |
| `app/src/components/recordings/RecordingPlayer.tsx` | Full playback overlay |
| `app/src/components/recordings/RecordingItem.tsx` | List item component |
| `app/src/components/recordings/RecordingsHeader.tsx` | Header with search + sort |

## Files to Modify

| File | Change |
|------|--------|
| `app/src/types/call.ts` | Add `CallRecording` interface |
| `app/src/types/common.ts` | Add `'recordings'` to `AppSection` |
| `app/src/App.tsx` | Add hub item + routing + FloatingCallWidget REC update |
| `app/src/store/index.ts` | Integrate recordings slice |
| `app/src/lib/callManager.ts` | Add hook for CallRecorderService |
| `app/src/lib/groupCallManager.ts` | Delegate recording to CallRecorderService |
| `app/src/lib/huddleManager.ts` | Add hook for CallRecorderService |
| `app/src/config/navigation.tsx` | Add recordings to nav items |
| `app/src/components/call/FloatingCallWidget.tsx` | Show REC for all call types |
| `app/src/components/EmptyState.tsx` | Handle `'recordings'` section |

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| User denies mic permission | Recording skipped, no crash, log warning |
| IndexedDB quota exceeded | Catch error, show toast "Storage full. Free up space in Settings.", offer export |
| Call ends before recording starts | Graceful — stop recorder if running, discard empty blob |
| Very long call (>1 hour) | MediaRecorder chunks; test with long recordings |
| Multiple calls overlap | Only one recording at a time; second call's recording is skipped |
| App killed during recording | Blob is lost (in-memory chunks) — acceptable trade-off |
| Mobile (Capacitor) | IndexedDB works natively; recording uses Web APIs |

## Verification

- `npm run lint` — no new errors
- `npm run test` — existing tests pass
- `npm run build` — builds successfully
- Manual: start call → verify REC indicator → end call → verify recording appears in library → play/delete/export
