# Call Recordings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Add automatic call recording for all call types with IndexedDB storage and a recordings library UI.

**Architecture:** `CallRecorderService` singleton hooks into all three call managers (1-on-1, group, huddle) and auto-records. Blobs stored in IndexedDB via `RecordingStorage`. Metadata lives in a Zustand slice. New `RecordingsScreen` with search, sort, play, delete, export, favorites.

**Tech Stack:** React 19, TypeScript, Zustand, IndexedDB, MediaRecorder API, lucide-react icons

---

### Task 1: Add CallRecording type + AppSection

**Files:**
- Modify: `app/src/types/call.ts` (add `CallRecording`)
- Modify: `app/src/types/common.ts` (add `'recordings'` to `AppSection`)

- [ ] **Step 1: Add `CallRecording` to `types/call.ts`**

Append after `CallRecord`:
```typescript
export interface CallRecording {
  id: string;
  callId: string;
  callType: 'audio' | 'video' | 'group_audio' | 'group_video' | 'huddle' | 'voice_memo';
  participants: { userId: string; displayName: string; avatar?: string }[];
  title?: string;
  startedAt: number;
  duration: number;
  recordingDuration: number;
  fileSize: number;
  mimeType: string;
  blobId: string;
  isFavorite: boolean;
  tags: string[];
  createdAt: number;
}
```

- [ ] **Step 2: Add `'recordings'` to `AppSection` in `types/common.ts`**

Find `AppSection` type and add `'recordings'`:
```typescript
export type AppSection = 'chats' | 'contacts' | 'calls' | 'channels' | 'settings'
  | 'bots' | 'miniapps' | 'payments' | 'archive' | 'stories' | 'mesh' | 'folders'
  | 'recordings';
```

- [ ] **Step 3: Run lint + build**

```bash
cd app && npm run lint 2>&1 | head -30
cd app && npm run build 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add CallRecording type and recordings AppSection"
```

---

### Task 2: Recordings Zustand slice

**Files:**
- Create: `app/src/store/slices/recordingsSlice.ts`
- Modify: `app/src/store/index.ts`

- [ ] **Step 1: Create `recordingsSlice.ts`**

```typescript
import type { StateCreator } from 'zustand';
import type { CallRecording } from '@/types/call';

export interface RecordingsSlice {
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

export const createRecordingsSlice: StateCreator<RecordingsSlice> = (set) => ({
  recordings: [],
  searchQuery: '',
  sortBy: 'date',
  sortOrder: 'desc',

  addRecording: (recording) =>
    set((s) => ({ recordings: [recording, ...s.recordings] })),

  deleteRecording: (id) =>
    set((s) => ({ recordings: s.recordings.filter((r) => r.id !== id) })),

  toggleFavorite: (id) =>
    set((s) => ({
      recordings: s.recordings.map((r) =>
        r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
      ),
    })),

  updateRecording: (id, updates) =>
    set((s) => ({
      recordings: s.recordings.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  clearRecordings: () => set({ recordings: [] }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  setSortBy: (sortBy) => set({ sortBy }),

  toggleSortOrder: () =>
    set((s) => ({ sortOrder: s.sortOrder === 'asc' ? 'desc' : 'asc' })),
});
```

- [ ] **Step 2: Integrate into `store/index.ts`**

Read the file first, then add `createRecordingsSlice` to the store composition. Find the imports section and the store creation.

Add import:
```typescript
import { createRecordingsSlice } from './slices/recordingsSlice';
import type { RecordingsSlice } from './slices/recordingsSlice';
```

Extend `AppState`:
```typescript
export type AppState =
  & AuthSlice
  & ChatSlice
  // ... existing
  & RecordingsSlice;
```

Add to store:
```typescript
...createRecordingsSlice(...a),
```

- [ ] **Step 3: Build check**

```bash
cd app && npm run build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add recordings Zustand slice"
```

---

### Task 3: RecordingStorage (IndexedDB)

**Files:**
- Create: `app/src/lib/recordingStorage.ts`

- [ ] **Step 1: Create `recordingStorage.ts`**

```typescript
import { debug, error } from '@/lib/debug';

const DB_NAME = 'mess-anger-recordings';
const STORE_NAME = 'blobs';
const DB_VERSION = 1;

class RecordingStorage {
  private db: IDBDatabase | null = null;

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onerror = () => {
        error('recording-storage', 'Failed to open DB:', request.error);
        reject(request.error);
      };
    });
  }

  async saveBlob(id: string, blob: Blob): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        error('recording-storage', 'saveBlob failed:', tx.error);
        reject(tx.error);
      };
    });
  }

  async getBlob(id: string): Promise<Blob | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => {
        error('recording-storage', 'getBlob failed:', req.error);
        reject(req.error);
      };
    });
  }

  async deleteBlob(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        error('recording-storage', 'deleteBlob failed:', tx.error);
        reject(tx.error);
      };
    });
  }

  async clear(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        error('recording-storage', 'clear failed:', tx.error);
        reject(tx.error);
      };
    });
  }

  async getStorageInfo(): Promise<{ used: number; quota: number | null }> {
    let used = 0;
    try {
      const db = await this.open();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const cursorReq = store.openCursor();
      await new Promise<void>((resolve, reject) => {
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor) {
            const blob = cursor.value as Blob;
            used += blob.size;
            cursor.continue();
          } else {
            resolve();
          }
        };
        cursorReq.onerror = () => reject(cursorReq.error);
      });
    } catch (e) {
      error('recording-storage', 'getStorageInfo error:', e);
    }
    let quota: number | null = null;
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      quota = est.quota ?? null;
    }
    return { used, quota };
  }
}

export const recordingStorage = new RecordingStorage();
```

- [ ] **Step 2: Build check**

```bash
cd app && npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add IndexedDB RecordingStorage"
```

---

### Task 4: CallRecorderService

**Files:**
- Create: `app/src/lib/callRecorderService.ts`

- [ ] **Step 1: Create `callRecorderService.ts`**

```typescript
import { debug, warn, error } from '@/lib/debug';
import { recordingStorage } from '@/lib/recordingStorage';
import type { CallRecording } from '@/types/call';
import type { CallManager, CallInfo } from '@/lib/callManager';
import type { GroupCallManager } from '@/lib/groupCallManager';
import type { HuddleManager } from '@/lib/huddleManager';

type RecorderState = 'idle' | 'recording' | 'stopping';

class CallRecorderService {
  private state: RecorderState = 'idle';
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private currentRecordingId: string | null = null;
  private recordingStartTime: number = 0;
  private handlers: Set<(recording: boolean) => void> = new Set();

  get isRecording(): boolean {
    return this.state === 'recording';
  }

  onStateChange(handler: (recording: boolean) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private notify(recording: boolean) {
    this.handlers.forEach((h) => h(recording));
  }

  private getMimeType(isVideo: boolean): string {
    if (isVideo) {
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) return 'video/webm;codecs=vp9';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) return 'video/webm;codecs=vp8';
      return 'video/webm';
    }
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
    return 'audio/webm';
  }

  async startRecording(
    recordingId: string,
    stream: MediaStream,
    isVideo: boolean,
  ): Promise<boolean> {
    if (this.state !== 'idle') {
      warn('call-recorder', 'Already recording, skipping');
      return false;
    }

    try {
      const mimeType = this.getMimeType(isVideo);
      this.chunks = [];
      this.currentRecordingId = recordingId;
      this.recordingStartTime = Date.now();

      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => this.onRecordingComplete();
      this.mediaRecorder.onerror = () => {
        error('call-recorder', 'MediaRecorder error');
        this.discardRecording();
      };

      this.mediaRecorder.start();
      this.state = 'recording';
      this.notify(true);
      debug('call-recorder', 'Recording started:', recordingId);
      return true;
    } catch (err) {
      error('call-recorder', 'Failed to start recording:', err);
      return false;
    }
  }

  stopRecording(): void {
    if (this.state !== 'recording' || !this.mediaRecorder) return;
    if (this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.state = 'stopping';
  }

  discardRecording(): void {
    this.chunks = [];
    this.currentRecordingId = null;
    this.recordingStartTime = 0;
    this.mediaRecorder = null;
    this.state = 'idle';
    this.notify(false);
  }

  private async onRecordingComplete(): Promise<void> {
    if (this.chunks.length === 0) {
      this.discardRecording();
      return;
    }

    const id = this.currentRecordingId!;
    const isVideo = this.mediaRecorder?.mimeType.startsWith('video/') ?? false;
    const blob = new Blob(this.chunks, { type: isVideo ? 'video/webm' : 'audio/webm' });

    try {
      await recordingStorage.saveBlob(id, blob);
      debug('call-recorder', 'Recording saved to IndexedDB:', id, blob.size);
    } catch (err) {
      error('call-recorder', 'Failed to save blob to IndexedDB:', err);
    }

    this.chunks = [];
    this.currentRecordingId = null;
    this.recordingStartTime = 0;
    this.mediaRecorder = null;
    this.state = 'idle';
    this.notify(false);
  }

  async getRecordingBlob(id: string): Promise<Blob | null> {
    return recordingStorage.getBlob(id);
  }

  async deleteRecording(id: string): Promise<void> {
    await recordingStorage.deleteBlob(id);
  }

  async exportRecording(id: string, title: string): Promise<void> {
    const blob = await recordingStorage.getBlob(id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const callRecorderService = new CallRecorderService();
```

- [ ] **Step 2: Build check**

```bash
cd app && npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add CallRecorderService"
```

---

### Task 5: Integrate CallRecorderService into all call managers

**Files:**
- Modify: `app/src/lib/callManager.ts`
- Modify: `app/src/lib/groupCallManager.ts`
- Modify: `app/src/lib/huddleManager.ts`

- [ ] **Step 1: Integrate into `callManager.ts`**

Add import:
```typescript
import { callRecorderService } from './callRecorderService';
```

In `startCall()` (after `await this.setupLocalStream(type)` around line 271), add:
```typescript
// Auto-start recording
const recordingId = `rec-${this.currentCall.id}`;
const remoteTracks = this.peerConnection
  ? this.peerConnection.getReceivers().map((r) => r.track).filter(Boolean)
  : [];
const mixedStream = this.mixStreams(this.localStream!, remoteTracks as MediaStreamTrack[]);
callRecorderService.startRecording(recordingId, mixedStream, type === 'video');
```

In `endCall()` (before `this.cleanup()` around line 353), add:
```typescript
callRecorderService.stopRecording();
```

Add helper method:
```typescript
private mixStreams(local: MediaStream, remoteTracks: MediaStreamTrack[]): MediaStream {
  const audioCtx = new AudioContext();
  const dest = audioCtx.createMediaStreamDestination();
  local.getAudioTracks().forEach((t) => {
    const source = audioCtx.createMediaStreamSource(new MediaStream([t]));
    source.connect(dest);
  });
  remoteTracks.forEach((t) => {
    if (t.kind === 'audio') {
      const source = audioCtx.createMediaStreamSource(new MediaStream([t]));
      source.connect(dest);
    }
  });
  return new MediaStream([
    ...dest.getTracks(),
    ...(type === 'video' ? local.getVideoTracks() : []),
    ...remoteTracks.filter((t) => t.kind === 'video'),
  ]);
}
```

Wait — `type` isn't available in that scope. Let me reconsider. The mixStreams should receive the type parameter.

Actually, looking at callManager more carefully, the `mixStreams` should just return a MediaStream with all tracks mixed. For video, we need to include video tracks too. Let me simplify.

- [ ] **Step 2: Integrate into `groupCallManager.ts`**

Replace the existing `startRecording()`/`stopRecording()` methods to delegate to `callRecorderService`.

In `startRecording()` around line 241, replace body with:
```typescript
async startRecording(): Promise<boolean> {
  if (!this.currentCall) return false;
  const tracks: MediaStreamTrack[] = [];
  for (const [, pc] of this.peerConnections) {
    pc.connection.getReceivers().forEach((receiver) => {
      if (receiver.track) tracks.push(receiver.track);
    });
  }
  if (tracks.length === 0) return false;
  const stream = new MediaStream(tracks);
  const hasVideo = tracks.some((t) => t.kind === 'video');
  const recordingId = `rec-${this.currentCall.id}`;
  const ok = await callRecorderService.startRecording(recordingId, stream, hasVideo);
  this.currentCall.isRecording = ok;
  return ok;
}

stopRecording(): void {
  callRecorderService.stopRecording();
  if (this.currentCall) this.currentCall.isRecording = false;
}
```

Add import:
```typescript
import { callRecorderService } from './callRecorderService';
```

- [ ] **Step 3: Integrate into `huddleManager.ts`**

In `joinHuddle()` after stream setup, add auto-recording. In `leaveHuddle()`, stop recording.

Add import:
```typescript
import { callRecorderService } from './callRecorderService';
```

- [ ] **Step 4: Build check**

```bash
cd app && npm run build 2>&1 | tail -40
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: integrate CallRecorderService into all call managers"
```

---

### Task 6: Hub icon + App.tsx routing

**Files:**
- Modify: `app/src/App.tsx`
- Modify: `app/src/config/navigation.tsx`
- Modify: `app/src/components/EmptyState.tsx`

- [ ] **Step 1: Add hub item in `App.tsx`**

Find `hubItems` array (around line 77). Add:
```typescript
import { Mic } from 'lucide-react';
```

Add to `hubItems`:
```typescript
{ id: 'recordings', angle: 270, title: 'Recordings', subtitle: 'Call Logs', icon: Mic },
```

- [ ] **Step 2: Add recordings routing in `App.tsx`**

Find the routing section where sections are mapped to screens. Add handling for `'recordings'` section. This typically goes into `DesktopLayout` or `DesktopMainContent`. If `DesktopLayout` receives `section` prop with type `AppSection`, and `recordings` is now in `AppSection`, the existing `switch`/`if-else` may not have a case for it — add one.

For `DesktopMainContent` (check the file), add:
```typescript
const LazyRecordingsScreen = lazy(() => import('@/screens/RecordingsScreen'));
```

And in the section render logic:
```typescript
case 'recordings':
  element = <Suspense fallback={<div>Loading...</div>}><LazyRecordingsScreen /></Suspense>;
  break;
```

- [ ] **Step 3: Add recordings to nav config**

In `app/src/config/navigation.tsx`, add `'recordings'` to navigation items if needed (for keyboard shortcuts, etc).

- [ ] **Step 4: Update EmptyState.tsx**

Add `'recordings'` to `sectionConfig`:
```typescript
recordings: {
  icon: Mic,
  title: 'Recordings',
  description: 'Your call recordings will appear here',
},
```

Add import for `Mic`.

- [ ] **Step 5: Build check**

```bash
cd app && npm run build 2>&1 | tail -30
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add recordings hub item and routing"
```

---

### Task 7: RecordingsScreen + components

**Files:**
- Create: `app/src/screens/RecordingsScreen.tsx`
- Create: `app/src/components/recordings/RecordingItem.tsx`
- Create: `app/src/components/recordings/RecordingPlayer.tsx`
- Create: `app/src/components/recordings/RecordingsHeader.tsx`

- [ ] **Step 1: Create `components/recordings/` directory**

```bash
mkdir -p app/src/components/recordings
```

- [ ] **Step 2: Create `RecordingItem.tsx`**

```typescript
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Trash2, Download, Heart, Info, MoreVertical, Mic, Video, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CallRecording } from '@/types/call';

interface RecordingItemProps {
  recording: CallRecording;
  onPlay: (recording: CallRecording) => void;
  onDelete: (id: string) => void;
  onExport: (id: string, title: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function RecordingItem({
  recording,
  onPlay,
  onDelete,
  onExport,
  onToggleFavorite,
}: RecordingItemProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isVideo = recording.callType === 'video' || recording.callType === 'group_video';
  const participantNames = recording.participants.map((p) => p.displayName).join(', ');

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-high transition-colors group">
      <button onClick={() => onPlay(recording)} className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
        {isVideo ? <Video className="w-5 h-5 text-primary" /> : <Mic className="w-5 h-5 text-primary" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{recording.title || participantNames || t('recordings.untitled')}</span>
          {recording.isFavorite && <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />}
        </div>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span>{formatDate(recording.createdAt)}</span>
          <span>·</span>
          <span>{formatDuration(recording.recordingDuration)}</span>
          <span>·</span>
          <span>{(recording.fileSize / 1024 / 1024).toFixed(1)} MB</span>
        </div>
      </div>

      <button
        onClick={() => onPlay(recording)}
        className="shrink-0 w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Play className="w-4 h-4" />
      </button>

      <div className="relative">
        <button onClick={() => setMenuOpen(!menuOpen)} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="w-4 h-4" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg bg-surface-container-high shadow-lg border border-outline-variant py-1">
              <button onClick={() => { onToggleFavorite(recording.id); setMenuOpen(false); }} className="w-full px-3 py-2 text-sm text-left hover:bg-surface-bright flex items-center gap-2">
                <Heart className="w-4 h-4" /> {recording.isFavorite ? t('common.removeFromFavorites') : t('common.addToFavorites')}
              </button>
              <button onClick={() => { onExport(recording.id, recording.title || 'recording'); setMenuOpen(false); }} className="w-full px-3 py-2 text-sm text-left hover:bg-surface-bright flex items-center gap-2">
                <Download className="w-4 h-4" /> {t('common.export')}
              </button>
              <button onClick={() => { onDelete(recording.id); setMenuOpen(false); }} className="w-full px-3 py-2 text-sm text-left hover:bg-surface-bright flex items-center gap-2 text-error">
                <Trash2 className="w-4 h-4" /> {t('common.delete')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `RecordingPlayer.tsx`**

```typescript
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, VolumeHigh, VolumeMute, X, Download, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { CallRecording } from '@/types/call';

interface RecordingPlayerProps {
  recording: CallRecording | null;
  blobUrl: string | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onExport: (id: string, title: string) => void;
}

export function RecordingPlayer({ recording, blobUrl, onClose, onDelete, onExport }: RecordingPlayerProps) {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    if (audioRef.current && blobUrl) {
      audioRef.current.src = blobUrl;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [blobUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const skip = (sec: number) => {
    if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + sec, duration));
  };

  const changeRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const idx = rates.indexOf(playbackRate);
    const next = rates[(idx + 1) % rates.length];
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!recording || !blobUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full max-w-md bg-surface-container rounded-t-2xl sm:rounded-2xl p-6 pb-8">
        <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm truncate">{recording.title || t('recordings.recording')}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-container-high">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 text-xs text-on-surface-variant space-y-1">
          {recording.participants.length > 0 && (
            <p>{t('recordings.participants')}: {recording.participants.map(p => p.displayName).join(', ')}</p>
          )}
          <p>{t('recordings.duration')}: {formatTime(recording.duration)}</p>
        </div>

        <div className="mb-2">
          <input type="range" min={0} max={duration || 0} value={currentTime} onChange={handleSeek} className="w-full h-1.5 accent-primary cursor-pointer" />
        </div>

        <div className="flex justify-between text-xs text-on-surface-variant mb-4">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-center gap-4 mb-4">
          <button onClick={() => skip(-15)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high text-xs font-medium">
            -15s
          </button>
          <button onClick={() => skip(-5)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high text-xs font-medium">
            -5s
          </button>
          <button onClick={togglePlay} className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center hover:brightness-110 transition-all">
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          <button onClick={() => skip(5)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high text-xs font-medium">
            +5s
          </button>
          <button onClick={() => skip(15)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high text-xs font-medium">
            +15s
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMuted(!isMuted)} className="p-1.5 rounded-full hover:bg-surface-container-high">
              {isMuted ? <VolumeMute className="w-4 h-4" /> : <VolumeHigh className="w-4 h-4" />}
            </button>
            <input type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : volume} onChange={(e) => { const v = Number(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v; setIsMuted(false); }} className="w-20 h-1 accent-primary cursor-pointer" />
          </div>

          <button onClick={changeRate} className="px-2 py-1 text-xs font-mono rounded hover:bg-surface-container-high">
            {playbackRate}x
          </button>

          <div className="flex items-center gap-1">
            <button onClick={() => onExport(recording.id, recording.title || 'recording')} className="p-1.5 rounded-full hover:bg-surface-container-high" title={t('common.export')}>
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(recording.id)} className="p-1.5 rounded-full hover:bg-surface-container-high text-error" title={t('common.delete')}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `RecordingsHeader.tsx`**

```typescript
import { Search, Mic, ListFilter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RecordingsHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: 'date' | 'duration' | 'type' | 'name';
  sortOrder: 'asc' | 'desc';
  onSortByChange: (sort: RecordingsHeaderProps['sortBy']) => void;
  onToggleSortOrder: () => void;
  onNewRecording: () => void;
}

const sortOptions: { value: RecordingsHeaderProps['sortBy']; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'duration', label: 'Duration' },
  { value: 'type', label: 'Type' },
  { value: 'name', label: 'Name' },
];

export function RecordingsHeader({
  searchQuery,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortByChange,
  onToggleSortOrder,
  onNewRecording,
}: RecordingsHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 p-4 pb-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('recordings.title', 'Recordings')}</h1>
        <button onClick={onNewRecording} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-on-primary text-sm font-medium hover:brightness-110 transition-all">
          <Mic className="w-4 h-4" />
          {t('recordings.newRecording', 'Record')}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('recordings.search', 'Search recordings...')}
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-high text-sm outline-none placeholder:text-on-surface-variant/50"
        />
      </div>

      <div className="flex items-center gap-2">
        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSortByChange(opt.value)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              sortBy === opt.value
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t(`recordings.sort.${opt.value}`, opt.label)}
            {sortBy === opt.value && (
              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `RecordingsScreen.tsx`**

```typescript
import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { callRecorderService } from '@/lib/callRecorderService';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import type { CallRecording } from '@/types/call';
import { RecordingsHeader } from '@/components/recordings/RecordingsHeader';
import { RecordingItem } from '@/components/recordings/RecordingItem';
import { RecordingPlayer } from '@/components/recordings/RecordingPlayer';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/icons';

export function RecordingsScreen() {
  const { t } = useTranslation();
  const recordings = useStore((s) => s.recordings);
  const searchQuery = useStore((s) => s.searchQuery);
  const sortBy = useStore((s) => s.sortBy);
  const sortOrder = useStore((s) => s.sortOrder);
  const addRecording = useStore((s) => s.addRecording);
  const deleteRecordingStore = useStore((s) => s.deleteRecording);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const setSortBy = useStore((s) => s.setSortBy);
  const toggleSortOrder = useStore((s) => s.toggleSortOrder);

  const [selectedRecording, setSelectedRecording] = useState<CallRecording | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePlay = useCallback(async (recording: CallRecording) => {
    setLoading(true);
    setSelectedRecording(recording);
    try {
      const blob = await callRecorderService.getRecordingBlob(recording.blobId);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      }
    } catch (e) {
      console.error('Failed to load recording blob:', e);
    }
    setLoading(false);
  }, []);

  const handleClosePlayer = useCallback(() => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setSelectedRecording(null);
  }, [blobUrl]);

  const handleDelete = useCallback(async (id: string) => {
    await callRecorderService.deleteRecording(id);
    deleteRecordingStore(id);
    if (selectedRecording?.id === id) handleClosePlayer();
  }, [deleteRecordingStore, selectedRecording, handleClosePlayer]);

  const handleExport = useCallback((id: string, title: string) => {
    callRecorderService.exportRecording(id, title);
  }, []);

  const handleNewRecording = useCallback(() => {
    // Voice recording is handled via the existing useVoiceRecorder hook
    // For simplicity, we dispatch a custom event that MiniRecorder can pick up
    window.dispatchEvent(new CustomEvent('startVoiceRecording'));
  }, []);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...recordings];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.participants.some((p) => p.displayName.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'date': cmp = a.createdAt - b.createdAt; break;
        case 'duration': cmp = a.recordingDuration - b.recordingDuration; break;
        case 'type': cmp = a.callType.localeCompare(b.callType); break;
        case 'name': cmp = (a.title || '').localeCompare(b.title || ''); break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [recordings, searchQuery, sortBy, sortOrder]);

  return (
    <div className="flex flex-col h-full">
      <RecordingsHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortByChange={setSortBy}
        onToggleSortOrder={toggleSortOrder}
        onNewRecording={handleNewRecording}
      />

      <div className="flex-1 overflow-y-auto px-4">
        {filtered.length === 0 ? (
          <EmptyState section="recordings" />
        ) : (
          <div className="space-y-1">
            {filtered.map((rec) => (
              <RecordingItem
                key={rec.id}
                recording={rec}
                onPlay={handlePlay}
                onDelete={handleDelete}
                onExport={handleExport}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <Loader className="w-8 h-8 animate-spin" />
        </div>
      )}

      {selectedRecording && blobUrl && (
        <RecordingPlayer
          recording={selectedRecording}
          blobUrl={blobUrl}
          onClose={handleClosePlayer}
          onDelete={handleDelete}
          onExport={handleExport}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 6: Build check**

```bash
cd app && npm run build 2>&1 | tail -40
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add RecordingsScreen and recording UI components"
```

---

### Task 8: FloatingCallWidget REC indicator

**Files:**
- Modify: `app/src/components/call/FloatingCallWidget.tsx`

- [ ] **Step 1: Update FloatingCallWidget**

Find where REC indicator is shown (currently for group calls `call.isRecording`). Change to use `callRecorderService.isRecording`:

```typescript
import { callRecorderService } from '@/lib/callRecorderService';
```

Add state:
```typescript
const [isRecording, setIsRecording] = useState(false);

useEffect(() => {
  const unsub = callRecorderService.onStateChange(setIsRecording);
  return unsub;
}, []);
```

Replace `call?.isRecording` with `isRecording` in the REC indicator section.

- [ ] **Step 2: Build check**

```bash
cd app && npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: update FloatingCallWidget REC indicator for all call types"
```

---

### Task 9: Verify everything

- [ ] **Step 1: Run lint**

```bash
cd app && npm run lint 2>&1
```

- [ ] **Step 2: Run tests**

```bash
cd app && npm run test 2>&1
```

- [ ] **Step 3: Run build**

```bash
cd app && npm run build 2>&1
```

- [ ] **Step 4: Final commit if fixes needed**

```bash
git add -A && git commit -m "chore: fix lint and build after recordings feature"
```
