# Security Instructions

## Manual Steps Required

⚠️ Что нужно сделать вручную
# 1. Сгенерировать новые JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Заменить JWT_SECRET в .env на сервере

# 3. Сгенерировать новый admin пароль и создать администратора
npm run admin:create -- <username> <password>

# 4. Проверить, что admin API работает:
# POST http://localhost:8766/api/admin/login
# POST http://localhost:8766/api/admin/verify-2fa
# GET  http://localhost:8766/api/admin/dashboard



### 1. Rotate / Generate Secrets

These values must be set in your `.env` file before production use. Generate them once and store securely.

```powershell
# JWT signing secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Admin admin password hash (bcrypt)
npx bcrypt-cli -g
```

Required `.env` variables:
| Variable | Where Used | Required? |
|---|---|---|
| `JWT_SECRET` | `server/auth.ts` — signs admin session tokens | **Required** |
| `CORS_ORIGINS` | `server/signaling-server.ts` — whitelist frontend origins | Recommended |
| `PORT` | `server/signaling-server.ts` — WebSocket port (default 8765) | Optional |
| `REST_PORT` | `server/signaling-server.ts` — REST API port (default 8766) | Optional |

### 2. Admin API Paths — Already Fixed

The admin client (`admin/src/api/client.ts`) uses `/api/admin/*` paths. The server now matches:

| Client Path | Server Route | Handler |
|---|---|---|
| `POST /api/admin/login` | `POST /api/admin/login` | `handleAuthRoute` (auth.ts) |
| `POST /api/admin/verify-2fa` | `POST /api/admin/verify-2fa` | `handleAuthRoute` (auth.ts) |
| `POST /api/admin/logout` | `POST /api/admin/logout` | `handleAuthRoute` (auth.ts) |
| `POST /api/admin/reset-2fa` | `POST /api/admin/reset-2fa` | `handleAuthRoute` (auth.ts) |
| `GET /api/admin/dashboard` | `GET /api/admin/dashboard` | `handleStatsRoute` (stats.ts) |
| `GET /api/admin/users` | `GET /api/admin/users` | `handleStatsRoute` (stats.ts) |
| `GET /api/admin/devices` | `GET /api/admin/devices` | `handleStatsRoute` (stats.ts) |
| `GET/POST/PUT/DELETE /api/admin/ads` | `GET/POST /api/admin/ads` + `PUT/DELETE /api/admin/ads/:id` | `handleAdsRoute` (ads.ts) |

All paths are now aligned. No client-side changes needed.

### 3. Run npm audit

```powershell
npm audit fix --force
```

This checks all dependencies for known CVEs and updates vulnerable packages. Review the output before applying `--force`.

### 4. Admin Reset 2FA — Server-side

The `POST /api/admin/reset-2fa` endpoint was added to `server/routes/auth.ts`. It:

1. Verifies the admin is authenticated via `requireAuth`.
2. Generates a new TOTP secret using `generateTotpSecret()` from `server/auth.ts`.
3. Updates the `admins.totp_secret` column in the database.
4. Returns a message instructing the admin to scan a new QR code.

This requires an active admin session (JWT + validated session in DB).

### 5. Database — Admin Table Schema

Ensure the `admins` table has these columns:

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-increment |
| `username` | TEXT UNIQUE | Admin username |
| `password_hash` | TEXT | bcrypt hash |
| `totp_secret` | TEXT | Base32 TOTP secret (empty = 2FA disabled) |

If the table is missing `totp_secret`:
```sql
ALTER TABLE admins ADD COLUMN totp_secret TEXT DEFAULT '';
```

### 6. Session Cleanup

Sessions expire after 24 hours. Old sessions accumulate in the `sessions` table. To clean up manually:

```sql
DELETE FROM sessions WHERE expires_at < datetime('now');
```

### 7. Rate Limiting

The server uses a in-memory rate limiter (`server/middleware/rateLimit.ts`) for:
- Login attempts: 10 per minute per IP
- 2FA verification: 10 per minute per IP

This is not persistent across server restarts. For production, consider using a database-backed or Redis rate limiter.

### 8. HTTPS

The REST server runs over plain HTTP. For production, place it behind a reverse proxy (nginx, Caddy, or Cloudflare) that terminates TLS. The WebSocket server should also be proxied through TLS.

### 9. CSP Headers

The Vite dev server and preview serve strict CSP headers (`vite.config.ts`). The production build inherits these. If you deploy behind a reverse proxy, ensure the proxy forwards or adds these headers.

## Quick Checklist Before Deploy

- [ ] `JWT_SECRET` is set (not empty, not a default)
- [ ] Admin password is hashed with bcrypt
- [ ] `npm audit` passes with 0 vulnerabilities
- [ ] Admin API paths match client (`/api/admin/*`)
- [ ] `admins.totp_secret` column exists
- [ ] Sessions cleaned periodically
- [ ] Rate limiter is adequate for your traffic
- [ ] HTTPS is configured (proxy + TLS)
- [ ] CORS origins are restricted to your actual domains
