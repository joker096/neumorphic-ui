#!/usr/bin/env bash
# Mess&Anger Signaling Server Starter
# Handles port conflicts and starts the signaling server
set -euo pipefail

SIGNALING_PORT="${PORT:-3006}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "[Mess&Anger] Starting signaling server on port $SIGNALING_PORT..."

# If port is in use, try to identify and kill the process
if ss -tlnp 2>/dev/null | grep -q ":$SIGNALING_PORT "; then
  echo "[WARN] Port $SIGNALING_PORT is in use. Attempting to free..."

  # Try fuser first
  fuser -k "$SIGNALING_PORT/tcp" 2>/dev/null || true
  sleep 2

  # If still in use, try killing by finding the process
  if ss -tlnp 2>/dev/null | grep -q ":$SIGNALING_PORT "; then
    OLD_PID=$(ss -tlnp 2>/dev/null | grep ":$SIGNALING_PORT " | grep -oP 'pid=\K[0-9]+' || echo "")
    if [ -n "$OLD_PID" ]; then
      kill "$OLD_PID" 2>/dev/null || true
      sleep 2
    fi
  fi

  # If still stuck, try binding to a fallback port
  if ss -tlnp 2>/dev/null | grep -q ":$SIGNALING_PORT "; then
    FALLBACK_PORT=8765
    echo "[WARN] Port $SIGNALING_PORT stuck. Using fallback port $FALLBACK_PORT."
    echo "[WARN] Update nginx proxy_pass or run: sudo fuser -k ${SIGNALING_PORT}/tcp"
    SIGNALING_PORT=$FALLBACK_PORT
  fi
fi

export PORT=$SIGNALING_PORT
exec npx tsx "$PROJECT_DIR/server/signaling-server.ts"
