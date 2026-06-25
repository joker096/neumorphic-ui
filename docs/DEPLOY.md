# Mess&Anger — Deployment Guide

## Структура

| Компонент | Расположение | Назначение |
|-----------|-------------|------------|
| **Web SPA** | `/var/www/mess.cvr.name/` | React PWA фронтенд |
| **Signaling Server** | PM2 `mess-signaling` (порт 3006) | WebSocket relay для P2P |
| **Admin Panel** | `/var/www/admin.mess.cvr.name/` (порт 3003) | Admin REST API + UI |
| **Android APK** | `app-release-signed.apk` | TWA обёртка для PWA |

## Быстрый деплой

### Локально (Windows):

```powershell
# 1. Собрать web + деплой на сервер + собрать APK
.\scripts\deploy-all.ps1

# 2. Только web деплой
.\scripts\deploy-web.ps1

# 3. Только APK (без пересборки web)
.\scripts\build-android.ps1 -SkipWebBuild
```

### На сервере (Linux):

```bash
# Управление signaling сервером
pm2 status mess-signaling
pm2 logs mess-signaling
pm2 restart mess-signaling

# Сохранить PM2 для автозапуска
pm2 save
pm2 startup
```

## Настройка сервера

### SSH доступ

Настроен в `~/.ssh/config`:
```
Host prod
    HostName 130.49.175.224
    User user0
    IdentityFile ~/.ssh/id_ed25519
```

### Nginx

Конфиг находится в `/etc/nginx/conf.d/mess.cvr.name.conf` (управляется HestiaCP).

**Важно:** SPA использует хэш-роутинг (`/#settings`). Если нужны красивые URL
(`/settings`), обновите в nginx:
```
location / {
    try_files $uri $uri/ /index.html;
}
```

### Signaling Server

Уже запущен через PM2 на порту 8765.

```bash
cd /home/user0/messanger
pm2 status mess-signaling
pm2 logs mess-signaling
pm2 restart mess-signaling
pm2 save
```

**Проблема:** Порт 3006 занят старым процессом (владелец root). Пока он не освобождён,
сигналинг работает на порту 8765. Nginx проксирует `/ws` → `3006`, но старый процесс
на 3006 не является нашим signaling сервером.

**Исправление (требуется root):**
```bash
# Узнать PID процесса на порту 3006
ss -tlnp | grep 3006
# Убить процесс
sudo fuser -k 3006/tcp
# Или через systemctl (если это systemd-сервис)
sudo systemctl stop messanger-signaling
# ИЛИ просто дождаться перезагрузки сервера
# После освобождения порта:
cd /home/user0/messanger && pm2 restart mess-signaling --update-env
```

**Либо изменить nginx (требуется root):**
```nginx
location /ws {
    proxy_pass http://127.0.0.1:8765;
    # ... остальные настройки
}
```

### SSL (Let's Encrypt)

Сертификаты уже установлены. Обновление:
```bash
certbot renew
```

## Android APK

### Требования для сборки:
- JDK 17+
- Android SDK (ANDROID_HOME)
- Keystore: `messandanger-keystore.jks`

### Сборка:

```powershell
.\scripts\build-android.ps1
```

**Выходные файлы:**
- `app-release-signed.apk` — для прямой установки
- `app-release-bundle.aab` — для Google Play

## Pull деплой (альтернатива)

Если на сервере есть git:

```bash
# На сервере:
git clone https://github.com/joker096/neumorphic-ui.git /home/user0/messanger
cd /home/user0/messanger
npm install --omit=dev
npm run build
cp -r dist/* /var/www/mess.cvr.name/
pm2 restart mess-signaling
```
