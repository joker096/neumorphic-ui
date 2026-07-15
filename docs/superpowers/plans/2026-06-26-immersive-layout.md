# Immersive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove outer ContentViewHeader, reduce active-chat header to a thin bar, and reduce paddings across list views to maximize content area.

**Architecture:** 5 files modified, 1 file deleted. Changes are purely presentational — no logic changes to state management or routing.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Motion (framer-motion)

---

### Task 1: ContentView + ContentViewHeader

**Files:**
- Delete: `src/components/app/ContentViewHeader.tsx`
- Modify: `src/components/app/ContentView.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Delete ContentViewHeader.tsx**

```bash
Remove-Item -LiteralPath "src/components/app/ContentViewHeader.tsx"
```

- [ ] **Step 2: Update ContentView.tsx**

Remove the import of ContentViewHeader, the `<ContentViewHeader />` usage, and the `onBack` prop. Reduce top padding.

```tsx
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { StoryViewerOverlay } from "../AppChrome";

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
  onCloseStory: () => void;
  activeStory: Story | null;
  isStealthMode: boolean;
};

export const ContentView = ({
  children,
  isDark,
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
    className="flex-1 w-full max-w-4xl mx-auto flex flex-col relative z-20 pt-2 pb-4 h-full min-h-0 px-2 sm:px-4"
  >
    <div className="flex-1 w-full overflow-hidden relative px-3 sm:px-4 flex flex-col items-center min-h-0">
      {children}
    </div>
    <StoryViewerOverlay activeStory={activeStory} onClose={onCloseStory} isStealthMode={isStealthMode} />
  </motion.div>
);
```

- [ ] **Step 3: Remove onBack from ContentView usage in App.tsx**

In App.tsx (~line 919-928), remove `onBack={handleBack}` from `<ContentView>` props:

```tsx
<ContentView
  title={contentViewTitle}
  theme={theme}
  isDark={isDark}
  t={t}
  onCloseStory={() => setActiveStory(null)}
  activeStory={activeStory}
  isStealthMode={useAppStore.getState().stealthMode}
>
```

The `handleBack` function can remain (unused) for now — safe to keep.

- [ ] **Step 4: Remove title prop usage from App.tsx's contentViewTitle**

The `title` prop is no longer needed. Remove the `contentViewTitle` useMemo (lines 760-775) and the `title={contentViewTitle}` from `<ContentView>`.

```tsx
// Remove this entire block (lines 760-775):
// const contentViewTitle = useMemo(() => { ... }, [activeChat?.name, view, t]);
```

And remove `title={contentViewTitle}` from the ContentView invocation.

---

### Task 2: ChatListView — Reduce Padding

**Files:**
- Modify: `src/components/ChatListView.tsx`

- [ ] **Step 1: Reduce outer container padding**

Change the container className from:
```tsx
className={`w-full max-w-[400px] flex-1 flex flex-col overflow-y-auto rounded-[32px] p-6 mb-8 pb-28 sm:pb-8 ...`}
```
to:
```tsx
className={`w-full max-w-[400px] flex-1 flex flex-col overflow-y-auto rounded-[32px] p-4 mb-4 pb-28 sm:pb-8 ...`}
```

---

### Task 3: ChatPreviewLayer — Minimal Header Bar

**Files:**
- Modify: `src/components/ChatPreviewLayer.tsx`

- [ ] **Step 1: Replace header with thin bar**

Find the header div (around line 286-443):
```tsx
{/* Header */}
<div
  className={`p-5 pb-4 flex items-center gap-4 ...`}
>
  {/* Button Back */}
  <div onClick={onClose} ...>
    <ChevronRight size={22} className="rotate-180" strokeWidth={2} />
  </div>

  {/* Avatar mini */}
  <div ...>...</div>

  {/* Chat name + online status */}
  <div className="flex-1 flex flex-col overflow-hidden">
    <span className="font-bold text-[15px] truncate ...">{chat.name}</span>
    <div className="flex items-center gap-1.5 mt-0.5">
      <span className="w-1.5 h-1.5 rounded-full ..." />
      <span className="text-[11px] font-bold tracking-wider uppercase ...">
        {chat.online ? t('chat.filters.online') : t('chat.filters.offline')}
      </span>
    </div>
  </div>

  {/* Action buttons — remove all */}
  <div className="flex items-center gap-1">
    <div onClick={() => setShowSearch(!showSearch)} ...><Search size={18} /></div>
    <div onClick={() => { ... }} ...><Phone size={18} /></div>
    <div onClick={() => { ... }} ...><Video size={20} /></div>
    <div onClick={() => setShowSavedPanel(true)} ...><Bookmark size={18} /></div>
    <div onClick={() => { ... }} ...><Trash2 size={18} /></div>
    <div onClick={() => { ... }} ...><ListFilter size={18} /></div>
  </div>
</div>
```

Replace with:
```tsx
{/* Header — thin bar */}
<div
  className={`px-3 py-2 flex items-center gap-3 ${
    isDark
      ? "bg-[#1a1d24]/90 border-b border-white/5 backdrop-blur-md"
      : "bg-[#f4f7f9]/90 border-b border-black/5 backdrop-blur-md"
  }`}
>
  <div
    onClick={onClose}
    className={`cursor-pointer w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
      isDark
        ? "bg-[#13151b] hover:bg-[#20242e] text-gray-400"
        : "bg-[#eaeff4] hover:bg-white text-slate-500 shadow-sm"
    }`}
  >
    <ChevronRight size={16} className="rotate-180" strokeWidth={2} />
  </div>

  <div
    onClick={() => {
      const allContacts = useAppStore.getState().contacts;
      const profileContact = allContacts.find(ct => ct.name === chat.name);
      setSelectedContact({
        id: `hash_${chat.id}`,
        name: chat.name,
        color: chat.color,
        lastSeen: chat.online ? 0 : Date.now() - 3600000,
        online: chat.online,
        isFavorite: chat.isFavorite,
        localFields: profileContact?.localFields
      });
    }}
    className={`w-8 h-8 rounded-full bg-gradient-to-br shrink-0 ${chat.color} flex items-center justify-center text-white font-bold text-sm shadow-sm relative cursor-pointer`}
  >
    {chat.name.charAt(0)}
    {chat.online && (
      <div className={`absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full border-[2px] ${isDark ? "bg-green-400 border-[#1a1d24]" : "bg-emerald-500 border-[#f4f7f9]"}`} />
    )}
  </div>

  <div className="flex-1 flex items-center gap-2 min-w-0">
    <span className={`font-bold text-[13px] truncate ${isDark ? "text-white" : "text-slate-800"}`}>
      {chat.name}
    </span>
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${chat.online ? "bg-green-500" : "bg-gray-500"}`} />
    <span className={`text-[9px] font-bold tracking-wider uppercase shrink-0 ${isDark ? "text-orange-400" : "text-orange-600"}`}>
      {chat.online ? t('chat.filters.online') : t('chat.filters.offline')}
    </span>
  </div>
</div>
```

- [ ] **Step 2: Remove unused imports**

After removing the action buttons, check if any icon imports become unused. The imports of `Search`, `Phone`, `Video`, `Bookmark`, `Trash2`, `ListFilter`, `BellOff`, `Mic`, `Plus`, `Play`, `Check`, `CheckCheck`, `Clock`, `Volume2`, `Maximize2`, `X` may still be used elsewhere in the component (e.g., search bar toggle, inline search bar, media panel). Keep all imports — only remove if the compiler shows they're unused.

---

### Task 4: ActiveChatWorkspace — Reduce Top Margin

**Files:**
- Modify: `src/components/chat/ActiveChatWorkspace.tsx`

- [ ] **Step 1: Change mt-6 to mt-2**

```tsx
<div className="w-full max-w-[800px] h-[90%] relative z-10 animate-fade-in mt-2 max-h-[800px]">
```

---

### Task 5: Verify Build

- [ ] **Step 1: Run TypeScript check and build**

```bash
npx tsc --noEmit && npm run build
```

Expected: No errors, build succeeds.

- [ ] **Step 2: Commit changes**

```bash
git add -A
git commit -m "feat: immersive layout - remove outer header, minimize chat header, reduce paddings"
```
