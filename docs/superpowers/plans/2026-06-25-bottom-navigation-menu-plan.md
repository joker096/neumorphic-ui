# Bottom Navigation Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace radial menu with Telegram-style adaptive bottom navigation (mobile) / sidebar (desktop), fix swipe conflict in chat items.

**Architecture:** Create BottomNav (mobile) and SidebarNav (desktop) components that control the `view` state. Remove HubView/RadialMenu/HomeButton. Simplify App.tsx to always show nav + content. Fix ChatListItem so onClick doesn't fire after drag.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, motion (framer-motion), Lucide React icons, Zustand state.

---

### Task 1: Create BottomNav component

**Files:**
- Create: `src/components/navigation/BottomNav.tsx`

- [ ] **Step 1: Create BottomNav component**

```tsx
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, Phone, Settings, Users } from "lucide-react";
import type { ReactNode } from "react";

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
};

type BottomNavProps = {
  activeView: string;
  isDark: boolean;
  unreadCount: number;
  onNavigate: (view: string) => void;
  t: (key: string) => string;
};

const NAV_ITEMS: NavItem[] = [
  { id: "chats", label: "nav.chats", icon: MessageCircle },
  { id: "contacts", label: "nav.contacts", icon: Users },
  { id: "calls", label: "nav.calls", icon: Phone },
  { id: "settings", label: "nav.settings", icon: Settings },
];

export const BottomNav = ({ activeView, isDark, unreadCount, onNavigate, t }: BottomNavProps) => (
  <nav
    className={`fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)] pt-2 ${
      isDark
        ? "bg-[#0d1017]/90 backdrop-blur-xl border-t border-white/[0.06]"
        : "bg-[#eaeff4]/90 backdrop-blur-xl border-t border-black/[0.06]"
    }`}
    style={{ height: "calc(56px + env(safe-area-inset-bottom, 0px))" }}
  >
    {NAV_ITEMS.map((item) => {
      const Icon = item.icon;
      const isActive = activeView === item.id;
      return (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`relative flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-200 ${
            isActive
              ? isDark
                ? "text-orange-400"
                : "text-orange-600"
              : isDark
                ? "text-gray-500 hover:text-gray-300"
                : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <div className="relative">
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
            {item.id === "chats" && unreadCount > 0 && (
              <div className={`absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center ${
                isDark
                  ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                  : "bg-orange-500 shadow-[0_2px_4px_rgba(249,115,22,0.4)]"
              }`}>
                <span className="text-[9px] font-bold text-white leading-none">{unreadCount > 99 ? "99+" : unreadCount}</span>
              </div>
            )}
          </div>
          <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? "opacity-100" : "opacity-60"}`}>
            {t(item.label)}
          </span>
          {isActive && (
            <motion.div
              layoutId="bottomNavActive"
              className={`absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full ${isDark ? "bg-orange-500" : "bg-orange-600"}`}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      );
    })}
  </nav>
);
```

- [ ] **Step 2: Create navigation index file**

```tsx
export { BottomNav } from "./BottomNav";
export { SidebarNav } from "./SidebarNav";
```

---

### Task 2: Create SidebarNav component

**Files:**
- Create: `src/components/navigation/SidebarNav.tsx`

- [ ] **Step 1: Create SidebarNav component**

```tsx
import { MessageCircle, Phone, Settings, Users } from "lucide-react";
import { CustomDiamondIcon } from "../app/CustomDiamondIcon";

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
};

type SidebarNavProps = {
  activeView: string;
  isDark: boolean;
  unreadCount: number;
  onNavigate: (view: string) => void;
  t: (key: string) => string;
};

const NAV_ITEMS: NavItem[] = [
  { id: "chats", label: "nav.chats", icon: MessageCircle },
  { id: "contacts", label: "nav.contacts", icon: Users },
  { id: "calls", label: "nav.calls", icon: Phone },
  { id: "settings", label: "nav.settings", icon: Settings },
];

export const SidebarNav = ({ activeView, isDark, unreadCount, onNavigate, t }: SidebarNavProps) => (
  <aside
    className={`hidden md:flex flex-col w-64 h-[100dvh] shrink-0 border-r ${
      isDark ? "bg-[#0d1017] border-r-white/[0.06]" : "bg-[#eaeff4] border-r-black/[0.06]"
    }`}
  >
    <div className="flex items-center gap-3 px-6 pt-8 pb-6">
      <CustomDiamondIcon
        className={`w-8 h-8 ${
          isDark
            ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]"
            : "text-orange-600 drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)]"
        }`}
      />
      <span className={`text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-slate-800"}`}>
        Mess&Anger
      </span>
    </div>

    <nav className="flex-1 flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
              isActive
                ? isDark
                  ? "bg-orange-500/15 text-orange-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  : "bg-orange-500/10 text-orange-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                : isDark
                  ? "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                  : "text-slate-500 hover:text-slate-800 hover:bg-black/[0.03]"
            }`}
          >
            <div className="relative">
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              {item.id === "chats" && unreadCount > 0 && (
                <div className={`absolute -top-1.5 -right-2 min-w-[14px] h-3.5 px-1 rounded-full flex items-center justify-center ${
                  isDark
                    ? "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]"
                    : "bg-orange-500 shadow-[0_1px_3px_rgba(249,115,22,0.3)]"
                }`}>
                  <span className="text-[8px] font-bold text-white leading-none">{unreadCount > 99 ? "99+" : unreadCount}</span>
                </div>
              )}
            </div>
            <span>{t(item.label)}</span>
          </button>
        );
      })}
    </nav>
  </aside>
);
```

---

### Task 3: Fix swipe onClick conflict in ChatListItem

**Files:**
- Modify: `src/components/ChatListView.tsx:89-147`

- [ ] **Step 1: Fix ChatListItem to prevent onClick after drag**

Add a ref to track drag distance. In the `motion.div` drag handler, use `onDragEnd` to set a flag. Only fire `onClick` if drag was minimal.

Replace the current `ChatListItem` component (lines 89-235) with one that tracks drag state:

```tsx
const ChatListItem = ({ chat, theme, type = "chat", active, onClick, onArchive, onAvatarClick, archiveLabel, onCall, onVideoCall, t }: any) => {
  const isDark = theme === "dark";
  const { stealthMode, typingIndicators } = useAppStore();
  const dragged = React.useRef(false);
  const dragDistance = React.useRef(0);

  const isGroup = type === "channel";
  const roundedClass = isGroup ? "rounded-2xl" : "rounded-full";
  const isMockTyping = typingIndicators && chat.id === 1 && type === "chat";

  const fuzzedTime = React.useMemo(() => {
    if (!stealthMode || !chat.time) return chat.time;
    const match = chat.time.match(/(\d{1,2}):(\d{2})/);
    if (!match) return chat.time;
    let h = parseInt(match[1]);
    let m = parseInt(match[2]);
    const offset = (chat.id % 11) - 5;
    m += offset;
    if (m < 0) { m += 60; h = (h - 1 + 24) % 24; }
    else if (m >= 60) { m -= 60; h = (h + 1) % 24; }
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }, [chat.time, chat.id, stealthMode]);

  return (
    <div className="relative mb-4 last:mb-0 overflow-hidden rounded-3xl">
      {!isGroup && onCall && onVideoCall && (
        <div className={`absolute inset-0 flex items-center justify-start rounded-3xl overflow-hidden`}>
          <div className="flex h-full">
            <button
              onClick={(e) => { e.stopPropagation(); onCall(); }}
              className={`h-full flex flex-col items-center justify-center gap-1 px-4 text-[11px] font-bold text-white cursor-pointer border-none ${isDark ? "bg-[#2b2f42]" : "bg-slate-600"}`}
              style={{ width: '76px' }}
            >
              <Phone size={18} fill="white" stroke="white" />
              Voice
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onVideoCall(); }}
              className={`h-full flex flex-col items-center justify-center gap-1 px-4 text-[11px] font-bold text-white cursor-pointer border-none bg-blue-500`}
              style={{ width: '76px' }}
            >
              <Video size={18} fill="white" stroke="white" />
              Video
            </button>
          </div>
        </div>
      )}
      <div className={`absolute inset-0 flex items-center justify-end px-6 rounded-3xl ${isDark ? "bg-orange-500/20" : "bg-orange-500"} text-white overflow-hidden`}>
        <Archive size={20} className={isDark ? "text-orange-500" : "text-white"} />
        <span className={`ml-2 text-sm font-bold ${isDark ? "text-orange-500" : "text-white"}`}>{archiveLabel}</span>
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.5, right: 0.5 }}
        onDragStart={() => {
          dragged.current = false;
          dragDistance.current = 0;
        }}
        onDrag={(_, info) => {
          dragDistance.current = Math.abs(info.offset.x);
        }}
        onDragEnd={(e, info) => {
          if (info.offset.x < -70 && onArchive) {
            onArchive(chat.id);
          }
          if (dragDistance.current > 10) {
            dragged.current = true;
          }
        }}
        onClick={(e: any) => {
          if (dragged.current) {
            dragged.current = false;
            return;
          }
          onClick?.(e);
        }}
        className={`relative w-full p-3 flex items-center gap-4 cursor-pointer transition-all duration-300 select-none group rounded-3xl ${
          isDark
            ? active
              ? "bg-[#101216] shadow-[inset_0_12px_24px_rgba(0,0,0,0.9),_inset_0_3px_6px_rgba(0,0,0,0.9)] border border-orange-500/20"
              : "bg-[#13151b] shadow-[0_8px_16px_rgba(0,0,0,0.3),_inset_0_1.5px_2px_rgba(255,255,255,0.05),_inset_0_-2px_4px_rgba(0,0,0,0.6)] border border-white/[0.02] hover:scale-[1.02]"
            : active
              ? "bg-[#e2e8f0] shadow-[inset_4px_4px_10px_rgba(165,175,190,0.4),_inset_-2px_-2px_6px_rgba(255,255,255,1)] border border-black/5"
              : "bg-[#eaeff4] shadow-[-6px_-6px_12px_rgba(255,255,255,0.8),_8px_8px_16px_rgba(165,175,190,0.4),_inset_1.5px_1.5px_3px_rgba(255,255,255,1)] border border-white/80 hover:scale-[1.02]"
        }`}
      >
      {/* Avatar */}
      <div
        onClick={(e) => {
           if (onAvatarClick && type !== "channel") {
              e.stopPropagation();
              onAvatarClick(chat);
           }
        }}
        className={`relative shrink-0 w-[52px] h-[52px] ${roundedClass} shadow-inner p-[2px] transition-transform duration-300 ${active ? "scale-95" : ""}`}
      >
        <div
          className={`w-full h-full ${roundedClass} bg-gradient-to-br ${chat.color} flex items-center justify-center text-white font-bold text-xl shadow-sm`}
        >
          {chat.name.charAt(0)}
        </div>
        {chat.online && (
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full border-[2.5px] z-10 ${isDark ? "bg-green-400 border-[#13151b]" : "bg-emerald-500 border-[#eaeff4]"}`}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center pr-2">
        <div className="flex justify-between items-center mb-[2px]">
          <span
            className={`font-bold text-[14.5px] truncate pr-2 ${isDark ? "text-[#e8ecf2]" : "text-slate-800"}`}
          >
            {chat.name}
          </span>
          <span
            className={`text-[10.5px] font-semibold tracking-wide shrink-0 ${isDark ? "text-gray-500" : "text-slate-400"}`}
          >
            {fuzzedTime}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span
            className={`text-[12.5px] truncate pr-4 ${isDark ? (active ? "text-orange-300" : "text-[#7a8190]") : active ? "text-orange-600" : "text-slate-500"} ${chat.unread ? "font-medium" : ""}`}
          >
            {isMockTyping ? (
                <span className={`font-bold tracking-wide italic ${isDark ? "text-orange-500" : "text-orange-600"}`}>
                   {t('chat.typing')}
                </span>
            ) : (
               <FormattedText text={chat.message} />
            )}
          </span>
          {chat.unread > 0 && (
             <div
               className={`shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm ${
                 isDark
                   ? "bg-gradient-to-tr from-orange-500 to-orange-400 text-white shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                   : "bg-gradient-to-tr from-orange-400 to-orange-300 text-orange-950 shadow-[0_2px_4px_rgba(249,115,22,0.5)]"
               }`}
             >
               <span className="text-[10px] font-bold pb-[0.5px] leading-none">
                 {chat.unread}
               </span>
             </div>
           )}
           {(chat as any).hasMentions && (
             <div
               className={`shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm ${
                 isDark
                   ? "bg-blue-500/90 text-white shadow-[0_0_8px_rgba(59,130,250,0.5)]"
                   : "bg-blue-500 text-white shadow-[0_2px_4px_rgba(29,78,183,0.5)]"
               }`}
             >
               <span className="text-[10px] font-bold pb-[0.5px] leading-none">@</span>
             </div>
           )}
        </div>
      </div>
      </motion.div>
    </div>
  );
};
```

---

### Task 4: Update ContentView — remove HomeButton

**Files:**
- Modify: `src/components/app/ContentView.tsx`

- [ ] **Step 1: Remove HomeButton import and usage**

Replace the current ContentView with:

```tsx
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { StoryViewerOverlay } from "../AppChrome";
import { ContentViewHeader } from "./ContentViewHeader";

type Story = {
  id: number;
  name: string;
  color: string;
};

type ContentViewProps = {
  children: ReactNode;
  title: string;
  theme: "light" | "dark";
  isDark: boolean;
  t: (key: string, options?: any) => string;
  onBack: () => void;
  onCloseStory: () => void;
  activeStory: Story | null;
  isStealthMode: boolean;
};

export const ContentView = ({
  children,
  title,
  theme,
  isDark,
  t,
  onBack,
  onCloseStory,
  activeStory,
  isStealthMode,
}: ContentViewProps) => (
  <motion.div
    key="content-view"
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 40 }}
    transition={{ duration: 0.3 }}
    className="flex-1 w-full max-w-4xl mx-auto flex flex-col relative z-20 pt-4 sm:pt-8 pb-20 sm:pb-4 h-full min-h-0 px-2 sm:px-4"
  >
    <ContentViewHeader title={title} isDark={isDark} t={t} onBack={onBack} />
    <div className="flex-1 w-full overflow-hidden relative px-3 sm:px-4 flex flex-col items-center min-h-0">
      {children}
    </div>
    <StoryViewerOverlay activeStory={activeStory} onClose={onCloseStory} isStealthMode={isStealthMode} />
  </motion.div>
);
```

---

### Task 5: Refactor App.tsx — remove radial menu, integrate navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/app/index.ts`
- Modify: `src/components/AppChrome.tsx`
- Delete: `src/components/app/HubView.tsx`
- Delete: `src/components/app/RadialMenu.tsx`
- Delete: `src/components/app/HomeButton.tsx`

- [ ] **Step 1: Delete HubView.tsx, RadialMenu.tsx, HomeButton.tsx**

```bash
git rm src/components/app/HubView.tsx src/components/app/RadialMenu.tsx src/components/app/HomeButton.tsx
```

- [ ] **Step 2: Update AppChrome.tsx — remove deleted exports**

```tsx
export { AdvancedFilterModal } from "./app/AdvancedFilterModal";
export { CustomDiamondIcon } from "./app/CustomDiamondIcon";
export { LanguageSelector } from "./app/LanguageSelector";
export { StoryViewerOverlay } from "./app/StoryViewerOverlay";
export { ThemeToggle } from "./app/ThemeToggle";
```

- [ ] **Step 3: Update app/index.ts — remove HubView export**

```tsx
export { AppOverlays } from "./AppOverlays";
export { ContentView } from "./ContentView";
export { ContentViewHeader } from "./ContentViewHeader";
```

- [ ] **Step 4: Refactor App.tsx**

Key changes:
1. Change default view from `'hub'` to `'chats'`
2. Remove `HubView` import, `hubItems`, `hubBadges`, `HubView` branch in render
3. Remove `handleHome` (no longer needed)
4. Add `BottomNav` and `SidebarNav` imports
5. Render nav components
6. Simplify `contentViewTitle` — just use `activeChat?.name` or `t('nav.' + view)`
7. Remove `onHome` prop from ContentView
8. Remove `showHomeButton` prop
9. Add padding bottom for nav on mobile
10. Add locale keys for nav labels (`nav.chats`, `nav.contacts`, `nav.calls`, `nav.settings`)

Import section changes:
```tsx
import { ChatWorkspace } from "./components/chat";
import { AppOverlays, ContentView } from "./components/app";
import { BottomNav, SidebarNav } from "./components/navigation";
// ... rest of existing imports excluding removed ones
```

Remove the hub-related computed values (`hubBadges`, `hubItems`).

Change the render section — instead of AnimatePresence with HubView vs ContentView, always render:
```tsx
<div className={`w-full h-[100dvh] flex font-sans select-none overflow-hidden relative ${isDark ? "bg-[#0d1017] text-white" : "bg-[#eaeff4] text-slate-800"}`}>
  {isDark && (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
  )}
  
  <TransportIndicator status={connectionStatus} />
  
  <SidebarNav
    activeView={view}
    isDark={isDark}
    unreadCount={chatsUnread}
    onNavigate={(v) => { setActiveChat(null); setView(v as any); }}
    t={t}
  />

  <div className="flex-1 flex flex-col min-w-0">
    <AnimatePresence mode="wait">
      <ContentView
        title={contentViewTitle}
        theme={theme}
        isDark={isDark}
        t={t}
        onBack={handleBack}
        onCloseStory={() => setActiveStory(null)}
        activeStory={activeStory}
        isStealthMode={useAppStore.getState().stealthMode}
      >
        {isChatListRoute && (
          <SafeRender>
            <ChatWorkspace
              hasActiveChat={Boolean(activeChat)}
              listProps={chatListWorkspaceProps}
              activeProps={activeChatWorkspaceProps}
            />
          </SafeRender>
        )}
        <SafeRender>
          <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>}>
            <FeatureViews
              view={view}
              theme={theme}
              setTheme={setTheme}
              contacts={contacts}
              setContacts={setContacts as any}
              showContactPicker={showContactPicker}
              setShowContactPicker={setShowContactPicker}
              setEditingContact={setEditingContact}
              chats={chats}
              setChats={setChats as any}
              setActiveChat={setActiveChat}
              setView={setView as any}
              onCall={handlePreviewCall}
              onVideoCall={(name: string, color?: string) => handlePreviewCall(name, color, 'video')}
              onMessage={handlePreviewMessage}
            />
          </Suspense>
        </SafeRender>
      </ContentView>
    </AnimatePresence>
  </div>

  <BottomNav
    activeView={view}
    isDark={isDark}
    unreadCount={chatsUnread}
    onNavigate={(v) => { setActiveChat(null); setView(v as any); }}
    t={t}
  />

  {/* ... AppOverlays, CallScreen, IncomingCallSheet same as before ... */}
</div>
```

Also update `handleBack`:
```tsx
const handleBack = () => {
  if (activeChat) setActiveChat(null);
  else if (view !== 'chats') setView("chats");
};
```

Remove `handleHome` entirely.

Update `contentViewTitle`:
```tsx
const contentViewTitle = activeChat
  ? activeChat.name
  : view === 'chats' ? t('nav.chats')
  : view === 'contacts' ? t('nav.contacts')
  : view === 'calls' ? t('nav.calls')
  : view === 'settings' ? t('nav.settings')
  : '';
```

Update `isChatListRoute` — should only be true for `view === 'chats'`:
```tsx
const isChatListRoute = view === "chats";
```

Remove `hubBadges` and `hubItems` computed values entirely.

- [ ] **Step 5: Clean up imports in App.tsx**

Remove these imports (they're no longer used):
```tsx
// REMOVE:
import { Activity, Bot, Hash, Lock, MessageCircle, Mic, Phone, Settings, Target, Users } from "lucide-react";
// (Lock, Phone may still be used - check before removing)
```

Only keep icons that are actually used elsewhere in App.tsx.

---

### Task 6: Add locale keys for navigation

**Files:**
- Modify: `src/locales/en.json` (and other locale files if needed)

- [ ] **Step 1: Add nav locale keys to en.json**

```json
{
  "nav": {
    "chats": "Chats",
    "contacts": "Contacts",
    "calls": "Calls",
    "settings": "Settings"
  }
}
```

---

### Task 7: Verify and fix

**Files:**
- Check: `src/App.tsx`, `src/components/app/ContentView.tsx`, `src/components/ChatListView.tsx`, `src/components/navigation/*`

- [ ] **Step 1: Build and verify**

Run: `npm run build` or `npx tsc --noEmit` to check for type errors.

- [ ] **Step 2: Fix any issues**

Fix any compilation errors that arise.

- [ ] **Step 3: Commit all changes**

```bash
git add -A
git commit -m "feat: replace radial menu with Telegram-style bottom/side navigation

- Remove HubView, RadialMenu, HomeButton components
- Add BottomNav (mobile) and SidebarNav (desktop) components
- Fix swipe-to-click conflict in ChatListItem
- Simplify App.tsx — always show nav + content
- Move non-primary sections into Settings
- Default view is now 'chats' instead of 'hub'"
```
