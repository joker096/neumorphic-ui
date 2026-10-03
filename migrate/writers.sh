#!/usr/bin/env bash
# migrate/writers.sh {start|stop} — остановка/запуск всех пишущих сервисов (катовер/роллбек)
set -euo pipefail
APP_USER="${APP_USER:-user0}"
case "${1:-}" in
  stop)
    sudo systemctl stop cvr.name photolessons.org sud-parser 2>/dev/null || true
    pm2 stop mess-signaling 2>/dev/null || true
    echo "writers stopped"
    ;;
  start)
    sudo systemctl start cvr.name photolessons.org sud-parser 2>/dev/null || true
    su - "$APP_USER" -c "pm2 start mess-signaling" 2>/dev/null || true
    echo "writers started"
    ;;
  *) echo "usage: writers.sh {start|stop}"; exit 1 ;;
esac
