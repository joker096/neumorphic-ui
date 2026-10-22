# Mess&Anger — Neumorphic Messenger

P2P messenger with E2E encryption, signaling server, and neumorphic UI.

## Quick Start

```bash
npm install
npm run dev
```

## Structure

| Directory | Purpose |
|---|---|
| `src/` | React app (Vite + TypeScript + Tailwind) |
| `server/` | Signaling + REST API (JWT, 2FA, WebSocket) |
| `admin/` | Admin panel (Vite + React) |
| `scripts/` | Build & deploy helpers |
| `config/` | Server configuration |
| `e2e/` | Playwright tests |
| `tests/` | Vitest unit tests |
| `docs/` | Deployment & architecture docs |
| `landing/` | Public landing page |

## Key Features

- **E2E encryption** — X25519 ECDH key agreement, Ed25519 message signatures, HMAC-SHA256 per-message authentication (no server in the trust path)
- **P2P mesh** — Multi-hop relay, NAT traversal
- **Signaling** — WebSocket with JWT auth, TOTP 2FA, rate limiting
- **UI** — Neumorphic design, dark/light themes, fully responsive
- **Offline** — Service worker, IndexedDB cache, graceful degradation
- **Accessible** — WCAG 44x44px touch targets, aria-labels, reduced motion
- **Secure** — CSP, HSTS, X-Frame-Options, input sanitization

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run lint` | ESLint + TypeScript check |
| `npm run lint:admin` | Type-check the admin SPA (own tsconfig; needs `npm install --prefix admin`) |
| `npm run build` | Production build |
| `npm run release` | Collect release artifacts + write `dist/releases/releases.json` |
| `npm run verify` | Verify the release manifest (file sizes + sha256) |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run Playwright e2e tests |
| `npm run l10n:audit` | i18n key/fallback audit (0 errors) |
| `npm run icon-font:audit` | Icon/font audit |
| `npm run button:audit` | Dead-control audit (D1–D5) |
| `npm run audit` | Prod dependency audit (0 high/critical) |
| `npm run admin:create` | Admin CLI (stats, ads) — `npx tsx server/cli.ts` |
| `npm run deploy:server` | Start signaling server + REST API (via `deploy-all.ps1 -SkipBuild -SkipAndroid`) |

## Environment

Copy `.env.example` to `.env` in the repo root — one file for the whole app. The signaling server loads it through `server/env.ts` in the order `./.env` → `./server/.env` → `<cwd>/.env` (the first file that defines a key wins), and the SPA reads the `VITE_*` variables at build time.

Server variables (`server/.env.example` lists the same set with comments):

```
JWT_SECRET=<random 64-char hex>
PORT=8765
REST_PORT=8766
DB_PATH=./data/admin.db
ALLOWED_ORIGINS=https://yourdomain.com
```

Client variables (Vite inlines them at build time):

```
VITE_SIGNALING_SEED_URLS=wss://signals.example.com/ws
VITE_RELAY_PROXY_URL=
VITE_SIGNALING_REST_URL=
VITE_EMBED_WIDGET_URL=
VITE_USE_MOCK=
```

The release pipeline (`npm run release` / `npm run verify`) reads four more variables:

```
RELEASE_BASE_URL=https://mess.cvr.name/releases/
APP_BASE_URL=https://mess.cvr.name/
PLAY_STORE_URL=https://play.google.com/store/apps/details?id=<android-package>
RELEASE_SIGN_KEY=
```

`RELEASE_BASE_URL` is the public base of the published artifacts — it becomes `baseUrl` in the manifest and every artifact url is resolved against it. `APP_BASE_URL` is the app root used by the "Web · PWA" entry. `PLAY_STORE_URL` overrides the store link (default: the Google Play page of the Android package). `RELEASE_SIGN_KEY` is the GPG key id used to sign `releases.json` (unset = unsigned).

## Tests

- **Unit:** 6577 tests across 381 files (Vitest)
- **E2E:** 210 Playwright tests in 23 spec files (`e2e/`)
- **Lint:** ESLint + TypeScript — 0 errors
