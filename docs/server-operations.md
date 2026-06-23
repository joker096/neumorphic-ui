# Server Operations Guide

For secure deployment modes, see [`deploy-secure.md`](./deploy-secure.md). Use `--mode=minimal` for a signaling-only relay and `--mode=full` for production with admin panel, nginx, firewall, secrets, and CSP.

## Signaling Server

File: `server/signaling-server.ts`

A combined WebSocket + REST server for P2P signaling and admin operations.

### Starting

```bash
# Development
npx tsx server/signaling-server.ts

# With custom ports
PORT=9000 REST_PORT=9001 npx tsx server/signaling-server.ts
```

### WebSocket Protocol (port 8765)

The signaling server relays WebRTC handshake messages between peers.

**Client → Server message types:**

| Type | Payload | Description |
|------|---------|-------------|
| `register` | `{ publicKey: string }` | Register with public key |
| `offer` | `{ target: string, sdp: any }` | Forward WebRTC offer |
| `answer` | `{ target: string, sdp: any }` | Forward WebRTC answer |
| `ice-candidate` | `{ target: string, candidate: any }` | Forward ICE candidate |
| `typing-indicator` | `{ target: string, data: any }` | Typing status |
| `delivery-receipt` | `{ target: string, data: any }` | Delivery confirmation |
| `online-status` | `{ target: string, data: any }` | Online status change |
| `read-receipt` | `{ target: string, data: any }` | Read confirmation |

**Server → Client message types:**

| Type | Description |
|------|-------------|
| `registered` | Confirms registration with publicKey |
| `error` | Error message (invalid JSON, target not found, etc.) |
| `offer` / `answer` / `ice-candidate` | Forwarded from other peer |
| `typing-indicator` / `delivery-receipt` / etc. | Forwarded metadata |

### REST API (port 8766)

Full API reference: `docs/admin-panel-setup.md`

## Admin CLI

```bash
# Create admin account (interactive)
npm run admin:create <username> <password>
```

Generates bcrypt password hash + TOTP secret. Displays QR code for Google Authenticator.

## Database

Location: `data/admin.db` (configurable via `DB_PATH` env var)

SQLite with WAL mode. Tables auto-created on first start.

### Backup

```bash
# While server is running (WAL mode allows reads during writes)
cp data/admin.db backups/admin-$(date +%Y%m%d).db
```

### Reset

```bash
rm data/admin.db
# Server will recreate tables on next start
```

## Testing

```bash
# All tests
npx vitest run

# Server-only tests
npx vitest run --config vitest.server.config.ts

# Main app tests
npx vitest run
```

## File Structure

```
server/
├── signaling-server.ts    — Main entry: WS + REST server
├── db.ts                  — SQLite connection + schema
├── auth.ts                — JWT + TOTP helpers
├── cli.ts                 — Admin creation CLI
├── middleware/
│   └── auth.ts            — JWT verification middleware
├── routes/
│   ├── auth.ts            — Login + 2FA + logout
│   ├── stats.ts           — Analytics endpoints
│   └── ads.ts             — Ad CRUD + tracking
└── __tests__/             — Server tests (16 total)

admin/
├── package.json
├── vite.config.ts
├── src/
│   ├── App.tsx            — Router + auth provider
│   ├── api/client.ts      — API client
│   ├── hooks/useAuth.tsx   — Auth context
│   ├── pages/
│   │   ├── Login.tsx       — Login form
│   │   ├── Verify2FA.tsx   — TOTP input
│   │   ├── Dashboard.tsx   — Overview stats
│   │   ├── Users.tsx       — User list
│   │   ├── Devices.tsx     — Device breakdown
│   │   ├── Ads.tsx         — Ad management
│   │   └── Settings.tsx    — Security settings
│   └── components/
│       ├── Layout.tsx      — Sidebar + header shell
│       ├── MetricCard.tsx  — Dashboard stat card
│       └── StatTable.tsx   — Reusable data table
```
