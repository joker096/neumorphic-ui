# Changelog

## [Unreleased]

### Changed
- AGENTS.md optimization cycle: Stage 1 (structural), Stage 2 (UI/UX), Stage 3 (security), Stage 4 (resilience)

### Security
- Removed unused `@bubblewrap/core` dependency (9 transitive CVEs)
- Added `Permissions-Policy` header to Vite config
- All CSS colors migrated to CSS custom properties (eliminated hardcoded colors)
- Added CSP meta tag configuration via `_headers` and `vite.config.ts`

### Fixed
- Build error: removed broken `locales` entry from `manualChunks`
- Stale lockfile cleaned (`package-lock.json` regenerated)
- `useCall.ts`: all 8 async callbacks wrapped in try-catch (unhandled rejections)
- `useAppLock.ts`: `hashAppLockPIN` wrapped in try-catch
- `wsTunnel.ts`: added 10s WebSocket connection timeout
- `PillButton`: replaced non-focusable `<div>` with `<button>` (keyboard a11y)
- `BottomNav`: added `aria-current="page"`, `focus-visible` ring
- `Input`: added `min-h-[44px]` touch target, `role="alert"` on errors
- `ErrorBoundary`/`SuspenseFallback`: theme-aware, added `role="alert"`/`role="status"`
- `EmptyState`: added `role="status"`

### Added
- Service Worker (`public/sw.js`) — cache-first, offline fallback
- CSS tokens for all missing vars (`--bg-card`, `--color-warning`, `--button-*`, etc.)

### Removed
- ~111 unused files (dead code, empty directories, test snapshots)
- 7 unused npm dependencies (`@bubblewrap/core`, `googleapis`, `jimp`, etc.)
- All hardcoded theme branches replaced with CSS variables
- Empty `.gitkeep` files
- Barrels/index re-exports (replaced with direct imports)
