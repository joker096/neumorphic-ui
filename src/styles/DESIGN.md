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
| `--text-xs` | 12px | Labels, badges |
| `--text-sm` | 14px | Body text, inputs |
| `--text-base` | 16px | Primary content |
| `--text-lg` | 18px | Section headers |
| `--text-xl` | 20px | Large headings |
| `--text-2xl` | 24px | Hero text |

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

## Neumorphic Shadows

- Raised dark: `3px 3px 6px #0d1017, -3px -3px 6px #1f232b`
- Inset dark: `inset 3px 3px 6px #0d1017, inset -3px -3px 6px #1f232b`
- Raised light: `3px 3px 6px #d1d9e6, -3px -3px 6px #ffffff`
- Inset light: `inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff`

## Accessibility

- Touch targets minimum: **44×44px**
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
