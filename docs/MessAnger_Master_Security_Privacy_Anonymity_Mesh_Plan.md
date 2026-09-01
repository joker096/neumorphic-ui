# Mess&Anger — Master Security, Privacy, Anonymity & Resilient Networking Plan

> Назначение: технический master-план для построения Mess&Anger как privacy-first мессенджера с минимизацией собираемых данных, защитой содержимого и метаданных, отсутствием передачи почты/телефона третьим лицам и устойчивостью коммуникации при потере обычного интернет-соединения.
>
> Ключевой принцип: **данные пользователя не должны существовать в системе без необходимости**.
>
> Важное уточнение: абсолютную анонимность нельзя гарантировать одной настройкой. Архитектура должна минимизировать идентифицирующие данные, разделять их, не раскрывать их собеседникам и третьим сторонам, а также честно документировать остаточные риски.

---

# 0. Security Goals

Mess&Anger должен строиться вокруг следующих целей:

```text
PRIVACY
+
ANONYMITY
+
CONFIDENTIALITY
+
MINIMAL DATA
+
METADATA MINIMIZATION
+
FORWARD SECRECY
+
SECURE RECOVERY
+
SECURE MESH / OFFLINE RESILIENCE
+
NO UNNECESSARY THIRD-PARTY DISCLOSURE
=
PRIVACY-FIRST MESSENGER
```

Главные требования:

- не раскрывать email другим пользователям;
- не раскрывать телефон другим пользователям;
- не передавать email/телефон сторонним сервисам без строго необходимой причины;
- минимизировать IP- и connection metadata;
- минимизировать серверные логи;
- не хранить содержимое сообщений в открытом виде;
- не использовать контакты пользователя без явного согласия;
- не требовать реальные персональные данные для обычного использования;
- не делать email/phone публичным идентификатором;
- разделять account identity и contact identity;
- обеспечить шифрование сообщений;
- защитить ключи на устройстве;
- обеспечить безопасное удаление локальных данных;
- обеспечить безопасную работу при потере интернета;
- предусмотреть mesh/offline transport;
- не считать mesh автоматически приватным: каждый transport должен иметь собственную модель угроз;
- не использовать безопасность через «секретность реализации».

---

# 1. Threat Model

Перед реализацией составить официальную модель угроз.

## 1.1. Потенциальные противники

Рассматривать:

```text
обычный злоумышленник
скомпрометированный аккаунт
скомпрометированное устройство
вредоносное приложение
оператор сети
провайдер
злоумышленник в локальной сети
серверный администратор
скомпрометированный сервер
сторонний analytics provider
push provider
malicious relay
traffic observer
```

Отдельно определить:

```text
что защищаем
от кого
на каком уровне
какой ценой
```

---

# 2. Data Classification

Все данные разделить по классам.

## 2.1. Identity Data

```text
email
phone
name
date of birth
profile information
recovery information
```

Правило:

> Identity data не должна автоматически становиться messaging identity.

---

# 3. Messaging Identity

Пользователь должен иметь отдельный внутренний идентификатор.

Например:

```text
Account ID
Device ID
Messaging ID
Key ID
```

Не использовать:

```text
email → user ID
phone → user ID
```

в качестве публичной identity.

---

# 4. Public Identity

Публичный профиль должен использовать только то, что пользователь сознательно публикует.

Например:

```text
username
display name
avatar
bio
public key fingerprint
```

Email и телефон:

```text
PRIVATE BY DEFAULT
```

---

# 5. Email Privacy

Email не должен:

```text
показываться другим пользователям
использоваться как username
встраиваться в message metadata
передаваться contact list recipients
попадать в analytics
попадать в error reports
попадать в публичные API responses
```

Если email необходим для account recovery:

```text
использовать его только в recovery subsystem
```

---

# 6. Phone Privacy

Телефон не должен:

```text
показываться в профиле
передаваться собеседнику
попадать в публичный API
использоваться как обязательный public identity
попадать в analytics
попадать в crash reports
```

Если phone verification когда-либо используется:

```text
verification data
      ↓
isolated verification subsystem
      ↓
minimum retention
```

---

# 7. Contact Discovery

Это один из самых важных privacy-компонентов.

Не отправлять полный address book на сервер.

Запрещённый подход:

```text
client contacts
      ↓
entire phone book
      ↓
server
```

Предпочтительная архитектура:

```text
local contacts
      ↓
privacy-preserving matching design
      ↓
minimum necessary result
```

Отдельно провести security review выбранного contact-discovery механизма.

---

# 8. Metadata Minimization

Шифрование сообщения не скрывает автоматически:

```text
кто
когда
с кем
как часто
размер
на каком устройстве
```

Поэтому отдельно минимизировать:

```text
timestamps
IP
connection identifiers
device identifiers
message sizes
delivery metadata
presence
typing status
read status
contact graph
```

---

# 9. Server Logs

По умолчанию:

```text
NO CONTENT LOGGING
NO MESSAGE BODY LOGGING
NO PASSWORD LOGGING
NO TOKEN LOGGING
NO EMAIL IN GENERIC LOGS
NO PHONE IN GENERIC LOGS
NO FULL IP RETENTION WITHOUT NECESSITY
```

Логи должны быть:

```text
minimal
purpose-limited
short-lived
access-controlled
audited
```

---

# 10. Observability Privacy

Обычные analytics могут разрушить модель анонимности.

Не использовать без отдельного privacy review:

```text
Google Analytics
session replay
keystroke logging
full request logging
device fingerprinting
third-party behavioral analytics
```

Если analytics необходима:

```text
privacy-preserving
aggregated
non-identifying
opt-in where appropriate
```

---

# 11. Crash Reports

Crash reports не должны автоматически содержать:

```text
email
phone
message content
private keys
access tokens
authorization headers
full contact list
private profile data
```

Перед отправкой:

```text
sanitize
redact
minimize
```

---

# 12. Third-Party Services

Создать inventory всех external services:

```text
push provider
CDN
hosting
analytics
captcha
email
SMS
storage
monitoring
maps
fonts
media services
```

Для каждого:

```text
data received
data retained
jurisdiction
privacy risk
necessity
alternative
```

Правило:

> Сторонний сервис не должен получать пользовательские данные только потому, что это удобно разработчику.

---

# 13. API Privacy Boundary

API responses не должны возвращать лишние поля.

Например, если клиенту нужен:

```text
displayName
avatar
onlineStatus
```

не отправлять:

```text
email
phone
internal ID
recovery data
security metadata
```

если они не нужны этому конкретному клиенту.

---

# 14. Authorization

Разделить:

```text
authentication
authorization
session
device authorization
message authorization
admin authorization
```

Не использовать один универсальный token для всего.

---

# 15. Session Security

Предусмотреть:

```text
short-lived access tokens
secure refresh mechanism
token rotation
session revocation
device/session list
remote logout
suspicious session detection
```

Refresh tokens:

```text
never expose to JavaScript unnecessarily
never log
never place in URLs
```

---

# 16. Password Security

Если пароли используются:

```text
strong password hashing
unique salt
rate limiting
credential stuffing protection
secure reset flow
```

Никогда:

```text
plaintext passwords
reversible encryption for passwords
password logging
```

---

# 17. Authentication Without Mandatory PII

Цель:

> обычный пользователь должен иметь возможность пользоваться messenger identity без обязательной публикации или раскрытия email/phone.

Архитектуру authentication выбирать исходя из:

```text
privacy
recovery
abuse prevention
device loss
account portability
```

---

# 18. Account Recovery

Recovery — отдельная security-модель.

Пользователь должен понимать:

```text
recovery method
what it can reveal
what it cannot reveal
what happens if recovery data is lost
```

Нельзя обещать одновременно:

```text
complete anonymity
+
server-recoverable identity
+
full account recovery
```

без архитектурного компромисса.

---

# 19. Device Identity

Каждое устройство должно иметь собственную cryptographic identity.

```text
Account
 ├── Device A
 ├── Device B
 └── Device C
```

Каждое устройство:

```text
own key material
own session state
own revocation state
```

---

# 20. Key Storage

Private keys:

```text
never send to server in plaintext
never store in logs
never put into URLs
never expose unnecessarily to frontend
```

По возможности использовать:

```text
OS secure storage
hardware-backed keystore
encrypted local storage
```

---

# 21. End-to-End Encryption

Если Mess&Anger заявляет E2EE, необходимо обеспечить:

```text
sender
   ↓
encrypt
   ↓
server / relay
   ↓
encrypted transport
   ↓
recipient
   ↓
decrypt
```

Сервер не должен иметь обычного доступа к plaintext message content.

---

# 22. Cryptography

Не изобретать собственную криптографию.

Использовать:

```text
well-reviewed cryptographic libraries
standardized primitives
audited protocols
```

Криптографический протокол должен быть документирован.

---

# 23. Key Agreement

Предусмотреть защищённый механизм установления ключей.

Требования:

```text
authentication
forward secrecy
key rotation
session separation
device verification
```

---

# 24. Forward Secrecy

Компрометация долгосрочного ключа не должна автоматически раскрывать всю историю сообщений.

Проверить:

```text
session key lifecycle
ratchet/key rotation
old message protection
new message protection
```

---

# 25. Message Encryption

Каждое сообщение должно иметь:

```text
unique cryptographic context
authenticated encryption
replay protection
integrity protection
```

---

# 26. Message Metadata

Даже encrypted message может раскрывать:

```text
size
timing
sender/recipient relationship
delivery time
```

Поэтому рассмотреть:

```text
padding
batched delivery
delayed/non-identifying delivery metadata
minimal server-side identifiers
```

Только после анализа влияния на производительность и UX.

---

# 27. Message IDs

Message ID не должен раскрывать:

```text
timestamp
user ID
phone
email
sequential database ID
```

Не использовать простые:

```text
1
2
3
4
```

как публичные message identifiers.

---

# 28. Server-Side Message Storage

Определить чёткую политику:

```text
what is stored
why
how long
who can access
when deleted
```

Если сообщение может быть E2EE:

```text
server stores ciphertext
```

а не plaintext.

---

# 29. Local Message Storage

На устройстве:

```text
encrypted at rest
protected keys
secure deletion policy
no plaintext export by default
```

Особое внимание:

```text
database
cache
attachments
thumbnails
notifications
temporary files
clipboard
search index
backups
```

---

# 30. Notifications

Push notification может раскрывать содержание.

Плохой вариант:

```text
"Ivan: встречаемся завтра в 19:00"
```

Лучше privacy-first:

```text
New message
```

или настраиваемый пользователем privacy level.

---

# 31. Lock Screen Privacy

Настройки:

```text
show sender
show message preview
hide message content
hide all sensitive notification data
```

Default:

```text
privacy-first
```

---

# 32. Clipboard

Ограничить попадание sensitive data в clipboard.

Для копирования:

```text
copy message
copy username
copy sensitive data
```

отдельно рассмотреть:

```text
clipboard lifetime
platform protections
```

---

# 33. Screenshots

На поддерживаемых платформах рассмотреть:

```text
screenshot protection
screen recording indication
sensitive view masking
```

При этом честно документировать, что приложение не может гарантировать защиту от камеры другого устройства.

---

# 34. Media Privacy

Изображения и файлы могут содержать metadata:

```text
EXIF
GPS
device model
creation timestamp
software
```

Для media sharing предусмотреть:

```text
metadata stripping
user-controlled original upload
privacy warning
```

---

# 35. File Storage

Проверить:

```text
filename
path
MIME
metadata
thumbnail
preview
download URL
storage key
```

Не допускать раскрытия:

```text
local filesystem path
private storage path
internal bucket name
```

---

# 36. CDN Privacy

Если используется CDN:

```text
private media
signed access
short-lived authorization
no public permanent URLs
```

Проверить, какие данные видит CDN.

---

# 37. Link Previews

URL preview может передать приватный URL третьему серверу.

Не делать:

```text
user URL
 ↓
third-party preview service
```

без privacy review.

Предусмотреть:

```text
local preview
privacy-preserving proxy
user opt-out
```

---

# 38. Presence

Online status раскрывает поведенческие данные.

Настройки:

```text
online visibility
last seen
typing indicator
read receipts
```

Все должны быть:

```text
privacy-aware
user configurable
```

---

# 39. Read Receipts

Предусмотреть уровни:

```text
enabled
disabled
contacts only
per-chat
```

Не делать их обязательными.

---

# 40. Typing Indicators

Typing status — metadata.

Пользователь должен иметь возможность отключить его.

---

# 41. Contact Graph Protection

Сервер не должен получать больше информации о social graph, чем требуется архитектуре.

Проверить:

```text
who knows whom
who searched whom
who contacted whom
who is online
who belongs to which group
```

---

# 42. Search Privacy

Разделить:

```text
local search
server search
public directory search
private contact search
```

Не отправлять на сервер полный текст локального поиска без необходимости.

---

# 43. Username Privacy

Username:

- не должен быть равен email;
- не должен быть автоматически равен телефону;
- не должен содержать скрытый internal ID;
- должен иметь rate-limited discovery;
- должен защищаться от массового enumeration.

---

# 44. User Enumeration

Не позволять легко определить:

```text
does account exist?
does email belong to account?
does phone belong to account?
```

Ответы API должны минимизировать enumeration.

---

# 45. Rate Limiting

Защитить:

```text
login
registration
recovery
username search
contact discovery
message send
file upload
group creation
invite
API calls
```

Rate limits должны быть privacy-aware и не раскрывать существование аккаунта.

---

# 46. Anti-Abuse

Нужна отдельная anti-abuse архитектура, которая не превращается в mass surveillance.

Разделить:

```text
abuse prevention
content privacy
identity privacy
```

Не собирать полный behavioral profile ради антиспама.

---

# 47. Admin Access

Администратор не должен иметь магическую возможность:

```text
read all messages
read all private profiles
export all emails
export all phones
```

Административные права:

```text
least privilege
role based
audited
time limited where possible
```

---

# 48. Security Audit Log

Аудит безопасности может хранить:

```text
security event
time
internal event identifier
result
```

но не должен превращаться в полный user activity tracker.

---

# 49. Database Security

Разделить таблицы/хранилища:

```text
account identity
authentication
device keys
public profile
messages
contacts
security events
recovery
```

Не создавать единую таблицу со всеми пользовательскими данными.

---

# 50. Encryption At Rest

Защитить:

```text
databases
backups
object storage
secrets
configuration
logs
```

---

# 51. Secrets Management

Не хранить secrets:

```text
in Git
in frontend
in source code
in Docker image
in logs
in client bundle
```

Использовать централизованный secrets management.

---

# 52. Key Separation

Разные ключи для разных целей:

```text
database encryption
backup encryption
session signing
media encryption
application secrets
```

Не использовать один master secret для всего.

---

# 53. Backup Security

Backup — часть security perimeter.

Проверить:

```text
encryption
access
retention
deletion
restore permissions
audit
```

Удаление данных должно учитывать backup lifecycle.

---

# 54. Data Retention

Для каждого типа данных определить:

```text
minimum required lifetime
maximum retention
deletion trigger
backup deletion policy
```

Правило:

> Если данные не нужны — их не хранить.

---

# 55. Account Deletion

Удаление должно охватывать:

```text
profile
identity references
sessions
tokens
messages where policy permits
media
search indexes
caches
analytics records
recovery data
backups according to retention policy
```

Нельзя показывать пользователю «аккаунт удалён», если значимые данные продолжают храниться бессрочно.

---

# 56. Data Export

Если export предусмотрен:

```text
explicit user action
authentication
clear scope
secure generation
temporary download
automatic expiration
```

Не включать секреты без необходимости.

---

# 57. Data Portability

Export должен разделять:

```text
profile
contacts
messages
media
settings
security information
```

---

# 58. Browser Security

Для web client проверить:

```text
CSP
HSTS
secure cookies
SameSite
CSRF protection
XSS
clickjacking
frame policy
referrer policy
permissions policy
```

---

# 59. Frontend Security

Проверить:

```text
DOM XSS
unsafe HTML
markdown rendering
link handling
attachment preview
URL schemes
clipboard
local storage
IndexedDB
service worker
```

---

# 60. Web Storage

Не хранить sensitive secrets в:

```text
localStorage
sessionStorage
plain IndexedDB
```

если это можно заменить более защищённым механизмом.

Особенно:

```text
refresh tokens
private keys
recovery secrets
```

---

# 61. Service Worker

Если используется PWA/service worker:

```text
cache poisoning
stale sensitive data
offline cache
cache invalidation
private response caching
logout behavior
```

После logout sensitive cache должен быть очищен согласно политике.

---

# 62. Transport Security

Все обычные интернет-соединения:

```text
HTTPS
TLS
secure WebSocket
certificate validation
```

Не разрешать downgrade на небезопасный транспорт.

---

# 63. Network Metadata

Проверить, что инфраструктура не создаёт лишнюю связь:

```text
IP → account
IP → phone
IP → email
IP → message graph
```

Разделить сервисы и минимизировать retention.

---

# 64. Proxy / Relay Architecture

Если используются relay-компоненты, определить:

```text
what relay sees
what relay cannot see
how long metadata exists
whether relay can correlate users
```

Relay не должен получать plaintext E2EE content.

---

# 65. Mesh Network — Goal

Mess&Anger должен иметь возможность продолжать обмен данными при недоступности обычного internet path.

Сценарии:

```text
Internet unavailable
Central server unavailable
Temporary network partition
Local network only
Nearby devices available
Intermittent connectivity
```

Цель:

> сохранить возможность безопасной передачи сообщений без зависимости от единственного центрального endpoint.

---

# 66. Mesh Network — Security Model

Mesh нельзя считать автоматически безопасным.

Каждый промежуточный узел потенциально может:

```text
drop packets
reorder packets
replay packets
observe metadata
inject packets
attempt correlation
```

Поэтому:

```text
E2EE remains mandatory
```

даже если transport:

```text
Wi-Fi
Bluetooth
local network
peer relay
mesh node
```

---

# 67. Mesh Identity

Mesh peers должны использовать cryptographic identities, а не:

```text
phone number
email
device hostname
local IP as identity
```

---

# 68. Mesh Discovery

Discovery должен минимизировать раскрытие:

```text
identity
device information
account relationship
message metadata
```

Проверить:

```text
who can discover whom
how long discovery information remains
whether discovery can be enumerated
```

---

# 69. Mesh Trust

Не доверять промежуточному peer автоматически.

Модель:

```text
Unknown Peer
      ↓
Transport Connection
      ↓
Cryptographic Verification
      ↓
Authorized Relay
```

---

# 70. Mesh Relay

Relay должен передавать ciphertext.

Он не должен требовать plaintext.

Проверить:

```text
replay
packet injection
routing manipulation
message duplication
traffic analysis
resource exhaustion
```

---

# 71. Offline Queue

Если получатель временно недоступен:

```text
encrypted message
      ↓
secure queue
      ↓
delivery when route available
```

Queue должна иметь:

```text
expiration
size limits
encrypted storage
deduplication
replay protection
```

---

# 72. Store-and-Forward

Если mesh использует промежуточное хранение:

```text
relay stores ciphertext only
```

Определить:

```text
TTL
maximum storage
who can retrieve
authorization
deletion
```

---

# 73. Mesh Abuse Protection

Mesh может стать источником:

```text
spam
resource exhaustion
malicious routing
fake peers
message flooding
```

Предусмотреть:

```text
quotas
rate limits
peer reputation only where privacy-safe
resource limits
packet size limits
TTL
```

---

# 74. Mesh Encryption

Каждое сообщение должно оставаться защищённым независимо от количества hops:

```text
Device A
 ↓
Peer 1
 ↓
Peer 2
 ↓
Peer 3
 ↓
Device B
```

Peers не должны получать plaintext.

---

# 75. Mesh Metadata

Отдельно оценить:

```text
source
destination
hop count
timing
packet size
route
peer relationships
```

Цель:

> mesh transport не должен создавать более подробный social graph, чем обычный transport.

---

# 76. Network Switching

Клиент должен уметь выбирать:

```text
Internet
Local network
Mesh
Offline queue
```

без потери security properties.

Ключевое правило:

```text
transport changes
≠
security level changes
```

---

# 77. Network Failure

При отключении сервера:

```text
do not expose private data
do not silently downgrade encryption
do not switch to plaintext
do not disable authentication
```

---

# 78. No Silent Fallback

Запрещено:

```text
secure transport unavailable
      ↓
plaintext fallback
```

Если безопасный режим невозможен:

```text
fail closed
```

или явно сообщить пользователю о снижении уровня защиты.

---

# 79. Mesh and Website Availability

Веб-сайт и центральный сервер не должны быть единственной точкой доступа к уже установленному клиенту.

Предусмотреть:

```text
installed client
      ↓
local functionality
      ↓
cached UI
      ↓
offline/mesh transport
```

при этом не хранить в offline cache лишние sensitive данные.

---

# 80. Decentralized Bootstrap

Для mesh необходимо иметь независимый механизм первоначального обнаружения/настройки, который не требует постоянной доступности одного центрального сайта.

При этом bootstrap metadata должна быть минимальной.

---

# 81. Update Security

При отсутствии обычного internet connection приложение не должно принимать произвольные обновления от mesh peers.

Updates должны иметь:

```text
cryptographic signature
version verification
integrity verification
trusted signing key
rollback protection
```

---

# 82. Secure Update

Проверять:

```text
package signature
hash
version
publisher identity
```

Никогда не выполнять code/update только потому, что файл пришёл от trusted peer.

---

# 83. Supply Chain Security

Защитить:

```text
dependencies
build pipeline
CI/CD
package registry
signing keys
release artifacts
developer accounts
```

---

# 84. Dependency Policy

Для каждой зависимости:

```text
purpose
version
license
known vulnerabilities
maintenance
permissions
```

Регулярно выполнять:

```text
dependency audit
SBOM generation
vulnerability scanning
```

---

# 85. Secure Build

Build pipeline:

```text
source
 ↓
review
 ↓
tests
 ↓
security scan
 ↓
build
 ↓
sign
 ↓
publish
```

Signing keys не должны находиться в обычном developer environment.

---

# 86. Secrets in Client

Нельзя считать secret, встроенный в frontend/mobile binary, настоящим secret.

Запрещено помещать в client:

```text
server master key
database password
private signing key
admin secret
API secret with privileged access
```

---

# 87. Admin Panel

Admin panel:

```text
MFA
least privilege
IP/network policy where appropriate
audit
session timeout
reauthentication for critical actions
```

---

# 88. Dangerous Admin Actions

Для:

```text
account deletion
bulk export
security configuration
key rotation
server shutdown
backup access
```

требовать повышенную авторизацию и подтверждение.

---

# 89. Security Headers

Для web application проверить:

```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
frame-ancestors
```

---

# 90. CORS

CORS должен быть explicit.

Не использовать:

```text
Access-Control-Allow-Origin: *
```

для authenticated private APIs.

---

# 91. CSRF

Для cookie-based authentication:

```text
SameSite
CSRF tokens
origin validation
```

---

# 92. XSS

Особенно проверить:

```text
messages
usernames
bios
group names
channel names
file names
link previews
markdown
HTML
```

Все пользовательские данные должны рассматриваться как untrusted input.

---

# 93. SSRF

Особенно опасные зоны:

```text
URL previews
webhooks
remote media
importers
external integrations
```

Запретить доступ backend к внутренним network targets.

---

# 94. File Upload Security

Проверить:

```text
MIME spoofing
extension spoofing
malicious files
polyglot files
oversized files
zip bombs
path traversal
SVG/script injection
```

---

# 95. Image Processing

Media processing выполняется в изолированной среде.

Не доверять:

```text
filename
MIME
dimensions
metadata
embedded content
```

---

# 96. Search / Index Security

Search index не должен создавать новый plaintext leak.

Если локальный search:

```text
encrypted local database
```

Если server-side search:

```text
explicitly define privacy model
```

---

# 97. Backups and E2EE

Определить, что происходит с:

```text
encrypted messages
device keys
account recovery
media
```

при backup.

Нельзя незаметно превратить E2EE в:

```text
server-readable backup
```

---

# 98. Device Loss

При потере устройства:

```text
revoke device
rotate sessions
invalidate tokens
protect local encrypted storage
```

Другие устройства должны оставаться управляемыми.

---

# 99. New Device

При добавлении нового устройства:

```text
authenticate
verify device
establish keys
authorize
notify user
```

Не доверять новому устройству только по email/phone.

---

# 100. Security Notifications

Показывать:

```text
new device
key change
session revoked
recovery changed
security setting changed
```

без раскрытия лишних данных.

---

# 101. Key Verification

Для чувствительных коммуникаций предусмотреть:

```text
safety number / fingerprint
QR verification
device verification
key change warning
```

---

# 102. Key Change

Если identity key изменился:

```text
notify user
show verification state
do not silently trust
```

---

# 103. Account Compromise

Предусмотреть сценарий:

```text
token stolen
device stolen
password compromised
session hijacked
key compromised
```

для каждого определить:

```text
detection
containment
revocation
recovery
notification
```

---

# 104. Abuse Reporting vs Privacy

Если пользователь жалуется на сообщение, не нужно автоматически превращать всю систему в plaintext surveillance.

Разделить:

```text
user-initiated report
message content voluntarily submitted
security metadata
abuse prevention
```

Пользователь должен явно понимать, что именно отправляется при report.

---

# 105. Blocks

Block должен работать локально и серверно настолько, насколько это возможно.

Проверить:

```text
message delivery
presence
search
contact discovery
group interactions
notifications
mesh relay behavior
```

---

# 106. Groups

В группах определить:

```text
member identity
admin identity
membership metadata
invite privacy
history access
removed member access
```

Удалённый участник не должен автоматически сохранять право получать новые сообщения.

---

# 107. Group Key Management

Для групп необходимо отдельное управление ключами:

```text
member join
member leave
member removal
admin change
key rotation
```

---

# 108. Channels

Публичный канал и приватный чат имеют разные privacy models.

Документировать:

```text
what is public
what is private
what server sees
what subscribers see
```

---

# 109. Calls

Для calls проверить:

```text
E2EE
signaling metadata
IP exposure
relay behavior
recording
screensharing
call history
```

Особенно:

> прямое peer-to-peer соединение может раскрывать сетевую информацию, поэтому transport architecture должна учитывать privacy requirements.

---

# 110. Voice / Video Recording

По умолчанию:

```text
no automatic recording
no hidden recording
no server-side recording
```

если recording вообще существует — явное действие и понятный indicator.

---

# 111. Local Security Settings

Добавить отдельный раздел:

```text
Privacy
Security
Devices
Sessions
Encryption
Notifications
Data
Network
Mesh
```

---

# 112. Privacy Dashboard

Пользователь должен видеть:

```text
What data Mess&Anger stores
What data is public
What data is private
What data is shared
What services receive data
How long data is retained
```

---

# 113. Privacy Controls

Пользовательские настройки:

```text
Email visibility
Phone visibility
Online status
Last seen
Read receipts
Typing indicator
Message previews
Contact discovery
Search discoverability
Media metadata
Link previews
Analytics
Crash reports
Mesh participation
Relay participation
```

---

# 114. Privacy Defaults

Default configuration должна быть privacy-first.

```text
email        = private
phone        = private
profile      = minimal
analytics    = minimal / disabled where possible
previews     = hidden
presence     = limited
contact sync = disabled until needed
mesh relay   = explicit user choice
```

---

# 115. Permission Design

Каждое разрешение должно иметь:

```text
why needed
when needed
what happens if denied
```

Не запрашивать всё при первом запуске.

---

# 116. Camera / Microphone / Contacts

Permissions запрашивать контекстно:

```text
camera → when taking photo
microphone → when recording
contacts → when enabling contact discovery
```

---

# 117. Contact Permission

Если пользователь не дал доступ к контактам:

```text
messenger remains usable
```

Не блокировать основной messaging functionality.

---

# 118. Mesh Permissions

Для mesh могут потребоваться platform-specific permissions.

Запрашивать только необходимые.

Пользователь должен понимать:

```text
mesh enabled
mesh disabled
relay enabled
relay disabled
```

---

# 119. Local Network Privacy

Если приложение обнаруживает peers в локальной сети:

```text
do not collect unnecessary network inventory
do not fingerprint unrelated devices
do not retain unnecessary peer metadata
```

---

# 120. Mesh Relay Opt-in

Участие устройства в relay должно быть:

```text
explicit
visible
controllable
revocable
resource-limited
```

Пользователь должен понимать:

```text
battery impact
traffic impact
storage impact
privacy implications
```

---

# 121. Mesh Resource Limits

Ограничить:

```text
CPU
RAM
storage
bandwidth
queue size
peer count
connection count
TTL
```

---

# 122. Mesh Offline Security

Offline не означает:

```text
security disabled
```

Даже без центрального сервера должны сохраняться:

```text
authentication
encryption
integrity
replay protection
access control
```

---

# 123. Central Server Failure

При недоступности центрального сервера:

```text
existing local data remains available
encrypted messages remain protected
mesh transport can continue where supported
client does not downgrade security
```

---

# 124. Website Failure

Если website unavailable:

```text
installed clients continue functioning according to available transport
```

При этом web client естественно зависит от доступности его delivery infrastructure; native/offline client architecture должна учитывать это отдельно.

---

# 125. Emergency / Partition Mode

Предусмотреть понятный режим:

```text
ONLINE
DEGRADED
OFFLINE
MESH
SYNCING
```

Пользователь должен видеть, каким транспортом сейчас отправляется сообщение.

---

# 126. Transport Indicator

Например:

```text
Internet
Local
Mesh
Queued
Delivered
```

Не раскрывать пользователю лишнюю сетевую информацию.

---

# 127. Message Delivery Guarantees

Чётко определить:

```text
sent
accepted locally
queued
relayed
delivered
read
```

Не путать эти состояния.

---

# 128. Security UX

Нельзя показывать:

```text
green shield = "100% anonymous"
```

если система этого не гарантирует.

Лучше:

```text
End-to-end encrypted
Private profile
Mesh transport
```

с пояснением модели.

---

# 129. Transparency

Создать security documentation:

```text
Threat Model
Privacy Model
Encryption Model
Metadata Model
Mesh Security Model
Data Retention
Third-party Services
Recovery Model
Incident Response
```

---

# 130. Open Security Architecture

Публично документировать:

```text
cryptographic protocol
key lifecycle
threat model
data lifecycle
privacy guarantees
limitations
```

Секретом должен быть ключ, а не принцип работы системы.

---

# 131. Security Testing

Обязательные категории:

```text
SAST
DAST
dependency scanning
secret scanning
container scanning
API security testing
XSS testing
CSRF testing
SSRF testing
authentication testing
authorization testing
rate-limit testing
file upload testing
crypto protocol review
mesh protocol testing
```

---

# 132. Fuzzing

Фаззить:

```text
message parser
packet parser
file parser
media parser
protocol messages
mesh packets
serialization
WebSocket frames
```

---

# 133. Penetration Testing

Проводить отдельно:

```text
Web
API
Mobile
Backend
Infrastructure
Mesh
Admin
Authentication
```

---

# 134. Cryptographic Audit

Криптографическая часть должна пройти независимый review.

Проверить:

```text
protocol design
key exchange
key storage
key rotation
forward secrecy
authentication
replay protection
randomness
implementation
```

---

# 135. Mesh Security Audit

Отдельно проверять:

```text
peer discovery
peer authentication
relay
routing
store-and-forward
packet replay
packet injection
traffic analysis
DoS
privacy leakage
```

---

# 136. Privacy Audit

Отдельно проверять:

```text
email leakage
phone leakage
IP retention
analytics
logs
crash reports
notifications
metadata
contact discovery
third-party SDKs
CDN
backups
```

---

# 137. API Security Audit

Проверить каждый endpoint:

```text
authentication
authorization
input validation
output minimization
rate limiting
enumeration
logging
data exposure
```

---

# 138. Security Headers / Browser Audit

Проверить production:

```text
TLS
HSTS
CSP
CORS
cookies
CSRF
permissions
iframe policy
referrer policy
```

---

# 139. Incident Response

Создать план:

```text
detect
contain
revoke
rotate
notify
recover
investigate
document
prevent recurrence
```

---

# 140. Key Compromise Response

Если signing key или cryptographic infrastructure compromised:

```text
emergency rotation
revoke compromised key
publish trusted replacement
client update
incident notification
```

---

# 141. Vulnerability Disclosure

Создать:

```text
security contact
responsible disclosure policy
severity classification
response SLA
security advisory process
```

---

# 142. Security Severity

```text
S0 — catastrophic
S1 — critical
S2 — high
S3 — medium
S4 — low
```

Примеры S0:

```text
server can decrypt all E2EE messages
private keys exposed
mass email/phone leak
authentication bypass affecting all accounts
```

---

# 143. Security Regression

После каждого изменения security-critical component проверять:

```text
authentication
authorization
encryption
key handling
privacy
logging
notifications
mesh
offline
```

---

# 144. Dependency Update Policy

Не обновлять security-sensitive dependencies вслепую.

Pipeline:

```text
new version
 ↓
automated tests
 ↓
security scan
 ↓
compatibility
 ↓
review
 ↓
release
```

---

# 145. Production Hardening

Перед production:

```text
debug disabled
verbose logs disabled
test accounts removed
development endpoints disabled
source maps policy reviewed
admin endpoints protected
secrets rotated
TLS verified
security headers enabled
rate limits enabled
backup encryption verified
```

---

# 146. Privacy QA Checklist

```text
[ ] email нигде не раскрывается без необходимости
[ ] phone нигде не раскрывается без необходимости
[ ] email не является public username
[ ] phone не является public username
[ ] contact list не загружается целиком
[ ] analytics не собирает message content
[ ] crash report не содержит secrets
[ ] logs не содержат tokens
[ ] logs не содержат plaintext messages
[ ] notifications не раскрывают текст по умолчанию
[ ] media metadata контролируется
[ ] link previews privacy-safe
[ ] account enumeration ограничен
[ ] profile data минимально
```

---

# 147. E2EE QA Checklist

```text
[ ] server не видит plaintext сообщений
[ ] private keys не покидают защищённое хранилище
[ ] keys rotate
[ ] forward secrecy предусмотрена
[ ] replay protection
[ ] integrity protection
[ ] device verification
[ ] key change warnings
[ ] group key lifecycle
[ ] secure attachment encryption
[ ] encrypted offline queue
```

---

# 148. Mesh QA Checklist

```text
[ ] работает без central server where designed
[ ] работает при временной потере internet
[ ] ciphertext сохраняет E2EE
[ ] peer не видит plaintext
[ ] peer authentication
[ ] replay protection
[ ] packet injection protection
[ ] queue TTL
[ ] storage limits
[ ] bandwidth limits
[ ] peer limits
[ ] relay opt-in
[ ] no silent plaintext fallback
[ ] secure update verification
```

---

# 149. Data Lifecycle Checklist

Для каждого поля:

```text
CREATE
 ↓
USE
 ↓
STORE
 ↓
SHARE
 ↓
CACHE
 ↓
BACKUP
 ↓
DELETE
```

Если для поля невозможно объяснить весь lifecycle:

```text
data design is not complete
```

---

# 150. Data Inventory

Создать таблицу:

| Data | Collected? | Required? | Public? | Encrypted? | Stored Where? | Retention | Third Party? | Delete Path |
|---|---|---|---|---|---|---|---|---|
| Email | No/Minimal | Optional | No | Yes | Recovery subsystem | Minimal | No/Explicit | Yes |
| Phone | No/Minimal | Optional | No | Yes | Verification subsystem | Minimal | No/Explicit | Yes |
| Message | Yes | Yes | No | E2EE | Ciphertext storage | Policy | No | Yes |
| IP | Minimal | Transport | No | N/A | Minimal logs | Short | Infrastructure only | Yes |
| Contacts | Local by default | No | No | Local protection | Device | User-controlled | No | Yes |
| Device key | Yes | Yes | No | Protected | Device | Account lifecycle | No | Revocation |

Эта таблица должна стать обязательной частью security documentation.

---

# 151. Privacy Budget

Для каждой функции определить:

```text
minimum data required
```

Пример:

```text
send message
→ recipient identity + ciphertext
```

а не:

```text
recipient identity
+ phone
+ email
+ location
+ device fingerprint
+ behavioral history
```

---

# 152. Least Data Principle

Правило:

> Если функция работает без данных — не собирать данные.

Если функция работает с локальными данными:

> не отправлять их на сервер.

Если серверу нужен только результат:

> не передавать исходный набор данных.

---

# 153. Least Privilege

Каждый:

```text
user
device
service
microservice
admin
relay
database
```

получает только необходимые права.

---

# 154. Service Isolation

Разделить:

```text
auth service
profile service
message service
media service
recovery service
notification service
mesh service
admin service
```

так, чтобы компрометация одного компонента не раскрывала всё сразу.

---

# 155. Blast Radius

Для каждого компонента определить:

```text
what happens if compromised?
```

Цель:

```text
one compromised component
      ↓
limited data exposure
```

---

# 156. Privacy-Preserving Error Handling

Пользовательские ошибки:

```text
generic enough to avoid enumeration
specific enough to be useful
```

Не показывать:

```text
"Email user@example.com already exists"
```

если это позволяет account enumeration.

---

# 157. Secure UX Copy

В интерфейсе избегать ложных обещаний:

```text
❌ "Вы полностью невидимы"
❌ "Никто никогда не сможет вас отследить"
❌ "100% anonymous"
```

Использовать проверяемые утверждения:

```text
✓ Email скрыт от других пользователей
✓ Сообщения имеют сквозное шифрование
✓ Профиль приватен по умолчанию
✓ Mesh transport поддерживается
```

---

# 158. Security Settings UX

Настройки должны объяснять последствия.

Например:

```text
Last seen
[ Nobody ]

Read receipts
[ Off ]

Message preview
[ Hidden ]

Mesh relay
[ Off ]
```

Каждая настройка должна иметь краткое объяснение.

---

# 159. Security Onboarding

Первый запуск:

```text
Privacy-first defaults
↓
Explain identity
↓
Explain encryption
↓
Explain recovery
↓
Explain mesh
↓
Optional permissions
```

Не перегружать пользователя техническими терминами.

---

# 160. Recovery vs Anonymity Matrix

Создать явную матрицу:

| Capability | Privacy | Recovery | Trade-off |
|---|---|---|---|
| No PII account | High | Lower | Loss of recovery path |
| Email recovery | Medium/High | High | Email exists in recovery system |
| Phone recovery | Medium | High | Phone exists in verification system |
| Device-only keys | Very High | Lower | Device loss risk |
| Multi-device recovery | Depends | High | More key-management complexity |

Главное:

> пользователь должен понимать компромисс, а архитектура — не выдавать recovery identity как public identity.

---

# 161. Security Architecture Diagram

Целевая логика:

```text
                         ┌─────────────────────┐
                         │      CLIENT        │
                         │                     │
                         │ Identity Keys       │
                         │ Private Profile     │
                         │ Local Messages      │
                         │ Local Contacts      │
                         └──────────┬──────────┘
                                    │
                              E2EE ciphertext
                                    │
                   ┌────────────────┴────────────────┐
                   │                                 │
             INTERNET PATH                       MESH PATH
                   │                                 │
             ┌─────▼─────┐                    ┌──────▼──────┐
             │   Relay   │                    │ Mesh Peer   │
             └─────┬─────┘                    └──────┬──────┘
                   │                                 │
                   └──────────────┬──────────────────┘
                                  │
                           ┌──────▼──────┐
                           │   SERVER    │
                           │             │
                           │ Ciphertext  │
                           │ Minimal Meta│
                           │ No PII Leak │
                           └─────────────┘
```

---

# 162. Target Security Architecture

```text
                 USER
                  │
          ┌───────▼────────┐
          │ Local Identity  │
          │ Private Keys    │
          └───────┬────────┘
                  │
             E2E Encryption
                  │
        ┌─────────┴─────────┐
        │                   │
     INTERNET              MESH
        │                   │
      RELAYS              PEERS
        │                   │
        └─────────┬─────────┘
                  │
              SERVER
                  │
       ┌──────────┴──────────┐
       │                     │
  Ciphertext             Minimal metadata
       │                     │
       └──────────┬──────────┘
                  │
              Recipient
```

---

# 163. Implementation Phases

## Phase 1 — Threat Model

```text
[ ] threat model
[ ] data inventory
[ ] trust boundaries
[ ] attack surface
[ ] security assumptions
```

## Phase 2 — Identity

```text
[ ] account identity
[ ] messaging identity
[ ] device identity
[ ] public identity
[ ] email isolation
[ ] phone isolation
```

## Phase 3 — Cryptography

```text
[ ] protocol selection
[ ] key lifecycle
[ ] E2EE
[ ] forward secrecy
[ ] device verification
[ ] group keys
```

## Phase 4 — Backend Security

```text
[ ] auth
[ ] authorization
[ ] API minimization
[ ] logging
[ ] retention
[ ] database security
[ ] secrets
```

## Phase 5 — Client Security

```text
[ ] secure storage
[ ] local DB encryption
[ ] token protection
[ ] notification privacy
[ ] cache security
[ ] service worker
```

## Phase 6 — Privacy

```text
[ ] analytics audit
[ ] crash report audit
[ ] contact discovery
[ ] metadata minimization
[ ] media metadata
[ ] link previews
```

## Phase 7 — Mesh

```text
[ ] transport abstraction
[ ] peer identity
[ ] discovery
[ ] E2EE over mesh
[ ] relay
[ ] offline queue
[ ] store-and-forward
[ ] replay protection
[ ] resource limits
```

## Phase 8 — Hardening

```text
[ ] SAST
[ ] DAST
[ ] fuzzing
[ ] dependency scan
[ ] secret scan
[ ] penetration testing
[ ] crypto review
[ ] mesh review
```

## Phase 9 — Production

```text
[ ] secure build
[ ] signing
[ ] secrets rotation
[ ] production hardening
[ ] incident response
[ ] vulnerability disclosure
```

---

# 164. Security Priority

```text
S0
Cryptographic failure
Mass identity leak
Mass message plaintext exposure
Authentication bypass

S1
Email/phone mass leakage
Private key exposure
Account takeover
Authorization bypass
Mesh trust bypass

S2
Metadata leakage
Session weakness
Storage leakage
Privacy configuration bypass

S3
Minor information disclosure
Weak security UX
Non-critical logging issues

S4
Documentation
UI polish
Minor hardening
```

---

# 165. Definition of Done — Privacy

```text
[ ] email private
[ ] phone private
[ ] no unnecessary PII collection
[ ] no unnecessary third-party sharing
[ ] minimal logs
[ ] minimal analytics
[ ] contact discovery privacy reviewed
[ ] metadata minimized
[ ] notifications privacy-safe
[ ] media metadata controlled
[ ] deletion lifecycle documented
```

---

# 166. Definition of Done — Encryption

```text
[ ] E2EE implemented
[ ] audited cryptographic library/protocol
[ ] private keys protected
[ ] forward secrecy
[ ] key rotation
[ ] device verification
[ ] replay protection
[ ] group key lifecycle
[ ] encrypted attachments
[ ] encrypted offline queue
```

---

# 167. Definition of Done — Mesh

```text
[ ] central server is not sole transport dependency
[ ] offline/partition behavior defined
[ ] peer authentication
[ ] ciphertext through relay
[ ] no plaintext fallback
[ ] store-and-forward secured
[ ] TTL
[ ] quotas
[ ] peer limits
[ ] secure update verification
[ ] relay participation is controllable
```

---

# 168. Definition of Done — Infrastructure

```text
[ ] TLS
[ ] secure headers
[ ] CORS
[ ] CSRF
[ ] CSP
[ ] secrets management
[ ] database isolation
[ ] backup encryption
[ ] admin MFA
[ ] least privilege
[ ] audit
```

---

# 169. Definition of Done — Incident Response

```text
[ ] security contact
[ ] vulnerability disclosure
[ ] severity matrix
[ ] incident playbook
[ ] key rotation procedure
[ ] session revocation
[ ] user notification
[ ] forensic procedure
[ ] recovery procedure
```

---

# 170. Final Security Principle

Mess&Anger не должен строиться по принципу:

```text
"Мы соберём данные, но обещаем их не использовать."
```

Целевая модель:

```text
"Мы не собираем данные, которые нам не нужны."
```

И:

```text
"Мы не раскрываем данные, которые пользователь не разрешил раскрывать."
```

И:

```text
"Мы не полагаемся на центральный сервер как на единственный способ безопасного обмена сообщениями."
```

И:

```text
"Смена transport layer не должна снижать уровень криптографической защиты."
```

---

# 171. Final Security Checklist

```text
IDENTITY
[ ] email private
[ ] phone private
[ ] public identity separate
[ ] device identity separate
[ ] account enumeration protected

DATA
[ ] data minimization
[ ] retention policy
[ ] deletion policy
[ ] backup policy
[ ] third-party inventory

MESSAGES
[ ] E2EE
[ ] forward secrecy
[ ] key rotation
[ ] replay protection
[ ] encrypted attachments
[ ] secure local storage

METADATA
[ ] IP minimization
[ ] timestamp minimization
[ ] presence controls
[ ] typing controls
[ ] read receipt controls
[ ] contact graph minimization

CLIENT
[ ] secure key storage
[ ] token security
[ ] cache security
[ ] notification privacy
[ ] service worker security
[ ] screenshot policy

SERVER
[ ] least privilege
[ ] no plaintext message access
[ ] minimal logs
[ ] encrypted storage
[ ] secret management
[ ] admin MFA

WEB
[ ] CSP
[ ] HSTS
[ ] CORS
[ ] CSRF
[ ] XSS
[ ] SSRF
[ ] secure cookies

MESH
[ ] peer identity
[ ] peer authentication
[ ] E2EE
[ ] relay security
[ ] offline queue
[ ] store-and-forward
[ ] replay protection
[ ] DoS limits
[ ] resource limits
[ ] no plaintext fallback
[ ] signed updates

PROCESS
[ ] threat model
[ ] security audit
[ ] crypto review
[ ] penetration test
[ ] fuzzing
[ ] dependency scanning
[ ] incident response
[ ] vulnerability disclosure
```

---

# 172. Final Product Security Target

Итоговая архитектура Mess&Anger должна стремиться к следующей модели:

```text
                 MESS&ANGER
                     │
       ┌─────────────┼─────────────┐
       │             │             │
    PRIVACY       SECURITY       RESILIENCE
       │             │             │
   No PII leak     E2EE          Internet
   Minimal data    Key safety    unavailable
   Minimal logs    Auth          Server unavailable
   Private profile Forward       Mesh
   No unnecessary  secrecy       Offline queue
   tracking        Integrity     Store-forward
       │             │             │
       └─────────────┼─────────────┘
                     │
              USER CONTROL
                     │
        ┌────────────┼────────────┐
        │            │            │
     Identity     Privacy       Network
        │            │            │
     private      private       selectable
     public       by default    secure
```

Главная архитектурная формула:

```text
MINIMUM DATA
+
PRIVATE IDENTITY
+
E2EE
+
METADATA MINIMIZATION
+
SECURE KEY MANAGEMENT
+
LEAST PRIVILEGE
+
NO UNNECESSARY THIRD PARTIES
+
SECURE OFFLINE STORAGE
+
MESH RESILIENCE
+
NO SECURITY DOWNGRADE
+
INDEPENDENT SECURITY AUDITS
=
MESS&ANGER SECURITY BASELINE
```

Этот документ должен использоваться как master security plan перед реализацией функций, а не как декларация абсолютной анонимности. Каждое заявленное privacy/security свойство должно иметь техническую реализацию, тест и проверяемый критерий готовности.
