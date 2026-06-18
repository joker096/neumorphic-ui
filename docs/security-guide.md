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

- Device-bound master key derived from browser fingerprint via PBKDF2-SHA256 with 600,000 iterations
- Master key is encrypted with the device-bound key and stored in IndexedDB under `__nexus_key_storage`
- On each app launch, the encrypted master key is decrypted and imported as a CryptoKey for `encrypt`/`decrypt` operations

### Recovery Phrase

- BIP39-style mnemonic phrase for cross-device key restoration
- Implementation in `src/lib/recovery/RecoveryManager.ts`
- PBKDF2-SHA256 (600,000 iterations) to derive key material from the phrase
- The phrase itself is never stored -- only the derived key material

### Encryption Flow

```
User PIN/Password
    -> PBKDF2-SHA256 (600k iterations)
    -> Device-Bound Key (AES-GCM)
    -> Encrypted Master Key (stored in IndexedDB)
    -> Decrypted Master Key (AES-GCM)
    -> Encrypted Application Data (IndexedDB)
```

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

### Environment Variables

```bash
# Required
export JWT_SECRET="$(openssl rand -base64 48)"

# Signaling Server
export PORT=8765
export REST_PORT=8766
export CORS_ORIGINS="https://app.example.com"
export DB_PATH="/var/lib/messanger/data/admin.db"
```

### Reverse Proxy (nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/ssl/certs/example.crt;
    ssl_certificate_key /etc/ssl/private/example.key;

    # Security headers
    add_header Content-Security-Policy "default-src 'none'; connect-src 'self' wss://app.example.com; style-src 'self' 'unsafe-inline'; frame-src 'none'; media-src 'self'";
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
