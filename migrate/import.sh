#!/usr/bin/env bash
# migrate/import.sh — восстановление ВСЕХ сайтов на ЧИСТОМ VPS (Debian 12).
# Запускать как root:  bash import.sh /root/migrate-bundle-<TS>.tar.gz
# Бандл содержит приватные ключи и .env — удалять бандл после импорта.
set -euo pipefail

BUNDLE="${1:?Usage: bash import.sh /path/to/migrate-bundle-<TS>.tar.gz}"
APP_USER="${APP_USER:-user0}"
WORK="/tmp/migrate-restore.$$"

echo "==> 1. Пакеты (nginx, php8.3-fpm, node18, certbot)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq nginx php8.3-fpm php8.3-cli php8.3-sqlite3 php8.3-mysql \
  php8.3-curl php8.3-gd php8.3-mbstring php8.3-xml php8.3-bcmath php8.3-zip \
  sqlite3 rsync openssl ca-certificates webp certbot
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y -qq nodejs

id -u "$APP_USER" &>/dev/null || useradd -m -s /bin/bash "$APP_USER"
echo "==> npm global (user0) + pm2"
su - "$APP_USER" -c "npm config set prefix /home/$APP_USER/.npm-global && npm install -g pm2"

echo "==> 2. Распаковка"
mkdir -p "$WORK"
tar -xpf "$BUNDLE" -C "$WORK"
STAGE_NAME="$(cd "$WORK" && ls -1 | head -1)"
S="$WORK/$STAGE_NAME"
[ -d "$S" ] || { echo "unexpected bundle layout in $WORK"; exit 1; }

echo "==> 3. Web roots"
mkdir -p /var/www
cp -a "$S"/www/. /var/www/
chown -R "$APP_USER:www-data" /var/www 2>/dev/null || chown -R "$APP_USER" /var/www

echo "==> 4. Home dirs"
mkdir -p "/home/$APP_USER/.pm2"
for d in messanger sud-parser scripts web logs conf; do
  [ -e "$S/home/$d" ] && cp -a "$S/home/$d" "/home/$APP_USER/"
done
[ -f "$S/pm2/dump.pm2" ] && cp -a "$S/pm2/dump.pm2" "/home/$APP_USER/.pm2/dump.pm2"
chown -R "$APP_USER" "/home/$APP_USER/messanger" "/home/$APP_USER/sud-parser" "/home/$APP_USER/scripts" "/home/$APP_USER/.pm2" 2>/dev/null || true

echo "==> 5. nginx (конфы + старый nginx.conf с cache-зонами)"
cp -a "$S"/nginx/conf.d/*.conf /etc/nginx/conf.d/
[ -f "$S/nginx/nginx.conf" ] && { cp -a /etc/nginx/nginx.conf "/etc/nginx/nginx.conf.orig-$(date +%s)"; cp -a "$S/nginx/nginx.conf" /etc/nginx/nginx.conf; }
[ -d "$S/nginx/sites-enabled" ] && cp -a "$S/nginx/sites-enabled/." /etc/nginx/sites-enabled/

echo "==> 6. Let's Encrypt (скопированные ключи; ре-выдача после смены DNS)"
mkdir -p /etc/letsencrypt
cp -a "$S"/letsencrypt/. /etc/letsencrypt/ 2>/dev/null || true
chmod -R 0600 /etc/letsencrypt/live 2>/dev/null || true

echo "==> 7. PHP pools"
[ -d "$S/php" ] && cp -a "$S"/php/. /etc/php/ 2>/dev/null || true

echo "==> 8. Systemd units (только живые; dead-юниты НЕ ставим)"
for u in cvr.name photolessons.org sud-parser; do
  [ -f "$S/systemd/$u.service" ] && cp -a "$S/systemd/$u.service" /etc/systemd/system/
done
systemctl daemon-reload
systemctl enable --now cvr.name photolessons.org sud-parser 2>/dev/null || true

echo "==> 9. pm2 (mess-signaling)"
su - "$APP_USER" -c "cd /home/$APP_USER/messanger && /home/$APP_USER/.npm-global/bin/pm2 start ecosystem.config.cjs && /home/$APP_USER/.npm-global/bin/pm2 save" || true

echo "==> 10. Cron (user0)"
[ -f "$S/cron/user0.cron" ] && crontab -u "$APP_USER" "$S/cron/user0.cron"

echo "==> 11. nginx"
nginx -t
systemctl enable --now nginx
systemctl restart php8.3-fpm 2>/dev/null || true

echo "==> 12. Verify (локально)"
for d in mess.cvr.name admin.mess.cvr.name cvr.name fennec.cvr.name photolessons.org seoqube.cvr.name sud.cvr.name; do
  printf "%-22s %s\n" "$d" "$(curl -sk --resolve "$d:443:127.0.0.1" "https://$d/" -o /dev/null -w '%{http_code}' 2>/dev/null || echo ERR)"
done
echo "mess /health: $(curl -sk --resolve mess.cvr.name:443:127.0.0.1 https://mess.cvr.name/health 2>/dev/null || echo ERR)"
ss -tln | grep -E ':(3000|3002|3003|3006|3007)\b' || true

echo "==> Готово. Дальше: CUTOVER.md — смена DNS A-записей на новый IP, затем certbot на каждый домен."
rm -rf "$WORK"
