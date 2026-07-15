# Messenger UX Perfectionist — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply 10 micro-polish and structural UX improvements to the Mess&Anger messenger, following Telegram/WhatsApp best practices.

**Architecture:** Each improvement is a focused change to existing components. No new pages or routes. All changes within the existing React + Zustand + Motion + Tailwind stack. Batch 1 (Tasks 1-7) = micro-polish, Batch 2 (Tasks 8-10) = structural.

**Tech Stack:** React 19, TypeScript 5.8, Tailwind v4, Motion v12, TanStack Virtual v3, Zustand v5

**Design Reference:** `docs/superpowers/specs/2026-06-28-messenger-perfectionist-ux-design.md`

---

### Task 1: Message Bubble Grouping

**Files:**
- Modify: `src/components/ChatPreviewLayer.tsx`

**Goal:** Consecutive messages from the same sender within 5 minutes render as a connected group — only the last bubble has the tail, middle bubbles are flat on the sender side.

- [ ] **Step 1: Add `groupMessages` utility**

At the top of `ChatPreviewLayer.tsx`, add a function:

```tsx
type GroupPosition = 'single' | 'first' | 'middle' | 'last'

interface MessageGroup {
  messages: any[]
  groupPositions: GroupPosition[]
}

function groupMessages(history: any[]): MessageGroup[] {
  const groups: MessageGroup[] = []
  for (const msg of history) {
    const lastGroup = groups[groups.length - 1]
    const lastMsg = lastGroup?.messages?.at(-1)
    if (lastMsg && lastMsg.sender === msg.sender) {
      lastGroup.messages.push(msg)
    } else {
      groups.push({ messages: [msg], groupPositions: [] })
    }
  }
  // Assign positions
  for (const group of groups) {
    if (group.messages.length === 1) {
      group.groupPositions = ['single']
    } else {
      group.groupPositions = group.messages.map((_, i) => {
        if (i === 0) return 'first'
        if (i === group.messages.length - 1) return 'last'
        return 'middle'
      })
    }
  }
  return groups
}
```

- [ ] **Step 2: Modify the render loop to use groups**

Replace direct `.map()` of `filteredHistory` in the `<VirtualizedMessageList>` children with a grouped approach:

```tsx
const messageGroups = useMemo(() => groupMessages(filteredHistory), [filteredHistory])
```

Then render groups in the virtual list by flattening back to individual messages but passing `groupPosition`:

```tsx
const flatItems = useMemo(() => {
  return messageGroups.flatMap((group, gi) =>
    group.messages.map((msg, mi) => ({
      ...msg,
      _groupPosition: group.groupPositions[mi],
      _isFirstInGroup: mi === 0,
      _isLastInGroup: mi === group.messages.length - 1,
    }))
  )
}, [messageGroups])
```

Use `flatItems` as the `items` prop for `VirtualizedMessageList`.

- [ ] **Step 3: Update bubble styling per group position**

Inside the message render, conditionally apply corner radius based on `_groupPosition`:

```tsx
const groupPosition = msg._groupPosition as GroupPosition | undefined

const bubbleCornerClass = (() => {
  if (isMe) {
    if (groupPosition === 'single') return 'rounded-[20px] rounded-br-sm'
    if (groupPosition === 'first') return 'rounded-t-[20px] rounded-bl-[20px] rounded-br-[20px] rounded-bl-sm'
    if (groupPosition === 'middle') return 'rounded-l-[20px] rounded-r-[20px] rounded-br-[20px] rounded-bl-[20px]'
    if (groupPosition === 'last') return 'rounded-tl-[20px] rounded-tr-[20px] rounded-br-sm rounded-bl-[20px]'
    return 'rounded-[20px] rounded-br-sm'
  } else {
    if (groupPosition === 'single') return 'rounded-[20px] rounded-bl-sm'
    if (groupPosition === 'first') return 'rounded-t-[20px] rounded-br-[20px] rounded-br-sm rounded-bl-[20px]'
    if (groupPosition === 'middle') return 'rounded-r-[20px] rounded-l-[20px] rounded-bl-[20px] rounded-br-[20px]'
    if (groupPosition === 'last') return 'rounded-tr-[20px] rounded-tl-[20px] rounded-bl-sm rounded-br-[20px]'
    return 'rounded-[20px] rounded-bl-sm'
  }
})()
```

Also reduce margin: `mb-1` for `_isLastInGroup === false` (instead of `mb-4`).

- [ ] **Step 4: Only show timestamp/avatar on last message in group**

Conditionally render timestamp and delivery status only when `_isLastInGroup === true`. Same for reactions bar and action buttons.

- [ ] **Step 5: Verify in browser**

Open a chat with multiple consecutive messages. Messages from the same sender should visually merge. The group should look like a single "cluster" with connected bubbles.

- [ ] **Step 6: Commit**

```bash
git add src/components/ChatPreviewLayer.tsx
git commit -m "feat: message bubble grouping for connected chat clusters"
```

---

### Task 2: Date Separators

**Files:**
- Modify: `src/components/ChatPreviewLayer.tsx`

**Goal:** Insert date dividers ("Today", "Yesterday", "June 28") between message groups from different days.

- [ ] **Step 1: Add `formatDateLabel` utility**

```tsx
function formatDateLabel(dateStr: string): string {
  const date = new Date()
  const msgDate = parseTimeString(dateStr)
  if (!msgDate) return dateStr

  const now = new Date()
  const diffDays = Math.floor((now.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (now.getFullYear() === msgDate.getFullYear()) {
    return msgDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
  }
  return msgDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function parseTimeString(timeStr: string): Date | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})/)
  if (!match) return null
  const h = parseInt(match[1])
  const m = parseInt(match[2])
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}
```

- [ ] **Step 2: Inject date separators in the flat items**

Inside the `groupMessages` → `flatItems` pipeline, between groups from different days, inject a separator object:

```tsx
type FlatItem = any & { _isDateSeparator?: boolean; _dateLabel?: string }

const flatItems: FlatItem[] = []
let lastDateLabel = ''

for (const group of messageGroups) {
  const firstMsg = group.messages[0]
  const dateLabel = formatDateLabel(firstMsg.time)
  
  if (dateLabel !== lastDateLabel && lastDateLabel !== '') {
    flatItems.push({ _isDateSeparator: true, _dateLabel: dateLabel, id: `sep-${dateLabel}` })
  }
  lastDateLabel = dateLabel

  group.messages.forEach((msg, mi) => {
    flatItems.push({
      ...msg,
      _groupPosition: group.groupPositions[mi],
      _isFirstInGroup: mi === 0,
      _isLastInGroup: mi === group.messages.length - 1,
    })
  })
}
```

Also push a date separator before the first group (if there are any messages).

- [ ] **Step 3: Render date separators**

In the VirtualizedMessageList render function:

```tsx
if ((msg as any)._isDateSeparator) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 py-2 px-4" key={msg.id}>
      <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
      <span className={`text-[11px] font-bold uppercase tracking-widest shrink-0 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
        {(msg as any)._dateLabel}
      </span>
      <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
    </div>
  )
}
```

Note: The virtual list `estimateSize` in `VirtualizedMessageList.tsx` is fixed at 72px. Date separators are shorter (~40px). Either adjust the estimate or let overscan handle it (acceptable for now).

- [ ] **Step 4: Verify in browser**

Mock data messages should show "Today" / "Yesterday" separators between groups from different simulated days.

- [ ] **Step 5: Commit**

```bash
git add src/components/ChatPreviewLayer.tsx
git commit -m "feat: date separators between message groups"
```

---

### Task 3: Message Status Animation

**Files:**
- Modify: `src/components/ChatPreviewLayer.tsx`

**Goal:** Sent → delivered → read transitions animate smoothly (fade/scale for checkmarks, color transition for read receipt).

- [ ] **Step 1: Replace static status icon with animated version**

Find the status rendering block (lines ~472-484 in current `ChatPreviewLayer.tsx`):

```tsx
{isMe && (
  <AnimatePresence mode="wait">
    {(!deliveryReceipts || msg.status === 'sent') && (
      <motion.span
        key="sent"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.15 }}
      >
        <Check size={12} strokeWidth={2.5} />
      </motion.span>
    )}
    {deliveryReceipts && msg.status === 'delivered' && (
      <motion.span
        key="delivered"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.15 }}
      >
        <CheckCheck size={12} strokeWidth={2.5} />
      </motion.span>
    )}
    {deliveryReceipts && readReceipts && msg.status === 'read' && (
      <motion.span
        key="read"
        initial={{ opacity: 0, color: '#9ca3af' }}
        animate={{ opacity: 1, color: '#60a5fa' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <CheckCheck size={12} strokeWidth={2.5} className={isDark ? 'text-blue-400' : 'text-blue-500'} />
      </motion.span>
    )}
  </AnimatePresence>
)}
```

- [ ] **Step 2: Verify in browser**

Send a message → single check appears. After 1s → transitions to double check (fade/scale). After 1.5s → transitions to blue (color change). All smooth.

- [ ] **Step 3: Commit**

```bash
git add src/components/ChatPreviewLayer.tsx
git commit -m "feat: animated message delivery status transitions"
```

---

### Task 4: Double-Tap Reaction

**Files:**
- Modify: `src/components/ChatPreviewLayer.tsx`

**Goal:** Double-tap any message to toggle 👍 reaction (most-used emoji).

- [ ] **Step 1: Add `useRef` for last tap timestamp**

```tsx
const lastTapRef = useRef<{ time: number; msgId: string | number }>({ time: 0, msgId: 0 })
```

- [ ] **Step 2: Add `handleDoubleTap` inline in message render**

```tsx
const handleTap = (msgId: string | number) => {
  const now = Date.now()
  if (now - lastTapRef.current.time < 300 && lastTapRef.current.msgId === msgId) {
    // Double tap detected
    handleReactionMessage(msgId, '👍')
    lastTapRef.current = { time: 0, msgId: 0 }
  } else {
    lastTapRef.current = { time: now, msgId }
    // Delay to see if double-tap completes
    setTimeout(() => {
      if (lastTapRef.current.msgId === msgId && lastTapRef.current.time === now) {
        // Single tap - do nothing here (existing click behavior handles)
      }
    }, 300)
  }
}
```

Add `onClick={() => handleTap(msg.id)}` to the message bubble div.

- [ ] **Step 3: Add motion feedback**

On the bubble element, add a brief scale pulse on double-tap detection:

```tsx
<motion.div
  animate={bounce ? { scale: [1, 0.95, 1.05, 1] } : {}}
  transition={{ duration: 0.3 }}
  // ... existing props
>
```

Track bounce state: `const [bounce, setBounce] = useState(false)` and trigger it in double-tap handler.

- [ ] **Step 4: Verify in browser**

Double-tap any message → 👍 reaction appears on the reaction bar. Double-tap again → reaction count increments (or toggles if already reacted).

- [ ] **Step 5: Commit**

```bash
git add src/components/ChatPreviewLayer.tsx
git commit -m "feat: double-tap to react with thumbs up"
```

---

### Task 5: Scroll-to-Bottom FAB

**Files:**
- Modify: `src/components/chat/VirtualizedMessageList.tsx`
- Modify: `src/components/ChatPreviewLayer.tsx`

**Goal:** Floating "jump to bottom" button with unread count when scrolled up > 200px.

- [ ] **Step 1: Expose scroll position from VirtualizedMessageList**

Add scroll tracking callback:

```tsx
interface VirtualizedMessageListProps<T> {
  // ... existing props
  onScrollPosition?: (offset: number, isNearBottom: boolean) => void
}

// Inside component, add scroll handler:
const handleScroll = useCallback(() => {
  const el = scrollRef.current
  if (!el || !onScrollPosition) return
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  onScrollPosition(el.scrollTop, distanceFromBottom < 200)
}, [onScrollPosition])

// Attach to scroll event
useEffect(() => {
  const el = scrollRef.current
  if (!el) return
  el.addEventListener('scroll', handleScroll, { passive: true })
  return () => el.removeEventListener('scroll', handleScroll)
}, [handleScroll])
```

- [ ] **Step 2: Add FAB state and rendering in ChatPreviewLayer**

```tsx
const [scrollPos, setScrollPos] = useState({ scrolledUp: false, unreadSinceScroll: 0 })

// Track new messages while scrolled up
const prevHistoryLength = useRef(chat.history?.length || 0)
useEffect(() => {
  const currentLen = chat.history?.length || 0
  if (scrollPos.scrolledUp && currentLen > prevHistoryLength.current) {
    setScrollPos(prev => ({ ...prev, unreadSinceScroll: prev.unreadSinceScroll + (currentLen - prevHistoryLength.current) }))
  }
  prevHistoryLength.current = currentLen
}, [chat.history?.length])
```

Render FAB (inside the VirtualizedMessageList area, after the list):

```tsx
<AnimatePresence>
  {scrollPos.scrolledUp && (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      onClick={() => {
        // Scroll to bottom logic
        setScrollPos({ scrolledUp: false, unreadSinceScroll: 0 })
      }}
      className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg cursor-pointer ${
        isDark ? 'bg-orange-500 text-white hover:bg-orange-400' : 'bg-orange-500 text-white hover:bg-orange-400'
      }`}
    >
      <ChevronRight size={16} className="rotate-90" />
      {scrollPos.unreadSinceScroll > 0 && (
        <span className="text-[11px] font-bold">{scrollPos.unreadSinceScroll}</span>
      )}
    </motion.button>
  )}
</AnimatePresence>
```

- [ ] **Step 3: Wire scroll-to-bottom**

The onClick handler needs to scroll the VirtualizedMessageList. Pass a `scrollToBottom` ref or use the virtualizer:

```tsx
// In VirtualizedMessageList, expose via ref:
useImperativeHandle(ref, () => ({
  scrollToBottom: () => {
    virtualizer.scrollToIndex(items.length - 1, { align: 'end' })
  }
}))
```

- [ ] **Step 4: Verify in browser**

Scroll up in chat → FAB appears with unread count when new "messages" arrive. Click FAB → scrolls to bottom smoothly.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/VirtualizedMessageList.tsx src/components/ChatPreviewLayer.tsx
git commit -m "feat: scroll-to-bottom FAB with unread count"
```

---

### Task 6: Swipe-to-Reply

**Files:**
- Modify: `src/components/ChatPreviewLayer.tsx`

**Goal:** Swipe right on received messages to trigger reply mode.

- [ ] **Step 1: Wrap received message bubble container with `motion.div` + drag**

Replace the outer message container for received messages:

```tsx
{!isMe && (
  <motion.div
    drag="x"
    dragConstraints={{ left: 0, right: 80 }}
    dragElastic={0.1}
    onDrag={(_, info) => {
      setSwipeProgress(Math.min(info.offset.x / 80, 1))
    }}
    onDragEnd={(_, info) => {
      if (info.offset.x > 60) {
        onReply?.(msg)
      }
      setSwipeProgress(0)
    }}
    animate={{ x: 0 }}
    className="relative overflow-hidden"
    style={{ touchAction: 'pan-y' }}
  >
    {/* Blue accent line */}
    <motion.div
      className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-500 z-10"
      animate={{ opacity: swipeProgress > 0.3 ? 1 : 0 }}
    />
    {/* ... existing bubble content ... */}
  </motion.div>
)}
```

- [ ] **Step 2: Add `swipeProgress` state**

```tsx
const [swipeProgress, setSwipeProgress] = useState(0)
```

Reset it after drag end with a delay.

- [ ] **Step 3: Verify in browser**

Swipe right on a received message → blue accent appears → release > 60px → reply banner appears in input area.

- [ ] **Step 4: Commit**

```bash
git add src/components/ChatPreviewLayer.tsx
git commit -m "feat: swipe right to reply on received messages"
```

---

### Task 7: Voice Recording — Swipe-to-Cancel

**Files:**
- Modify: `src/components/LiveVoiceRecorder.tsx`
- Modify: `src/components/ChatInputOverlay.tsx`

**Goal:** While recording voice, swipe down to cancel (Telegram-style).

- [ ] **Step 1: Add swipe-to-cancel overlay in LiveVoiceRecorder**

```tsx
// Inside LiveVoiceRecorder, while recording:
const [dragY, setDragY] = useState(0)
const isCancelling = dragY < -60

return (
  <div className="relative">
    {/* Recording UI */}
    <div className="flex items-center gap-3">
      <motion.div
        drag="y"
        dragConstraints={{ top: -120, bottom: 0 }}
        dragElastic={0.2}
        onDrag={(_, info) => setDragY(info.offset.y)}
        onDragEnd={(_, info) => {
          if (info.offset.y < -60) {
            onCancel?.()
          }
          setDragY(0)
        }}
        className="flex items-center gap-3"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCancelling ? 'bg-red-500' : 'bg-red-500/20'}`}>
          <Mic size={20} className={isCancelling ? 'text-white' : 'text-red-500'} />
        </div>
        <div className="flex flex-col">
          <span className={`text-sm font-bold ${isCancelling ? 'text-red-500' : ''}`}>
            {isCancelling ? 'Slide to cancel' : 'Recording...'}
          </span>
          <span className="text-xs opacity-70">{duration}</span>
        </div>
      </motion.div>
    </div>
  </div>
)
```

- [ ] **Step 2: Wire `onCancel` prop through ChatInputOverlay**

In `ChatInputOverlay.tsx`, the `LiveVoiceRecorder` already accepts `onCancel`. Ensure it's wired:

```tsx
<LiveVoiceRecorder
  isDark={isDark}
  onCancel={() => setIsRecordingVoice(false)}
  // ...
/>
```

- [ ] **Step 3: Verify in browser**

Hold mic → recording starts → drag down past threshold → recording cancels and returns to input state.

- [ ] **Step 4: Commit**

```bash
git add src/components/LiveVoiceRecorder.tsx src/components/ChatInputOverlay.tsx
git commit -m "feat: swipe down to cancel voice recording"
```

---

### Task 8: Navigation Consolidation (7 → 4 Tabs)

**Files:**
- Modify: `src/components/navigation/BottomNav.tsx`
- Modify: `src/components/navigation/SidebarNav.tsx`
- Modify: `src/App.tsx`

**Goal:** Reduce nav tabs from 7 to 4 (Chats, Calls, Contacts, Settings). Radar/Recordings move under Settings.

- [ ] **Step 1: Update NAV_ITEMS in both navigation files**

```tsx
const NAV_ITEMS = [
  { id: "chats", label: "nav.chats", icon: MessageCircle },
  { id: "calls", label: "nav.calls", icon: Phone },
  { id: "contacts", label: "nav.contacts", icon: Users },
  { id: "settings", label: "nav.settings", icon: Settings },
]
```

- [ ] **Step 2: Add sub-navigation for Settings in App.tsx**

In the `FeatureViews` component or in `App.tsx`, when `view === "settings"`, render a sub-menu or settings view that includes links to Recordings, Radar, and other extended features.

Check how `FeatureViews` currently routes these views and adapt accordingly:

```tsx
// In the section where FeatureViews is rendered with the current `view`:
{view === 'recordings' || (view === 'settings' && subView === 'recordings') ? <RecordingsScreen ... /> : null}
{view === 'radar' || (view === 'settings' && subView === 'radar') ? <MeshRadar ... /> : null}
```

- [ ] **Step 3: Add `subView` state**

In `App.tsx`:

```tsx
const [subView, setSubView] = useState<string | null>(null)
```

When navigating to Settings, clear `subView`. When clicking on "Recordings" from within Settings, set `subView: 'recordings'`.

- [ ] **Step 4: Create Settings sub-navigation**

Inside the Settings view (`SettingsView.tsx`), add menu items:

```tsx
<div onClick={() => setSubView('recordings')} className="...">
  <Mic size={20} />
  <span>Recordings</span>
</div>
<div onClick={() => setSubView('radar')} className="...">
  <Radar size={20} />
  <span>Mesh Radar</span>
</div>
```

These need `setSubView` passed as a prop.

- [ ] **Step 5: Verify in browser**

Bottom nav and sidebar show only 4 tabs. Settings page has sub-links to Recordings and Radar. Clicking them navigates correctly.

- [ ] **Step 6: Commit**

```bash
git add src/components/navigation/BottomNav.tsx src/components/navigation/SidebarNav.tsx src/App.tsx
git commit -m "refactor: consolidate navigation from 7 to 4 tabs"
```

---

### Task 9: Pinned Chats

**Files:**
- Modify: `src/store/index.ts`
- Modify: `src/components/ChatListView.tsx`
- Modify: `src/components/chat-preview/ChatListItem.tsx`

**Goal:** Pin up to 3 chats to the top of the chat list.

- [ ] **Step 1: Add `pinned` field to chat type in store**

In `src/store/index.ts`, find the chat type and add:

```tsx
pinned?: boolean
```

Initial default: `false` for all chats.

- [ ] **Step 2: Add pin/unpin action**

```tsx
pinChat: (chatId: string | number) =>
  set(state => {
    const target = state.chats.find(c => c.id === chatId)
    if (!target) return {}
    const pinnedCount = state.chats.filter(c => c.pinned).length
    if (!target.pinned && pinnedCount >= 3) {
      // Max 3 pins
      return {}
    }
    return {
      chats: state.chats.map(c =>
        c.id === chatId ? { ...c, pinned: !c.pinned } : c
      )
    }
  })
```

- [ ] **Step 3: Separate pinned chats in ChatListView**

In `ChatListView.tsx`:

```tsx
const pinnedChats = filteredChats.filter(c => c.pinned)
const regularChats = filteredChats.filter(c => !c.pinned)
```

Render pinned section before regular chats:

```tsx
{pinnedChats.length > 0 && (
  <>
    <div className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 ${isDark ? 'text-orange-500' : 'text-orange-600'}`}>
      Pinned
    </div>
    {pinnedChats.map(c => (
      <ChatListItem key={c.id} chat={c} ... />
    ))}
    <div className={`h-px my-4 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
  </>
)}
```

- [ ] **Step 4: Add pin icon to ChatListItem**

```tsx
{chat.pinned && (
  <span className="mr-1 opacity-50">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
    </svg>
  </span>
)}
```

- [ ] **Step 5: Verify in browser**

Long-press a chat → pin/unpin option appears. Pinned chat moves to top section. Max 3 pins enforced.

- [ ] **Step 6: Commit**

```bash
git add src/store/index.ts src/components/ChatListView.tsx src/components/chat-preview/ChatListItem.tsx
git commit -m "feat: pinned chats with max 3 limit"
```

---

### Task 10: Multi-Select Mode

**Files:**
- Modify: `src/components/ChatListView.tsx`
- Modify: `src/components/chat-preview/ChatListItem.tsx`

**Goal:** Long-press a chat to enter multi-select mode with bulk archive/delete/mark-read actions.

- [ ] **Step 1: Add selection state in ChatListView**

```tsx
const [selectMode, setSelectMode] = useState(false)
const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())
```

- [ ] **Step 2: Add long-press handler in ChatListItem**

```tsx
// Track press duration
const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

const onPointerDown = () => {
  pressTimer.current = setTimeout(() => {
    onLongPress?.()
  }, 500)
}

const onPointerUp = () => {
  if (pressTimer.current) {
    clearTimeout(pressTimer.current)
    pressTimer.current = null
  }
}
```

Add `onLongPress` prop to `ChatListItemProps`.

- [ ] **Step 3: Add selection visuals in ChatListItem**

```tsx
// In the avatar area, when in select mode:
{selectMode ? (
  <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center ${isDark ? 'bg-[#1a1d24]' : 'bg-white'}`}>
    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selected ? 'bg-orange-500 border-orange-500' : 'border-gray-400'}`}>
      {selected && <Check size={14} className="text-white" />}
    </div>
  </div>
) : (
  // existing avatar rendering
)}
```

- [ ] **Step 4: Add top action bar in ChatListView**

```tsx
{selectMode && (
  <div className={`flex items-center gap-2 px-2 py-3 ${isDark ? 'bg-[#1a1d24]' : 'bg-white'} rounded-2xl mb-4`}>
    <button onClick={() => { setSelectMode(false); setSelectedIds(new Set()) }} className="text-sm font-bold opacity-60 hover:opacity-100">Cancel</button>
    <span className="flex-1 text-center text-sm font-bold">{selectedIds.size} selected</span>
    <button onClick={handleBulkArchive} className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-500">Archive</button>
    <button onClick={handleBulkDelete} className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-500">Delete</button>
    <button onClick={handleBulkMarkRead} className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-500">Read</button>
  </div>
)}
```

- [ ] **Step 5: Implement bulk actions**

```tsx
const handleBulkArchive = () => {
  selectedIds.forEach(id => toggleArchive(id))
  setSelectMode(false)
  setSelectedIds(new Set())
}
const handleBulkDelete = () => {
  selectedIds.forEach(id => {
    setChats(prev => prev.filter(c => c.id !== id))
  })
  setSelectMode(false)
  setSelectedIds(new Set())
}
const handleBulkMarkRead = () => {
  setChats(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, unread: 0 } : c))
  setSelectMode(false)
  setSelectedIds(new Set())
}
```

- [ ] **Step 6: Verify in browser**

Long-press a chat → enters select mode with cancel bar. Tap multiple chats → checkboxes fill. Tap Archive → selected chats archived. Tap Cancel → exit select mode.

- [ ] **Step 7: Commit**

```bash
git add src/components/ChatListView.tsx src/components/chat-preview/ChatListItem.tsx
git commit -m "feat: multi-select mode with bulk archive/delete/mark-read"
```
