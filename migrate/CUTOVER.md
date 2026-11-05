# Cutover план — перевод всех сайтов на новый VPS/VDS

## Новый VPS (требования)
- Debian 12 (bookworm) — один-в-один, все бинарники/конфиги переносимы
- Диск ≥ 20 GB, RAM ≥ старого (см. `INVENTORY.md`)
- SSH доступ root (или sudo-юзер, тогда `import.sh` адаптировать)

## До (за 1–2 дня)
1. **DNS TTL всех зон → 300** (cvr.name, mess.cvr.name, photolessons.org, fennec/seoqube/sud — в зависимости от зон-провайдеров).
2. Dry-run: `pwsh migrate/migrate.ps1 -DryRun` — проверить, что бандл собирается (проверенный dry-run: **385M**, sha256 в логе; см. `INVENTORY.md` → Bundle).
3. Проверить новый VPS: `ssh new 'lsb_release -d'` = bookworm, `df -h /`.

## Катовер (~15 мин. даунтайма писателей)
```
pwsh migrate/migrate.ps1 -NewHost root@NEW_VPS_IP
```
Скрипт делает: export (останавливает писателей на old) → scp бандл old→local→new → import (apt, restore, systemd, pm2, nginx, verify) → cleanup бандлов.

После:
1. **A-записи → IP нового VPS**: `cvr.name` (+www), `mess.cvr.name` (+www), `admin.mess.cvr.name`, `fennec.cvr.name`, `photolessons.org` (+www), `seoqube.cvr.name`, `sud.cvr.name` (+www).
2. Ждём TTL (≤5 мин).
3. **Публичная проверка** (с любого хоста):
   ```
   for d in mess.cvr.name cvr.name fennec.cvr.name photolessons.org seoqube.cvr.name sud.cvr.name admin.mess.cvr.name; do
     curl -sI https://$d/ | head -1
   done
   curl -s https://mess.cvr.name/health
   curl -sk --http1.1 -H 'Upgrade: websocket' -H 'Connection: Upgrade' https://mess.cvr.name/ws -o /dev/null -w '%{http_code}\n'  # 101
   ```
4. **Сертификаты**: скопированные Let's Encrypt действуют до expiry, но renewal идёт от старого ACME-аккаунта. На новом хосте:
   ```
   certbot --nginx -d mess.cvr.name -d www.mess.cvr.name
   certbot --nginx -d cvr.name -d www.cvr.name
   certbot --nginx -d fennec.cvr.name -d www.fennec.cvr.name
   certbot --nginx -d photolessons.org -d www.photolessons.org
   certbot --nginx -d seoqube.cvr.name -d www.seoqube.cvr.name
   certbot --nginx -d sud.cvr.name -d www.sud.cvr.name
   ```
5. Old-хост остаётся **стопнутым** (писатели остановлены export'ом) — это роллбек-страховка.

## Роллбек
1. DNS A-записи вернуть на старый IP.
2. `ssh prod 'bash /tmp/writers.sh start'` (или `migrate/writers.sh`).
3. Готово. Экспорт read-only: старый сервер не модифицирован. Данные, написанные в окно миграции — отсутствуют (писатели были остановлены) — принять/отклонить по бизнесу.

## Decommission старого (после 48h успеха)
1. Снимать мониторинг/алерты.
2. `systemctl stop nginx` и т.д.; сделать disk-снапшот (если провайдер позволяет).
3. Оставить хост на 1 месяц в холодном состоянии, потом вернуть.

## Что НЕ переносится (осознанно)
- Почта (exim4/dovecot) — при необходимости: перенос `/var/mail` + пере-конфиг; доменные MX менять отдельно.
- FTP (vsftpd), bind9 (reverse-зоны старого IP), docker — не нужны сайтам.
- MariaDB (не используется), dead-юниты (`portfolio`, `humanizer-api`, `pm2-root`).

## Безопасность
- Бандл содержит `.env` (JWT, пароли, API-ключи) и приватные ключи Let's Encrypt.
- Бандл удаляется со всех трёх хостов автоматически (migrate.ps1 step 5). Локальная копия в `%TEMP%` — проверить/удалить.
- Не отправлять бандл никуда, кроме нового VPS.
