# Styles

## Design Token System

This directory contains the application's design tokens — centralized design values (colors, spacing, typography) used across all components.

### Files

| File | Purpose |
|---|---|
| `tokens.ts` | TypeScript design tokens (importable in components) |
| `tokens.css` | CSS custom properties (consumed by Tailwind) |
| `app.css` | Global CSS imports and base styles |

### Usage

**In React components (inline styles):**
```tsx
const colors = getThemeColors('dark');
<div style={{ color: colors.text.primary }} />
```

**In React components (Tailwind classes):**
```tsx
<div className="bg-[var(--bg-primary)] text-[var(--text-primary)]" />
```

### Token Structure

- `Colors.dark` / `Colors.light` — color values per theme
- `Spacing` — spacing scale (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`)
- `Typography` — font families and sizes
- `getThemeColors(mode)` — helper to get all colors for a theme
