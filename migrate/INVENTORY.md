# Инвентарь сервера (prod = user0@130.49.175.224, Debian 12)

Документация по переносу: F:\AISTUDIO\neumorphic-ui\migrate\:
- INVENTORY.md — инвентарь сервера: сайты, порты, данные, dead-юниты, cron, секреты, размеры + секция «Bundle (верифицирован)» (385M, sha256, layout)
- CUTOVER.md — план катчера: DNS TTL, cutover ~15 мин, публичная проверка, ре-выдача certbot, роллбек, decommission
- export.sh / import.sh / writers.sh / migrate.ps1 — сами скрипты

Состав собран 2026-08-22. Источник: живые конфиги, systemd, ss, du.

## Сайты

| Домен | Фронтенд | Бэкенд | Порт(ы) | Данные |
|---|---|---|---|---|
| mess.cvr.name (+www) | SPA `/var/www/mess.cvr.name` (static, sw.js, _headers) | pm2 `mess-signaling` (node, `/home/user0/messanger`) | 3003 REST, 3006 WS | SQLite `/home/user0/messanger/data/admin.db` (+wal/shm) |
| admin.mess.cvr.name | Static `/var/www/admin.mess.cvr.name` (app.js, data.json, config/) | — | — | файлы `data.json`, `config/` |
| cvr.name (+www) | SPA `/var/www/cvr.name` | node `/var/www/cvr.name/server.js` (systemd `cvr.name.service`) | 3002 API | SQLite `/var/www/cvr.name/data/platform.db` (+wal) |
| fennec.cvr.name (+www) | SPA `/var/www/fennec.cvr.name` | Firebase (нет своего бэкенда) | — | — |
| photolessons.org (+www) | Static + Rust-бинарник `/var/www/photolessons.org/photolessons.org` (systemd) | systemd `photolessons.org.service` | 3000 | SQLite `data/posts.db` (~872M), legacy `data/photolessons.db` (~870M), JSON в `data/`, посты в `posts/` |
| seoqube.cvr.name (+www) | Static `/var/www/seoqube.cvr.name` | — | — | — |
| sud.cvr.name (+www) | Static `/var/www/sud.cvr.name` | node `/home/user0/sud-parser/server.js` (systemd `sud-parser.service`, internal API) | 3007 | `/home/user0/sud-parser/` (json, логи) |
| vps.cvr.name | Корневой каталог есть, **nginx-виртхоста НЕТ** | fpm-пул `php8.3-fpm-vps.cvr.name.sock` (остаток Hestia) | — | **dead, не мигрировать** |

## Службы (systemd)

| Unit | Состояние | Назначение |
|---|---|---|
| cvr.name.service | active | node THE_PLATFORM, env `/var/www/cvr.name/.env`, порт 3002 |
| photolessons.org.service | active | Rust-бинарник, порт 3000, env `/var/www/photolessons.org/.env` |
| sud-parser.service | active | node sud-parser, порт 3007 |
| portfolio.service | **activating (застревает)** | root-owned Rust-бинарник, PORT=3002 — конфликт с cvr.name, бинарника нет. **Dead** |
| humanizer-api.service | inactive | `/opt/humanizer_api` **не существует**. **Dead** |
| pm2-root.service | disabled | legacy `/opt/messanger-signaling` (остановлен, отключён). **Dead** |
| mess-signaling | pm2 user0 | REST 3003 + WS 3006 |

## Порты (ss)

`80/443` nginx · `3000` photolessons · `3002` cvr.name · `3003`+`3006` mess-signaling · `3007` sud-parser

## Секреты (в бандле, 0600 user0)

- `/var/www/cvr.name/.env` — VITE_ADMIN_PASSWORD, JWT_SECRET, CONTACT_EMAIL, NODEMAILER_KEY, DATABASE_PATH
- `/var/www/photolessons.org/.env` — ADMIN_PASS, BLOG_POSTS_DIR
- mess: env через pm2/ecosystem (`ecosystem.config.cjs` в `/home/user0/messanger/`)
- Let's Encrypt: приватные ключи в `/etc/letsencrypt/` (копируются в бандле)

## Cron (user0)

```
0 3 * * 0  /home/user0/scripts/cleanup-weekly.sh
0 6 * * *  df -h / >> /home/user0/logs/disk-check.log
17 * * * * RETENTION_HOURS=6 DRY_RUN=0 /home/user0/bin/photolessons-cleanup.sh
0 3 * * *  /var/www/photolessons.org/static/img/webp-convert.sh
0 3 * * *  node /home/user0/scripts/auto-refresh.mjs
0 3 * * *  rm -rf /home/user0/.local/share/Trash/*
0 3 * * 0  rm -rf /home/user0/cvr-build/target /home/user0/photolessons-build/target
```

## Что НЕ мигрируется (осознанно)

- **MariaDB** — запущен, но не используется ни одним сайтом (всё SQLite/файлы). Legacy от панели.
- **exim4/dovecot** (почта), **vsftpd** (FTP), **bind9** (reverse-зоны старого IP), **docker** — оценить отдельно; доменную почту при необходимости переносить вручную.
- Dead-юниты: `portfolio`, `humanizer-api`, `pm2-root`; `/opt/messanger-signaling`, `/opt/sud-app` (дубль `/home/user0/sud-parser`), `/var/www/vps.cvr.name`.
- PHP: пулы `php8.3-fpm-<domain>` существуют, но **PHP-файлов на сайтах нет** (статика). Ссылка `php8.2-fpm.sock` в конфигах устаревшая — безвредна.
- `photolessons.db` (legacy, 870M) — копируется для сохранности, приложение использует `posts.db`.

## Размеры (для оценки бандля)

`/var/www` ~3.4G (photolessons 2.5G, fennec 184M, cvr.name 109M) · `/home/user0/messanger` 199M · `sud-parser` 14M · `scripts` 9.6M · **итого бандл ≈ 4G** (disk на prod: 24G свободно)

## Bundle (верифицирован 2026-08-22)

- Dry-run `export.sh --no-stop` на prod: `/home/user0/migrate-bundle-20260822-142356.tar.gz`, **385M**, sha256 `da5d9858e3c2344bd047ac984f8d35e417b5b9f4e9d1d5727aa3cabf5f54a580`.
- Layout: `www/{cvr.name,photolessons.org,...}` · `home/{messanger,sud-parser,scripts,web,logs,conf}` · `nginx/` · `letsencrypt/` (ключи) · `php/` · `systemd/` · `pm2/` · `cron/` · `meta/`.
- Ключевые файлы в бандле: `.env` (cvr.name, photolessons, mess) · `data/*.db` · `letsencrypt/live/*/*.pem` · `cvr.name.service` · `user0.cron` · `dump.pm2`.
- Вне бандла (не читается user0): `/var/www/fastuser/data/logs/.protected` — панельный артефакт, воссоздать при необходимости (`touch` + 0600).

## Версии

Debian 12 bookworm · nginx 1.22 · **Node v18.20.8** · PHP 8.3/8.4-fpm (пулы) · sqlite3
