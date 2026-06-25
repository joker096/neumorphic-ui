# Chat Swipe Actions — Implementation Plan

**Goal:** Add swipe-left (archive/unarchive) and swipe-right (voice/video call) gestures to chat list items.

**Architecture:** Two swipe directions on ChatListItem: left reveals archive, right reveals voice/video. Archive button is context-aware. Voice/video call `onCall`/`onVideoCall` callbacks threaded from App.tsx.

**Tech Stack:** React, Framer Motion, Zustand

---

### Task 1: Add onCall/onVideoCall to ChatListView and ChatListItem

**Files:**
- Modify: `src/components/ChatListView.tsx`
- Modify: `src/App.tsx`

**Step 1.1: Add call props to ChatListViewProps**
```diff
 interface ChatListViewProps {
   ...
   toggleArchive: (id: string | number) => void;
+  onCall: (name: string, color?: string) => void;
+  onVideoCall: (name: string, color?: string) => void;
   contacts: any[];
```

Pass them through to ChatListItem in both the chats and channels rendering sections.

**Step 1.2: Wire callbacks in App.tsx**
Find the `<ChatWorkspace>` and check how ChatListView receives props. If ChatListView is used via ChatListWorkspace → ChatWorkspace, add `onCall`/`onVideoCall` through the chain.

---

### Task 2: Implement swipe gestures in ChatListItem

**File:** `src/components/ChatListView.tsx` (inline ChatListItem, lines 87-210)

Replace the current single-direction swipe with bidirectional swipe:
- `dragElastic={{ left: 0.5, right: 0.5 }}` (allow both directions)
- Left swipe (< -70px): show archive button
- Right swipe (> 70px): show voice/video buttons (non-group only)

Add left-side voice/video buttons and right-side archive button with context-aware label.

---

### Task 3: Add translation key for unarchive

**File:** `src/locales/en.json`
Add: `"chat.unarchive": "Unarchive"`

Also add to ru.json: `"chat.unarchive": "Разархивировать"`
