# Admin Panel — Setup & Operations

## Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────────────────────────┐
│   P2P Clients   │ ◄──────────────►  │   Signaling Server (port 8765)      │
│  (React SPA)    │                    │   + REST API (port 8766)            │
│                 │     REST API       │   + SQLite (data/admin.db)          │
│  + AdBanner     │ ◄──────────────►  │   + GeoIP + JWT + TOTP 2FA          │
└─────────────────┘                    └──────────┬──────────────────────────┘
                                                  │ REST (port 8766)
                                                  ▼
                                       ┌─────────────────────┐
                                       │   Admin UI (React)   │
                                       │   localhost:5174     │
                                       └─────────────────────┘
```

## Quick Start

### 1. Start the server

```bash
npx tsx server/signaling-server.ts
```

This starts both:
- WebSocket signaling on **port 8765** (P2P relay)
- REST API on **port 8766** (admin endpoints)

### 2. Create an admin account

```bash
npm run admin:create <username> <password>
```

Example:
```bash
npm run admin:create admin mySecurePass123
```

This will output:
- A QR code to scan in Google Authenticator / Authy
- A TOTP URI as fallback
- The raw TOTP secret

### 3. Start the Admin UI

```bash
cd admin
npm run dev
```

Open **http://localhost:5174**

### 4. Login flow

1. Enter username + password → Step 1
2. Enter 6-digit TOTP code from authenticator app → Step 2
3. Dashboard loads with analytics

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8765` | WebSocket signaling port |
| `REST_PORT` | `8766` | REST API port |
| `DB_PATH` | `data/admin.db` | SQLite database path |
| `JWT_SECRET` | auto-generated | JWT signing secret |
| `VITE_API_URL` | `http://localhost:8766` | Admin UI API base URL (admin/.env) |
| `VITE_ADMIN_API_URL` | `http://localhost:8766` | AdBanner API base URL (main app) |

## Database

SQLite at `data/admin.db`. Tables:

| Table | Purpose |
|-------|---------|
| `connections` | User connections (IP, UA, country, timestamps) |
| `admins` | Admin accounts (bcrypt hash, TOTP secret) |
| `sessions` | Active JWT sessions |
| `ads` | Advertisements (title, URLs, impression/click counts) |
| `ad_events` | Individual impression/click events |
| `logs` | Admin action audit log |

## API Endpoints

### Auth (no token needed)
- `POST /api/auth/login` — username + password → sessionToken
- `POST /api/auth/verify-2fa` — sessionToken + TOTP code → JWT

### Auth (token needed)
- `POST /api/auth/logout` — invalidate session

### Stats (token needed)
- `GET /api/stats/overview` — onlineNow, today, totalUsers, countries
- `GET /api/stats/countries` — per-country user counts
- `GET /api/stats/devices` — OS breakdown with percentages
- `GET /api/stats/users?page=1&limit=50` — paginated user list

### Ads
- `GET /api/ads/active` — current active ad (no auth, for client)
- `POST /api/ads/:id/impression` — track impression (no auth)
- `POST /api/ads/:id/click` — track click (no auth)
- `GET /api/ads` — list all ads (auth)
- `POST /api/ads` — create ad (auth)
- `PUT /api/ads/:id` — update ad (auth)
- `DELETE /api/ads/:id` — delete ad (auth)

## Admin UI Pages

| Route | Description |
|-------|-------------|
| `/login` | Login form (username + password) |
| `/login/2fa` | TOTP verification (6 digits) |
| `/` | Dashboard (online now, today, countries, devices) |
| `/users` | Paginated user list with connection history |
| `/devices` | Device/OS breakdown with progress bars |
| `/ads` | Ad management (CRUD) |
| `/settings` | Security settings |

## Data Collected

Only metadata already visible to the signaling server:
- **IP address** (from WebSocket connection)
- **User-Agent** (browser/OS from HTTP upgrade header)
- **Public key** (from `register` message)
- **Connection / disconnection time**

No message content, contact lists, or private data is collected.
Country is resolved via offline GeoIP (`geoip-lite`).

## Production Deployment

### Security headers (must be set server-side)
```
Content-Security-Policy: frame-ancestors 'none';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

### Recommended nginx config
```nginx
server {
    listen 443 ssl;
    server_name admin.example.com;

    # Admin UI
    location / {
        proxy_pass http://127.0.0.1:5174;
    }

    # REST API
    location /api/ {
        proxy_pass http://127.0.0.1:8766;
        proxy_set_header Authorization $http_authorization;
    }
}
```

### JWT_SECRET
Always set a fixed `JWT_SECRET` environment variable in production.
```bash
export JWT_SECRET="$(openssl rand -base64 48)"
```
