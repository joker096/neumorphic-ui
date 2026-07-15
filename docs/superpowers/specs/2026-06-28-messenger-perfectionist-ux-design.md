# Messenger UX Perfectionist: Micro-Polish & Structural Improvements

**Date:** 2026-06-28
**Status:** Design Spec
**Target:** Mess&Anger (neumorphic-ui) messenger app

---

## 1. Design Read

Reading this as: a fully-featured encrypted messenger (Mess&Anger) with neumorphic dark/light design, React + Tailwind + Motion. The app already has rich features (E2EE, scheduling, stickers, voice, stories, channels, bots, mesh radar) but lacks the micro-polish that makes Telegram/WhatsApp feel "expensive" — grouped bubbles, date separators, scroll-to-bottom, swipe-to-reply, double-tap reactions, and navigation consolidation.

Audience: privacy-conscious users, prosumers, teams. Vibe: dark-tech/industrial with orange accent. Moving toward: premium-polished messenger.

---

## 2. Three Dials

- **DESIGN_VARIANCE:** 5 (tighten from 8 — messenger UX needs predictability)
- **MOTION_INTENSITY:** 5 (micro-interactions added, but restrained)
- **VISUAL_DENSITY:** 4 (same — messenger is already airy)

---

## 3. Approaches

### Approach A: Micro-Polish (Recommended as Phase 1)
Focus on tactile UX patterns that make the chat feel responsive and premium. Minimal code changes, maximal perceptual impact.

**Trade-offs:**
- + Fast to implement (1-2 sessions)
- + High user-perceptible quality jump
- - Doesn't fix structural issues (nav density)

### Approach B: Structural Redesign (Recommended as Phase 2)
Consolidate navigation, add pinned chats, multi-select mode, context menus. Restructure information architecture.

**Trade-offs:**
- + Reduces cognitive load (7 tabs → 4)
- + Adds power-user features (multi-select, pinning)
- - More invasive changes across multiple files

### Approach C: Full Telegram Parity
All features: message editing, disappearing messages, forwarding, polls, custom wallpapers, inline search.

**Trade-offs:**
- + Feature-complete competitor
- - Extremely large scope (multiple weeks)
- - Risk of feature bloat

**Recommendation:** A (now) + B (next) — micro-polish first for immediate UX lift, then structural.

---

## 4. Design Sections

### Section 1: Message Bubble Grouping

**Problem:** Every message is an independent bubble with full rounded corners and bottom margin (`mb-4`). Telegram/WhatsApp group consecutive messages from the same sender within ~5 minutes into a single "cluster" — only the last bubble has the tail (`rounded-br-sm`/`rounded-bl-sm`), middle bubbles are flat on that side, and the group shares a single timestamp.

**Solution:**

1. In `ChatPreviewLayer.tsx`, add a pre-processing step before rendering:
   - Walk through `filteredHistory`
   - Group consecutive messages with same `sender` within 5-minute window
   - Assign `groupPosition`: `"first"` | `"middle"` | `"last"` | `"single"`

2. Visual rules per position:
   - `"single"`: current full bubble (rounded everywhere + tail)
   - `"first"`: rounded top corners, flat bottom corners on sender side
   - `"middle"`: flat left/right on sender side
   - `"last"`: flat top corners on sender side, rounded bottom + tail
   - `mb-1` between grouped messages, `mb-4` between groups

3. Timestamp only shown on last message in group
4. Reactions bar only on last message in group
5. Reply/Save actions available per-message (not per-group)

**Files affected:**
- `src/components/ChatPreviewLayer.tsx` — message rendering logic

**Pseudocode (message grouping):**
```ts
function groupMessages(history: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = []
  for (const msg of history) {
    const prev = groups[groups.length - 1]?.messages?.at(-1)
    if (prev && prev.sender === msg.sender && timeDiff(prev.time, msg.time) < 5 * 60 * 1000) {
      groups[groups.length - 1].messages.push(msg)
    } else {
      groups.push({ messages: [msg] })
    }
  }
  return groups
}
```

**Test:** consecutive messages from "me" should render as connected bubbles.

---

### Section 2: Date Separators

**Problem:** No visual separation between messages sent on different days. The chat scroll is a continuous stream of bubbles.

**Solution:**

1. Between message groups from different calendar days, insert a date separator:
   - Thin `<hr>` line with centered text overlay
   - Text: "Today", "Yesterday", or "June 28, 2026" (locale-aware via `t()`)
   - `sticky top-0 z-10` so it pins when scrolling through that day's messages

2. Implementation: in the grouped message render loop, before each group where the day changes, render:
```tsx
<div className="sticky top-0 z-10 flex items-center gap-3 py-2">
  <div className="flex-1 h-px bg-white/10" />
  <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 shrink-0 px-2">
    {formatDateLabel(msg.time)}
  </span>
  <div className="flex-1 h-px bg-white/10" />
</div>
```

3. `formatDateLabel`:
   - Same day as latest message → "Today"
   - 1 day before → "Yesterday"
   - Within current year → "June 28"
   - Previous year → "June 28, 2025"

**Files affected:**
- `src/components/ChatPreviewLayer.tsx` — render loop

**Test:** messages from mock data with different dates show correct separators.

---

### Section 3: Scroll-to-Bottom FAB

**Problem:** When scrolled up in a long chat, users must manually scroll to bottom to see new messages or send a new one. Telegram/WhatsApp show a floating "jump to bottom" button with an unread count badge.

**Solution:**

1. Floating action button:
   - Appears when scroll position is > 200px from bottom
   - Orange pill shape: `rounded-full` with down arrow icon
   - Shows unread count badge (messages received while scrolled up)
   - Positioned at bottom-center of message area, above input bar
   - Animate with spring: `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}`

2. State management:
   - `isScrolledUp: boolean` — tracked via scroll event on VirtualizedMessageList
   - `unreadSinceScroll: number` — increments when new messages arrive while scrolled up
   - On FAB click: scroll to bottom, reset counter

3. Track scroll position via TanStack Virtual's `scrollElement`:
```tsx
const [isScrolledUp, setIsScrolledUp] = useState(false)
const virtualizer = useVirtualizer({ ... })
// On scroll, check if near bottom
```

**Files affected:**
- `src/components/chat/VirtualizedMessageList.tsx` — scroll tracking
- `src/components/ChatPreviewLayer.tsx` — FAB rendering

**Test:** scroll up in chat → FAB appears. Click FAB → scrolls to bottom.

---

### Section 4: Message Status Animation

**Problem:** Message status changes instantly (single check → double check → blue). No visual feedback that something happened.

**Solution:**

1. Sent → Delivered:
   - Single check fades out (`opacity: 1 → 0`, 200ms)
   - Double check fades in (`opacity: 0 → 1`, 200ms) with slight scale bounce

2. Delivered → Read:
   - Double check color transitions from current → blue (300ms)
   - Subtle glow pulse on the blue check at the end

3. Implementation with Motion:
```tsx
<AnimatePresence mode="wait">
  {status === 'sent' && (
    <motion.div key="sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Check size={12} />
    </motion.div>
  )}
  {status === 'delivered' && (
    <motion.div key="delivered" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
      <CheckCheck size={12} />
    </motion.div>
  )}
  {status === 'read' && (
    <motion.div key="read" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <CheckCheck size={12} className="text-blue-400" />
    </motion.div>
  )}
</AnimatePresence>
```

4. Sending state (before `sent`): subtle pulsing clock icon or animated dots, shown for messages with no status or `status === "sending"`.

**Files affected:**
- `src/components/ChatPreviewLayer.tsx` — status rendering (line ~472-484)

**Test:** message status transitions animate smoothly.

---

### Section 5: Double-Tap Reaction

**Problem:** Adding a reaction requires: hover → see + button → click → pick emoji from popup. 3-step interaction for a common action. Telegram: double-tap → 👍 instantly.

**Solution:**

1. Double-tap handler on message bubble:
   - Track last tap timestamp via `useRef`
   - If two taps within < 300ms → toggle 👍 reaction

```tsx
const lastTapRef = useRef<number>(0)
const handleDoubleTap = (msgId: string) => {
  const now = Date.now()
  if (now - lastTapRef.current < 300) {
    handleReactionMessage(msgId, '👍')
    lastTapRef.current = 0
  } else {
    lastTapRef.current = now
  }
}
```

2. Visual feedback: brief scale bounce `scale: [1, 0.95, 1.05, 1]` over 300ms

3. Most-used emoji: store per-user preference, fall back to 👍

**Files affected:**
- `src/components/ChatPreviewLayer.tsx` — message bubble onClick

**Test:** double-tap on message → 👍 reaction toggles.

---

### Section 6: Swipe-to-Reply

**Problem:** Replying requires hover → see reply button → click → type. 3 steps. Telegram: swipe right on message → instantly enters reply mode.

**Solution:**

1. Add `drag="x"` with `dragDirectionLock` to received message bubbles
   - Swipe right > 60px → triggers reply
   - Visual indicator: blue accent line reveals on the leading edge of the bubble
   - Haptic-like feedback: `spring` animation with slight overshoot

2. Implementation:
   - Wrap message bubble container in `motion.div` with drag
   - On `onDragEnd`, if `offset.x > 60`, call `onReply(msg)`
   - Show a blue left-border accent during drag:
     `<div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-500 opacity-0" style={{ opacity: dragProgress }} />`

**Constraint:** Only for received messages (`isMe === false`). Sent messages keep existing tap behavior.

**Files affected:**
- `src/components/ChatPreviewLayer.tsx` — message rendering per-message

**Test:** swipe right on received message → reply target set.

---

### Section 7: Voice Recording — Swipe-to-Cancel

**Problem:** During voice recording, the ONLY way to cancel is... there isn't one mentioned. The `onPointerDown` starts recording immediately. Telegram/WhatsApp: hold to record, swipe left/down to cancel.

**Solution:**

1. While recording (`isRecordingVoice === true`), show swipe-to-cancel zone:
   - A `<div>` at the top of the recording UI with red background and "Slide to cancel" label
   - Track vertical drag distance via Motion `drag="y"`
   - If dragged down > 80px → cancel recording with haptic feedback

2. Alternative: horizontal swipe left (more natural for one-handed use):
   - Mic icon transforms to a cancellable state
   - Dragging left past threshold shows red "Cancel" label
   - Release outside threshold → discard recording

3. `LiveVoiceRecorder` already accepts `onReRecord` and `onCancel`:

**Files affected:**
- `src/components/LiveVoiceRecorder.tsx` — add swipe-to-cancel overlay
- `src/components/ChatInputOverlay.tsx` — wire up cancel handler

**Test:** hold mic → swipe down/left → recording cancelled without sending.

---

### Section 8: Navigation Consolidation (7 Tabs → 4)

**Problem:** Bottom nav has 7 items: Chats, Company, Contacts, Calls, Recordings, Radar, Settings. On mobile this is crowded. Telegram has 4: Chats, Calls, People, Settings.

**Solution:**

1. **New nav structure:**
   - **Chats** (MessageCircle icon) — combines Stories/Chats/Channels/Bots
   - **Calls** (Phone icon) — dialpad + call history
   - **Contacts** (Users icon) — people + company contacts
   - **Settings** (Settings icon) — settings + recordings + radar + music + aftercare

2. Moves:
   - Recordings → accessible from Settings (subsection)
   - Radar → accessible from Settings (subsection) or as a top-right icon on the Chats page
   - Company → merged into Contacts as a tab/filter ("Company" filter pill)

3. Desktop sidebar: same reduction, use the freed space for:
   - Archived chats link
   - Saved messages link
   - Folder shortcuts

**Files affected:**
- `src/components/navigation/BottomNav.tsx` — NAV_ITEMS array
- `src/components/navigation/SidebarNav.tsx` — NAV_ITEMS array
- `src/App.tsx` — view routing

**Test:** all 4 nav items work, sub-views accessible from their new parents.

---

### Section 9: Pinned Chats

**Problem:** No way to keep important chats at the top. Telegram pin feature is universally expected.

**Solution:**

1. Add `pinned: boolean` to chat data model (store)
2. Pinned chats render in a separate section above main list, with a divider
3. Pin/unpin via long-press context menu or from chat header menu
4. Max 3 pinned chats visible; "3/3 pinned" indicator when at limit
5. Visual: subtle pin icon next to name, slight background tint

**Files affected:**
- `src/store/index.ts` — add `pinned` to chat type
- `src/components/ChatListView.tsx` — pinned section rendering
- `src/components/chat-preview/ChatListItem.tsx` — pin icon

**Test:** pin a chat → appears at top with pin icon.

---

### Section 10: Multi-Select Mode

**Problem:** No bulk operations. Users can't archive/delete multiple chats at once.

**Solution:**

1. Long-press on `ChatListItem` → enters multi-select mode:
   - Checkbox circles overlay on avatar (replacing the avatar itself)
   - Selected item gets highlighted border
   - Top bar shows "2 selected" with count
   - Action buttons appear: Archive, Delete (all), Mark Read, Pin
   - Tap "X" or back to exit multi-select

2. Implementation:
   - New state in `ChatListView`: `selectedChats: Set<string | number>`
   - `ChatListItem` receives `selectMode: boolean` and `selected: boolean`
   - In select mode, `onClick` toggles selection instead of opening chat

3. Bulk actions:
   - Archive: `selectedChats.forEach(id => toggleArchive(id))`
   - Delete: show `ConfirmDialog`, then remove from state
   - Mark Read: reset unread count for selected chats

**Files affected:**
- `src/components/ChatListView.tsx` — selection state + action bar
- `src/components/chat-preview/ChatListItem.tsx` — select mode visual
- `src/components/ui/ConfirmDialog.tsx` — already exists

**Test:** long-press chat → enters selection → select multiple → bulk archive works.

---

## 5. Implementation Order (Priority)

| # | Section | Effort | Impact | Dependencies |
|---|---------|--------|--------|-------------|
| 1 | Message grouping | Medium | High | None |
| 2 | Date separators | Low | Medium | #1 (grouping) |
| 3 | Status animation | Low | Medium | None |
| 4 | Double-tap reaction | Low | Medium | None |
| 5 | Scroll-to-bottom FAB | Medium | High | None |
| 6 | Swipe-to-reply | Medium | High | #1 (grouping) |
| 7 | Swipe-to-cancel recording | Low | Low | None |
| 8 | Navigation consolidation | Medium | High | None |
| 9 | Pinned chats | Medium | Medium | None |
| 10 | Multi-select mode | High | Medium | None |

**Recommended batch 1 (micro-polish):** Items 1-7
**Recommended batch 2 (structural):** Items 8-10

---

## 6. Design Principles

1. **No feature bloat:** Every addition must remove a step from the user's flow
2. **Consistency with neumorphic design:** All additions use existing token system
3. **Accessibility:** All interactions have a tap/click equivalent (no gesture-locked features)
4. **Reduced motion respected:** All animations degrade gracefully under `prefers-reduced-motion`
5. **Existing patterns honored:** New interactions follow the app's existing Motion/Tailwind conventions

---

## 7. Spec Self-Review

- ✅ No placeholders or TODOs
- ✅ All sections internally consistent
- ✅ Scope appropriate for single implementation cycle per batch
- ✅ No ambiguity: each section has clear behavior, files affected, and test criteria

---

## 8. File Map

| File | Changes |
|------|---------|
| `ChatPreviewLayer.tsx` | Message grouping, date separators, status animation, double-tap, swipe-to-reply, scroll FAB |
| `ChatListView.tsx` | Pinned section, multi-select mode, nav consolidation |
| `ChatListItem.tsx` | Select mode visuals, pin icon |
| `VirtualizedMessageList.tsx` | Scroll position tracking for FAB |
| `LiveVoiceRecorder.tsx` | Swipe-to-cancel gesture |
| `ChatInputOverlay.tsx` | Cancel handler wiring |
| `BottomNav.tsx` | Reduce NAV_ITEMS to 4 |
| `SidebarNav.tsx` | Reduce NAV_ITEMS to 4 |
| `App.tsx` | View routing for consolidated nav |
| `store/index.ts` | Add `pinned` field to chat type |
