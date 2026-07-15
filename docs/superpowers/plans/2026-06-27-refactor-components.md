# Component Refactoring Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break down large components into smaller files, remove unused directories, and optimize bundle size for faster load times.

**Architecture:** Extract inline components from monolithic files into dedicated directories. Use React.lazy() for code-splitting. Remove dead code.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Motion

---

### Task 1: Cleanup Unused Lib Directories

**Files to remove:**
- `src/lib/adapt/`
- `src/lib/ads/`
- `src/lib/bot/`
- `src/lib/cache/`
- `src/lib/calendar/`
- `src/lib/distribution/`
- `src/lib/huddle/`
- `src/lib/integrations/`
- `src/lib/messaging/`
- `src/lib/moderation/`
- `src/lib/network/`
- `src/lib/payments/`
- `src/lib/reserves/`
- `src/lib/resilience/`
- `src/lib/security/`
- `src/lib/storage/`
- `src/lib/sync/`
- `src/lib/utils/`

**Files to keep (used elsewhere):**
- `src/lib/` root files: `i18n.tsx`, `lazyViews.ts`, `mockDataFlag.ts`, `callRecorderService.ts`, `deviceSecurity.ts`, `cryptoCore.ts`, `icqEmojis.ts`
- `src/lib/auth/` (TotpSetup uses `auth/clientTotp`)
- `src/lib/backup/`, `call/`, `company/`, `crypto/`, `identity/`, `p2p/`, `recovery/`, `signaling/`, `sounds/`, `transport/`

- [ ] **Step 1: Remove unused directories**
```bash
Remove-Item -LiteralPath src/lib/adapt -Recurse -Force
Remove-Item -LiteralPath src/lib/ads -Recurse -Force
Remove-Item -LiteralPath src/lib/bot -Recurse -Force
Remove-Item -LiteralPath src/lib/cache -Recurse -Force
Remove-Item -LiteralPath src/lib/calendar -Recurse -Force
Remove-Item -LiteralPath src/lib/distribution -Recurse -Force
Remove-Item -LiteralPath src/lib/huddle -Recurse -Force
Remove-Item -LiteralPath src/lib/integrations -Recurse -Force
Remove-Item -LiteralPath src/lib/messaging -Recurse -Force
Remove-Item -LiteralPath src/lib/moderation -Recurse -Force
Remove-Item -LiteralPath src/lib/network -Recurse -Force
Remove-Item -LiteralPath src/lib/payments -Recurse -Force
Remove-Item -LiteralPath src/lib/reserves -Recurse -Force
Remove-Item -LiteralPath src/lib/resilience -Recurse -Force
Remove-Item -LiteralPath src/lib/security -Recurse -Force
Remove-Item -LiteralPath src/lib/storage -Recurse -Force
Remove-Item -LiteralPath src/lib/sync -Recurse -Force
Remove-Item -LiteralPath src/lib/utils -Recurse -Force
```

- [ ] **Step 2: Verify build still passes**

Run: `npm run lint`

---

### Task 2: Extract Dialpad Nested Components

**Target:** `src/components/Dialpad.tsx` (972 lines)

**Create:** `src/components/dialpad/` directory with individual component files.

**Extract:**
- `NeumorphicKnob.tsx`
- `GlowingKnobLine.tsx`
- `GlowingPlusLight.tsx`
- `LightPillButton.tsx`
- `LightSearchBar.tsx`
- `DarkPillButton.tsx`
- `DarkSearchBar.tsx`
- `ActionCircleButton.tsx`
- `PillButton.tsx`
- `Dialpad.tsx` (keep main component only)

- [ ] **Step 1: Extract NeumorphicKnob**

Create `src/components/dialpad/NeumorphicKnob.tsx`:
```tsx
import React from "react";

export const NeumorphicKnob = () => (
  <div className="w-[18px] h-[18px] rounded-full bg-[#eaeff4] shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),_2px_2px_5px_rgba(165,175,190,0.5),_inset_1px_1px_2px_rgba(255,255,255,0.8),_inset_-1px_-1px_2px_rgba(165,175,190,0.1)] shrink-0" />
);
```

- [ ] **Step 2: Extract GlowingKnobLine**

Create `src/components/dialpad/GlowingKnobLine.tsx`:
```tsx
import React from "react";

interface GlowingKnobLineProps {
  count?: number;
}

export const GlowingKnobLine = ({ count }: GlowingKnobLineProps) => (
  <div className="w-[20px] h-[20px] rounded-full bg-[#eaeff4] shadow-[0_0_15px_rgba(255,160,80,0.8),_-2px_-2px_5px_rgba(255,255,255,0.9),_2px_2px_5px_rgba(165,175,190,0.5),_inset_1px_1px_2px_rgba(255,255,255,0.8)] shrink-0 flex items-center justify-center relative">
    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-300 via-orange-400 to-orange-200 opacity-90 shadow-[inset_0_-2px_4px_rgba(234,88,12,0.5)]" />
    {count && (
      <span className="relative z-10 text-[10px] font-bold text-orange-950 pb-[0.5px] pr-[0.5px]">
        {count}
      </span>
    )}
  </div>
);
```

- [ ] **Step 3: Extract GlowingPlusLight**

Create `src/components/dialpad/GlowingPlusLight.tsx`:
```tsx
import React from "react";
import { Plus } from "lucide-react";

export const GlowingPlusLight = () => (
  <div className="relative flex items-center justify-center p-1 w-6 h-6 shrink-0">
    <div className="absolute inset-0 bg-orange-400/50 blur-[14px] rounded-full scale-[2.2]" />
    <Plus
      size={20}
      strokeWidth={2}
      className="relative z-10 text-orange-50 drop-shadow-[0_0_4px_rgba(249,115,22,0.9)]"
    />
  </div>
);
```

- [ ] **Step 4: Extract LightPillButton**

Create `src/components/dialpad/LightPillButton.tsx`:
```tsx
import React, { useState } from "react";

interface LightPillButtonProps {
  title: string;
  subtitle: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  badge?: React.ReactNode;
}

export const LightPillButton = ({ title, subtitle, icon: Icon, badge }: LightPillButtonProps) => {
  const [active, setActive] = useState(false);
  return (
    <div
      onClick={() => setActive(!active)}
      className={`w-[260px] h-[66px] rounded-[33px] pl-6 pr-5 py-3 flex items-center justify-between cursor-pointer transition-all duration-300 select-none group border ${
        active
          ? "bg-[#e2e8f0] shadow-[inset_4px_4px_8px_rgba(165,175,190,0.25),_inset_-2px_-2px_6px_rgba(255,255,255,1)] border-black/5"
          : "bg-[#eaeff4] shadow-[-10px_-10px_22px_rgba(255,255,255,0.9),_14px_18px_32px_rgba(165,175,190,0.55),_inset_1.5px_1.5px_2.5px_rgba(255,255,255,1)] hover:scale-[1.03] active:scale-[0.97] border-white/80"
      }`}
    >
      <div className="flex flex-col -space-y-[1px] mt-1 pointer-events-none overflow-hidden pr-3">
        <span
          className={`text-[14.5px] font-semibold tracking-tight truncate w-full transition-colors ${active ? "text-orange-600" : "text-[#1a1a1b] group-hover:text-orange-600"}`}
        >
          {title}
        </span>
        <span className="text-[11.5px] font-medium text-[#88909e] truncate w-full">
          {subtitle}
        </span>
      </div>
      <div className="flex items-center justify-center shrink-0">
        {badge ? (
          <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-tr from-orange-400 to-orange-300 shadow-[0_4px_8px_rgba(249,115,22,0.4),_inset_0_-2px_4px_rgba(249,115,22,0.5)] shrink-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-orange-950 pb-[0.5px] pr-[0.5px]">
              {badge}
            </span>
          </div>
        ) : Icon ? (
          <Icon
            size={20}
            strokeWidth={1.75}
            className={`transition-all duration-300 ${active ? "text-orange-500 scale-110" : "text-[#4b5563]"}`}
          />
        ) : null}
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Extract LightSearchBar**

Create `src/components/dialpad/LightSearchBar.tsx`:
```tsx
import React, { useState } from "react";
import { Search } from "lucide-react";

interface LightSearchBarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  placeholder?: string;
}

export const LightSearchBar = ({ searchQuery, onSearchChange, placeholder }: LightSearchBarProps) => {
  const [internalVal, setInternalVal] = useState("");
  const val = searchQuery !== undefined ? searchQuery : internalVal;
  const setVal = onSearchChange || setInternalVal;
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <div className="relative group w-full">
      <div
        className={`relative w-full h-[44px] rounded-full px-6 py-0 flex items-center justify-between border transition-all duration-300 
        ${
          pressed
            ? "bg-[#e2e8f0] shadow-[inset_4px_4px_10px_rgba(165,175,190,0.4),_inset_-2px_-2px_6px_rgba(255,255,255,1)] border-black/5 scale-[0.98]"
            : focused
              ? "bg-[#eaeff4] border-orange-300/60 scale-[1.01] shadow-[-6px_-6px_12px_rgba(255,255,255,1),_8px_10px_20px_rgba(165,175,190,0.4),_inset_3px_3px_6px_rgba(165,175,190,0.1)]"
              : "bg-[#eaeff4] shadow-[-10px_-10px_20px_rgba(255,255,255,0.9),_12px_16px_28px_rgba(165,175,190,0.5),_inset_1.5px_1.5px_3px_rgba(255,255,255,1)] border-white/80 hover:scale-[1.005]"
        }`}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
      >
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder || "Search chats or messages..."}
          className="bg-transparent border-none outline-none w-full text-[14px] font-medium text-[#4b5563] placeholder:text-[#88909e] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
        />
        <div
          className={`ml-2 cursor-pointer w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${focused ? "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 active:scale-90 active:bg-orange-500/30" : "text-[#5b6371] hover:bg-gray-200/50"}`}
        >
          <Search
            size={18}
            strokeWidth={1.75}
            className={`drop-shadow-[0_1px_1px_rgba(255,255,255,1)]`}
          />
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 6: Extract DarkPillButton**

Create `src/components/dialpad/DarkPillButton.tsx`:
```tsx
import React, { useState } from "react";

interface DarkPillButtonProps {
  title: string;
  subtitle: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  badge?: React.ReactNode;
}

export const DarkPillButton = ({ title, subtitle, icon: Icon, badge }: DarkPillButtonProps) => {
  const [active, setActive] = useState(false);
  return (
    <div
      onClick={() => setActive(!active)}
      className={`relative group w-[260px] h-[66px] rounded-[33px] cursor-pointer transition-all duration-300 select-none ${!active && "hover:scale-[1.03] active:scale-[0.97]"} ${
        active
          ? "shadow-[inset_0_12px_24px_rgba(0,0,0,0.9),_inset_0_3px_6px_rgba(0,0,0,0.9)] bg-[#101216] border border-orange-500/20"
          : "shadow-[0_22px_38px_rgba(0,0,0,0.5),_0_10px_16px_rgba(0,0,0,0.35),_inset_0_1.5px_2px_rgba(255,255,255,0.08),_inset_0_-2px_4px_rgba(0,0,0,0.8)] bg-[#13151b] border border-white/[0.04]"
      }`}
    >
      {active && (
        <>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-3 bg-orange-500 rounded-full blur-[10px] opacity-100 pointer-events-none" />
          <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-10 h-[2px] bg-white rounded-full blur-[1px] opacity-80 pointer-events-none" />
          <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-4 h-[4px] bg-white rounded-full blur-[4px] opacity-100 pointer-events-none" />
        </>
      )}

      <div className="w-full h-full rounded-[33px] pl-6 pr-5 py-3 flex items-center justify-between pointer-events-none overflow-hidden relative z-10 transition-colors">
        <div className="flex flex-col -space-y-[1px] mt-0.5 mt-1">
          <span
            className={`text-[14.5px] font-semibold tracking-wide truncate w-full transition-colors ${active ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" : "text-[#e8ecf2]"}`}
          >
            {title}
          </span>
          <span className="text-[11.5px] font-medium text-[#7a8190] truncate w-full">
            {subtitle}
          </span>
        </div>
        <div className="flex items-center justify-center shrink-0">
          {badge ? (
            <div className="w-[22px] h-[22px] bg-gradient-to-tr from-orange-500 to-orange-400 rounded-full shadow-[0_0_12px_rgba(249,115,22,0.7),_inset_0_2px_3px_rgba(255,255,255,0.4)] border border-white/20 flex items-center justify-center">
              <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] pb-[0.5px] pr-[0.5px]">
                {badge}
              </span>
            </div>
          ) : Icon ? (
            <Icon
              size={20}
              strokeWidth={active ? 2 : 1.75}
              className={`transition-all duration-300 ${active ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)] scale-110" : "text-[#7a8190]"}`}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 7: Extract DarkSearchBar**

Create `src/components/dialpad/DarkSearchBar.tsx`:
```tsx
import React, { useState } from "react";
import { Search } from "lucide-react";

interface DarkSearchBarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  placeholder?: string;
}

export const DarkSearchBar = ({ searchQuery, onSearchChange, placeholder }: DarkSearchBarProps) => {
  const [internalVal, setInternalVal] = useState("");
  const val = searchQuery !== undefined ? searchQuery : internalVal;
  const setVal = onSearchChange || setInternalVal;
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <div className="relative group w-full">
      <div
        className={`relative w-full h-[44px] rounded-full px-6 py-0 flex items-center justify-between border transition-all duration-300 
        ${
          pressed
            ? "bg-[#101216] shadow-[inset_0_12px_24px_rgba(0,0,0,0.9),_inset_0_3px_6px_rgba(0,0,0,0.9)] border-orange-500/20 scale-[0.98]"
            : focused
              ? "bg-[#13151b] border-orange-500/40 scale-[1.01] shadow-[0_10px_20px_rgba(0,0,0,0.6),_inset_0_1.5px_2px_rgba(249,115,22,0.1),_inset_0_-2px_4px_rgba(0,0,0,0.9)]"
              : "bg-[#13151b] shadow-[0_12px_24px_rgba(0,0,0,0.4),_0_6px_12px_rgba(0,0,0,0.3),_inset_0_1.5px_2px_rgba(255,255,255,0.08),_inset_0_-2px_4px_rgba(0,0,0,0.8)] border-white/[0.04] hover:scale-[1.005]"
        }`}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
      >
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder || "Search messages, people..."}
          className="bg-transparent border-none outline-none w-full text-[14px] font-medium text-[#e8ecf2] placeholder:text-[#7a8190]"
        />
        <div
          className={`ml-2 cursor-pointer w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${focused ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 active:scale-90 active:bg-orange-500/30" : "text-[#a0a5b1] hover:bg-white/5"}`}
        >
          <Search size={18} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 8: Extract ActionCircleButton**

Create `src/components/dialpad/ActionCircleButton.tsx`:
```tsx
import React, { useState } from "react";

interface ActionCircleButtonProps {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  theme: "light" | "dark";
  label: string;
  color?: "default" | "red" | "yellow" | "green" | "blue";
  isToggleable?: boolean;
}

export const ActionCircleButton = ({ icon: Icon, theme, label, color = "default", isToggleable = true }: ActionCircleButtonProps) => {
  const [active, setActive] = useState(false);
  const isDark = theme === "dark";

  let iconColor = isDark ? "text-white/70" : "text-slate-500";
  let hoverIconColor = isDark ? "group-hover:text-white" : "group-hover:text-slate-800";
  let activeIconColor = isDark ? "text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" : "text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,1)]";

  if (color === "red") {
    iconColor = isDark ? "text-red-400/80" : "text-red-500";
    hoverIconColor = isDark ? "group-hover:text-red-300 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" : "group-hover:text-red-600";
    activeIconColor = isDark ? "text-red-400 drop-shadow-[0_0_12px_rgba(248,113,113,0.8)] scale-105" : "text-red-600 drop-shadow-[0_2px_4px_rgba(220,38,38,0.3)] scale-105";
  } else if (color === "yellow") {
    iconColor = "text-amber-500";
    hoverIconColor = isDark ? "group-hover:text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" : "group-hover:text-amber-400";
    activeIconColor = isDark ? "text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-105" : "text-amber-500 drop-shadow-[0_1px_1px_rgba(255,255,255,1)] scale-105";
  } else if (color === "green") {
    iconColor = isDark ? "text-teal-400" : "text-teal-600";
    hoverIconColor = isDark ? "group-hover:text-teal-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" : "group-hover:text-teal-700";
    activeIconColor = "text-teal-400 drop-shadow-[0_0_12px_rgba(45,212,191,0.8)] scale-105";
  } else if (color === "blue") {
    iconColor = isDark ? "text-blue-400" : "text-blue-600";
    hoverIconColor = isDark ? "group-hover:text-blue-300 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" : "group-hover:text-blue-700";
    activeIconColor = isDark ? "text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.8)] scale-105" : "text-blue-600 drop-shadow-[0_1px_1px_rgba(255,255,255,1)] scale-105";
  }

  if (active && color === "default") {
    activeIconColor = isDark
      ? "text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.8)] scale-105"
      : "text-orange-500 scale-105 drop-shadow-[0_2px_4px_rgba(249,115,22,0.3)]";
  }

  return (
    <div
      className="flex flex-col items-center gap-3 group cursor-pointer w-[80px]"
      onClick={() => isToggleable && setActive(!active)}
    >
      <div
        className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-300 ${!active ? "group-hover:scale-[1.05] active:scale-95" : "scale-95"} ${
          isDark
            ? active
              ? "bg-[#101216] shadow-[inset_0_12px_24px_rgba(0,0,0,0.9),_inset_0_3px_6px_rgba(0,0,0,0.9)] border border-orange-500/20"
              : "bg-[#13151b] shadow-[0_12px_24px_rgba(0,0,0,0.5),_inset_0_1.5px_2px_rgba(255,255,255,0.08),_inset_0_-2px_4px_rgba(0,0,0,0.8)] border border-white/[0.04]"
            : active
              ? "bg-[#e2e8f0] shadow-[inset_4px_4px_10px_rgba(165,175,190,0.4),_inset_-2px_-2px_6px_rgba(255,255,255,1)] border border-black/5"
              : "bg-[#eaeff4] shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),_8px_8px_16px_rgba(165,175,190,0.5),_inset_2px_2px_4px_rgba(255,255,255,1)] border border-white/80"
        }`}
      >
        <Icon
          size={24}
          strokeWidth={1.75}
          className={`transition-all duration-300 ${active ? activeIconColor : `${iconColor} ${hoverIconColor} text-slate-800"}`}
        />
      </div>
      <span
        className={`text-[10.5px] font-bold uppercase tracking-wider text-center transition-colors ${active ? (isDark ? "text-orange-400" : "text-orange-600") : isDark ? "text-gray-500 group-hover:text-gray-300" : "text-slate-500 group-hover:text-slate-800"}`}
      >
        {label}
      </span>
    </div>
  );
};
```

- [ ] **Step 9: Update Dialpad.tsx to import extracted components**

Update `src/components/Dialpad.tsx` imports and remove nested definitions.

- [ ] **Step 10: Verify build passes**

Run: `npm run build`

---

### Task 3: Extract ChatPreviewLayer Subcomponents

**Target:** `src/components/ChatPreviewLayer.tsx` (849 lines)

**Create:** `src/components/chat-preview/` directory.

**Extract obvious subcomponents:**
- `ReactionPicker.tsx`
- `MessageActions.tsx`
- `VideoPlayerOverlay.tsx` (already exists in `src/components/chat/VideoPlayerOverlay.tsx` - verify if duplicate)
- `PhotoViewerOverlay.tsx` (check if exists in PhotoViewer.tsx)

- [ ] **Step 1: Verify existing overlays**
Check if `VideoPlayerOverlay` is already extracted to `src/components/chat/VideoPlayerOverlay.tsx`.

- [ ] **Step 2: Extract ReactionPicker**

Create `src/components/chat-preview/ReactionPicker.tsx` from ChatPreviewLayer lines 80-200.

- [ ] **Step 3: Update ChatPreviewLayer imports**

Import extracted components and verify build.

---

### Task 4: Enable Code Splitting in Vite

**File:** `vite.config.ts`

- [ ] **Step 1: Configure manualChunks**
Add manual chunk splitting for vendor libraries to reduce main bundle size.

- [ ] **Step 2: Verify chunk sizes**
Run `npm run build` and confirm main chunk is under 500 kB.

---

### Task 5: Final Verification

- [ ] **Step 1: Run lint**
`npm run lint`

- [ ] **Step 2: Run tests**
`npm run test`
