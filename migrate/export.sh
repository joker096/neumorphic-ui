#!/usr/bin/env bash
# migrate/export.sh — бандл-экспорт ВСЕХ сайтов (read-only по сути: только stop писателей).
# Запускать как user0 на СТАРОМ сервере. Нужен NOPASSWD sudo: cp, chmod, systemctl (как на prod).
#
#   bash export.sh            # production: останавливает писателей перед копированием
#   bash export.sh --no-stop  # dry-run: сервисы не трогаем (для проверки бандля)
#
# Результат: /home/user0/migrate-bundle-<TS>.tar.gz
set -euo pipefail

APP_USER="${APP_USER:-user0}"
STOP_WRITERS=1
[ "${1:-}" = "--no-stop" ] && STOP_WRITERS=0

TS="$(date +%Y%m%d-%H%M%S)"
STAGE="/home/$APP_USER/.migrate-stage-$TS"
BUNDLE="/home/$APP_USER/migrate-bundle-$TS.tar.gz"
UNITS="cvr.name photolessons.org sud-parser portfolio humanizer-api pm2-root"

echo "==> Stage: $STAGE"
rm -rf "/home/$APP_USER"/.migrate-stage-* 2>/dev/null || true
mkdir -p "$STAGE"/nginx "$STAGE"/letsencrypt "$STAGE"/php "$STAGE"/systemd \
         "$STAGE"/cron "$STAGE"/pm2 "$STAGE"/meta "$STAGE"/home "$STAGE"/www

echo "==> Writers: $([ "$STOP_WRITERS" = 1 ] && echo STOP || echo 'keep running (dry run)')"
if [ "$STOP_WRITERS" = 1 ]; then
  sudo systemctl stop cvr.name photolessons.org sud-parser 2>/dev/null || true
  pm2 stop mess-signaling 2>/dev/null || true
fi

echo "==> nginx + letsencrypt + php + units"
cp -a /etc/nginx/nginx.conf "$STAGE/nginx/"
cp -a /etc/nginx/conf.d "$STAGE/nginx/"
[ -d /etc/nginx/sites-enabled ] && cp -a /etc/nginx/sites-enabled "$STAGE/nginx/" || true
sudo cp -a /etc/letsencrypt/. "$STAGE/letsencrypt/"
sudo cp -a /etc/php/. "$STAGE/php/"
sudo chmod -R a+rX "$STAGE/letsencrypt" "$STAGE/php"
for u in $UNITS; do
  [ -f "/etc/systemd/system/$u.service" ] && cp -a "/etc/systemd/system/$u.service" "$STAGE/systemd/" || true
done

echo "==> pm2 + cron"
pm2 save 2>/dev/null || true
[ -f "/home/$APP_USER/.pm2/dump.pm2" ] && cp -a "/home/$APP_USER/.pm2/dump.pm2" "$STAGE/pm2/"
[ -f "/home/$APP_USER/messanger/ecosystem.config.cjs" ] && cp -a "/home/$APP_USER/messanger/ecosystem.config.cjs" "$STAGE/pm2/"
crontab -l > "$STAGE/cron/user0.cron" 2>/dev/null || true

echo "==> Data: home app dirs (root-owned через sudo cp)"
for d in messanger sud-parser scripts logs; do
  [ -e "/home/$APP_USER/$d" ] && cp -a "/home/$APP_USER/$d" "$STAGE/home/" || true
done
sudo cp -a "/home/$APP_USER/web" "$STAGE/home/web" 2>/dev/null && sudo chmod -R a+rX "$STAGE/home/web" || true
sudo cp -a "/home/$APP_USER/conf" "$STAGE/home/conf" 2>/dev/null && sudo chmod -R a+rX "$STAGE/home/conf" || true

echo "==> Data: web roots (медленно, ~3.4G)"
cp -a /var/www "$STAGE"/ 2>"$STAGE/cp-web-errors.txt" || true
echo "==> Не читаются user0 (home/conf уходит через sudo cp; остальное вне бандла):"
find /var/www "/home/$APP_USER" -type f ! -readable 2>/dev/null > "$STAGE/meta/UNREADABLE.txt" || true
cat "$STAGE/meta/UNREADABLE.txt"

echo "==> meta"
{
  echo "exported_at: $(date -Is)"
  echo "hostname: $(hostname)"
  lsb_release -d 2>/dev/null || true
  echo "node: $(node -v 2>/dev/null || true)"
  echo "php: $(php -v 2>/dev/null | head -1 || true)"
} > "$STAGE/meta/META.txt"

echo "==> Bundle: $BUNDLE"
tar -czpf "$BUNDLE" -C "/home/$APP_USER" ".migrate-stage-$TS"
sha256sum "$BUNDLE"
rm -rf "$STAGE" 2>/dev/null || true

if [ "$STOP_WRITERS" = 1 ]; then
  echo "WRITERS_STOPPED: old-сервер молчит. Роллбек: bash writers.sh start (на old-хосте)."
fi
echo "BUNDLE=$BUNDLE"
