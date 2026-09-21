# Design System Documentation

## Typography

- **Display:** Space Grotesk — headings, titles
- **Sans:** Inter — body text
- **Mono:** ui-monospace — code, crypto values
- **Serif (Landing):** Cormorant Garamond — editorial headings
- **Sans (Landing):** Outfit — body text
- **Mono (Landing):** DM Mono — labels, navigation

### Font Sizes
| Token | Size | Use |
|-------|------|-----|
| `--text-2xs` | 11px | Micro labels |
| `--text-xs` | 12px | Labels, badges, inputs |
| `--text-sm` | 14px | Body text, buttons |
| `--text-base` | 16px | Primary content |
| `--text-lg` | 18px | Section headers |
| `--text-xl` | 20px | Large headings |
| `--text-2xl` | 24px | Hero text |

### Line Heights
| Token | Value | Use |
|-------|-------|-----|
| `--leading-tight` | 1.25 | Headings (base rule on h1–h4) |
| `--leading-normal` | 1.45 | Body text (base rule on body) |

Per-element overrides use Tailwind `leading-*` utilities (class specificity wins over the base rules).

### Font Weights
Weights use the Tailwind utility scale — no separate weight tokens:
- Regular 400 — body text
- Medium 500 (`font-medium`) — buttons, labels, active states
- Semibold/Bold 600/700 — headings, emphasis

Tracking: base body `letter-spacing: -0.005em`; custom `--tracking-wide/wider/widest` (negative) for display text.

## Color System

### Dark Theme
- Background: `#0d1017` (primary) / `#13151b` (secondary) / `#1a1d24` (tertiary) / `#22262e` (elevated)
- Text: `#f0f2f5` (primary) / `#9ca3af` (secondary) / `#6b7280` (tertiary)
- Accent: `#6f7fff` (indigo) / `#965dff` (secondary accent)
- Gold (landing/accents): `#c9a96e`
- Success: `#38d69a` / Warning: `#ffc85b` / Danger: `#ff607d`

### Light Theme
- Background: `#f8fafc` (primary) / `#f1f5f9` (secondary) / `#e2e8f0` (tertiary) / `#ffffff` (elevated)
- Text: `#0f172a` (primary) / `#475569` (secondary) / `#94a3b8` (tertiary)
- Accent: `#ea580c` (orange)
- Gold (landing/accents): `#c9a96e`
- Success: `#16a04a` / Warning: `#d97c0f` / Danger: `#dc2023`

## Spacing System

| Token | Size |
|-------|------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-7` (landing) | 48px |
| `--space-8` (landing) | 64px |

## Breakpoints

| Breakpoint | Width | Use |
|------------|-------|-----|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet portrait |
| lg | 1024px | Tablet landscape / small desktop |
| xl | 1280px | Desktop |
| 2xl | 1536px | Large desktop |

## Icons

- Family: `lucide-react` only. Raw inline `<svg>` is forbidden except for the `FormActions` loading spinner.
- **`AppIcon` wrapper** (`src/components/ui/AppIcon.tsx`): normalized lucide rendering. Props: `icon` (lucide component), `size` (default 16), `active` (boolean — boosts strokeWidth to 2.5), `filled` (boolean — sets fill=currentColor for select icons). Auto-strokeWidth: 2 base, 2.5 when `size ≤ 14` or `active`. Type `AppIconSource = ComponentType<{size?, strokeWidth?, fill?, className?}>` — all icon-bearing component props should accept this type.
- Stroke: base `strokeWidth={2}` (lucide default). Emphasis `strokeWidth={2.5}` allowed for active/pressed state and tiny glyphs (≤14px). AppIcon handles this automatically.
- Optical size scale (px, passed via `size`):

| Size | Use |
|------|-----|
| 12 | Micro / status glyphs |
| 14 | Compact inline (lists, chips) |
| 16 | Default inline |
| 18 | Large inline (headers) |
| 20 | Buttons / form controls |
| 24 | Extended (panels, empty hints) |
| 32 | Empty states / hero |
| 40 / 48 | Display (brand, onboarding) |

- Off-scale sizes (9, 10, 11, 13, 15, 22, 26, 28, 30, 36) are forbidden.
- Icon-only buttons must carry `aria-label` + `title` (localised). Icon-only buttons with an obvious text label next to them may rely on that label.

## Neumorphic Shadows

All shadow values defined as CSS custom properties in `src/styles/tokens.css` (dark + light themes).

### Token Reference

| Token | Dark Value | Light Value |
|-------|-----------|-------------|
| `--neo-shadow-out` | `-7px -7px 16px rgba(255,255,255,0.035)` | `-7px -7px 16px rgba(255,255,255,0.9)` |
| `--neo-shadow-in` | `7px 7px 16px rgba(0,0,0,0.55)` | `7px 7px 16px rgba(148,163,184,0.45)` |
| `--neo-shadow-out-sm` | `-3px -3px 7px rgba(255,255,255,0.03)` | `-3px -3px 7px rgba(255,255,255,0.9)` |
| `--neo-shadow-in-sm` | `3px 3px 7px rgba(0,0,0,0.5)` | `3px 3px 7px rgba(148,163,184,0.4)` |
| `--neo-shadow-inset` | `inset 4px 4px 10px rgba(0,0,0,0.6), inset -4px -4px 10px rgba(255,255,255,0.025)` | `inset 4px 4px 10px rgba(148,163,184,0.5), inset -4px -4px 10px rgba(255,255,255,0.9)` |
| `--neo-shadow-inset-sm` | `inset 2px 2px 5px rgba(0,0,0,0.55), inset -2px -2px 5px rgba(255,255,255,0.02)` | `inset 2px 2px 5px rgba(148,163,184,0.45), inset -2px -2px 5px rgba(255,255,255,0.9)` |
| `--inset-field-shadow` | `inset 0 2px 4px 0 rgba(0,0,0,0.4)` | `inset 0 1px 2px 0 rgba(0,0,0,0.15)` |
| `--shadow-btn-primary` | `0 8px 24px -8px var(--accent)` | `0 8px 24px -8px var(--accent)` |
| `--shadow-btn-primary-pressed` | `0 2px 8px -4px var(--accent)` | `0 2px 8px -4px var(--accent)` |

### CSS Classes

| Class | Purpose | Shadow Used |
|-------|---------|-------------|
| `.neo-raised` | True neumorphic raised (call screens) | `--neo-shadow-out` + `--neo-shadow-in` |
| `.neo-raised-sm` | Small neumorphic raised | `--neo-shadow-out-sm` + `--neo-shadow-in-sm` |
| `.neo-pressed` | True neumorphic pressed | `--neo-shadow-inset` |
| `.neo-circle` | Circular call buttons | `--neo-shadow-out-sm` + `--neo-shadow-in-sm` |
| `.neu-card-inset` | Card/section inset | `--neo-shadow-inset-sm` |

## Accessibility

- Touch targets minimum: **44×44px**
- All `Button` sizes (sm/md/lg/xl) enforce a **44px minimum height** (`SIZE_MAP` in `config/buttonThemes.ts` + `--control-height-sm/md/lg` tokens); component-level `min-h` overrides below 44px are forbidden
- Focus visible: 2px gold outline with 3px offset
- Reduced motion: `prefers-reduced-motion` respected globally
- Skip link: present on all pages
- Contrast ratio: WCAG AA compliant (4.5:1 minimum)

## Animation

| Token | Duration |
|-------|----------|
| fast | 150ms |
| normal | 300ms |
| slow | 700ms |

Easing: `cubic-bezier(0.32, 0.72, 0, 1)`
