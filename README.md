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
| `npm run build` | Production build |
| `npx vitest run` | Run unit tests |
| `npx playwright test` | Run e2e tests |
| `node server/cli.js` | Admin CLI (stats, ads) |
| `node server/signaling-server.js` | Start signaling server |

## Environment

Copy `server/.env.example` to `server/.env` and configure:

```
JWT_SECRET=<random 64-char hex>
PORT=8765
REST_PORT=8766
DB_PATH=./data/admin.db
ALLOWED_ORIGINS=https://yourdomain.com
```

## Tests

- **Unit:** 4349+ tests across 182 files (Vitest)
- **E2E:** Playwright specs in `e2e/`
- **Lint:** ESLint + TypeScript — 0 errors
