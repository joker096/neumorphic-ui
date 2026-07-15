# UI Optimization & Settings Redesign — Thinking Doc

**Date:** 2026-06-27  
**Scope:** SettingsView consolidation, design token system, visual polish  
**Constraint:** Work with existing Tailwind v4 + React + motion. No framework migration.  

---

## 1. Core Diagnosis

| Problem | Severity | Why It Matters |
|---|---|---|
| SettingsView is a 569-line monolith | **High** | Adding company chat settings will push it past 800 lines. Unmaintainable. |
| Zero design tokens | **High** | Every color, shadow, spacing value is repeated as an arbitrary Tailwind class. Changing the palette requires editing 50+ components. |
| 4 different settings UI patterns | **Medium** | Users get confused: some settings are big gradient cards, others are tiny rows, others are grid tiles. No visual grammar. |
| Inconsistent spacing scale | **Medium** | `p-5`, `p-4`, `py-3`, `py-3.5`, `py-2.5` used interchangeably. Feels hand-coded, not systematic. |
| Theme prop drilled 5+ levels | **Medium** | `App.tsx` forwards `theme`, `isDark`, `t` through 5 component layers. Any new feature must thread them through. |
| Neumorphism exists only in 3 isolated components | **Low** | Project is named "neumorphic-ui" but 90% of the UI is dark glassmorphism with orange glow. Brand promise vs reality mismatch. |

---

## 2. Recommended Changes (Prioritized)

### Phase 1: Foundation (must do first)

**2.1 Design Tokens via CSS Custom Properties + Tailwind theme**

Create `src/styles/tokens.css`:
```css
:root {
  /* Spacing scale (4-base) */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */

  /* Radius scale */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.25rem;

  /* Typography */
  --font-sans: 'Roboto', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;

  /* Shadows (tinted, not black) */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -4px rgba(0,0,0,0.3);
  --shadow-inset: inset 0 2px 4px 0 rgba(0,0,0,0.5);
  
  /* Neumorphic shadows (light) */
  --neu-raised-light: 3px 3px 6px #d1d9e6, -3px -3px 6px #ffffff;
  --neu-inset-light: inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff;
  
  /* Neumorphic shadows (dark) */
  --neu-raised-dark: 3px 3px 6px #0a0c10, -3px -3px 6px #14171e;
  --neu-inset-dark: inset 3px 3px 6px #0a0c10, inset -3px -3px 6px #14171e;
}

[data-theme="dark"] {
  /* Dark palette */
  --bg-primary: #0d1017;
  --bg-secondary: #13151b;
  --bg-tertiary: #1a1d24;
  --bg-elevated: #1e2128;
  --text-primary: #f0f2f5;
  --text-secondary: #9ca3af;
  --text-tertiary: #6b7280;
  --border-color: rgba(255,255,255,0.06);
  --accent: #f97316;
  --accent-soft: rgba(249,115,22,0.12);
}

[data-theme="light"] {
  /* Light palette */
  --bg-primary: #f8fafc;
  --bg-secondary: #f1f5f9;
  --bg-tertiary: #e2e8f0;
  --bg-elevated: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  --border-color: rgba(0,0,0,0.08);
  --accent: #ea580c;
  --accent-soft: rgba(234,88,12,0.1);
}
```

Then in Tailwind config, extend theme to use these as utilities:
```js
// vite.config.ts or tailwind config
theme: {
  extend: {
    spacing: {
      '1': 'var(--space-1)',
      '2': 'var(--space-2)',
      // ...
    },
    borderRadius: {
      'sm': 'var(--radius-sm)',
      // ...
    }
  }
}
```

**Benefit:** Change the entire app palette by editing 1 file. No more arbitrary `bg-[#1a1d24]` scattered across 100 components.

---

**2.2 Theme Context (eliminate prop drilling)**

Create `src/contexts/ThemeContext.tsx`:
```tsx
export const ThemeContext = createContext<{
  theme: 'light' | 'dark';
  isDark: boolean;
  setTheme: (t: 'light' | 'dark') => void;
  t: (key: string) => string;
}>(null);
```

Wrap `App.tsx` once. Every component calls `useTheme()` instead of receiving props.

**Benefit:** Adding company chat UI won't require threading 4 new props through 6 component layers.

---

**2.3 Split SettingsView into a registry pattern**

Current: 569 lines, 20+ useState hooks, 10 lazy sections, all in one file.

Target architecture:
```
src/components/settings/
  SettingsShell.tsx              # Layout, search, breadcrumb — 80 lines
  settingsRegistry.ts            # Map of { id, label, icon, component, category }
  categories/
    IdentitySettings.tsx         # Account, devices, recovery
    AppearanceSettings.tsx       # Theme, language, font size
    PrivacySettings.tsx          # Forwarding, read receipts, visibility
    SecuritySettings.tsx         # PIN, 2FA, secure wipe
    NotificationSettings.tsx     # DND, sounds, priority contacts
    NetworkSettings.tsx          # Obfuscation, proxy, TURN
    StorageSettings.tsx          # Backup, export, media autoload
    CompanySettings.tsx          # NEW: company channels, members, key rotation
```

Each file owns its own state. `SettingsShell` just renders the active one.

**Benefit:** Company chat settings slot in as a new file. SettingsView becomes ~120 lines.

---

### Phase 2: Visual Consistency (medium effort, high payoff)

**2.4 Standardize the 4 settings patterns into 2**

Current patterns:
1. **Gradient big cards** (Account, Security, Privacy) — used for "entry points"
2. **SettingsGroup + SettingsRow** (Notifications, Advanced) — used for "toggles"
3. **3-column quick grid** (Quick Options) — used for "top actions"
4. **Full-width highlight card** (Data Storage) — used for "primary action"

Consolidate to:
- **Section Cards** — `bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[var(--radius-xl)] p-[var(--space-5)]`
  - Contains either: (a) navigation rows or (b) toggle rows
  - Never gradient backgrounds. Color communicates category via a left border accent or icon color only.
- **Primary Action Row** — full-width, slightly elevated (`shadow-md`), contains the main CTA

**Rule:** One container style. One row style. Icon color + label communicates category.

---

**2.5 Fix spacing scale enforcement**

Replace all of these:
- `p-5` → `p-[var(--space-5)]` (20px)
- `p-4` → `p-[var(--space-4)]` (16px)
- `gap-2` → `gap-[var(--space-2)]` (8px)
- `gap-5` → `gap-[var(--space-5)]` (20px)

Standardize SettingsView to: **section gap 20px, card padding 20px, row padding 16px, row gap 12px.**

---

**2.6 Standardize icon containers**

Current: `w-8 h-8`, `w-10 h-10`, `rounded-lg`, `rounded-xl` mixed.

Standard: **`w-9 h-9 rounded-[var(--radius-lg)]`** for all inline icons in settings rows. One size, one radius.

---

### Phase 3: Polish (low effort, noticeable)

**2.7 Animation consistency**

Replace all:
```tsx
transition={{ type: "spring", stiffness: 300, damping: 25 }}
```

With a shared constant:
```ts
// src/constants.ts
export const SPRING = { type: "spring", stiffness: 350, damping: 28 } as const;
export const EASE_OUT = [0.16, 1, 0.3, 1] as const; // for non-spring
```

And for view transitions, use directional springs:
```ts
const SLIDE_RIGHT = { x: [-20, 0], ...SPRING };
const SLIDE_LEFT = { x: [20, 0], ...SPRING };
```

---

**2.8 Accessibility quick wins**

- All clickable `div`s in settings → `<button>` with `type="button"`
- Add `focus-visible:ring-2 focus-visible:ring-[var(--accent)]` to all interactive elements
- Increase minimum readable text from `text-[8.5px]` to `text-xs` (12px)
- Add `sr-only` labels where icon-only buttons exist

---

**2.9 Neumorphic consistency (optional, brand alignment)**

Since the project is called "neumorphic-ui", commit to the aesthetic properly:

Add a `neu-*` utility class set:
```css
.neu-raised {
  box-shadow: var(--neu-raised-dark);
  background: var(--bg-secondary);
}
.neu-inset {
  box-shadow: var(--neu-inset-dark);
}
[data-theme="light"] .neu-raised {
  box-shadow: var(--neu-raised-light);
}
[data-theme="light"] .neu-inset {
  box-shadow: var(--neu-inset-light);
}
```

Apply to: input fields, toggle tracks, the settings search bar, company chat input.

**This ties the visual brand to the project name instead of looking like generic dark-mode Telegram.**

---

## 3. SettingsView Specific Recommendations

### 3.1 Reorganize sections into 3 groups

**Group 1 — Essentials (always visible)**
- Account
- Appearance (theme + font size)
- Notifications

**Group 2 — Privacy & Security**
- Security (PIN, 2FA, wipe)
- Privacy (forwarding, read receipts, visibility)

**Group 3 — Advanced**
- Network (obfuscation, proxy)
- Company (NEW: channels, members)
- Storage (backup, export)
- System Status

**Remove:** PWA banner (it's a one-time thing, not a setting), Quick Options grid (redundant with sections below).

---

### 3.2 Replace the "Quick Options" 3-column grid

Current: Notifications / Sound / Cloud Sync as big tiles.

Better: These are already toggle rows in the Notifications section below. Delete the grid. One source of truth.

---

### 3.3 Search should filter, not just highlight

Current search in SettingsView does nothing functional (no filtering code visible).

Add: `filteredSections = sections.filter(s => s.label.toLowerCase().includes(query))` — hide non-matching sections. This makes settings actually discoverable at 20+ options.

---

## 4. Proposed File Changes

| Action | File | Priority |
|---|---|---|
| Create | `src/styles/tokens.css` | **P0** |
| Create | `src/contexts/ThemeContext.tsx` | **P0** |
| Modify | `src/App.tsx` — wrap in ThemeProvider, remove theme prop drilling | **P0** |
| Modify | `src/index.css` — import tokens.css, extend Tailwind theme | **P0** |
| Create | `src/components/settings/settingsRegistry.ts` | **P1** |
| Split | `SettingsView.tsx` → Shell + 8 category files | **P1** |
| Modify | All components — replace arbitrary colors with CSS variables | **P1** |
| Modify | `src/components/ui/SettingsRow.tsx` — standardize sizing | **P2** |
| Create | `src/constants.ts` — shared SPRING/EASE constants | **P2** |
| Modify | SettingsView search — add actual filtering | **P2** |

---

## 5. What NOT to Change

- **Keep Tailwind.** It's working. Don't migrate to CSS modules or styled-components.
- **Keep motion/react.** The spring animations feel good; just standardize the constants.
- **Keep the dark-mode-first approach.** The target audience is security-conscious users who prefer dark UI.
- **Keep lucide-react.** Icons are fine; just standardize stroke width (currently mixed between `strokeWidth={1.5}` and default `2`).

---

## 6. Risk Assessment

| Risk | Mitigation |
|---|---|
| CSS variable browser support | All target browsers support CSS custom properties. No risk. |
| Breaking existing components during token migration | Do it incrementally: add variables, then migrate one component at a time. Old arbitrary values can coexist during transition. |
| SettingsView split introduces bugs | Each category file is self-contained. Shell just renders `<activeSection />`. Low risk. |
| Theme Context breaks SSR | App is client-only (Vite SPA). No SSR. No risk. |

---

## 7. Success Criteria

1. **SettingsView < 200 lines** (currently 569)
2. **< 10 arbitrary color values** in the entire settings directory (currently ~50+)
3. **Zero prop drilling** for theme/i18n in component tree below App.tsx
4. **Consistent spacing**: only 3 padding values used in settings (`--space-4`, `--space-5`, `--space-6`)
5. **Search filters** sections in real-time

---

*End of thinking doc.*
