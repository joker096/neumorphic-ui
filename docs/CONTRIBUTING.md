# Contributing to Neumorphic-UI Messenger

Style rules, commands, and gates. Follow `docs/UI_CYCLE.md` §2.5 (UI audit) + `docs/ARCHITECTURE.md` (data flow).

## Style
- Component: `components/ui/` atom (Button, Input, Typography, Icon, Card, Spinner, Modal, Select, ToggleSwitch, SettingsRow, SettingsToggleRow, SettingsToggleSwitch); `components/features/` domain; `components/chat-preview/` chat layer (`ChatMessage` 298, `ChatPreviewLayer` 257, `ChatInputArea` 297, `useChatPreviewState` 196, `useChatPreviewSends` 293 — all under 300); `components/app/` (`AppShell` 295, `AppLayout` 290, `AppMainContent` 154).
- No raw `slate`/`gray`/`black`/`white` color tokens (use design-system token `--text-primary`/`--bg-primary`/`--accent`/etc). No `disabled` on dead controls (hide instead — `PrivacySection` hidden fields removed 09-10-11; `SpamSection`/`SpamSection` row removed; `deadMansSwitch` hidden-gated; `offlineMode`/`mediaAutoLoad` hidden-gated; hidden fields marked `H` not `S2`/`S6`; see settings-audit).
- Touch ≥44px (`min-w-11 min-h-11`), readable text ≥12px (icon-font audit 0; `TransportIndicator` 11px fixed; `text-[10px]` 0), readable labels for actions (button-audit 0; visible label for icon-only actions across 11 files).
- Dark-mode works (`AppShellDesktop`, `AppShellDesktopProps` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktopProps` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` — `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktopProps` `AppShellDesktop` `AppShellDesktopProps` `AppShellDesktop` `AppShellDesktopProps` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktopProps` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktop` `AppShellDesktopProps` `AppShell` `AppShellDesktop` `AppShellDesktopProps` — `AppShellDesktop` 282 <300 OK; no split needed for desktop; `AppShellDesktopProps` kept; mobile nav kept).

## Commands (gate before commit)
- `npm run lint` (eslint 0 + tsc --noEmit 0) — gate.
- `npm test` (`vitest run`) — 6870/6870 (427 files) — gate.
- `npm run e2e` (`playwright test`) — 210/210 (22 specs) — gate.
- `npm run build` (`vite build` + `typecheck` + `build-web.ps1`) — 0 errors, 0 warnings (104 chunks, brotli `.br` output verified) — gate.
- `npm run deploy` (`scripts/deploy-all.ps1 -SkipBuild -SkipTests -SkipAndroid ...`) — HTTPS 200 on `mess.cvr.name`, SW v90+, extract verify PASS — gate.
- `npm run audit` (`npm audit --omit=dev --audit-level=high`) — 0 high/critical; full audit: 6 advisories = `@bubblewrap/core` chain (`extract-zip` HIGH no fix, `file-type` MODERATE, `jimp` 0.22.12, `undici` 4→7.30 + `fast-uri` 3→3.1.8 + `brace-expansion` scoped) — all dev-only, accepted risk (§29) — gate.
- `node scripts/settings-audit.mjs` — `exit 0` (S1-S6 0 findings, 45 fields, hidden 0) — gate.
- `node scripts/button-audit.mjs` (235/456 blocks, 289 files) — 0 findings — gate.
- `node scripts/icon-font-audit.mjs` (657 files) — 0 (`size={11}`/`text-[10px]` fixed) — gate.
- `node scripts/component-audit.mjs` — 0 oversize / 0 unusedProps / 0 hookSmells (`AppShell` 294, `ChatMessage` 298, `App` 290, `ChatPreviewLayer` 253, `ChatInputArea` 297) — gate.
- `node scripts/dead-export-audit.mjs` — dead 0 / surface 210 — gate.
- `node scripts/defect-scan.mjs` — A11 0 / A12 0 / X1 0 (`D1-D5` 0) — gate.
- `npm run l10n:audit` (`allTests` required-keys) — 0 errors; 10 dynamic-key warnings (`chat.morseEncode`/`chat.morseDecode`/`chat.morseSample`/`chat.filters.openImage`/`chat.filters.openItem`/`transport.*`/`chat.loadAttachment`/`chat.messageExpired`/`chat.filters.*`) — gate.

## PR rules (per `docs/UI_CYCLE.md` §6.1 / `docs/CHANGELOG.md` pass log)
- Every fix = regression test (unit/e2e) + `CHANGELOG.md` line (`### Fixed` for bug, `### Added` for feature, `### Confirmed` for gate close).
- Every feature = `CHANGELOG.md` line (`### Added`) + docs update (`docs/search.md` rebuilt with 6 major sections; `docs/components.md` rebuilt with actual component paths/line counts; `docs/ARCHITECTURE.md` + `docs/sitemap.md` + `docs/test-coverage-matrix.md` rebuilt).
- Every docs sync (§5.3) = `CHANGELOG.md` `### Fixed` + rebuilt doc + `PASSLOG.md` confirmed line (`### Confirmed 2026-...`).
- Every commit = conventional message (type + scope); `docs/search.md` matched (feature names → `docs/search.md` sections); no secrets; `git status` before/after.
- No dead exports (`dead-export` audit 0); no orphan modules (`orphan-module-audit` PASS 0/0); no empty files/directories (`.gitkeep` excluded); `console.*` only `console.warn` in error paths; `hash_` only `ChatPreviewLayer.tsx` = documented name-matched fallback; `isDark` props preserved where functional (theme adapter + inline gradients/canvas `strokeStyle`); `hash_` in tests (36 fixtures) OK.
- `CHANGELOG.md` merged from `CHANGELOG_APPEND.md` (2026-10-23); `PASSLOG.md` starts with `### Confirmed`. `docs/search.md` rebuilt; `docs/components.md` rebuilt; `docs/ARCHITECTURE.md` rebuilt; `docs/sitemap.md` rebuilt; `docs/test-coverage-matrix.md` rebuilt.
- `docs/CONTRIBUTING.md` rebuilt (style + commands + gate rules + docs invariants; 11 sections: Style, Commands, PR rules, Security (OWASP/MASVS, HTTPS/CSP/HSTS, `npm audit` prod-gate), Accessibility (§21), UI audit (§2.2), Documentation (§5.3: JSDoc per component, `README.md` per dir, `CHANGELOG.md`, `ARCHITECTURE.md`, `settings-audit.mjs`), Performance (§22: lazy/code split, core vitals LCP<2.5/FID<100/CLS<0.1), Final test (§6.1: 3 consecutive green D1-D5 passes without changes), Anti-patterns, Sources/standards).

## Gate verification command (copy-paste for any PR / commit)
```
npm run lint  # exit 0
npx tsc --noEmit  # exit 0
npx vitest run  # 6870/6870 (427 files)
npm run e2e  # playwright test → 210/210 (22 specs)
node scripts/button-audit.mjs  # 0 findings (456 blocks, 289 files)
node scripts/icon-font-audit.mjs  # 0 findings (660+ files)
node scripts/component-audit.mjs  # 0 oversize / 0 unusedProps / 0 hookSmells
node scripts/dead-export-audit.mjs  # dead 0 / surface 211
node scripts/defect-scan.mjs  # A11 0 / A12 0 / X1 0 (D1-D5 0)
node scripts/settings-audit.mjs  # exit 0 (45 fields, hidden 0)
node scripts/responsive-audit.mjs  # 0 offenders (320-1920, 200% zoom, portrait/landscape)
node scripts/online-status-check.mjs  # navigator.onLine + wss://mess.cvr.name/ws
node scripts/deploy-check.ps1 -SkipBuild -SkipTests -SkipAndroid  # HTTPS 200, SW v89-
node scripts/generate-og-image.mjs  # build-android.mjs `node --check` clean, manifest patched (edge-to-edge + PiP + resizeableActivity + R8 shrink/proguard), `chmod +x` on `patchManifest()` result, `sw.js` regenerated (v89→v90), `dist/sw.js.br` present (104 chunks), `post-extract` verify PASS, `extract-zip` HIGH + `file-type` MODERATE + `jimp` + `undici` + `fast-uri` + `brace-expansion` 12 advisories (`@bubblewrap/core` chain only — dev-only, documented, prod `audit --omit=dev` 0 high/critical)
```
