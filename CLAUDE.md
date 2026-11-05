# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Mess&Anger** — P2P messenger with E2E encryption (X25519 ECDH + Ed25519 signatures + HMAC-SHA256), a WebSocket/REST signaling server, and a neumorphic UI. React 19 + TypeScript + Vite + Tailwind v4, Zustand state, Motion animations.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server on port 3000 (`--host=0.0.0.0`) |
| `npm run lint` | ESLint + `tsc --noEmit` (must pass with 0 errors) |
| `npm test` | Unit tests (Vitest, jsdom, config `vitest.config.ts`) |
| `npx vitest run path/to/file.test.ts` | Run a single unit test file |
| `npm run test:e2e` | Playwright e2e (`e2e/`, config `playwright.config.ts`) |
| `npx playwright test e2e/basic.spec.ts` | Run a single e2e spec |
| `npm run build` | Production build → `dist/` |
| `npm run build:hardened` | Build + JS obfuscation |
| `npm run release` / `npm run verify` | Release manifest + sha256 verification |
| `npm run lint:admin` | Type-check the admin SPA (needs `npm install --prefix admin`) |
| `npm run admin:create` | Admin CLI (`npx tsx server/cli.ts`) |
| `npm run deploy:server` | Start signaling server + REST API |

Server unit tests live in `server/__tests__/` and run with the separate config `vitest.server.config.ts` (Node environment) — `npx vitest run --config vitest.server.config.ts`.

E2E tests boot the app with `VITE_USE_MOCK=true` (see `playwright.config.ts` webServer env); without it the app shows onboarding and most UI paths are dead.

## Environment

One `.env` at the repo root for the whole app (template: `.env.example`).
- Server reads it via `server/env.ts` in order: `./.env` → `./server/.env` → `<cwd>/.env` (first definition wins). **Any module that reads `process.env` at module scope must import `server/env.js` first.**
- The SPA reads `VITE_*` variables, inlined at **build time** by Vite.
- `JWT_SECRET` is required, ≥32 chars, non-placeholder — the signaling server refuses to start otherwise.

## Architecture

### Client (`src/`)
- Entry: `src/main.tsx` → `src/App.tsx` (shell + boot hooks) → `AppLayout`. Feature views are lazy-loaded chunks.
- **State:** one Zustand store at `src/store/index.ts`, assembled from slices in `src/store/slices/` (chat, call, settings, crm, premium, etc.). `src/store/uiStore.ts` holds ephemeral modal/UI flags. Persistence: localStorage + IndexedDB (`src/lib/idb.ts`, idb-keyval).
- **Business logic lives in `src/hooks/`** (e.g. `useMessageActions`, `useP2PBoot`, `useAppConnection`) — components call hooks, hooks call the store.
- **Transport:** `src/lib/transport/` (wsTunnel) + `src/lib/p2p/` (P2PTransport, MeshRouter/DHT, chatFrame encoding) + `src/lib/signaling/`. Reconnect: exponential backoff in the signaling manager, linear in P2PTransport.
- **Crypto:** `src/lib/crypto/` (cryptoCore, ed25519, channelSigning, safetyNumber). Only X25519 ECDH + Ed25519 + HMAC-SHA256 are live; older Kyber/DoubleRatchet code was removed.
- **Embed widget:** separate Vite entry `src/embed-entry.tsx` → stable `dist/embed.js` (no app store/router). Generated snippet lives behind Settings → Website Embed (`PersonalSiteChatManager`).
- Resilience: root `<ErrorBoundary>`, `SafeRender` around ChatWorkspace, `window.onerror` guards in `main.tsx`, service worker `public/sw.js` (cache-first static, network-first API).

### Server (`server/`)
- `signaling-server.ts` — WebSocket signaling: JWT auth, per-identity key → sockets map, ed25519 challenge-response ownership proof, anti-replay `seq` counters.
- REST routes in `server/routes/` (auth, stats, ads, paymento, integrations), middleware in `server/middleware/` (rate limit, client IP, connection limit, CORS origins).
- SQLite (better-sqlite3) at `DB_PATH` (must live inside `data/`).
- `signalling-proxy-worker.mjs` — Cloudflare Worker relay; `signalling-seed-registry.ts` — public seed registry.

### Admin (`admin/`)
Separate Vite+React SPA with its **own** `package.json`/`node_modules` (own React copy). Root vitest aliases react/react-dom to root node_modules and `react-router-dom` to `admin/node_modules` so root tests can render admin pages without duplicate-React crashes.

## Conventions (from CONTRIBUTING.md)

- TypeScript strict mode; single quotes, no semicolons (Prettier).
- Tailwind utilities only (no CSS modules); all colors via CSS custom properties in `src/styles/tokens.css` — no hardcoded hex.
- Atomic components, max ~300 lines; touch targets ≥44px, `role`/`aria-*` required.
- Shared state → Zustand store; ephemeral UI state → local; business logic → custom hooks.
- No `dangerouslySetInnerHTML`; localStorage contents are untrusted (parse with try-catch).
- New features need Vitest + Testing Library tests.

## Quality gates (must pass before PR)

1. `npm run lint` — 0 errors
2. `npm test` (plus server tests via `vitest.server.config.ts`)
3. Audits where relevant: `npm run l10n:audit`, `npm run icon-font:audit`, `npm run button:audit`, `npm run audit`
