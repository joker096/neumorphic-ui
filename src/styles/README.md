# Styles

## Design Token System

This directory contains the application's design tokens — centralized design values (colors, spacing, typography) used across all components.

### Files

| File | Purpose |
|---|---|
| `tokens.css` | CSS custom properties (consumed by Tailwind + `@theme inline` in `src/index.css`) |

### Usage

**Preferred: semantic Tailwind tokens** (auto-adapt to light/dark via the `@theme inline` layer in `src/index.css`):
```tsx
<div className="bg-background text-foreground border-border" />
<button className="bg-primary text-primary-foreground hover:bg-primary/90" />
```

**Legacy: raw CSS variables** (still valid, resolved from `tokens.css`):
```tsx
<div className="bg-[var(--bg-primary)] text-[var(--text-primary)]" />
```

### Token Structure

Semantic tokens (Tailwind utilities) mapped in `src/index.css` `@theme inline`:
`background`, `foreground`, `card`, `popover`, `primary` / `primary-foreground`,
`secondary`, `muted` / `muted-foreground`, `accent` / `accent-foreground`,
`destructive` / `destructive-foreground`, `border`, `input`, `ring`, and `radius-*`.
