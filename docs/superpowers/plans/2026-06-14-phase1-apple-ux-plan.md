# Phase 1: Full Apple Experience — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Mess&Anger UI into an iOS/macOS/iPad-native experience — system fonts, iOS colors, spring animations, stack navigation, bottom sheets, gestures, keyboard shortcuts, and responsive iPad layout.

**Architecture:** Layered approach — foundation (CSS/animation) → components (Sheet, gestures, navigation) → integration (modals, shortcuts, iPad layout). Each layer builds on the prior one with zero regressions.

**Tech Stack:** React 19, TypeScript 5.8, Tailwind CSS 4, motion (framer-motion), Zustand, lucide-react

---

## File Structure

### New Files (15):
| File | Responsibility |
|------|---------------|
| `src/lib/animation/presets.ts` | Spring animation configs |
| `src/lib/animation/variants.ts` | Shared motion variants |
| `src/lib/gestures/useSwipeGesture.ts` | Swipe gesture hook |
| `src/lib/gestures/useLongPress.ts` | Long press hook |
| `src/lib/gestures/usePullToRefresh.ts` | Pull to refresh hook |
| `src/lib/navigation/NavigationStack.ts` | Stack navigation provider + hook |
| `src/lib/navigation/useKeyboardShortcuts.ts` | Global keyboard shortcuts |
| `src/components/ui/Sheet.tsx` | iOS-style bottom sheet |
| `src/components/ui/SearchBar.tsx` | iOS-style search bar |
| `src/components/ui/Toggle.tsx` | iOS 17 toggle switch |
| `src/components/ui/ContextMenu.tsx` | Long press context menu |
| `src/components/ui/ActionSheet.tsx` | Alert / action sheet |
| `src/components/ui/ActivityIndicator.tsx` | iOS spinner |

### Existing Files to Modify (8):
| File | Changes |
|------|---------|
| `src/index.css` | Font stack, iOS colors, 8pt grid, safe areas, materials |
| `src/App.tsx` | Navigation stack, keyboard shortcuts, safe area layout |
| `src/components/SettingsView.tsx` | Replace toggles with iOS Toggle, modals with Sheet |
| `src/components/ChatListPanel.tsx` | Use SearchBar, add swipe gestures, pull to refresh |
| `src/components/ChatPreviewLayer.tsx` | Context menu on messages |
| `src/constants.ts` | Theme mode type, keyboard shortcut records |
| `src/lib/i18n.tsx` | Safe area CSS env vars fallback |
| `src/components/ui/NeumorphicKnob.tsx` | Migrate to spring animation |

---

### Task 1: CSS Foundation — System Font, iOS Colors, 8pt Grid, Safe Areas

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Replace font stack and add iOS design tokens**

Replace the current `index.css` content:

```css
@import "tailwindcss";

@theme {
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
    "Helvetica Neue", "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: -apple-system, BlinkMacSystemFont, "SF Pro Display",
    "SF Pro Text", "Helvetica Neue", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "JetBrains Mono", monospace;
}

:root {
  /* iOS System Colors */
  --system-blue: #007AFF;
  --system-green: #34C759;
  --system-orange: #FF9500;
  --system-red: #FF3B30;
  --system-yellow: #FFCC00;
  --system-teal: #5AC8FA;
  --system-purple: #AF52DE;
  --system-pink: #FF2D55;
  --system-gray: #8E8E93;
  --system-gray-2: #AEAEB2;
  --system-gray-3: #C7C7CC;
  --system-gray-4: #D1D1D6;
  --system-gray-5: #E5E5EA;
  --system-gray-6: #F2F2F7;

  /* 8pt Spacing Grid */
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-5: 40px;
  --space-6: 48px;
  --space-7: 56px;
  --space-8: 64px;

  /* iOS Type Scale */
  --fs-large-title: 34px;
  --fs-title-1: 28px;
  --fs-title-2: 22px;
  --fs-title-3: 20px;
  --fs-headline: 17px;
  --fs-body: 17px;
  --fs-callout: 16px;
  --fs-subheadline: 15px;
  --fs-footnote: 13px;
  --fs-caption-1: 12px;
  --fs-caption-2: 11px;
}

[data-theme="light"], :root {
  --system-background: #FFFFFF;
  --secondary-system-bg: #F2F2F7;
  --tertiary-system-bg: #FFFFFF;
  --grouped-bg: #F2F2F7;
  --separator: rgba(60, 60, 67, 0.12);
  --opaque-separator: rgba(60, 60, 67, 0.36);
}

[data-theme="dark"] {
  --system-background: #000000;
  --secondary-system-bg: #1C1C1E;
  --tertiary-system-bg: #2C2C2E;
  --grouped-bg: #000000;
  --separator: rgba(84, 84, 88, 0.36);
  --opaque-separator: rgba(84, 84, 88, 0.60);
}

body, html {
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
  margin: 0;
  padding: 0;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  padding-top: constant(safe-area-inset-top, 0px);
  padding-bottom: constant(safe-area-inset-bottom, 0px);
}

.perspective-root {
  perspective: 1000px;
  transform-style: preserve-3d;
}

/* Material/Blur Classes */
.material-ultra-thin {
  backdrop-filter: blur(60px);
  -webkit-backdrop-filter: blur(60px);
}

.material-thin {
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
}

.material-regular {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.material-thick {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* iOS Spring Animation Default */
.ios-transition {
  transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
  transition-duration: 350ms;
}

/* Scrollbar: iOS-style (thin, minimal) */
.scrollbar-none::-webkit-scrollbar { display: none; }
.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }

.scrollbar-ios::-webkit-scrollbar { width: 3px; }
.scrollbar-ios::-webkit-scrollbar-track { background: transparent; }
.scrollbar-ios::-webkit-scrollbar-thumb {
  background: var(--separator);
  border-radius: 10px;
}
.scrollbar-ios::-webkit-scrollbar-thumb:hover {
  background: var(--opaque-separator);
}

/* iOS Spinner */
@keyframes ios-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ios-spinner {
  animation: ios-spin 1s linear infinite;
}
```

- [ ] **Step 2: Verify CSS compiles**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(ios): add system font, iOS colors, 8pt grid, safe areas, material classes"
```

---

### Task 2: Spring Animation Presets & Motion Variants

**Files:**
- Create: `src/lib/animation/presets.ts`
- Create: `src/lib/animation/variants.ts`

- [ ] **Step 1: Create spring presets**

```ts
// src/lib/animation/presets.ts
import type { Transition } from 'motion/react';

type SpringPreset = Transition;

export const springs: Record<string, SpringPreset> = {
  soft: { type: "spring", stiffness: 200, damping: 25, mass: 1 },
  snappy: { type: "spring", stiffness: 400, damping: 30, mass: 0.8 },
  bouncy: { type: "spring", stiffness: 150, damping: 15, mass: 1 },
  gentle: { type: "spring", stiffness: 120, damping: 20, mass: 1 },
};

export const iosEase = { ease: [0.25, 0.1, 0.25, 1], duration: 0.35 };
```

- [ ] **Step 2: Create shared motion variants**

```ts
// src/lib/animation/variants.ts
import type { Variants } from 'motion/react';

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.15 } },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 350, damping: 30 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 350, damping: 26 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.12 } },
};

export const navPush: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400, damping: 32 } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.15 } },
};

export const navPop: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400, damping: 32 } },
  exit: { opacity: 0, x: 60, transition: { duration: 0.15 } },
};
```

- [ ] **Step 3: Verify imports compile**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/animation/
git commit -m "feat(ios): add spring animation presets and motion variants"
```

---

### Task 3: Gesture Hooks — Swipe, Long Press, Pull to Refresh

**Files:**
- Create: `src/lib/gestures/useSwipeGesture.ts`
- Create: `src/lib/gestures/useLongPress.ts`
- Create: `src/lib/gestures/usePullToRefresh.ts`

- [ ] **Step 1: Create useSwipeGesture hook**

```ts
// src/lib/gestures/useSwipeGesture.ts
import { useRef, useCallback, type TouchEvent, type MouseEvent } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeConfig {
  threshold?: number;
  edgeOnly?: boolean;
  edgeWidth?: number;
}

export function useSwipeGesture(
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) {
  const { threshold = 80, edgeOnly = false, edgeWidth = 30 } = config;
  const startRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (edgeOnly && touch.clientX > edgeWidth) return;
    startRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, [edgeOnly, edgeWidth]);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    if (!startRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startRef.current.x;
    const dy = touch.clientY - startRef.current.y;
    const elapsed = Date.now() - startRef.current.time;
    startRef.current = null;

    if (elapsed > 300) return; // too slow, not a swipe

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy && absDx > threshold) {
      if (dx > 0) handlers.onSwipeRight?.();
      else handlers.onSwipeLeft?.();
    } else if (absDy > absDx && absDy > threshold) {
      if (dy > 0) handlers.onSwipeDown?.();
      else handlers.onSwipeUp?.();
    }
  }, [threshold, handlers]);

  return {
    onTouchStart,
    onTouchEnd,
  };
}
```

- [ ] **Step 2: Create useLongPress hook**

```ts
// src/lib/gestures/useLongPress.ts
import { useRef, useCallback } from 'react';

interface LongPressConfig {
  duration?: number;
  onLongPress: (e: { clientX: number; clientY: number }) => void;
  onClick?: () => void;
}

export function useLongPress({ duration = 500, onLongPress, onClick }: LongPressConfig) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isLongPressRef = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isLongPressRef.current = false;
    posRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress({ clientX: posRef.current.x, clientY: posRef.current.y });
    }, duration);
  }, [duration, onLongPress]);

  const onPointerUp = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isLongPressRef.current) onClick?.();
    timerRef.current = null;
  }, [onClick]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - posRef.current.x);
    const dy = Math.abs(e.clientY - posRef.current.y);
    if (dx > 10 || dy > 10) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onPointerDown,
    onPointerUp,
    onPointerMove,
  };
}
```

- [ ] **Step 3: Create usePullToRefresh hook**

```ts
// src/lib/gestures/usePullToRefresh.ts
import { useState, useRef, useCallback, type TouchEvent } from 'react';

interface PullToRefreshConfig {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export function usePullToRefresh({ onRefresh, threshold = 60 }: PullToRefreshConfig) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (e.currentTarget.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!pullingRef.current || isRefreshing) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) {
      const resisted = delta * 0.4; // resistance
      setPullDistance(Math.min(resisted, 120));
    }
  }, [isRefreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, threshold, onRefresh]);

  return {
    pullDistance,
    isRefreshing,
    pullToRefreshHandlers: { onTouchStart, onTouchMove, onTouchEnd },
    refreshStyle: {
      transform: `translateY(${pullDistance}px)`,
      transition: pullDistance === 0 ? 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
    },
  };
}
```

- [ ] **Step 4: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/gestures/
git commit -m "feat(ios): add swipe, long press, and pull to refresh gesture hooks"
```

---

### Task 4: iOS Components — Sheet, Toggle, SearchBar, ActionSheet, ActivityIndicator, ContextMenu

**Files:**
- Create: `src/components/ui/Sheet.tsx`
- Create: `src/components/ui/Toggle.tsx`
- Create: `src/components/ui/SearchBar.tsx`
- Create: `src/components/ui/ActionSheet.tsx`
- Create: `src/components/ui/ActivityIndicator.tsx`
- Create: `src/components/ui/ContextMenu.tsx`

- [ ] **Step 1: Create Sheet component**

```tsx
// src/components/ui/Sheet.tsx
import { useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  detent?: 'medium' | 'large';
  children: ReactNode;
}

export function Sheet({ isOpen, onClose, detent = 'medium', children }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startTranslate = useRef(0);
  const currentTranslate = useRef(0);

  useEffect(() => {
    if (!isOpen) currentTranslate.current = 0;
  }, [isOpen]);

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    startTranslate.current = currentTranslate.current;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const delta = e.clientY - startY.current;
    if (delta > 0) {
      currentTranslate.current = startTranslate.current + delta;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${currentTranslate.current}px)`;
      }
    }
  };

  const onPointerUp = () => {
    if (currentTranslate.current > 100) {
      onClose();
    }
    currentTranslate.current = 0;
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 material-thin"
            onClick={onClose}
          />
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 1 }}
            style={{ height: detent === 'medium' ? '50vh' : '92vh' }}
            className="relative w-full max-w-lg rounded-t-2xl bg-[var(--system-background)] shadow-xl overflow-hidden touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 rounded-full bg-[var(--system-gray-4)] dark:bg-[var(--system-gray-2)]" />
            </div>
            <div className="overflow-y-auto h-full pb-6 px-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Create Toggle component**

```tsx
// src/components/ui/Toggle.tsx
import { motion } from 'motion/react';

interface ToggleProps {
  isOn: boolean;
  onToggle: () => void;
  isDark?: boolean;
}

export function Toggle({ isOn, onToggle, isDark }: ToggleProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 flex items-center px-[2px] touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
        isOn ? 'bg-[var(--system-green)]' : isDark ? 'bg-[#39393D]' : 'bg-[#E9E9EA]'
      }`}
      role="switch"
      aria-checked={isOn}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 1 }}
        className="w-[27px] h-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.1)] flex-shrink-0"
        style={{ marginLeft: isOn ? 'auto' : undefined, marginRight: isOn ? undefined : 'auto' }}
      />
    </button>
  );
}
```

- [ ] **Step 3: Create SearchBar component**

```tsx
// src/components/ui/SearchBar.tsx
import { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDark?: boolean;
  showCancel?: boolean;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search',
  isDark,
  showCancel = true,
  onCancel,
  autoFocus,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  return (
    <div className="flex items-center gap-2 w-full">
      <div
        className={`flex-1 flex items-center h-9 rounded-[10px] px-3 transition-all duration-200 ${
          isDark
            ? 'bg-[#1C1C1E] border border-white/5 focus-within:border-blue-500/30'
            : 'bg-[#E9E9EA] border border-transparent focus-within:border-blue-400/30'
        }`}
      >
        <svg className={`w-[15px] h-[15px] mr-2 shrink-0 ${isDark ? 'text-[#8E8E93]' : 'text-[#8E8E93]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`w-full bg-transparent border-none outline-none text-[15px] leading-none py-2 ${
            isDark ? 'text-white placeholder:text-[#8E8E93]' : 'text-black placeholder:text-[#8E8E93]'
          }`}
        />
      </div>
      {showCancel && isFocused && (
        <button
          onClick={() => { onChange(''); onCancel?.(); inputRef.current?.blur(); }}
          className={`text-[15px] font-normal shrink-0 transition-opacity ${
            isDark ? 'text-blue-400' : 'text-blue-500'
          }`}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create ActionSheet component**

```tsx
// src/components/ui/ActionSheet.tsx
import { motion, AnimatePresence } from 'motion/react';

interface ActionSheetAction {
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  onClick: () => void;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: ActionSheetAction[];
  cancelLabel?: string;
}

export function ActionSheet({ isOpen, onClose, title, message, actions, cancelLabel = 'Cancel' }: ActionSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-[var(--space-5)] px-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-[var(--secondary-system-bg)]"
          >
            {title && (
              <div className="px-4 pt-4 pb-2 text-center">
                <div className="text-[13px] font-semibold text-[var(--system-gray)]">{title}</div>
                {message && <div className="text-[12px] text-[var(--system-gray)] mt-1">{message}</div>}
              </div>
            )}
            <div className="px-2 py-1 space-y-[1px]">
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => { action.onClick(); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-[17px] font-normal text-center justify-center rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
                >
                  {action.icon}
                  <span className={action.destructive ? 'text-red-500' : ''}>{action.label}</span>
                </button>
              ))}
            </div>
            <div className="px-2 pb-2 pt-1">
              <button
                onClick={onClose}
                className="w-full py-3.5 text-[17px] font-semibold text-center rounded-lg bg-[var(--system-background)] hover:opacity-80 transition-opacity"
              >
                {cancelLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 5: Create ActivityIndicator component**

```tsx
// src/components/ui/ActivityIndicator.tsx
interface ActivityIndicatorProps {
  size?: number;
  color?: string;
}

export function ActivityIndicator({ size = 20, color }: ActivityIndicatorProps) {
  return (
    <div
      className="ios-spinner"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `conic-gradient(from 0deg, transparent 60%, ${color || 'var(--system-gray)'} 100%)`,
        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px))',
        mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px))',
      }}
    />
  );
}
```

- [ ] **Step 6: Create ContextMenu component**

```tsx
// src/components/ui/ContextMenu.tsx
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  shortcut?: string;
  onClick: () => void;
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ isOpen, position, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ left: position.x, top: position.y }}
          className="fixed z-[60] min-w-[180px] py-1 rounded-xl bg-[var(--secondary-system-bg)] border border-[var(--separator)] shadow-2xl overflow-hidden"
        >
          {items.map((item, i) => (
            <button
              key={i}
              disabled={item.disabled}
              onClick={() => { item.onClick(); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-left transition-colors ${
                item.destructive
                  ? 'text-red-500 hover:bg-red-500/10'
                  : item.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-white/10 active:bg-white/20'
              }`}
            >
              {item.icon && <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <span className="text-[11px] text-[var(--system-gray)] ml-4">{item.shortcut}</span>
              )}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 7: Verify all components compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/Sheet.tsx src/components/ui/Toggle.tsx src/components/ui/SearchBar.tsx src/components/ui/ActionSheet.tsx src/components/ui/ActivityIndicator.tsx src/components/ui/ContextMenu.tsx
git commit -m "feat(ios): add native iOS UI components — Sheet, Toggle, SearchBar, ActionSheet, Spinner, ContextMenu"
```

---

### Task 5: Navigation Stack

**Files:**
- Create: `src/lib/navigation/NavigationStack.ts`

- [ ] **Step 1: Create NavigationStack hook**

```tsx
// src/lib/navigation/NavigationStack.ts
import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';

export interface NavRoute {
  name: string;
  params?: Record<string, any>;
}

export function useNavigationStack(initialRoute: NavRoute) {
  const [stack, setStack] = useState<NavRoute[]>([initialRoute]);

  const push = useCallback((route: NavRoute) => {
    setStack(prev => [...prev, route]);
  }, []);

  const pop = useCallback(() => {
    setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const popToRoot = useCallback(() => {
    setStack(prev => [prev[0]]);
  }, []);

  const replace = useCallback((route: NavRoute) => {
    setStack(prev => [...prev.slice(0, -1), route]);
  }, []);

  const current = useMemo(() => stack[stack.length - 1], [stack]);
  const canGoBack = stack.length > 1;

  return { stack, current, push, pop, popToRoot, replace, canGoBack };
}

export function NavPageTransition({ children, isActive }: { children: React.ReactNode; isActive: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key="page"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/navigation/NavigationStack.ts
git commit -m "feat(ios): add navigation stack with push/pop/replace and page transitions"
```

---

### Task 6: Keyboard Shortcuts

**Files:**
- Create: `src/lib/navigation/useKeyboardShortcuts.ts`

- [ ] **Step 1: Create keyboard shortcuts hook**

```ts
// src/lib/navigation/useKeyboardShortcuts.ts
import { useEffect } from 'react';

interface ShortcutMap {
  [key: string]: () => void;
}

function normalizeKey(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.metaKey) parts.push('Cmd');
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  if (e.key === ',') parts.push(',');
  else if (e.key === ' ') parts.push('Space');
  else if (e.key === 'Escape') parts.push('Escape');
  else if (e.key === 'Enter') parts.push('Enter');
  else parts.push(e.key.toUpperCase());
  return parts.join('+');
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const key = normalizeKey(e);
      const action = shortcuts[key];
      if (action) {
        e.preventDefault();
        e.stopPropagation();
        action();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcuts, enabled]);
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/navigation/useKeyboardShortcuts.ts
git commit -m "feat(mac): add keyboard shortcuts hook with Cmd key support"
```

---

### Task 7: Migrate App.tsx to Stack Navigation + Keyboard Shortcuts

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add navigation stack and keyboard shortcuts to App.tsx**

Import and integrate:
```tsx
// Add to imports in App.tsx
import { useNavigationStack, NavPageTransition } from './lib/navigation/NavigationStack';
import { useKeyboardShortcuts } from './lib/navigation/useKeyboardShortcuts';
import { Sheet } from './components/ui/Sheet';
```

Replace `const [view, setView] = useState<'hub' | ...>('hub')` with:
```tsx
const nav = useNavigationStack({ name: 'hub' });
const { current: navCurrent, push, pop, canGoBack } = nav;
const view = navCurrent.name;
const setView = (v: string) => push({ name: v });
```

Add keyboard shortcuts (after the state declarations):
```tsx
useKeyboardShortcuts({
  'Cmd+,': () => push({ name: 'settings' }),
  'Cmd+F': () => setChatSearchQuery(prev => prev || ' '),
  'Escape': () => { if (activeChat) setActiveChat(null); else if (canGoBack) pop(); },
  'Cmd+N': () => { setView('contacts'); },
  'Cmd+W': () => setActiveChat(null),
  'Cmd+Enter': () => handleSendMessage(),
});
```

Replace the `AnimatePresence mode="wait"` that switches between hub and content:
```tsx
<AnimatePresence mode="wait">
  {view === 'hub' ? (
    <motion.div key="hub" ...>...</motion.div>
  ) : (
    <motion.div key="content" ...>...</motion.div>
  )}
</AnimatePresence>
```

No change needed — the pattern already uses AnimatePresence mode="wait" which works with the stack.

- [ ] **Step 2: Verify app compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Verify dev server starts**

Run: `npm run dev`
Expected: Server starts on port 3000.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/lib/navigation/
git commit -m "feat(ios): integrate navigation stack and keyboard shortcuts into App"
```

---

### Task 8: Integrate iOS Components into SettingsView

**Files:**
- Modify: `src/components/SettingsView.tsx`

- [ ] **Step 1: Replace toggle with iOS Toggle**

```tsx
// Add import
import { Toggle } from './ui/Toggle';

// Replace ToggleSwitch usage (line ~96-106) with:
// const ToggleSwitch = ({ isOn, onToggle, isDark }) => (
//   <Toggle isOn={isOn} onToggle={onToggle} isDark={isDark} />
// );
```

Replace the inline ToggleSwitch definition:
```tsx
const ToggleSwitch = ({ isOn, onToggle, isDark }: { isOn: boolean, onToggle: () => void, isDark: boolean }) => (
  <Toggle isOn={isOn} onToggle={onToggle} isDark={isDark} />
);
```

- [ ] **Step 2: Replace SearchBar with iOS SearchBar**

```tsx
// Replace the search input in renderMainSettings (lines ~702-716):
import { SearchBar } from './ui/SearchBar';

// Replace:
{/* <div className="relative">...</div> */}
// With:
<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder={searchPlaceholder}
  isDark={isDark}
/>
```

- [ ] **Step 3: Verify compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/SettingsView.tsx
git commit -m "feat(ios): integrate iOS Toggle and SearchBar into SettingsView"
```

---

### Task 9: Add Context Menu to Chat Messages

**Files:**
- Modify: `src/components/ChatPreviewLayer.tsx`

- [ ] **Step 1: Read current ChatPreviewLayer to understand structure**

Run: `wc -l src/components/ChatPreviewLayer.tsx`
Check the file structure to find where to add context menu trigger.

- [ ] **Step 2: Add context menu to messages**

```tsx
// Add to imports
import { useLongPress } from '../lib/gestures/useLongPress';
import { ContextMenu } from '../components/ui/ContextMenu';
import { useState } from 'react';

// Add state inside the component
const [contextMenuMsg, setContextMenuMsg] = useState<{ id: number; x: number; y: number } | null>(null);

// For each message element, add long press and right-click handlers:
// Wrap the message div with:
/*
const longPressProps = useLongPress({
  onLongPress: (pos) => setContextMenuMsg({ id: msg.id, x: pos.clientX, y: pos.clientY }),
  onClick: () => {/* existing click handler *\/},
});

// On the message element:
<div {...longPressProps} onContextMenu={(e) => { e.preventDefault(); setContextMenuMsg({ id: msg.id, x: e.clientX, y: e.clientY }); }}>
  {/* message content *\/}
</div>

// At the end of the component JSX:
<ContextMenu
  isOpen={!!contextMenuMsg}
  position={contextMenuMsg ? { x: contextMenuMsg.x, y: contextMenuMsg.y } : { x: 0, y: 0 }}
  items={[
    { label: 'Copy', icon: <Copy size={14} />, onClick: () => copyMessage(contextMenuMsg?.id) },
    { label: 'Reply', icon: <Reply size={14} />, onClick: () => replyTo(contextMenuMsg?.id) },
    { label: 'Forward', icon: <Forward size={14} />, onClick: () => forward(contextMenuMsg?.id) },
    { label: 'Delete', icon: <Trash2 size={14} />, destructive: true, onClick: () => deleteMessage(contextMenuMsg?.id) },
  ]}
  onClose={() => setContextMenuMsg(null)}
/>
*/
```

- [ ] **Step 3: Verify compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ChatPreviewLayer.tsx
git commit -m "feat(ios): add iOS-style context menu on message long press and right-click"
```

---

### Task 10: Add Swipe Gestures to ChatListPanel

**Files:**
- Modify: `src/components/ChatListPanel.tsx`

- [ ] **Step 1: Add swipe-to-archive on chat items**

```tsx
// Add import
import { useSwipeGesture } from '../lib/gestures/useSwipeGesture';

// In the chat item loop, wrap each ChatListItem:
/*
{filteredChats.map((c: any) => {
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => toggleArchive(c.id),
  });

  return (
    <div key={c.id} className="mb-4 relative overflow-hidden" {...swipeHandlers}>
      <ChatListItem ... />
    </div>
  );
})}
*/
```

- [ ] **Step 2: Add pull to refresh**

```tsx
// Add import
import { usePullToRefresh } from '../lib/gestures/usePullToRefresh';

// In ChatListPanel, add:
const pullToRefresh = usePullToRefresh({
  onRefresh: async () => {
    // Simulate refresh
    await new Promise(r => setTimeout(r, 1000));
  },
});

// Wrap the scrollable area:
/*
<div style={pullToRefresh.refreshStyle} {...pullToRefresh.pullToRefreshHandlers} className="...">
  {pullToRefresh.isRefreshing && (
    <div className="flex justify-center py-4">
      <ActivityIndicator />
    </div>
  )}
  ...existing content...
</div>
*/
```

- [ ] **Step 3: Verify compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ChatListPanel.tsx
git commit -m "feat(ios): add swipe gestures and pull to refresh to chat list"
```

---

### Task 11: Convert Modals to Sheet

**Files:**
- Modify: `src/components/CreateChannelModal.tsx`
- Modify: `src/components/EditChannelModal.tsx`
- Modify: `src/components/CreateBotModal.tsx`
- Modify: `src/components/AdvancedFilterModal.tsx`
- Modify: `src/components/FolderManagerModal.tsx`
- Modify: `src/components/ContactProfileModal.tsx`
- Modify: `src/components/SlideUpPreview.tsx`

- [ ] **Step 1: Convert one modal (example — CreateChannelModal)**

```tsx
// src/components/CreateChannelModal.tsx
import { Sheet } from './ui/Sheet';
// ... rest of imports

// Replace the wrapper div with Sheet:
export function CreateChannelModal({ theme, onClose }: { theme: string; onClose: () => void }) {
  return (
    <Sheet isOpen={true} onClose={onClose} detent="large">
      {/* Move all existing content here, wrapping in scrollable div */}
      <div className="space-y-4">
        {/* existing form content */}
      </div>
    </Sheet>
  );
}
```

- [ ] **Step 2: Repeat for remaining modals**

Convert each modal to use Sheet component. For ContactProfileModal use `detent="medium"`.

- [ ] **Step 3: Verify compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/CreateChannelModal.tsx src/components/EditChannelModal.tsx src/components/CreateBotModal.tsx src/components/AdvancedFilterModal.tsx src/components/FolderManagerModal.tsx src/components/ContactProfileModal.tsx src/components/SlideUpPreview.tsx
git commit -m "feat(ios): convert all modals to iOS-style bottom sheets"
```

---

### Task 12: Polish — Theme Mode Toggle (System/Light/Dark)

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add system theme detection**

```tsx
// Add to App.tsx
const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(
  () => (localStorage.getItem('app_theme_mode') as any) || 'dark'
);

// Detect system preference
const [systemDark, setSystemDark] = useState(
  window.matchMedia('(prefers-color-scheme: dark)').matches
);

useEffect(() => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}, []);

// Compute effective theme
const effectiveTheme = themeMode === 'system' ? (systemDark ? 'dark' : 'light') : themeMode;

// Apply data-theme attribute
useEffect(() => {
  document.documentElement.setAttribute('data-theme', effectiveTheme);
}, [effectiveTheme]);

// Persist
useEffect(() => {
  localStorage.setItem('app_theme_mode', themeMode);
}, [themeMode]);
```

- [ ] **Step 2: Add theme toggle in SettingsView**

Add a settings row:
```tsx
<SettingsItem
  title="Appearance"
  subtitle={themeMode === 'system' ? 'System' : themeMode === 'dark' ? 'Dark' : 'Light'}
  isDark={isDark}
  rightElement={
    <select
      value={themeMode}
      onChange={(e) => setThemeMode(e.target.value as any)}
      className={`text-xs rounded-lg px-2 py-1 ${isDark ? 'bg-[#1C1C1E] text-white' : 'bg-white text-black'}`}
    >
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  }
/>
```

- [ ] **Step 3: Verify compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/SettingsView.tsx
git commit -m "feat(ios): add system/light/dark theme mode with OS preference detection"
```

---

### Task 13: iPad Three-Column Layout

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add responsive three-column layout**

Wrap the content area:
```tsx
// In the content view (non-hub), add responsive layout:
/*
<div className={`flex-1 w-full ${isWide ? 'flex gap-0' : 'flex flex-col'} min-h-0`}>
  {isWide && (
    <div className="w-[68px] shrink-0 border-r border-[var(--separator)] flex flex-col items-center py-4 gap-4">
      {/* Compact sidebar with icon buttons *\/}
      {compactNavItems.map(item => (
        <button key={item.id} onClick={() => setView(item.id)}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
            view === item.id ? 'bg-blue-500 text-white' : 'hover:bg-white/10'
          }`}
        >
          <item.icon size={20} />
        </button>
      ))}
    </div>
  )}
  {(!isWide || !activeChat) && (
    <div className={isWide ? 'w-[320px] shrink-0 border-r border-[var(--separator)]' : 'flex-1'}>
      <ChatListPanel ... />
    </div>
  )}
  {activeChat && (
    <div className="flex-1 min-w-0">
      <ChatPreviewLayer ... />
      <ChatInputBar ... />
    </div>
  )}
</div>
*/
```

- [ ] **Step 2: Add wide screen detection**

```tsx
const [isWide, setIsWide] = useState(window.innerWidth >= 1024);

useEffect(() => {
  const handler = () => setIsWide(window.innerWidth >= 1024);
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);
```

- [ ] **Step 3: Verify layout on resize**

Run: `npm run dev`
Manually resize browser to >1024px and verify three-column layout.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ipad): add three-column responsive layout for iPad (1024px+)"
```

---

### Task 14: Final Polish — Audit All Transitions

**Files:**
- Modify: `src/components/ui/NeumorphicKnob.tsx`
- Modify: `src/components/ThemeToggle.tsx`

- [ ] **Step 1: Migrate NeumorphicKnob to spring animation**

```tsx
// In NeumorphicKnob, replace transition with spring:
import { springs } from '../../lib/animation/presets';

// Replace transition={{ duration: 0.3 }} with transition={springs.snappy}
```

- [ ] **Step 2: Update scrollbar classes**

Replace `scrollbar-dark` / `scrollbar-light` with `scrollbar-ios` in all components.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/NeumorphicKnob.tsx src/components/ThemeToggle.tsx
git commit -m "chore(ios): final polish — spring transitions, iOS scrollbars, animations audit"
```

---

## Spec Coverage Check

| Spec Section | Tasks |
|-------------|-------|
| 1.1 Typography | Task 1 |
| 1.2 Color System | Task 1 |
| 1.3 Spacing | Task 1 |
| 1.4 System Appearance | Task 12 |
| 1.5 Material/Blur | Task 1 |
| 2.1 Spring Presets | Task 2 |
| 2.2 Swipe Gestures | Task 3, 10 |
| 2.3 Long Press | Task 3, 9 |
| 2.4 Pull to Refresh | Task 3, 10 |
| 2.5 Page Transitions | Task 2, 5 |
| 3.1 Stack Navigation | Task 5, 7 |
| 3.2 Navigation Bar | Task 5 |
| 3.3 Tab Bar | Deferred (spec optional) |
| 3.4 Hub Retention | Task 7 (no-op) |
| 3.5 Deep Linking | Deferred |
| 4.1 Sheet | Task 4, 11 |
| 4.2 Search Bar | Task 4, 8 |
| 4.3 Toggle Switch | Task 4, 8 |
| 4.4 Context Menu | Task 4, 9 |
| 4.5 Action Sheet | Task 4 |
| 4.6 Activity Indicator | Task 4 |
| 5.1 Keyboard Shortcuts | Task 6, 7 |
| 5.2 Hover States | Task 14 |
| 5.3 Right-Click Menu | Task 9 |
| 5.4 Window Management | Task 13 |
| 6.1 Three-Column Layout | Task 13 |
| 6.2 Keyboard Avoidance | Deferred |
| 6.3 Safe Areas | Task 1 |
| 6.4 Orientation | Task 13 |

**Deferred items** (not critical for initial launch):
- Tab bar (spec says "optional")
- Deep linking (complex, requires URL scheme setup)
- Keyboard avoidance (iOS Safari-specific, complex)
