# Secure Deployment Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three deployment modes to Mess&Anger: local/offline, minimal signaling server, and full production server.

**Architecture:** Keep the existing full deployment as the backward-compatible default. Add a `--mode` parser to `scripts/deploy-secure.sh`, split mode-specific behavior into helper functions, and document the modes in deployment/security docs.

**Tech Stack:** Bash, systemd, nginx, UFW, TypeScript signaling server.

---

### Task 1: Add deployment mode parsing and local-mode guard

**Files:**
- Modify: `scripts/deploy-secure.sh:38-64`
- Modify: `scripts/deploy-secure.sh:65-75`

- [ ] **Step 1: Add mode variables and parser cases**

Replace the current option variables around lines 45-50 with:

```bash
MODE="full"
DOMAIN=""
EMAIL=""
ADMIN_USER="admin"
SKIP_NGINX=false
SKIP_FIREWALL=false
```

Add these cases inside the `while [[ $# -gt 0 ]]; do` parser:

```bash
--mode=*) MODE="${1#*=}"; shift ;;
```

Add validation after `--help` handling:

```bash
case "$MODE" in
  local|minimal|full) ;;
  *) echo "Unknown mode: $MODE"; exit 1 ;;
esac
```

- [ ] **Step 2: Add local-mode guard before root check**

Before the root-only check, add:

```bash
if [[ "$MODE" == "local" ]]; then
  cat <<'LOCAL'
Local/offline mode does not deploy anything.

Run the app locally:
  npm install
  npm run dev

Use a local signaling URL only for development:
  ws://localhost:3000/ws

Do not expose this local dev server to the public internet.
LOCAL
  exit 0
fi
```

- [ ] **Step 3: Update help text**

At the top of the script, change the usage/options comments to include:

```bash
#   sudo bash scripts/deploy-secure.sh [--mode=local|minimal|full] [--domain=example.com] [--email=admin@example.com]
#
# Modes:
#   local     Print local/offline instructions and exit without server changes
#   minimal   Deploy only the signaling WebSocket relay, no admin UI
#   full      Deploy full production stack (default)
#
# Options:
#   --mode=MODE     Deployment mode: local, minimal, or full (default: full)
#   --domain=DOMAIN Domain name (default: $(hostname))
#   --email=EMAIL   Email for Let's Encrypt (optional, for HTTPS)
#   --admin=USER    Admin username (default: admin, full mode only)
#   --no-nginx      Skip nginx setup (full/minimal mode)
#   --no-firewall   Skip firewall setup (full/minimal mode)
#   --help          Show this help
```

- [ ] **Step 4: Run shell syntax check**

Run:

```bash
bash -n scripts/deploy-secure.sh
```

Expected: no output and exit code 0.

### Task 2: Split full-mode build and admin setup behind a guard

**Files:**
- Modify: `scripts/deploy-secure.sh:100-115`
- Modify: `scripts/deploy-secure.sh:361-381`

- [ ] **Step 1: Guard full-mode build/admin dependencies**

Wrap the Node build section with:

```bash
if [[ "$MODE" == "full" ]]; then
  info "Installing root dependencies..."
  npm ci 2>/dev/null || npm install
  info "Building main SPA..."
  npm run build

  # Admin project
  info "Installing admin dependencies..."
  cd "$APP_DIR/admin"
  npm ci 2>/dev/null || npm install
  info "Building admin SPA..."
  VITE_API_URL="http://127.0.0.1:$REST_PORT" npx vite build
  cd "$APP_DIR"
else
  info "Skipping main/admin build for $MODE mode"
fi
```

- [ ] **Step 2: Guard admin account creation**

Replace the interactive admin creation block with:

```bash
if [[ "$MODE" == "full" ]]; then
  echo ""
  info "Admin account setup"
  echo "  Create an admin user for the panel."
  echo ""

  read -rp "  Admin username [${ADMIN_USER}]: " input_user
  ADMIN_USER="${input_user:-$ADMIN_USER}"

  while true; do
    read -rsp "  Admin password (min 8 chars): " ADMIN_PASS
    echo ""
    if [[ ${#ADMIN_PASS} -ge 8 ]]; then break; fi
    warn "Password too short. Try again."
  done

  JWT_SECRET="$JWT_SECRET" DB_PATH="$DATA_DIR/admin.db" \
    npx tsx server/cli.ts "$ADMIN_USER" "$ADMIN_PASS" || true

  info "Admin '$ADMIN_USER' created"
  echo ""
else
  info "Skipping admin account setup in $MODE mode"
fi
```

- [ ] **Step 3: Run shell syntax check**

Run:

```bash
bash -n scripts/deploy-secure.sh
```

Expected: no output and exit code 0.

### Task 3: Add minimal-mode systemd service without admin UI

**Files:**
- Modify: `scripts/deploy-secure.sh:150-239`
- Modify: `scripts/deploy-secure.sh:353-359`

- [ ] **Step 1: Create only signaling service in minimal mode**

Replace the systemd section with:

```bash
signaling_service="/etc/systemd/system/$APP_NAME-signaling.service"
admin_service="/etc/systemd/system/$APP_NAME-admin.service"

ENV_FILE="/etc/systemd/system/$APP_NAME-signaling.env"
cat > "$ENV_FILE" <<ENV
JWT_SECRET=$JWT_SECRET
DB_PATH=$DATA_DIR/admin.db
PORT=$SIGNALING_PORT
REST_PORT=$REST_PORT
CORS_ORIGINS=http://$DOMAIN,https://$DOMAIN
ENV
chown root:"$SERVICE_USER" "$ENV_FILE"
chmod 640 "$ENV_FILE"

cat > "$signaling_service" <<SERVICE
[Unit]
Description=Mess&Anger Signaling Server
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=$(which npx) tsx server/signaling-server.ts
Restart=always
RestartSec=5
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=$DATA_DIR $LOG_DIR
ReadOnlyPaths=$APP_DIR
CapabilityBoundingSet=
SystemCallFilter=@system-service
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
MemoryDenyWriteExecute=true
LockPersonality=true
RestrictRealtime=true
RestrictSUIDSGID=true
RemoveIPC=true

[Install]
WantedBy=multi-user.target
SERVICE

if [[ "$MODE" == "full" ]]; then
  cat > "$admin_service" <<SERVICE
[Unit]
Description=Mess&Anger Admin UI
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$APP_DIR/admin
Environment=VITE_API_URL=http://127.0.0.1:$REST_PORT
ExecStart=$(which npx) vite preview --port=$ADMIN_UI_PORT --host=127.0.0.1
Restart=always
RestartSec=5
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadOnlyPaths=$APP_DIR/admin
CapabilityBoundingSet=
SystemCallFilter=@system-service
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
MemoryDenyWriteExecute=true
LockPersonality=true
RestrictRealtime=true
RestrictSUIDSGID=true
RemoveIPC=true

[Install]
WantedBy=multi-user.target
SERVICE
fi

systemctl daemon-reload
info "systemd services created for $MODE mode"
```

- [ ] **Step 2: Guard service enable/start**

Replace service enable/start block with:

```bash
systemctl enable "$APP_NAME-signaling.service"
systemctl restart "$APP_NAME-signaling.service"

if [[ "$MODE" == "full" ]]; then
  systemctl enable "$APP_NAME-admin.service"
  systemctl restart "$APP_NAME-admin.service"
fi

info "Services started"
```

- [ ] **Step 3: Run shell syntax check**

Run:

```bash
bash -n scripts/deploy-secure.sh
```

Expected: no output and exit code 0.

### Task 4: Adjust nginx for minimal mode

**Files:**
- Modify: `scripts/deploy-secure.sh:240-335`
- Modify: `scripts/deploy-secure.sh:384-416`

- [ ] **Step 1: Keep main SPA/API/WS proxy for both modes**

No change required to the main nginx site block. It should continue serving:

- `/ws` -> signaling server
- `/api/` -> REST server
- `/` -> main SPA

- [ ] **Step 2: Create admin subdomain only in full mode**

Wrap the admin subdomain block with:

```bash
if [[ "$MODE" == "full" ]]; then
  if [[ "$DOMAIN" != "$(hostname)" ]]; then
    cat > "/etc/nginx/sites-available/$APP_NAME-admin" <<NGINX
...
NGINX
    ln -sf "/etc/nginx/sites-available/$APP_NAME-admin" "/etc/nginx/sites-enabled/"
  else
    warn "No domain specified. Admin UI will not be proxied automatically."
    warn "Run with --domain=yourdomain.com for full setup."
  fi
fi
```

- [ ] **Step 3: Update summary URLs**

Replace the summary block with mode-aware output:

```bash
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                Deployment Complete                           ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║  Mode:       $MODE                                           "
echo "║  Main App:   http://$DOMAIN                                 "
if [[ "$MODE" == "full" ]]; then
  echo "║  Admin UI:   http://admin.$DOMAIN                           "
fi
server_ip="$(curl -4fsS ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
echo "║  Server IP:  $server_ip                                     "
...
if [[ "$MODE" == "full" ]]; then
  echo "║    systemctl status $APP_NAME-admin                          "
  echo "║    journalctl -u $APP_NAME-admin -f                          "
fi
...
echo "║  Security:                                                   "
echo "║    User:     $SERVICE_USER (no shell, no root)               "
echo "║    CSP:      HTTP headers (not meta tags)                    "
echo "║    Firewall: UFW (22, 80, 443)                               "
if [[ "$MODE" == "full" ]]; then
  echo "║    JWT:      $JWT_SECRET_FILE (root:service, 600)            "
  echo "║    DB:       $DATA_DIR/admin.db (rw only for service)        "
  echo "║    Admin:    bcrypt + TOTP 2FA                              "
else
  echo "║    Admin:    Disabled                                        "
  echo "║    DB:       Not created in minimal mode                     "
fi
echo "║    Code:     Read-only for service (ProtectSystem=strict)    "
...
if [[ "$MODE" == "full" ]]; then
  echo "║    2. Scan TOTP QR code above in Google Authenticator        "
  echo "║    3. Login at http://admin.$DOMAIN                          "
else
  echo "║    2. Configure client signaling URL: wss://$DOMAIN/ws       "
fi
echo "╚═══════════════════════════════════════════════════════════════╝"
```

- [ ] **Step 4: Run shell syntax check**

Run:

```bash
bash -n scripts/deploy-secure.sh
```

Expected: no output and exit code 0.

### Task 5: Rewrite deployment documentation for three modes

**Files:**
- Modify: `docs/deploy-secure.md`

- [ ] **Step 1: Replace the document with the three-mode guide**

Write a document with these sections:

```markdown
# Secure Deployment — Three Modes

## Mode comparison

| Mode | Server | Admin | Firewall | Best for |
|---|---|---|---|---|
| Local/offline | No | No | No | Development and demos |
| Minimal signaling | Signaling only | No | Yes | Small private relay |
| Full production | Signaling + admin + nginx | Yes | Yes | Public production |

## 1. Local / Offline P2P
...
## 2. Minimal Signaling Server
...
## 3. Full Production Server
...
```

- [ ] **Step 2: Include exact commands**

Add:

```bash
npm install
npm run dev
sudo bash scripts/deploy-secure.sh --mode=minimal --domain=mess.cvr.name
sudo bash scripts/deploy-secure.sh --mode=full --domain=mess.cvr.name
```

- [ ] **Step 3: Include client URLs**

Add:

```text
Local: ws://localhost:3000/ws
Minimal: wss://mess.cvr.name/ws
Full: wss://mess.cvr.name/ws
```

- [ ] **Step 4: Preserve security guarantees**

Keep the existing explanations:

- P2P E2EE
- CSP headers
- systemd sandboxing
- non-root service user
- JWT secret file permissions
- UFW behavior
- admin TOTP 2FA
- what a compromised server can and cannot see

- [ ] **Step 5: Add operational commands per mode**

Add:

```bash
systemctl status messanger-signaling
journalctl -u messanger-signaling -f
systemctl status messanger-admin
journalctl -u messanger-admin -f
```

Mark admin commands as full mode only.

### Task 6: Update linked security docs

**Files:**
- Modify: `docs/server-operations.md`
- Modify: `docs/security-guide.md`

- [ ] **Step 1: Add deployment pointer to server operations**

In `docs/server-operations.md`, add after the opening overview:

```markdown
For secure deployment modes, see `deploy-secure.md`. Use `--mode=minimal` for signaling-only relay deployments and `--mode=full` for production with admin panel, nginx, firewall, and secrets.
```

- [ ] **Step 2: Add deployment pointer to security guide**

In `docs/security-guide.md`, add to `Recommended Production Configuration`:

```markdown
For a hardened Ubuntu/Debian deployment, use `scripts/deploy-secure.sh` with `--mode=minimal` or `--mode=full`. See `deploy-secure.md` for mode comparison and post-install commands.
```

- [ ] **Step 3: Verify links**

Run:

```bash
test -f docs/deploy-secure.md && test -f docs/server-operations.md && test -f docs/security-guide.md
```

Expected: exit code 0.

### Task 7: Final verification

**Files:**
- `scripts/deploy-secure.sh`
- `docs/deploy-secure.md`
- `docs/server-operations.md`
- `docs/security-guide.md`
- `docs/superpowers/specs/2026-06-21-secure-deployment-modes-design.md`

- [ ] **Step 1: Shell syntax check**

Run:

```bash
bash -n scripts/deploy-secure.sh
```

Expected: exit code 0.

- [ ] **Step 2: Help text check**

Run:

```bash
bash scripts/deploy-secure.sh --help | grep -E -- '--mode=local|--mode=minimal|--mode=full'
```

Expected: all three mode flags appear.

- [ ] **Step 3: Local mode check**

Run:

```bash
bash scripts/deploy-secure.sh --mode=local
```

Expected: prints local/offline instructions and exits 0 without requiring root.

- [ ] **Step 4: Documentation scan**

Run:

```bash
grep -R "mode=minimal\|mode=full\|Local / Offline" docs/deploy-secure.md docs/server-operations.md docs/security-guide.md
```

Expected: each mode is referenced in deployment docs and linked docs.
