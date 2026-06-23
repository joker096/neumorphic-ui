# Mess&Anger — Secure Deployment Modes Design

> **Date:** 2026-06-21
> **Status:** Approved by user for implementation
> **Goal:** Provide three secure deployment modes for Mess&Anger: local/offline, minimal signaling server, and full production server.

## Context

The existing `docs/deploy-secure.md` documents only the full production deployment path. The existing `scripts/deploy-secure.sh` also implements only the full production path: Node build, systemd services, nginx, UFW, secrets, and admin creation.

The messenger security model is P2P E2EE. Server components must be treated as untrusted relay infrastructure: they may relay public keys, SDP/ICE candidates, and metadata, but must never receive plaintext message content or private keys.

## Modes

### 1. Local / Offline P2P

**Purpose:** Run the messenger without a server for local testing, demos, LAN/P2P experiments, or offline recovery.

**Security posture:**

- No server process is installed.
- No secrets are generated.
- No network ports are opened.
- Messages stay inside the browser/device context.
- WebRTC P2P is allowed only when the user explicitly configures local signaling or a trusted relay.

**Use cases:**

- Local development.
- Testing encrypted message storage and recovery flows.
- Demonstrating P2P/E2EE without deploying infrastructure.

**Commands:**

```bash
npm install
npm run dev
```

**Client signaling URL:**

```text
ws://localhost:3000/ws
```

or another explicitly configured local URL.

**Security notes:**

- `localhost` is not suitable for production.
- If two devices must communicate, use the minimal or full server mode.
- Do not expose the local dev server to the public internet.

### 2. Minimal Signaling Server

**Purpose:** Run only the relay needed for P2P discovery and WebRTC signaling. No admin UI, no ads, no analytics, no statistics.

**Security posture:**

- Smallest server attack surface.
- No admin database.
- No JWT secret.
- No admin panel.
- No public REST API except WebSocket signaling.
- Runs as a non-root user with systemd sandboxing.

**Use cases:**

- Small private deployments.
- Users who want relay service only.
- Deployments where metadata exposure must be minimized.

**Commands:**

```bash
sudo bash scripts/deploy-secure.sh --mode=minimal --domain=mess.cvr.name
```

**Client signaling URL:**

```text
wss://mess.cvr.name/ws
```

**Security notes:**

- The server can see public keys, IP addresses, User-Agent, timing, and online metadata.
- The server cannot read E2EE message content.
- The server should run with strict systemd sandboxing and a firewall that allows only 22, 80, and 443.

### 3. Full Production Server

**Purpose:** Run the complete Mess&Anger production stack with main app, admin panel, signaling, CSP headers, secrets, and firewall.

**Security posture:**

- Main app and admin UI are separated.
- Admin panel requires bcrypt password hash + TOTP 2FA.
- `JWT_SECRET` is stored in `/etc/messanger/jwt_secret` with `root:root 600`.
- nginx serves CSP and security headers from HTTP headers, not meta tags.
- systemd runs services as `messanger` with strict sandboxing.
- UFW allows only SSH, HTTP, and HTTPS.

**Commands:**

```bash
sudo bash scripts/deploy-secure.sh --mode=full --domain=mess.cvr.name
```

**Client signaling URL:**

```text
wss://mess.cvr.name/ws
```

**Admin URL:**

```text
https://admin.mess.cvr.name
```

**Security notes:**

- Use a real domain and HTTPS.
- Enable `certbot` after initial setup.
- Keep admin panel isolated on a subdomain.
- Rotate secrets only when prepared to invalidate active admin sessions.

## Recommended Default

`scripts/deploy-secure.sh` should default to `--mode=full` for backward compatibility. The minimal mode should be available for users who want the smallest attack surface. The local mode should be documented but not run through the deployment script.

## Implementation Scope

### Files to modify

- `docs/deploy-secure.md`
  - Replace single-mode documentation with a three-mode deployment guide.
  - Add mode comparison table, commands, client URLs, security guarantees, and operational commands for each mode.
- `scripts/deploy-secure.sh`
  - Add `--mode=local|minimal|full`.
  - Skip build/admin/nginx/firewall/admin creation as appropriate.
  - Preserve `--no-nginx` and `--no-firewall` as overrides for full mode.
  - Add clear help text and summary output per mode.
- `docs/server-operations.md`
  - Add a short pointer to deployment modes.
- `docs/security-guide.md`
  - Add production deployment mode references.

### Non-goals

- No new TURN server implementation.
- No new admin features.
- No change to E2EE/P2P protocol.
- No change to nginx CSP policy beyond documented secure deployment behavior.

## Acceptance Criteria

- `docs/deploy-secure.md` clearly describes three modes.
- `scripts/deploy-secure.sh --help` lists all modes.
- `--mode=local` exits without changing the server.
- `--mode=minimal` installs/starts only signaling service.
- `--mode=full` preserves current behavior.
- Minimal mode does not create admin DB, JWT secret, or admin UI service.
- Full mode still supports `--no-nginx` and `--no-firewall`.
