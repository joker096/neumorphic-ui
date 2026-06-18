# Admin Panel — Design Specification

## Overview

Admin panel for Mess&Anger P2P messenger with two-factor authentication, user analytics (online count, countries, devices), and in-app advertisement management.

The app is purely client-side P2P. The only centralized component is the **WebSocket signaling server** (`server/signaling-server.ts`, port 8765) that relays WebRTC handshake messages. The admin system extends this server with REST API, SQLite database, and a separate React SPA admin UI.

---

## Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────────────────────────┐
│   P2P Clients   │ ◄──────────────►  │   Enhanced Signaling Server         │
│  (React SPA)    │                    │   (port 8765)                       │
│                 │     REST API       │                                     │
│  + AdBanner     │ ◄──────────────►  │   ├─ WebSocket (existing relay)     │
│   component     │                    │   ├─ REST API (new, port 8766)      │
└─────────────────┘                    │   ├─ JWT + TOTP 2FA auth            │
                                       │   ├─ SQLite database                │
                                       │   └─ GeoIP (geoip-lite)             │
                                       └──────────┬──────────────────────────┘
                                                  │ REST (port 8766)
                                                  ▼
                                       ┌─────────────────────┐
                                       │   Admin UI (React)   │
                                       │   Separate SPA       │
                                       │   /admin/ route      │
                                       └─────────────────────┘
```

### Key Decisions
- **Single server binary** — signaling + REST run in same Node process, different ports (8765 WS, 8766 HTTP)
- **SQLite** via `better-sqlite3` — zero configuration, no external DB server
- **GeoIP** via `geoip-lite` — offline, free, MaxMind GeoLite data
- **Admin UI** — separate Vite + React SPA, not embedded in messenger (cleaner isolation, can be deployed on different domain)

---

## Database Schema (SQLite)

### `connections`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| public_key | TEXT | User's public key |
| ip | TEXT | Remote IP address |
| user_agent | TEXT | Browser User-Agent |
| country | TEXT | Country code (ISO 3166-1 alpha-2) |
| connected_at | TEXT (ISO 8601) | Connection timestamp |
| disconnected_at | TEXT (ISO 8601) | Disconnection timestamp (NULL if still connected) |

### `admins`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| username | TEXT UNIQUE | Login |
| password_hash | TEXT | bcrypt hash |
| totp_secret | TEXT | Base32-encoded TOTP secret |
| created_at | TEXT (ISO 8601) | |

### `sessions`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| admin_id | INTEGER FK | References admins.id |
| token | TEXT UNIQUE | JWT token |
| expires_at | TEXT (ISO 8601) | Token expiration |

### `ads`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| title | TEXT | Ad title |
| image_url | TEXT | Banner image URL |
| target_url | TEXT | Click-through URL |
| active | INTEGER (0/1) | Whether the ad is active |
| impressions | INTEGER | Total impression count |
| clicks | INTEGER | Total click count |
| created_at | TEXT (ISO 8601) | |
| updated_at | TEXT (ISO 8601) | Last modified |

### `ad_events`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| ad_id | INTEGER FK | References ads.id |
| public_key | TEXT | Viewer's public key (NULL if unknown) |
| type | TEXT | "impression" or "click" |
| timestamp | TEXT (ISO 8601) | |

### `logs`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| admin_id | INTEGER FK | References admins.id |
| action | TEXT | Description of admin action |
| ip | TEXT | Admin's IP |
| timestamp | TEXT (ISO 8601) | |

---

## REST API (port 8766)

### Auth
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/auth/login | Login with username + password → returns temp token | None |
| POST | /api/auth/verify-2fa | Verify TOTP code → returns JWT | Temp token |
| POST | /api/auth/logout | Invalidate session | JWT |

### Stats / Analytics
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/stats/overview | Online now, today, total, top countries, devices | JWT |
| GET | /api/stats/users | Paginated user list with connection history | JWT |
| GET | /api/stats/countries | Country breakdown | JWT |
| GET | /api/stats/devices | Browser/OS breakdown (parsed from User-Agent) | JWT |
| GET | /api/stats/realtime | Current online users stream (SSE) | JWT |

### Ads
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/ads | List all ads | JWT |
| POST | /api/ads | Create ad | JWT |
| PUT | /api/ads/:id | Update ad | JWT |
| DELETE | /api/ads/:id | Delete ad | JWT |
| GET | /api/ads/active | Get active ad for display (client) | None |
| POST | /api/ads/:id/impression | Track impression (client) | None |
| POST | /api/ads/:id/click | Track click (client) | None |

### Admin management
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/admin/setup | First-run setup (creates initial admin) | None |
| PUT | /api/admin/password | Change password | JWT |
| POST | /api/admin/reset-2fa | Regenerate TOTP secret | JWT |

---

## Data Collection

Only data already visible to the signaling server is collected:
- **IP address** (from WebSocket connection)
- **User-Agent** (from WebSocket upgrade header)
- **Public key** (from `register` message)
- **Connection / disconnection time** (from WS open/close events)

No active telemetry from the client. No message content, contact lists, or message metadata is collected.

**GeoIP**: Country is resolved from IP using `geoip-lite` (offline MaxMind database) at connection time and stored in the `connections` table.

**Device parsing**: User-Agent is parsed with `ua-parser-js` to extract browser name, OS, device type.

---

## 2FA Flow

1. **Admin creation**: CLI command (`npm run admin:create`) prompts for username/password → stores bcrypt hash + generates TOTP secret → outputs provisioning URI (otpauth://) as QR code URL
2. **Login**: POST username+password → server validates → returns `session_token` (short-lived, 5 min)
3. **2FA**: POST 6-digit TOTP code + `session_token` → server validates TOTP → returns JWT (24h expiry)
4. **Authenticated requests**: JWT in `Authorization: Bearer <token>` header

TOTP uses `otpauth://` URI format compatible with Google Authenticator, Authy, etc. 30-second window, SHA-1, 6 digits (standard).

---

## Admin UI

Separate React SPA built with the same stack (Vite, TypeScript, Tailwind, motion) as the main app, but in a `admin/` directory.

### Routes
| Route | Description |
|-------|-------------|
| /login | Login form |
| /login/2fa | TOTP input |
| / | Dashboard (overview stats) |
| /users | User list with connection history |
| /devices | Device/browser breakdown |
| /map | Geographic distribution (simple table or Leaflet) |
| /ads | Ad management (CRUD) |
| /settings | Change password, reset 2FA, logs |

### Dashboard Widgets
- **4 metric cards**: Online Now, Today, Total Users, Countries
- **Top Countries** table
- **Device distribution** list (percentage)
- **Recent Ads Performance** mini-cards (impressions, clicks, CTR)

---

## In-App Ad Display (Client-side)

### Component: `AdBanner`
- Fetches `GET /api/ads/active` on app mount
- Renders a compact banner with image + title + "sponsored" label
- Ad slot: **inline inside chat view** (after last messages)
- On render → `POST /api/ads/:id/impression` (fires once per session per ad)
- On click → `POST /api/ads/:id/click` + opens `target_url` in new tab

### Behavior
- If no active ad → nothing renders (zero-width)
- Ad refreshes on app restart (no polling — simple and privacy-respecting)
- AdBanner uses existing neumorphic style to match the app's design language

---

## Implementation Order

1. **Signaling server enhancement** — connection logging (IP, UA, public key, timestamps) into SQLite
2. **Admin auth** — admin CRUD CLI, login API, JWT, TOTP 2FA
3. **Stats API** — overview, countries, devices, user list
4. **Ads API** — CRUD + active ad endpoint + impression/click tracking
5. **Admin UI** — login + 2FA flow, dashboard, users, devices, ads management
6. **AdBanner component** — client-side ad display in messenger app

---

## Dependencies

### Server (added to existing `server/`)
- `better-sqlite3` — SQLite driver
- `bcrypt` — password hashing
- `jsonwebtoken` — JWT
- `otpauth` — TOTP generation + validation
- `geoip-lite` — offline GeoIP
- `ua-parser-js` — User-Agent parsing
- `qrcode` — QR code generation for 2FA setup (CLI output)

### Admin UI (new `admin/` directory)
- Same stack: React, Vite, TypeScript, Tailwind CSS
- `lucide-react` — icons (already in main app)
- No additional UI library — match existing neumorphic style

---

## Files to Modify / Create

### Modified
- `server/signaling-server.ts` — add connection logging, REST API server

### New: Server
- `server/db.ts` — SQLite connection + schema init
- `server/auth.ts` — JWT + TOTP logic
- `server/routes/stats.ts` — analytics endpoints
- `server/routes/ads.ts` — ad CRUD endpoints
- `server/routes/auth.ts` — login + 2FA endpoints
- `server/cli.ts` — admin creation CLI script
- `server/middleware/auth.ts` — JWT verification middleware

### New: Admin UI
- `admin/` — full Vite + React SPA
- `admin/src/pages/Login.tsx`
- `admin/src/pages/Verify2FA.tsx`
- `admin/src/pages/Dashboard.tsx`
- `admin/src/pages/Users.tsx`
- `admin/src/pages/Devices.tsx`
- `admin/src/pages/Ads.tsx`
- `admin/src/pages/Settings.tsx`
- `admin/src/components/` — shared UI components

### New: Client
- `src/components/ui/AdBanner.tsx` — in-app ad display component
