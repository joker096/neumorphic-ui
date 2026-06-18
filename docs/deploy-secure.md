# Secure Deployment — `deploy-secure.sh`

Одна команда для развёртывания Mess&Anger на чистом Ubuntu/Debian сервере с полной изоляцией.

## Быстрый старт

```bash
# Скопировать проект на сервер, затем:
sudo bash scripts/deploy-secure.sh --domain=mess.cvr.name

# После завершения — HTTPS:
apt install certbot python3-certbot-nginx
certbot --nginx -d mess.cvr.name -d admin.mess.cvr.name
```

## Что делает скрипт

### 1. Системный пользователь `messanger`
- Без shell (`/usr/sbin/nologin`), без логина, без домашней папки
- Всё приложение работает от его имени, **не от root**

### 2. Node.js + Сборка
- Устанавливает Node.js 20 через nvm (если нет)
- `npm ci` для корневого проекта и `admin/`
- Билдит основной SPA (`npm run build`) и админку (`vite build`)

### 3. Изоляция через systemd

Оба сервиса (`messanger-signaling`, `messanger-admin`) запускаются с жёсткими ограничениями:

| Параметр | Значение | Зачем |
|----------|----------|-------|
| `NoNewPrivileges` | `true` | Запрещает повышение привилегий |
| `ProtectSystem` | `strict` | Чтение — только APP_DIR, запись — только DATA_DIR |
| `ReadWritePaths` | `/var/lib/messanger /var/log/messanger` | Куда можно писать |
| `ReadOnlyPaths` | Путь к проекту | Код только для чтения |
| `CapabilityBoundingSet` | (пусто) | Ноль Linux capabilities |
| `MemoryDenyWriteExecute` | `true` | Нельзя сделать память одновременно W+X |
| `PrivateDevices` | `true` | Нет доступа к устройствам |
| `RestrictSUIDSGID` | `true` | Запрет setuid/setgid бинарников |
| `LockPersonality` | `true` | Нельзя сменить personality ядра |
| `RestrictRealtime` | `true` | Нет real-time приоритетов |
| `PrivateTmp` | `true` | Изолированный /tmp |
| `ProtectKernelModules` | `true` | Нет доступа к модулям ядра |
| `ProtectControlGroups` | `true` | Нет доступа к cgroups |
| `SystemCallFilter` | `@system-service` | Только безопасные системные вызовы |
| `RemoveIPC` | `true` | Очистка IPC при остановке |

### 4. Secrets

- `JWT_SECRET` генерируется через `openssl rand -base64 48`
- Хранится в `/etc/messanger/jwt_secret` (владелец root, права 600)
- В systemd передаётся через **EnvironmentFile**, не через `Environment=` (чтобы не светить в `systemctl show`)
- Файл env — `root:messanger`, права 640

### 5. nginx

- **CSP в HTTP-заголовках** (не meta-теги) — если злоумышленник модифицирует SPA, CSP заблокирует исполнение
- `X-Frame-Options: DENY` — защита от clickjacking
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000`
- `server_tokens off` — не светим версию nginx
- WebSocket `/ws` → signaling server (8765)
- REST API `/api/` → admin REST (8766)
- SPA — статика из `dist/`
- Админка — на поддомене `admin.domain`

### 6. UFW

- `deny incoming` по умолчанию
- Разрешены только 22 (SSH), 80 (HTTP), 443 (HTTPS)

### 7. Администратор

Скрипт запросит username + password и создаст админа через `server/cli.ts`:
- bcrypt(password, 12)
- TOTP secret (для Google Authenticator)
- QR-код выводится в терминал

## Почему взлом сервера ≠ взлом мессенджера

### Сообщений на сервере нет
Mess&Anger использует **P2P E2EE** (Double Ratchet + X25519 + AES-256-GCM).
Сервер только ретранслирует:
- Публичные ключи (X25519)
- ICE candidates (для WebRTC)
- Метаданные (статус онлайна, индикаторы печати)

Даже при полном доступе к серверу злоумышленник **не может прочитать сообщения**.

### Если взломан signaling server
- Увидит: public keys, IP-адреса, User-Agent, время соединения
- Не увидит: содержимое сообщений, контакты, историю переписки
- Может: отключить сервер (DoS), подменить ICE candidates
- **P2P соединения, уже установленные, остаются зашифрованными**

### Если взломан сервер (ОС)
- SPA файлы можно изменить, но **CSP в HTTP-заголовках** заблокирует модифицированный JS
- База данных админки содержит только хэши паролей (bcrypt, 12 раундов)
- JWT_SECRET в файле с правами 600 — только root может прочитать
- Сервисный пользователь не может выполнить sudo, не имеет shell, не может писать в код

### Если взломана админка
- Максимум — просмотр статистики (кто онлайн, страны, устройства)
- Управление рекламой (безвредно)
- TOTP 2FA обязателен для входа

## Параметры запуска

| Параметр | Значение по умолчанию | Описание |
|----------|----------------------|----------|
| `--domain` | `$(hostname)` | Домен для nginx |
| `--admin` | `admin` | Имя администратора |
| `--no-nginx` | — | Пропустить установку nginx |
| `--no-firewall` | — | Пропустить настройку UFW |
| `--help` | — | Показать справку |

## Команды после установки

```bash
# Статус сервисов
systemctl status messanger-signaling
systemctl status messanger-admin

# Логи
journalctl -u messanger-signaling -f
journalctl -u messanger-admin -f

# Рестарт
systemctl restart messanger-signaling
systemctl restart messanger-admin

# Создать ещё одного админа
cd /path/to/project
JWT_SECRET="$(cat /etc/messanger/jwt_secret)" \
  DB_PATH=/var/lib/messanger/admin.db \
  npx tsx server/cli.ts newadmin newpassword
```

## Настройка клиента

В настройках мессенджера указать Signaling URL:
```
wss://domain.com/ws
```

## Структура файлов

```
/etc/messanger/
└── jwt_secret              root:root 600 — JWT signing secret

/var/lib/messanger/
└── admin.db                messanger:messanger 640 — SQLite база

/var/log/messanger/         messanger:messanger 750 — логи

/etc/systemd/system/
├── messanger-signaling.service
├── messanger-signaling.env  root:messanger 640 — переменные окружения
└── messanger-admin.service

/etc/nginx/sites-available/
├── messanger               — основной домен (SPA + API + WS)
└── messanger-admin         — admin.domain.com
```
