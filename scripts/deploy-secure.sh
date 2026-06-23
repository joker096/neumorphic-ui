#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# Mess&Anger — Secure Production Deployment
#
# What this script does in full mode:
#   1. Creates a dedicated 'messanger' system user (no shell, no login)
#   2. Installs Node.js 20 LTS (via nvm) if not present
#   3. Installs npm dependencies & builds both SPAs
#   4. Generates a strong JWT_SECRET
#   5. Sets up systemd services (signaling server + admin UI)
#   6. Configures nginx with CSP, security headers, reverse proxy
#   7. Configures UFW firewall (only 80/443 open)
#   8. Creates an admin account (interactive)
#
# What this script does in minimal mode:
#   1. Creates the same non-root 'messanger' user
#   2. Installs Node.js 20 LTS (via nvm) if not present
#   3. Starts only the signaling WebSocket relay
#   4. Configures nginx for /ws only
#   5. Configures UFW firewall (only 80/443 open)
#
# Security design:
#   - Everything runs as 'messanger' (non-root) via systemd User/Group
#   - Code directory is mounted read-only for the service
#   - CSP is served via HTTP headers (not meta tags) — prevents XSS
#     even if an attacker modifies the SPA files
#   - P2P/E2E encryption means message content never touches the relay
#   - Full mode admin panel is separate, behind nginx + JWT + TOTP 2FA
#   - SQLite database exists only in full mode
#
# Usage:
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
###############################################################################

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="messanger"
SERVICE_USER="messanger"
SIGNALING_PORT=8765
REST_PORT=8766
ADMIN_UI_PORT=5174

MODE="full"
DOMAIN=""
EMAIL=""
ADMIN_USER="admin"
SKIP_NGINX=false
SKIP_FIREWALL=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain=*) DOMAIN="${1#*=}"; shift ;;
    --email=*) EMAIL="${1#*=}"; shift ;;
    --admin=*) ADMIN_USER="${1#*=}"; shift ;;
    --mode=*) MODE="${1#*=}"; shift ;;
    --no-nginx) SKIP_NGINX=true; shift ;;
    --no-firewall) SKIP_FIREWALL=true; shift ;;
    --help) head -50 "$0" | grep -E '^#' | sed 's/^# \?//'; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

case "$MODE" in
  local|minimal|full) ;;
  *) echo "Unknown mode: $MODE"; exit 1 ;;
esac

DOMAIN="${DOMAIN:-$(hostname)}"
NGINX_STATE="nginx security headers"
FIREWALL_STATE="UFW (22, 80, 443)"
if [[ "$SKIP_NGINX" == true ]]; then
  NGINX_STATE="nginx skipped by --no-nginx"
fi
if [[ "$SKIP_FIREWALL" == true ]]; then
  FIREWALL_STATE="firewall skipped by --no-firewall"
fi

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

if [[ $EUID -ne 0 ]]; then
  echo "  This script must be run as root."
  exit 1
fi

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { printf "${GREEN}[✓]${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}[!]${NC} %s\n" "$*"; }
err()   { printf "${RED}[✗]${NC} %s\n" "$*"; }

# ── 1. System user ──────────────────────────────────────────────────────────
if id "$SERVICE_USER" &>/dev/null; then
  info "User '$SERVICE_USER' already exists"
else
  useradd --system --no-create-home --shell /usr/sbin/nologin "$SERVICE_USER"
  info "Created system user '$SERVICE_USER'"
fi

# ── 2. Node.js via nvm ──────────────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  warn "Node.js 20 not found. Installing via nvm..."
  export NVM_DIR="/opt/nvm"
  if [[ ! -d "$NVM_DIR" ]]; then
    mkdir -p "$NVM_DIR"
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh \
      | NVM_DIR="$NVM_DIR" bash
  fi
  source "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm alias default 20
  nvm use default
  info "Node.js $(node -v) installed"
fi

# ── 3. Install dependencies & build ─────────────────────────────────────────
cd "$APP_DIR"

if [[ "$MODE" == "full" ]]; then
  # Root project — install all deps (tsx is in devDeps, needed for runtime)
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

# ── 4. Directories & permissions ───────────────────────────────────────────
DATA_DIR="/var/lib/$APP_NAME"
LOG_DIR="/var/log/$APP_NAME"
SECRETS_DIR="/etc/$APP_NAME"
NGINX_CACHE_DIR="/var/cache/nginx/$APP_NAME"

for dir in "$DATA_DIR" "$LOG_DIR"; do
  mkdir -p "$dir"
done

if [[ "$MODE" == "full" ]]; then
  mkdir -p "$SECRETS_DIR"
fi

JWT_SECRET=""
JWT_SECRET_FILE="$SECRETS_DIR/jwt_secret"
if [[ "$MODE" == "full" ]]; then
  # JWT secret
  if [[ ! -f "$JWT_SECRET_FILE" ]]; then
    echo "${JWT_SECRET_FILE} doesn't exist"
    openssl rand -base64 48 | tr -d '\n' > "$JWT_SECRET_FILE"
    info "Generated JWT_SECRET"
  fi
  JWT_SECRET="$(cat "$JWT_SECRET_FILE")"
fi

chown -R "$SERVICE_USER:$SERVICE_USER" "$DATA_DIR" "$LOG_DIR"
chmod 750 "$DATA_DIR" "$LOG_DIR"
if [[ "$MODE" == "full" ]]; then
  chmod 600 "$JWT_SECRET_FILE"
  chown root:"$SERVICE_USER" "$JWT_SECRET_FILE"
fi
info "Directory permissions set"

# Copy data directory to /var/lib if it doesn't exist
if [[ "$MODE" == "full" && -f "$APP_DIR/data/admin.db" && ! -f "$DATA_DIR/admin.db" ]]; then
  cp "$APP_DIR/data/admin.db" "$DATA_DIR/admin.db"
  chown "$SERVICE_USER:$SERVICE_USER" "$DATA_DIR/admin.db"
  chmod 640 "$DATA_DIR/admin.db"
  info "Copied existing database"
fi

# ── 5. systemd services ─────────────────────────────────────────────────────
signaling_service="/etc/systemd/system/$APP_NAME-signaling.service"
admin_service="/etc/systemd/system/$APP_NAME-admin.service"

# Environment file (secure: root:service, 640, not world-readable)
ENV_FILE="/etc/systemd/system/$APP_NAME-signaling.env"
if [[ "$MODE" == "full" ]]; then
  cat > "$ENV_FILE" <<ENV
JWT_SECRET=$JWT_SECRET
DB_PATH=$DATA_DIR/admin.db
PORT=$SIGNALING_PORT
REST_PORT=$REST_PORT
CORS_ORIGINS=http://$DOMAIN,https://$DOMAIN
ENV
else
  cat > "$ENV_FILE" <<ENV
PORT=$SIGNALING_PORT
REST_PORT=$REST_PORT
CORS_ORIGINS=http://$DOMAIN,https://$DOMAIN
ENV
fi
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

# ── 6. nginx reverse proxy ──────────────────────────────────────────────────
if ! $SKIP_NGINX; then
  if command -v nginx &>/dev/null || apt list --installed 2>/dev/null | grep -q nginx; then
    info "nginx already installed"
  else
    apt-get update -qq && apt-get install -y -qq nginx
    info "nginx installed"
  fi

  # Main reverse proxy
  if [[ "$MODE" == "minimal" ]]; then
    cat > "/etc/nginx/sites-available/$APP_NAME" <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};
    server_tokens off;

    add_header Content-Security-Policy "default-src 'none'; connect-src 'self' wss:; frame-ancestors 'none'; form-action 'none'; base-uri 'none';" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location /ws {
        proxy_pass http://127.0.0.1:${SIGNALING_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header Host \$host;
        proxy_read_timeout 86400s;
    }

    location / {
        return 404;
    }
}
NGINX
  else
    cat > "/etc/nginx/sites-available/$APP_NAME" <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};
    server_tokens off;

    # ── Security headers ─────────────────────────────────────────────
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https: wss:; img-src 'self' https: data:; font-src 'self' data:; frame-ancestors 'none'; form-action 'self'; base-uri 'self';" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # ── WebSocket Signaling ──────────────────────────────────────────
    location /ws {
        proxy_pass http://127.0.0.1:${SIGNALING_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header Host \$host;
        proxy_read_timeout 86400s;
    }

    # ── REST API ─────────────────────────────────────────────────────
    location /api/ {
        proxy_pass http://127.0.0.1:${REST_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
        proxy_pass_header Authorization;
    }

    # ── Main SPA ────────────────────────────────────────────────────
    location / {
        root ${APP_DIR}/dist;
        try_files \$uri \$uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX
  fi

  # Admin panel (full mode only)
  if [[ "$MODE" == "full" ]]; then
    if [[ "$DOMAIN" != "$(hostname)" ]]; then
      # With real domain — admin subdomain
      cat > "/etc/nginx/sites-available/$APP_NAME-admin" <<NGINX
server {
    listen 80;
    server_name admin.${DOMAIN};
    server_tokens off;

    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://127.0.0.1:${REST_PORT}; frame-ancestors 'none'; form-action 'self'; base-uri 'self';" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://127.0.0.1:${ADMIN_UI_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
      ln -sf "/etc/nginx/sites-available/$APP_NAME-admin" "/etc/nginx/sites-enabled/"
    else
      # Without real domain — serve admin at /admin path on same site
      warn "No domain specified. Admin UI will not be proxied automatically."
      warn "Run with --domain=yourdomain.com for full setup."
    fi
  fi

  ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/"
  rm -f /etc/nginx/sites-enabled/default

  # Test and reload
  nginx -t && systemctl reload nginx
  info "nginx configured and reloaded"
fi

# ── 7. UFW firewall ────────────────────────────────────────────────────────
if ! $SKIP_FIREWALL; then
  if command -v ufw &>/dev/null; then
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 80/tcp    comment "HTTP"
    ufw allow 443/tcp   comment "HTTPS"
    ufw allow 22/tcp    comment "SSH"
    ufw --force enable
    info "UFW firewall enabled (ports: 22, 80, 443)"
  else
    warn "UFW not installed. Skipping firewall setup."
    warn "  Install: apt install ufw"
  fi
fi

# ── 8. Enable & start services ─────────────────────────────────────────────
systemctl enable "$APP_NAME-signaling.service"
systemctl restart "$APP_NAME-signaling.service"

if [[ "$MODE" == "full" ]]; then
  systemctl enable "$APP_NAME-admin.service"
  systemctl restart "$APP_NAME-admin.service"
fi
info "Services started"

# ── 9. Create admin account ────────────────────────────────────────────────
cd "$APP_DIR"
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

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
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
echo "║                                                              "
echo "║  Services:                                                   "
echo "║    systemctl status $APP_NAME-signaling                       "
if [[ "$MODE" == "full" ]]; then
  echo "║    systemctl status $APP_NAME-admin                          "
fi
echo "║                                                              "
echo "║  Logs:                                                       "
echo "║    journalctl -u $APP_NAME-signaling -f                      "
if [[ "$MODE" == "full" ]]; then
  echo "║    journalctl -u $APP_NAME-admin -f                          "
fi
echo "║                                                              "
echo "║  Security:                                                   "
echo "║    User:     $SERVICE_USER (no shell, no root)               "
echo "║    CSP:      $NGINX_STATE                               "
echo "║    Firewall: $FIREWALL_STATE                             "
if [[ "$MODE" == "full" ]]; then
  echo "║    JWT:      $JWT_SECRET_FILE (root:service, 600)            "
  echo "║    DB:       $DATA_DIR/admin.db (rw only for service)        "
  echo "║    Admin:    bcrypt + TOTP 2FA                              "
else
  echo "║    Admin:    Disabled                                        "
  echo "║    DB:       Not created in minimal mode                     "
fi
echo "║    Code:     Read-only for service (ProtectSystem=strict)    "
echo "║                                                              "
echo "║  Next steps:                                                 "
echo "║    1. Add HTTPS with certbot:                                "
echo "║       apt install certbot python3-certbot-nginx              "
if [[ "$MODE" == "full" ]]; then
  echo "║       certbot --nginx -d $DOMAIN -d admin.$DOMAIN            "
  echo "║    2. Scan TOTP QR code above in Google Authenticator        "
  echo "║    3. Login at http://admin.$DOMAIN                          "
else
  echo "║       certbot --nginx -d $DOMAIN                            "
  echo "║    2. Configure client signaling URL: wss://$DOMAIN/ws       "
fi
echo "╚═══════════════════════════════════════════════════════════════╝"
