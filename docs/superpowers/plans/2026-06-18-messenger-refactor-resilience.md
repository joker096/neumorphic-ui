# Messenger Refactor and Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the messenger UI into smaller, focused components, remove dead files, fix syntax/build issues, improve responsive behavior, and document the architecture for future development.

**Architecture:** Split `App.tsx` and `AppChrome.tsx` responsibilities into focused components: global controls, hub radial UI, content navigation, message list, active chat, overlays, and resilience boundaries. Keep state ownership in `App.tsx` while UI blocks become reusable components with typed props.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, motion/react, Zustand, sonner, Vitest, ESLint.

---

### Task 1: Project Audit and Baseline Verification

**Files:**
- Modify: `package.json`
- Test: `npm run build`, `npm run lint`, `npm test`

- [ ] **Step 1: Inspect package scripts and config**

```bash
cat package.json
cat tsconfig.json
cat vite.config.ts
```

Expected: identify build, lint, and test commands.

- [ ] **Step 2: Run baseline checks**

```bash
npm run build
npm run lint
npm test
```

Expected: capture current failures before refactoring.

### Task 2: Extract App-Level UI Components

**Files:**
- Create: `src/components/app/GlobalControls.tsx`
- Create: `src/components/app/HubView.tsx`
- Create: `src/components/app/ContentView.tsx`
- Create: `src/components/app/ContentViewHeader.tsx`
- Create: `src/components/app/ChatWorkspace.tsx`
- Create: `src/components/app/index.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create global controls component**

```tsx
import { ThemeToggle, LanguageSelector } from "../AppChrome";

type Translate = (key: string, options?: any) => string;

type GlobalControlsProps = {
  isDark: boolean;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  showLangMenu: boolean;
  setShowLangMenu: (show: boolean) => void;
  language: string;
  setLanguage: (code: string) => void;
  t: Translate;
};

export const GlobalControls = ({
  isDark,
  theme,
  setTheme,
  showLangMenu,
  setShowLangMenu,
  language,
  setLanguage,
  t,
}: GlobalControlsProps) => (
  <div className="fixed top-4 right-4 z-[300] flex items-center gap-2 pointer-events-auto">
    <ThemeToggle isDark={isDark} theme={theme} setTheme={setTheme} t={t} />
    <LanguageSelector
      isDark={isDark}
      showLangMenu={showLangMenu}
      setShowLangMenu={setShowLangMenu}
      language={language}
      setLanguage={setLanguage}
      t={t}
    />
  </div>
);
```

Expected: theme and language controls are positioned consistently and no longer appear in document flow.

- [ ] **Step 2: Create hub view component**

```tsx
import { motion } from "motion/react";
import type { ComponentType, SVGProps } from "react";
import { AccountSwitcher } from "../AccountSwitcher";
import { RadialMenu } from "../AppChrome";

type HubItem = {
  id: string;
  angle: number;
  title: string;
  subtitle: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

type HubViewProps = {
  theme: "light" | "dark";
  items: HubItem[];
  badges?: Record<string, number>;
  centerTitle: string;
  centerSubtitle: string;
  onItemClick: (id: string) => void;
};

export const HubView = ({
  theme,
  items,
  badges,
  centerTitle,
  centerSubtitle,
  onItemClick,
}: HubViewProps) => (
  <motion.div
    key="hub-view"
    className="flex-1 w-full h-[100dvh] bg-transparent flex flex-col items-center justify-center relative z-10"
  >
    <AccountSwitcher theme={theme} />
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 scale-[0.45] min-[400px]:scale-[0.5] sm:scale-[0.6] md:scale-90 lg:scale-100 flex-1 flex flex-col items-center justify-center"
    >
      <RadialMenu
        theme={theme}
        items={items}
        badges={badges}
        centerTitle={centerTitle}
        centerSubtitle={centerSubtitle}
        onCenterClick={() => {}}
        onItemClick={onItemClick}
      />
    </motion.div>
  </motion.div>
);
```

Expected: hub rendering is isolated from App state.

- [ ] **Step 3: Create content header component**

```tsx
import { ChevronRight } from "lucide-react";

type ContentViewHeaderProps = {
  title: string;
  isDark: boolean;
  t: (key: string, options?: any) => string;
  onBack: () => void;
};

export const ContentViewHeader = ({
  title,
  isDark,
  t,
  onBack,
}: ContentViewHeaderProps) => (
  <div className="flex items-center gap-4 px-4 sm:px-8 py-3 sm:py-4 mb-2 sm:mb-4">
    <button
      onClick={onBack}
      title={t("chat.goBack")}
      aria-label={t("chat.goBack")}
      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
        isDark
          ? "bg-[#1a1d24] border border-white/10 hover:bg-white/10"
          : "bg-[#f4f7f9] border border-black/10 hover:bg-white shadow-md"
      }`}
    >
      <ChevronRight size={22} className="rotate-180" />
    </button>
    <h2 className="text-xl sm:text-2xl font-sans tracking-wide capitalize truncate">
      {title}
    </h2>
  </div>
);
```

Expected: back button is a real accessible button with responsive sizing.

- [ ] **Step 4: Create content view shell**

```tsx
import { AnimatePresence, motion } from "motion/react";
import { HomeButton, StoryViewerOverlay } from "../AppChrome";

type ContentViewProps = {
  children: React.ReactNode;
  theme: "light" | "dark";
  isDark: boolean;
  title: string;
  t: (key: string, options?: any) => string;
  onBack: () => void;
  onHome: () => void;
  activeStory: { id: number; name: string; color: string } | null;
  isStealthMode: boolean;
};

export const ContentView = ({
  children,
  theme,
  isDark,
  title,
  t,
  onBack,
  onHome,
  activeStory,
  isStealthMode,
}: ContentViewProps) => (
  <motion.div
    key="content-view"
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 40 }}
    transition={{ duration: 0.3 }}
    className="flex-1 w-full max-w-4xl mx-auto flex flex-col relative z-20 pt-8 pb-24 h-full min-h-0"
  >
    <ContentViewHeader title={title} isDark={isDark} t={t} onBack={onBack} />
    <div className="flex-1 w-full overflow-hidden relative px-3 sm:px-4 flex flex-col items-center min-h-0">
      {children}
    </div>
    <HomeButton isDark={isDark} onClick={onHome} />
  </motion.div>
);
```

Expected: content shell owns spacing and overlays.

- [ ] **Step 5: Update App.tsx to use extracted components**

Replace the inline hub/content blocks with `<HubView ... />` and `<ContentView ...>...</ContentView>`.

Expected: App.tsx becomes state orchestration and data preparation only.

### Task 3: Extract Active Chat Components

**Files:**
- Create: `src/components/chat/ActiveChatWorkspace.tsx`
- Create: `src/components/chat/ChatListWorkspace.tsx`
- Create: `src/components/chat/index.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create chat list workspace component**

```tsx
type ChatListWorkspaceProps = {
  theme: "light" | "dark";
  view: string;
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  chatSearchQuery: string;
  setChatSearchQuery: (query: string) => void;
  filteredChats: any[];
  filteredChannels: any[];
  bots: any[];
  archivedUnreadCount: number;
  toggleArchive: (id: string | number) => void;
  contacts: any[];
  setGlobalSelectedContact: (id: string | number | null) => void;
  setActiveChat: (chat: any) => void;
  setView: (view: string) => void;
  setActiveStory: (story: any) => void;
  setShowCreateChannel: (show: boolean) => void;
  setShowCreateBot: (show: boolean) => void;
  setShowAdvancedFilterModal: (show: boolean) => void;
  advancedFilters: Record<string, boolean>;
  t: (key: string, options?: any) => string;
  isDark: boolean;
};

export const ChatListWorkspace = (props: ChatListWorkspaceProps) => {
  const { theme, view, ...rest } = props;
  return <ChatListView theme={theme} view={view} {...rest} />;
};
```

Expected: active-chat branch is isolated from App.tsx.

- [ ] **Step 2: Create active chat workspace component**

```tsx
type ActiveChatWorkspaceProps = {
  theme: "light" | "dark";
  activeChat: any;
  setActiveChat: (chat: any | null) => void;
  messageText: string;
  setMessageText: (text: string) => void;
  scheduleDateTime: string;
  setShowSchedulePopup: (show: boolean) => void;
  setScheduleDateTime: (value: string) => void;
  isRecordingVoice: boolean;
  setIsRecordingVoice: (value: boolean) => void;
  voiceNoteError: string;
  setVoiceNoteError: (value: string) => void;
  showStickerPicker: boolean;
  setShowStickerPicker: (show: boolean) => void;
  morseMode: boolean;
  silentMode: boolean;
  replyTarget: any;
  setReplyTarget: (target: any) => void;
  draftTextByChat: Record<string, string>;
  setDraftTextByChat: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setChats: React.Dispatch<React.SetStateAction<any[]>>;
  setChannels: React.Dispatch<React.SetStateAction<any[]>>;
  handleSendMessage: () => void;
  sendVoiceMessage: (url: string, duration: string) => void;
  sendStickerMessage: (emoji: string) => void;
  onScheduleChange: (value: string) => void;
  onToggleMute: () => void;
  onAttachImage: (message: any) => void;
  onHoldRecord: () => void;
  onReRecord: () => void;
  onPermissionDenied: (message: string) => void;
  onSendVoice: (url: string, duration: string) => void;
  onToggleSchedulePopup: () => void;
  onToggleSilent: () => void;
  onToggleMorse: () => void;
};

export const ActiveChatWorkspace = (props: ActiveChatWorkspaceProps) => (
  <div className="w-full max-w-[800px] h-[90%] relative z-10 animate-fade-in mt-6 max-h-[800px]">
    <ChatPreviewLayer {...props} />
    <ChatInputOverlay {...props} />
  </div>
);
```

Expected: active chat rendering is isolated and App.tsx is smaller.

- [ ] **Step 3: Update App.tsx chat conditional**

Replace the inline list/active chat block with `<ChatListWorkspace />` or `<ActiveChatWorkspace />`.

Expected: no duplicate branches remain in App.tsx.

### Task 4: Extract Feature View Components

**Files:**
- Create: `src/components/features/FeatureViews.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create feature views component**

```tsx
type FeatureViewsProps = {
  view: string;
  theme: "light" | "dark";
  contacts: any[];
  setContacts: (contacts: any[]) => void;
  showContactPicker: boolean;
  setShowContactPicker: (show: boolean) => void;
  setEditingContact: (contact: any | null) => void;
  onCall: (name: string, color?: string) => void;
  onMessage: (name: string, color?: string) => void;
};

export const FeatureViews = ({
  view,
  theme,
  contacts,
  setContacts,
  showContactPicker,
  setShowContactPicker,
  setEditingContact,
  onCall,
  onMessage,
}: FeatureViewsProps) => {
  switch (view) {
    case "pulse":
      return <SystemPulsePlayer theme={theme} />;
    case "radar":
      return <MeshRadar theme={theme} />;
    case "calls":
      return <Dialpad theme={theme} contacts={contacts} showContactPicker={showContactPicker} setShowContactPicker={setShowContactPicker} setEditingContact={setEditingContact} onCall={onCall} onMessage={onMessage} />;
    case "settings":
      return <SettingsView theme={theme} />;
    case "recordings":
      return <RecordingsScreen theme={theme} onBack={() => {}} />;
    case "contacts":
      return <ContactsView theme={theme} contacts={contacts} setContacts={setContacts} onCall={onCall} onMessage={onMessage} />;
    default:
      return null;
  }
};
```

Expected: feature rendering is centralized.

- [ ] **Step 2: Update App.tsx**

Import `FeatureViews` and replace inline feature render conditions.

Expected: App.tsx no longer renders individual feature components.

### Task 5: Error Boundaries and Runtime Resilience

**Files:**
- Create: `src/components/ErrorBoundary.tsx`
- Create: `src/components/SafeRender.tsx`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create error boundary**

```tsx
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("React error boundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-red-950 text-white p-6">
          <div className="max-w-md rounded-2xl bg-white/10 p-6">
            <h1 className="text-xl font-bold mb-2">Что-то пошло не так</h1>
            <p className="text-sm opacity-80">Приложение осталось запущено, но часть интерфейса не смогла отрисоваться.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Expected: component render failures do not stop the whole app.

- [ ] **Step 2: Create SafeRender component**

```tsx
import { ErrorBoundary } from "./ErrorBoundary";

type SafeRenderProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export const SafeRender = ({ children, fallback }: SafeRenderProps) => (
  <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>
);
```

Expected: safe wrappers are reusable.

- [ ] **Step 3: Wrap root**

```tsx
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
```

Expected: root syntax errors remain build-time only; runtime component failures are contained.

### Task 6: Remove Dead Files and Empty Directories

**Files:**
- Remove: `fix_app.py`, `fix-components.cjs`, `fix-imports.cjs`, `fix-app.tsx.cjs`, `fixSyntax.cjs`, `modifyApp.cjs`, `injectFinal.cjs`, `cleanup.cjs`, `updateViews.cjs`, `updateAll.cjs`, `newApp.txt`, `finalApp.txt`
- Modify: `docs/ARCHITECTURE.md`

- [ ] **Step 1: Remove one-off migration scripts**

```bash
rm fix_app.py fix-components.cjs fix-imports.cjs fix-app.tsx.cjs fixSyntax.cjs modifyApp.cjs injectFinal.cjs cleanup.cjs updateViews.cjs updateAll.cjs newApp.txt finalApp.txt
```

Expected: only production, docs, tests, and config remain.

- [ ] **Step 2: Update architecture document**

Add sections:
- `src/App.tsx` owns state and orchestration.
- `src/components/app/*` owns layout, hub, content, and global controls.
- `src/components/chat/*` owns active chat/list workspaces.
- `src/components/features/*` owns feature screens.
- `src/components/ErrorBoundary.tsx` owns runtime failure containment.

Expected: future contributors know what each layer does.

### Task 7: Responsive and Usability Fixes

**Files:**
- Modify: `src/components/app/GlobalControls.tsx`
- Modify: `src/components/app/ContentView.tsx`
- Modify: `src/components/app/ContentViewHeader.tsx`
- Modify: `src/components/app/HubView.tsx`

- [ ] **Step 1: Add responsive global controls**

Use `fixed top-3 right-3 sm:top-4 sm:right-4` and `gap-1.5 sm:gap-2`.

Expected: controls do not overlap on mobile.

- [ ] **Step 2: Add responsive content spacing**

Use `pt-24 sm:pt-8 pb-28 sm:pb-24 px-0`.

Expected: mobile content is not hidden by fixed controls/home button.

- [ ] **Step 3: Add responsive hub scale**

Use `scale-[0.36] min-[400px]:scale-[0.42] sm:scale-[0.6] md:scale-90 lg:scale-100`.

Expected: hub fits small phones.

### Task 8: Schema and Architecture Documentation

**Files:**
- Create: `docs/architecture-messenger-schema.md`
- Modify: `docs/ARCHITECTURE.md`

- [ ] **Step 1: Create architecture schema**

Document:
- State owner: `App.tsx`.
- Store: `src/store/index.ts`.
- Layout components: `src/components/app/*`.
- Chat components: `src/components/chat/*`.
- Feature components: `src/components/features/*`.
- Shared UI: `src/components/ui/*`.
- Libraries: `src/lib/*`.
- Tests: `src/**/*.test.ts*`, `tests/**/*.test.ts`.

Expected: diagram and interaction map are available.

- [ ] **Step 2: Link schema from architecture doc**

Add a short "Messenger schema" section pointing to `docs/architecture-messenger-schema.md`.

Expected: architecture docs are discoverable.

### Task 9: Verification and Final Cleanup

**Files:**
- Modify: all touched files
- Test: `npm run build`, `npm run lint`, `npm test`

- [ ] **Step 1: Run TypeScript and ESLint**

```bash
npm run lint
```

Expected: no syntax, type, or lint errors.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: Vite production bundle completes.

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: Vitest suite completes.

- [ ] **Step 4: Browser smoke test**

Start dev server:

```bash
npm run dev
```

Open `http://localhost:3000` and check:
- mobile viewport: controls, hub, chat list, active chat.
- tablet viewport: controls, hub, chat list, active chat.
- desktop viewport: controls, hub, chat list, active chat.

Expected: no visual overlap, broken buttons, or blank screens.
