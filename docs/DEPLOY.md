# Mess&Anger — Deployment Guide

## Одна команда — всё сразу

```powershell
npm run deploy
```

Запускает полный пайплайн и деплоит на сервер:

| Шаг | Что делает |
|-----|-----------|
| 1. Build | Линт → тесты → сборка main SPA |
| 2. Admin | Сборка admin панели → `dist/admin` |
| 3. Server | Подготовка signaling-файлов (`dist/server/`) |
| 4. Deploy web | SSH → загрузка `dist/` на сервер (`/var/www/mess.cvr.name`) |
| 5. Deploy signaling | SSH → загрузка серверных файлов → npm install → PM2 restart |
| 6. Admin user | Создание администратора через CLI |
| 7. APK (опционально) | Сборка Android APK/AAB |

## Быстрые варианты

```powershell
# Только web деплой (без signaling, без Android)
npm run deploy:web

# Быстрый деплой (без тестов и Android)
npm run deploy:quick

# Передеплой с существующей сборки (не пересобирает)
npm run deploy:server
```

## Создание администратора вручную

```powershell
npm run admin:create admin fuckoff190
```

## Запуск сервера локально

```powershell
JWT_SECRET=your-secret npx tsx server/signaling-server.ts
```

## Проверка 2FA (через curl)

```bash
curl -X POST http://localhost:8766/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"fuckoff190"}'
```

## Что и куда деплоится

| Компонент | Куда на сервере |
|-----------|----------------|
| Main SPA (dist/) | `/var/www/mess.cvr.name/` |
| Admin UI (dist/admin/) | `/var/www/mess.cvr.name/admin/` |
| Signaling server | `/home/user0/messanger/server/` |
| PM2 процесс | `mess-signaling` (порт 8765) |

## Требования

- **SSH доступ** — настроен в `~/.ssh/config` (хост `prod`):
  ```
  Host prod
      HostName 130.49.175.224
      User user0
      IdentityFile ~/.ssh/id_ed25519
  ```
- **На сервере:** Node.js, npm, PM2 (`npm i -g pm2 tsx`)

## Структура

| Компонент | Назначение |
|-----------|-----------|
| **Web SPA** (`/var/www/mess.cvr.name/`) | React PWA фронтенд |
| **Admin Panel** (`/var/www/mess.cvr.name/admin/`) | Admin UI (React SPA) |
| **Signaling Server** (PM2, порт 8765) | WebSocket relay для P2P |
| **REST API** (порт 8766) | Админ-эндпоинты (статистика, реклама) |
| **Android APK** (`app-release-signed.apk`) | TWA обёртка для PWA |

## Управление сервером (Linux)

```bash
# Статус сигналинга
pm2 status mess-signaling
pm2 logs mess-signaling
pm2 restart mess-signaling
pm2 save
```

## Nginx

Конфиг в `/etc/nginx/conf.d/mess.cvr.name.conf` (управляется HestiaCP).

**Важно:** SPA использует хэш-роутинг (`/#settings`). Если нужны красивые URL,
обновите в nginx:

```
location / {
    try_files $uri $uri/ /index.html;
}
```

### Прокси WebSocket

```
location /ws {
    proxy_pass http://127.0.0.1:8765;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $host;
    proxy_read_timeout 86400s;
}
```

### Прокси REST API

```
location /api/ {
    proxy_pass http://127.0.0.1:8766;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Authorization $http_authorization;
    proxy_pass_header Authorization;
}
```

## Android APK

```powershell
# Сборка отдельно
.\scripts\build-android.ps1

# Или через npm run deploy (включается автоматически)
npm run deploy
```

**Выход:**
- `app-release-signed.apk` — прямая установка
- `app-release-bundle.aab` — Google Play

## Переменные окружения

| Переменная | Где | Назначение |
|-----------|-----|-----------|
| `JWT_SECRET` | Server env | Подпись JWT (авто-генерация) |
| `DB_PATH` | Server env | Путь к SQLite (`data/admin.db`) |
| `PORT` | Server env | WebSocket порт (8765) |
| `REST_PORT` | Server env | REST API порт (8766) |
| `VITE_API_URL` | Admin build | URL REST API (`http://localhost:8766`) |
| `GEMINI_API_KEY` | Main app | Gemini AI API |

## Pull-деплой (альтернатива)

```bash
git clone https://github.com/joker096/neumorphic-ui.git /home/user0/messanger
cd /home/user0/messanger
npm install --omit=dev
npm run build
cp -r dist/* /var/www/mess.cvr.name/
pm2 restart mess-signaling
```
