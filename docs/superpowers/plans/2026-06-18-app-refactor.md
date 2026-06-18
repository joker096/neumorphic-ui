# App Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `src/App.tsx` into focused React components without changing UI behavior.

**Architecture:** Keep `App` as the stateful shell that owns theme, language, view, chat, modal, and store interactions. Extract reusable UI and feature sections into `src/components/AppChrome.tsx`, `src/components/ChatListView.tsx`, `src/components/ChatInputOverlay.tsx`, `src/components/ChatPreviewLayer.tsx`, and `src/components/Dialpad.tsx`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, `motion/react`, Zustand store, `sonner`, `lucide-react`.

---

### Task 1: Extract app chrome UI

**Files:**
- Create: `src/components/AppChrome.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `AppChrome` exports**

Create `src/components/AppChrome.tsx` with:
- `CustomDiamondIcon`
- `ThemeToggle`
- `LanguageSelector`
- `HomeButton`
- `StoryViewerOverlay`
- `AdvancedFilterModal`

Use the exact JSX currently in `src/App.tsx` for theme toggle, language selector, home button, story viewer, and advanced filter modal.

- [ ] **Step 2: Replace App JSX with chrome components**

In `src/App.tsx`, import:

```tsx
import {
  AdvancedFilterModal,
  HomeButton,
  LanguageSelector,
  StoryViewerOverlay,
  ThemeToggle,
} from "./components/AppChrome";
```

Replace the inline theme toggle with:

```tsx
<ThemeToggle
  isDark={isDark}
  theme={theme}
  setTheme={setTheme}
  t={t}
/>
```

Replace the inline language selector with:

```tsx
<LanguageSelector
  isDark={isDark}
  showLangMenu={showLangMenu}
  setShowLangMenu={setShowLangMenu}
  language={language}
  setLanguage={(code) => {
    setLanguage(code);
    setLang(code);
    setShowLangMenu(false);
  }}
  t={t}
/>
```

Replace the inline bottom home button with:

```tsx
<HomeButton
  isDark={isDark}
  onClick={() => {
    setActiveChat(null);
    setView("hub");
  }}
/>
```

Replace the story viewer overlay with:

```tsx
<StoryViewerOverlay
  activeStory={activeStory}
  onClose={() => setActiveStory(null)}
  isStealthMode={useAppStore.getState().stealthMode}
/>
```

Replace the advanced filter modal with:

```tsx
<AdvancedFilterModal
  isOpen={showAdvancedFilterModal}
  onClose={() => setShowAdvancedFilterModal(false)}
  isDark={isDark}
  filters={advancedFilters}
  setFilters={setAdvancedFilters}
  t={t}
/>
```

### Task 2: Extract chat list rendering

**Files:**
- Create: `src/components/ChatListView.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `ChatListView`**

Create `src/components/ChatListView.tsx` exporting:

```tsx
export const ChatListView = ({
  theme,
  view,
  activeFolder,
  setActiveFolder,
  chatSearchQuery,
  setChatSearchQuery,
  filteredChats,
  filteredChannels,
  bots,
  archivedUnreadCount,
  toggleArchive,
  contacts,
  setGlobalSelectedContact,
  setActiveChat,
  setShowCreateChannel,
  setShowCreateBot,
  setShowAdvancedFilterModal,
  advancedFilters,
  t,
  isDark,
}: ChatListViewProps) => { ... };
```

Move the existing list JSX from `src/App.tsx` lines around `3837-3966` into this component.

- [ ] **Step 2: Replace App list JSX**

In `src/App.tsx`, import:

```tsx
import { ChatListView } from "./components/ChatListView";
```

Replace the existing list section with:

```tsx
<ChatListView
  theme={theme}
  view={view}
  activeFolder={activeFolder}
  setActiveFolder={setActiveFolder}
  chatSearchQuery={chatSearchQuery}
  setChatSearchQuery={setChatSearchQuery}
  filteredChats={filteredChats}
  filteredChannels={filteredChannels}
  bots={bots}
  archivedUnreadCount={archivedUnreadCount}
  toggleArchive={toggleArchive}
  contacts={contacts}
  setGlobalSelectedContact={setGlobalSelectedContact}
  setActiveChat={setActiveChat}
  setShowCreateChannel={setShowCreateChannel}
  setShowCreateBot={setShowCreateBot}
  setShowAdvancedFilterModal={setShowAdvancedFilterModal}
  advancedFilters={advancedFilters}
  t={t}
  isDark={isDark}
/>
```

### Task 3: Extract chat input overlay

**Files:**
- Create: `src/components/ChatInputOverlay.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `ChatInputOverlay`**

Create `src/components/ChatInputOverlay.tsx` exporting:

```tsx
export const ChatInputOverlay = ({
  theme,
  activeChat,
  messageText,
  setMessageText,
  scheduleDateTime,
  showSchedulePopup,
  setShowSchedulePopup,
  setScheduleDateTime,
  isRecordingVoice,
  setIsRecordingVoice,
  voiceNoteError,
  showStickerPicker,
  setShowStickerPicker,
  morseMode,
  silentMode,
  replyTarget,
  setReplyTarget,
  onSendText,
  onScheduleChange,
  onToggleMute,
  onSetChannels,
  onAttachImage,
  onToggleSchedulePopup,
  onToggleSilent,
  onToggleMorse,
  onSend,
  onHoldRecord,
  onReRecord,
  onPermissionDenied,
  onSendVoice,
  onToggleStickerPicker,
  onSendSticker,
  isDark,
}: ChatInputOverlayProps) => { ... };
```

Move the existing input overlay JSX from `src/App.tsx` lines around `3971-4097`.

- [ ] **Step 2: Replace App input overlay JSX**

In `src/App.tsx`, import:

```tsx
import { ChatInputOverlay } from "./components/ChatInputOverlay";
```

Replace the inline overlay with:

```tsx
<ChatInputOverlay
  theme={theme}
  activeChat={activeChat}
  messageText={messageText}
  setMessageText={setMessageText}
  scheduleDateTime={scheduleDateTime}
  showSchedulePopup={showSchedulePopup}
  setShowSchedulePopup={setShowSchedulePopup}
  setScheduleDateTime={setScheduleDateTime}
  isRecordingVoice={isRecordingVoice}
  setIsRecordingVoice={setIsRecordingVoice}
  voiceNoteError={voiceNoteError}
  showStickerPicker={showStickerPicker}
  setShowStickerPicker={setShowStickerPicker}
  morseMode={morseMode}
  silentMode={silentMode}
  replyTarget={replyTarget}
  setReplyTarget={setReplyTarget}
  onSendText={handleSendMessage}
  onScheduleChange={setScheduleDateTime}
  onToggleMute={() => {
    setActiveChat({ ...activeChat, isMuted: !activeChat.isMuted });
    setChannels((prev) =>
      prev.map((c) =>
        c.id === activeChat.id ? { ...c, isMuted: !activeChat.isMuted } : c,
      ) as any,
    );
  }}
  onSetChannels={setChannels}
  onAttachImage={(newMessage: any) => {
    setChats((prevChats) =>
      prevChats.map((c) =>
        c.id === activeChat.id ? { ...c, history: [...(c.history || []), newMessage] } : c,
      ),
    );
    setActiveChat((prev: any) => ({
      ...prev,
      history: [...(prev.history || []), newMessage],
    }));
  }}
  onToggleSchedulePopup={() => setShowSchedulePopup(!showSchedulePopup)}
  onToggleSilent={() => setSilentMode(!silentMode)}
  onToggleMorse={() => setMorseMode(!morseMode)}
  onSend={handleSendMessage}
  onHoldRecord={() => {
    if (!messageText) {
      setVoiceNoteError("");
      setIsRecordingVoice(true);
    }
  }}
  onReRecord={() => {
    setShowPreview(false);
    setPreviewUrl(null);
    setIsRecordingVoice(true);
  }}
  onPermissionDenied={(message: string) => {
    setIsRecordingVoice(false);
    setVoiceNoteError(message);
  }}
  onSendVoice={(url: string, dur: string) => {
    setIsRecordingVoice(false);
    sendVoiceMessage(url, dur);
    setVoiceNoteError("");
  }}
  onToggleStickerPicker={() => setShowStickerPicker(!showStickerPicker)}
  onSendSticker={sendStickerMessage}
  isDark={isDark}
/>
```

### Task 4: Extract chat preview layer

**Files:**
- Create: `src/components/ChatPreviewLayer.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Move `ChatPreviewLayer`**

Create `src/components/ChatPreviewLayer.tsx` by moving the full `ChatPreviewLayer` component from `src/App.tsx`.

It must import:
- `React`, `useState`, `useEffect`
- `motion`, `AnimatePresence`
- `lucide-react` icons used by the component
- `useI18n`
- `useAppStore`
- `ContactProfileModal`
- `PhotoViewerOverlay`
- `VoiceWaveform`
- `ChannelCommentsView`
- `FormattedText`
- `getICQStickerSrc`
- `toast`
- type `ContactProfile` if needed from `ContactProfileModal`

- [ ] **Step 2: Keep props unchanged**

Export:

```tsx
export const ChatPreviewLayer = ({
  chat,
  theme,
  onClose,
  onAction,
  onCall,
  onMessage,
  onUpdateChat,
  onReply,
  savedMessages = [],
  onToggleSavedMessage,
  deliveryReceipts = true,
  readReceipts = true,
  setEditingContact,
}: ChatPreviewLayerProps) => { ... };
```

- [ ] **Step 3: Replace App import**

In `src/App.tsx`, remove the local `ChatPreviewLayer` component and import:

```tsx
import { ChatPreviewLayer } from "./components/ChatPreviewLayer";
```

### Task 5: Extract dialpad

**Files:**
- Create: `src/components/Dialpad.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Move dialpad components**

Create `src/components/Dialpad.tsx` exporting:
- `Dialpad`
- `PillButton`
- `ActionCircleButton`
- `DarkSearchBar`
- `DarkPillButton`
- `LightSearchBar`
- `LightPillButton`
- `GlowingKnobLine`
- `GlowingPlusLight`
- `NeumorphicKnob`

Move `MOCK_CALLS` into this file.

- [ ] **Step 2: Keep props unchanged**

Export:

```tsx
export const Dialpad = ({
  theme,
  onCall,
  onMessage,
  contacts,
  showContactPicker,
  setShowContactPicker,
  setEditingContact,
}: DialpadProps) => { ... };
```

It must import `ContactProfileModal`, `Contact`, `ContactProfile`, `useAppStore`, `toast`, `motion`, `AnimatePresence`, and all icons used by the moved components.

- [ ] **Step 3: Replace App import**

In `src/App.tsx`, remove the local dialpad helpers and import:

```tsx
import { Dialpad } from "./components/Dialpad";
```

### Task 6: Clean `App.tsx` imports and verify no dead code

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Remove unused imports**

Remove imports for moved icons/components and any icons no longer used directly by `App`.

Keep imports needed by `App`:
- `MeshRadar`
- `SystemPulsePlayer`
- `ContactsView`
- `SettingsView`
- `RecordingsScreen`
- `ContactProfileModal`
- `ContactCreateEditModal`
- `MorseDecoder`, `encodeMorse`, `isMorseCode`
- `Tooltip`
- `React`, `useState`, `useRef`, `useEffect`, `useMemo`
- `motion`, `AnimatePresence`
- icons still used directly by `App`
- `PhotoViewerOverlay`
- `VoiceWaveform`
- `FloatingCallWidget`
- `useAppStore`
- `cryptoCore`
- `useI18n`
- `toast`, `Toaster`
- `CreateChannelModal`
- `CreateBotModal`
- `ChannelCommentsView`
- `AccountSwitcher`
- `FormattedText`
- `getICQEmojiPath`, `getICQStickerSrc`, `ICQ_EMOJI_MAP`
- type `Contact`

- [ ] **Step 2: Remove local moved components**

Delete local definitions for:
- `CustomDiamondIcon`
- light/dark button/search helpers
- `ActionCircleButton`
- `PillButton`
- `Dialpad`
- `HubToggleIcon`
- local `RadialMenu`
- `MOCK_CALLS`
- `AvatarRow`
- `ChatListItem`
- `ChatPreviewLayer`
- `SettingsToggle`
- `VideoPlayerOverlay`
- `NotificationMockup`
- `StickerPicker`

### Task 7: Run verification

**Files:**
- None

- [ ] **Step 1: Run TypeScript and lint**

Run:

```bash
npm run lint
```

Expected: exits with code `0`.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: exits with code `0`.

- [ ] **Step 3: Fix regressions**

If verification fails, fix only the refactor regression, then rerun the failed command before continuing.
