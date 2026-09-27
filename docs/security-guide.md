# Security Guide

## Overview

The application implements multiple layers of security covering transport, storage, authentication, and P2P messaging. This guide documents each measure and how to configure them for production.

## Content Security Policy (CSP)

CSP is configured in `server/csp.ts` via the `buildCSP()` and `applyCSP()` functions.

### Default Policy

```
default-src 'none'; connect-src 'self'; style-src 'none'; frame-src 'none'; media-src 'none'
```

### Configuration Options

```ts
interface CSPOptions {
  reportUri?: string        // Endpoint for violation reports
  allowInlineScript?: bool  // Enable nonce-based inline scripts
  allowedConnectSrc?: string[] // Additional connect-src origins (e.g. signaling server)
  nonce?: string            // Auto-generated per-request nonce
}
```

### Customizing for Production

```ts
import { applyCSP } from './csp'

applyCSP(response, {
  allowedConnectSrc: ['wss://signaling.example.com'],
  reportUri: '/csp-report',
})
```

### What to Change

- Add your signaling server WebSocket URL to `allowedConnectSrc`
- Set `reportUri` to a CSP reporting endpoint to catch violations in production
- Do not enable `allowInlineScript` unless absolutely required

## JWT Authentication

JWTs are used for admin panel authentication. Configuration is in `server/auth.ts`.

### Setting JWT_SECRET

```bash
export JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
```

If `JWT_SECRET` is not set, the server exits with a fatal error.

### Token Properties

- Algorithm: `HS256`
- Expiration: `24h`
- Payload contains `adminId` and `username`

### Rate Limiting

`server/routes/auth.ts` implements in-memory rate limiting:

- **Login**: 5 attempts per 60-second window per IP (returns `429 Too Many Requests`)
- **2FA verification**: 3 attempts per 60-second window per IP
- Stale entries are purged every 5 minutes

### Session Management

- Tokens are stored in SQLite `sessions` table
- Sessions can be invalidated via logout or server-side deletion
- Session validation checks token JWT signature AND database presence

## WebSocket Security

Configured in `server/signaling-server.ts`.

### Origin Validation

```ts
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:4173,http://localhost:3000').split(',')
```

WebSocket connections from disallowed origins are rejected with code `4001`. Set `CORS_ORIGINS` in production to restrict to your actual domains.

### Message Validation

- All incoming WebSocket messages must be valid JSON
- `register` messages require a non-empty `publicKey` string
- `offer`/`answer` messages require a non-empty `target` field
- Payload size limited to 1 MB via `maxPayload: 1024 * 1024`

### HMAC Authentication (P2P Layer)

Every P2P data channel message is authenticated with HMAC-SHA256:

```
[sig_hex]|[payload]
```

Messages without a valid HMAC signature are silently dropped. See `src/lib/p2p/HMACAuth.ts` for the implementation and `src/lib/p2p/P2PTransport.ts` (line 245-258) for enforcement.

## XSS Prevention

### URL Validation in FormattedText

The `FormattedText` component in `src/components/FormattedText.tsx` renders user-generated text. URLs are validated to only allow `http://` and `https://` schemes:

```tsx
if (/^https?:\/\/[^\s]+$/i.test(chunk) && (chunk.startsWith('http://') || chunk.startsWith('https://'))) {
```

Only `http://` and `https://` protocols are permitted -- no `javascript:`, `data:`, or other schemes.

### ReDoS Prevention

- Regex patterns use non-greedy quantifiers (`.*?`) throughout to prevent catastrophic backtracking
- The search term regex escapes special characters before construction:
  ```tsx
  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  ```
- Mention patterns are restricted to `[a-zA-Z0-9_]` only

### CSP Enforcement

The strict CSP policy prevents inline script execution and limits connection targets.

### No Direct DOM Injection

All rendering uses React's JSX, avoiding `dangerouslySetInnerHTML` or raw HTML concatenation.

## Storage Security

### Encrypted IndexedDB

Sensitive data is stored in IndexedDB encrypted with AES-256-GCM. See `src/lib/deviceSecurity.ts`.

### Key Derivation

- A **device-bound** wrapping key is derived from the browser fingerprint
  (`userAgent | hardwareConcurrency | platform | screen resolution`) with
  PBKDF2-SHA256, 600,000 iterations, and a fixed salt
- The master key is encrypted with that wrapping key and stored in IndexedDB
  under `__nexus_key_storage`; the identity seed is sealed the same way under
  `mess_master_seed`
- On each app launch, the encrypted master key is decrypted and imported as a
  CryptoKey for `encrypt`/`decrypt` operations

> **Limitation (documented, not fixed).** The wrapping key is derived from
> public values, so it is *not* a secret: anyone who can read this origin's
> IndexedDB (XSS, malicious extension, stolen device profile) can reproduce it
> and recover the master key. It provides device binding and keeps raw store
> contents unreadable, not protection from same-origin code execution. A real
> fix needs a user-held secret (app-lock PIN or data passphrase) or a platform
> keystore — see `docs/superpowers/threat-model/threat-model.md` §3.4.1.

### Encryption Flow

```
Device fingerprint (public)
    -> PBKDF2-SHA256 (600k iterations)
    -> Device-Bound Key (AES-GCM)
    -> Encrypted Master Key (stored in IndexedDB)
    -> Decrypted Master Key (AES-GCM)
    -> Encrypted Application Data (IndexedDB)
```

Separately, the **app-lock PIN** is an access gate only: it is verified with
PBKDF2-SHA256 (600k) against a stored hash and does not participate in any key
derivation. The backup/recovery passphrase does wrap the device key
(`deviceSecurity.exportEncryptedKey` / `importEncryptedKey`).

### Recovery Phrase

- BIP39-style mnemonic phrase for cross-device key restoration
- Implementation in `src/lib/recovery/RecoveryManager.ts`
- PBKDF2-SHA256 (600,000 iterations) to derive key material from the phrase
- The phrase itself is never stored -- only the derived key material

## P2P Security

### Mandatory HMAC

`src/lib/p2p/P2PTransport.ts` enforces HMAC-SHA256 authentication on all data channel messages:

- Sending: each message is prefixed with `sig|payload` where `sig` is HMAC-SHA256 of the payload
- Receiving: the signature is verified before processing; invalid signatures are dropped with a console warning

### Diffie-Hellman Key Exchange

The HMAC key is established via X25519 Diffie-Hellman key exchange during WebRTC signaling:

1. The caller generates an ephemeral X25519 key pair and sends the public key in the `offer` (as `dhpk`)
2. The callee generates its own ephemeral key pair, computes the shared secret via `x25519DH()`, derives the HMAC key via HKDF-SHA256 with context `'p2p-hmac'`, and sends its public key back in the `answer`
3. The caller computes the same shared secret and derives the identical HMAC key
4. If DH key exchange cannot be completed, a random HMAC key is generated (this path exists for backward compatibility but is not recommended)

### Removal of Plaintext HMAC Fallback

The codebase does not transmit HMAC keys in plaintext. The DH key exchange path is the primary mechanism. The legacy fallback (`msg.hmacKey` in `handleAnswer`) exists only for backward compatibility and should not be relied upon.

## Signaling Visibility

What the signaling server (`server/signaling-server.ts`) observes when relaying P2P traffic:

- **Registration:** only the peer's `publicKey` (a pseudo-anonymous key hash) plus the connection IP/User-Agent, persisted in the `connections` table (see `server/db.ts`).
- **SDP offer/answer + ICE candidates:** sent in full plaintext. SDP and ICE necessarily contain LAN/public IP addresses of both peers — the server must relay them for the WebRTC handshake to complete. End-to-end encryption of the signaling channel is not implemented; this is a documented limitation, not a data-path exposure (messages later flow over the DTLS/encrypted data channel).
- **Metadata frames** (`typing-indicator`, `online-status`, `delivery-receipt`, `read-receipt`): the server sees the message types, sender and target (an A→B social graph) but the payload is minimized to primitives only — `{ isTyping }` or `{ online }`. Display names are never transmitted in metadata; the client resolves names via `getPeerName()` locally.
- **Topic pub/sub** (`company:*` rooms): the server sees the topic, the sender and the plaintext envelope — this is server-readable by design (serverless room registry for company presence/notify).
- **Peer enumeration:** `/api/peers/:key` only answers single-key online lookups. Batch/list enumeration endpoints are intentionally absent.
- **Public `/health`:** reports `{ status, uptime }` only. The live connected-client count is deliberately not exposed publicly (it was an unauthenticated presence oracle); operators get counts via the auth-gated `/api/stats/overview`.

### Connection Log Retention

`connections` rows accumulate metadata (public key + IP + User-Agent + timestamps) indefinitely unless pruned. The server prunes them automatically:

- Env `CONNECTION_LOG_RETENTION_DAYS` (default `30`) sets the retention window.
- On boot and then every 24h, `purgeOldConnections(retentionDays)` deletes rows whose `connected_at` is older than the window; the purged count is logged.

### Documented Relay-Only Mode

Relay routing is optional and opt-in:

- Configure `VITE_RELAY_PROXY_URL` on the client and choose a `relayBackend` setting in Network settings (the relay-backend row is hidden when no relay proxy is configured).
- A relay peer sees only the signaling it forwards plus addressed payload forwarding. The data plane remains end-to-end encrypted over the WebRTC data channel — relay does not decrypt message content.

## TOTP Two-Factor Authentication

Implementation in `server/auth.ts` using the `otpauth` library.

### Admin Account Setup

```bash
npm run admin:create <username> <password>
```

This outputs:
- A QR code scannable in Google Authenticator or Authy
- A `otpauth://` URI for manual entry
- The raw base32 TOTP secret

### Configuration

- Algorithm: SHA256
- Digits: 6
- Period: 30 seconds
- Validation window: 1 (allows 30-second clock drift)

### Login Flow

1. `POST /api/auth/login` with `{ username, password }` returns a `sessionToken`
2. `POST /api/auth/verify-2fa` with `{ sessionToken, code }` returns the final JWT

## Rate Limiting on Auth Endpoints

See `server/routes/auth.ts` lines 7-19:

- In-memory `Map<string, { count, resetAt }>`
- Login: 5 requests per 60 seconds per IP
- 2FA verification: 3 requests per 60 seconds per IP
- Stale entries cleaned every 5 minutes by `setInterval`

Rate limiting cannot be disabled through configuration. To adjust limits, modify the `checkRateLimit()` calls in `server/routes/auth.ts`.

## Recommended Production Configuration

For a hardened Ubuntu/Debian deployment, use `scripts/deploy-secure.sh` with `--mode=minimal` or `--mode=full`. See [`deploy-secure.md`](./deploy-secure.md) for mode comparison, post-install commands, and security notes.

### Environment Variables

```bash
# Required
export JWT_SECRET="$(openssl rand -base64 48)"

# Signaling Server
export PORT=8765
export REST_PORT=8766
export CORS_ORIGINS="https://app.example.com"
export DB_PATH="/var/lib/messanger/admin.db"
```

### Reverse Proxy (nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/ssl/certs/example.crt;
    ssl_certificate_key /etc/ssl/private/example.key;

    # Security headers
    add_header Content-Security-Policy "default-src 'none'; connect-src 'self' wss://app.example.com; style-src 'self' 'unsafe-inline'; frame-src 'none'; media-src 'self' blob: data: https:";
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        root /var/www/messanger/dist;
        try_files $uri $uri/ /index.html;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8765;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8766;
        proxy_set_header Authorization $http_authorization;
    }
}
```

### CSP for Production

```ts
applyCSP(response, {
  allowedConnectSrc: ['wss://app.example.com'],
  reportUri: 'https://app.example.com/csp-report',
})
```

### Additional Recommendations

1. Run `npm audit` before each deployment
2. Keep the server patched and updated
3. Use a dedicated non-root user for the signaling server
4. Configure log rotation for server logs
5. Set up monitoring for failed auth attempts and CSP violation reports
6. Consider rotating `JWT_SECRET` periodically (will invalidate all active sessions)
