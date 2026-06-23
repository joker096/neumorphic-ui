# Secure Deployment — Three Modes

Один скрипт для трёх уровней развёртывания Mess&Anger:

| Режим | Сервер | Админка | Nginx | Firewall | Для чего |
|---|---|---|---|---|---|
| `local` | Нет | Нет | Нет | Нет | Локальная разработка, демо, offline/P2P-проверки |
| `minimal` | Только signaling relay | Нет | Да, только `/ws` | Да | Минимальный безопасный relay для P2P |
| `full` | Signaling + REST + SPA + admin | Да | Да, SPA + `/ws` + `/api/` | Да | Публичная production-инсталляция |

> По умолчанию используется `full`, чтобы сохранить обратную совместимость со старым `deploy-secure.sh`.

## Быстрый старт

### 1. Local / Offline P2P

Без deployment-сервера. Скрипт ничего не устанавливает и не создаёт systemd/nginx/firewall-правила. Для локального запуска используется обычный dev-сервер, поэтому не открывайте его в публичную сеть.

```bash
npm install
npm run dev
```

Signaling URL для локальной разработки:

```text
ws://localhost:3000/ws
```

Не используйте `localhost` для production и не открывайте dev-сервер в публичную сеть.

### 2. Minimal Signaling Server

Только WebSocket relay для WebRTC signaling. Без админки, без REST API, без JWT, без базы админки.

```bash
sudo bash scripts/deploy-secure.sh --mode=minimal --domain=mess.cvr.name
```

Signaling URL для клиента:

```text
wss://mess.cvr.name/ws
```

После первичного запуска — HTTPS:

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d mess.cvr.name
```

### 3. Full Production Server

Полный production-стек: основной SPA, signaling, admin REST, admin UI, nginx, CSP, secrets, UFW.

```bash
sudo bash scripts/deploy-secure.sh --mode=full --domain=mess.cvr.name
```

Signaling URL для клиента:

```text
wss://mess.cvr.name/ws
```

Admin URL:

```text
https://admin.mess.cvr.name
```

После первичного запуска — HTTPS:

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d mess.cvr.name -d admin.mess.cvr.name
```

## Что делает `deploy-secure.sh`

### Local mode

`--mode=local` только печатает инструкции и завершает работу до проверки root-прав.

```bash
bash scripts/deploy-secure.sh --mode=local
```

Этот режим не создаёт пользователя, сервисы, systemd-файлы, nginx-конфиги, firewall-правила, secrets или базы данных.

### Minimal mode

Создаёт минимальный relay:

1. Системный пользователь `messanger`
   - Без shell (`/usr/sbin/nologin`)
   - Без логина
   - Приложение работает не от root

2. Node.js runtime
   - Устанавливает Node.js 20 через nvm, если его нет
   - Не билдит SPA и admin UI

3. systemd-сервис `messanger-signaling`
   - Запускает `server/signaling-server.ts`
   - Не создаёт `messanger-admin`
   - Не создаёт JWT secret
   - Не создаёт SQLite admin DB

4. nginx
   - Открывает только `/ws`
   - Остальные пути возвращают `404`
   - Не проксирует `/api/`
   - Не обслуживает admin UI

5. UFW
   - `deny incoming` по умолчанию
   - Разрешены только 22, 80, 443

### Full mode

Сохраняет старый production-путь:

1. Node.js + сборка
   - `npm ci` для корневого проекта
   - `npm run build`
   - `npm ci` в `admin/`
   - `vite build` для admin UI

2. Secrets
   - `JWT_SECRET` генерируется через `openssl rand -base64 48`
   - Хранится в `/etc/messanger/jwt_secret`
   - Владелец `root:messanger`, права `640`

3. systemd
   - `messanger-signaling`
   - `messanger-admin`
   - Жёсткие sandbox-ограничения

4. nginx
   - CSP в HTTP-заголовках
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Strict-Transport-Security`
   - `server_tokens off`
   - `/ws` → signaling server
   - `/api/` → admin REST
   - `/` → main SPA
   - `admin.domain` → admin UI

5. UFW
   - Только SSH, HTTP, HTTPS

## systemd sandboxing

Оба server-режима используют жёсткие ограничения для signaling-сервиса:

| Параметр | Значение | Зачем |
|---|---|---|
| `NoNewPrivileges` | `true` | Запрещает повышение привилегий |
| `ProtectSystem` | `strict` | Чтение — только разрешённые пути |
| `ReadWritePaths` | `/var/lib/messanger /var/log/messanger` | Куда можно писать |
| `ReadOnlyPaths` | Путь к проекту | Код только для чтения |
| `CapabilityBoundingSet` | пусто | Ноль Linux capabilities |
| `MemoryDenyWriteExecute` | `true` | Нельзя сделать память одновременно W+X |
| `PrivateDevices` | `true` | Нет доступа к устройствам |
| `RestrictSUIDSGID` | `true` | Запрет setuid/setgid бинарников |
| `LockPersonality` | `true` | Нельзя сменить personality ядра |
| `RestrictRealtime` | `true` | Нет real-time приоритетов |
| `PrivateTmp` | `true` | Изолированный `/tmp` |
| `ProtectKernelModules` | `true` | Нет доступа к модулям ядра |
| `ProtectControlGroups` | `true` | Нет доступа к cgroups |
| `SystemCallFilter` | `@system-service` | Только безопасные системные вызовы |
| `RemoveIPC` | `true` | Очистка IPC при остановке |

## Почему взлом сервера ≠ взлом мессенджера

### Сообщений на сервере нет

Mess&Anger использует P2P E2EE. Сервер только ретранслирует:

- Публичные ключи
- SDP offer/answer
- ICE candidates
- Метаданные: статус онлайна, индикаторы печати, delivery/read receipts

Даже при полном доступе к серверу злоумышленник не может прочитать содержимое сообщений.

### Если взломан minimal signaling server

Можно увидеть:

- public keys
- IP-адреса
- User-Agent
- время соединения
- факт онлайн/офлайн
- метаданные, которые клиент сам отправляет через signaling

Нельзя увидеть:

- содержимое сообщений
- контакты
- историю переписки
- private keys
- локальную encrypted IndexedDB

Можно сделать:

- отключить relay
- задержать или сбросить соединения
- попытаться подменить ICE candidates

Уже установленные P2P-соединения остаются зашифрованными.

### Если взломан full server

- SPA-файлы можно изменить, но CSP в HTTP-заголовках должен заблокировать выполнение чужого JS
- admin REST защищён JWT
- admin UI требует TOTP 2FA
- SQLite admin DB содержит только bcrypt password hashes и session records
- `JWT_SECRET` не лежит в `systemctl show`
- сервисный пользователь не может выполнить sudo, не имеет shell и не пишет в код

## Параметры запуска

| Параметр | Значение по умолчанию | Описание |
|---|---|---|
| `--mode=local` | — | Печатает local/offline инструкции и выходит |
| `--mode=minimal` | — | Deploy only signaling relay |
| `--mode=full` | `full` | Deploy full production stack |
| `--domain` | `$(hostname)` | Домен для nginx |
| `--email` | — | Email для Let's Encrypt, если используется certbot вручную |
| `--admin` | `admin` | Имя администратора, только `full` |
| `--no-nginx` | — | Пропустить nginx, `minimal/full` |
| `--no-firewall` | — | Пропустить UFW, `minimal/full` |
| `--help` | — | Показать справку |

## Команды после установки

### Minimal mode

```bash
systemctl status messanger-signaling
journalctl -u messanger-signaling -f

systemctl restart messanger-signaling
```

### Full mode

```bash
systemctl status messanger-signaling
systemctl status messanger-admin

journalctl -u messanger-signaling -f
journalctl -u messanger-admin -f

systemctl restart messanger-signaling
systemctl restart messanger-admin
```

### Создать ещё одного админа в full mode

```bash
cd /path/to/project
JWT_SECRET="$(cat /etc/messanger/jwt_secret)" \
  DB_PATH=/var/lib/messanger/admin.db \
  npx tsx server/cli.ts newadmin newpassword
```

## Структура файлов

```text
/etc/messanger/
└── jwt_secret              full mode only, root:messanger 640 — JWT signing secret

/var/lib/messanger/
├── admin.db                full mode only, messanger:messanger 640 — SQLite admin DB
└──                         minimal mode: relay runtime data only

/var/log/messanger/         messanger:messanger 750 — логи signaling-сервиса

/etc/systemd/system/
├── messanger-signaling.service
├── messanger-signaling.env  root:messanger 640 — переменные окружения
└── messanger-admin.service full mode only

/etc/nginx/sites-available/
├── messanger               minimal/full: основной домен
└── messanger-admin         full mode only: admin.domain
```

## Выбор режима

- Для разработки: `local`
- Для маленького приватного relay без админки: `minimal`
- Для публичного production с админкой и полным набором защит: `full`
