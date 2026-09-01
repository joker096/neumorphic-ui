# Mess&Anger — Integration Architecture

> Назначение: техническая архитектура интеграционного слоя Mess&Anger для CRM, 1С, файлового импорта и внешних API.
>
> Статус: Architecture Blueprint
>
> Версия: 1.0
>
> Принцип: сначала стабильное одностороннее подключение и импорт, затем incremental sync, webhooks и только после этого полноценная двусторонняя синхронизация.

---

# 0. Архитектурные цели

Mess&Anger должен иметь отдельный Integration Hub, который не зависит от конкретной CRM.

Целевая схема:

```text
                    ┌─────────────────────────┐
                    │       Mess&Anger        │
                    │ Messenger + CRM + Files │
                    └────────────┬────────────┘
                                 │
                         Integration Hub
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
   Connector Layer         Sync Engine              Import Engine
        │                        │                        │
 ┌──────┼─────────┐       ┌──────┼──────┐         ┌──────┼──────┐
 │      │         │       │      │      │         │      │      │
 1C   amoCRM  Bitrix24   Webhook Polling Queue    CSV   XLSX   REST
```

Основная архитектурная идея:

```text
External Provider
       ↓
Provider Connector
       ↓
Provider Adapter
       ↓
Canonical Model
       ↓
Validation / Normalization
       ↓
Identity / Deduplication
       ↓
Import / Sync Engine
       ↓
Mess&Anger Domain
```

Обратный поток:

```text
Mess&Anger Domain
       ↓
Domain Event
       ↓
Sync Engine
       ↓
Canonical Model
       ↓
Provider Adapter
       ↓
Provider Connector
       ↓
External Provider
```

---

# 1. Архитектурные правила

## 1.1. CRM никогда не должна попадать непосредственно во frontend

Нельзя:

```text
React
  ↓
amoCRM API
```

Правильно:

```text
React
  ↓
Mess&Anger API
  ↓
Integration Service
  ↓
amoCRM
```

## 1.2. Credentials только backend

Frontend никогда не получает:

- client_secret;
- refresh_token;
- API secret;
- webhook secret;
- внутренние integration credentials.

## 1.3. Внешний API не должен определять внутреннюю модель Mess&Anger

Нельзя строить внутреннюю БД вокруг структуры одного provider.

Например:

```text
amoCRM lead
```

не должен становиться основой внутренней сущности `deal`.

Нужна canonical model.

## 1.4. Любая массовая операция асинхронная

Импорт 100 000 записей не должен выполняться внутри одного HTTP request.

```text
HTTP request
    ↓
Create job
    ↓
Queue
    ↓
Workers
```

---

# 2. Слои системы

```text
┌───────────────────────────────────────────────────────────┐
│                         FRONTEND                          │
│ Integrations UI / Import Wizard / Mapping / Logs / CRM  │
└──────────────────────────┬────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼────────────────────────────────┐
│                         API GATEWAY                        │
│ Auth / RBAC / Tenant / Rate Limit / Validation            │
└──────────────────────────┬────────────────────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────┐
│                    INTEGRATION SERVICE                     │
│ Manager / Connectors / Mapping / Sync / Webhooks          │
└──────────────┬───────────┬───────────────┬────────────────┘
               │           │               │
               ▼           ▼               ▼
          PostgreSQL     Queue          Object Storage
               │           │
               │           ▼
               │        Workers
               │           │
               ▼           ▼
        Integration DB   Providers
```

---

# 3. Frontend Architecture

Рекомендуемая структура:

```text
src/
├── app/
├── components/
├── pages/
│   └── integrations/
│       ├── IntegrationsPage.tsx
│       ├── IntegrationDetailsPage.tsx
│       ├── IntegrationConnectPage.tsx
│       ├── ImportWizardPage.tsx
│       ├── MappingPage.tsx
│       ├── SyncPage.tsx
│       ├── ConflictsPage.tsx
│       ├── LogsPage.tsx
│       └── ErrorsPage.tsx
│
├── features/
│   └── integrations/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── types/
│       └── utils/
│
└── ui/
```

---

# 4. Integration UI

Главный раздел:

```text
Settings
└── Integrations
```

Главный экран:

```text
Integrations

Connected
────────────────────────

● amoCRM       Connected
● 1C           Syncing
● Bitrix24     Warning

Available
────────────────────────

[ + Connect CRM ]
[ + Connect 1C ]
[ Import CSV ]
[ Import Excel ]
[ Custom REST API ]
```

---

# 5. Integration Details UI

```text
Overview
Connection
Data
Mapping
Synchronization
Conflicts
Errors
Logs
Permissions
Advanced
```

## Overview

Показывать:

- provider;
- account;
- status;
- last sync;
- next sync;
- records;
- errors;
- conflicts;
- health.

---

# 6. Import Wizard

Шаги:

```text
1. Source
2. Authentication
3. Entities
4. Mapping
5. Validation
6. Preview
7. Dry Run
8. Confirmation
9. Import
10. Result
```

Нельзя пропускать Preview для массового импорта.

---

# 7. Backend Project Structure

Рекомендуемая структура:

```text
backend/
├── src/
│   ├── app/
│   │   ├── server.ts
│   │   ├── config.ts
│   │   └── routes.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── organizations/
│   │   ├── users/
│   │   ├── contacts/
│   │   ├── companies/
│   │   ├── deals/
│   │   ├── tasks/
│   │   ├── conversations/
│   │   └── messages/
│   │
│   └── integrations/
│       ├── core/
│       │   ├── IntegrationManager.ts
│       │   ├── Connector.ts
│       │   ├── ConnectorRegistry.ts
│       │   ├── IntegrationContext.ts
│       │   └── IntegrationErrors.ts
│       │
│       ├── canonical/
│       │   ├── Contact.ts
│       │   ├── Company.ts
│       │   ├── Deal.ts
│       │   ├── Task.ts
│       │   ├── Product.ts
│       │   └── Activity.ts
│       │
│       ├── mapping/
│       │   ├── MappingEngine.ts
│       │   ├── TransformEngine.ts
│       │   └── MappingValidator.ts
│       │
│       ├── identity/
│       │   ├── ExternalIdentityService.ts
│       │   ├── DeduplicationService.ts
│       │   └── MergeService.ts
│       │
│       ├── sync/
│       │   ├── SyncEngine.ts
│       │   ├── SyncStateService.ts
│       │   ├── ConflictResolver.ts
│       │   ├── ReconciliationService.ts
│       │   └── ChangeDetector.ts
│       │
│       ├── import/
│       │   ├── ImportService.ts
│       │   ├── ImportPreviewService.ts
│       │   ├── ImportValidator.ts
│       │   └── ImportCheckpoint.ts
│       │
│       ├── queue/
│       │   ├── JobQueue.ts
│       │   ├── JobWorker.ts
│       │   ├── RetryPolicy.ts
│       │   └── DeadLetterQueue.ts
│       │
│       ├── webhooks/
│       │   ├── WebhookReceiver.ts
│       │   ├── WebhookVerifier.ts
│       │   └── WebhookProcessor.ts
│       │
│       ├── providers/
│       │   ├── amocrm/
│       │   ├── bitrix24/
│       │   ├── onec/
│       │   ├── hubspot/
│       │   ├── salesforce/
│       │   ├── csv/
│       │   ├── excel/
│       │   └── rest/
│       │
│       ├── security/
│       │   ├── CredentialVault.ts
│       │   ├── TokenService.ts
│       │   └── SecretRedactor.ts
│       │
│       └── observability/
│           ├── IntegrationLogger.ts
│           ├── Metrics.ts
│           └── HealthService.ts
│
├── workers/
│   ├── import.worker.ts
│   ├── sync.worker.ts
│   ├── webhook.worker.ts
│   └── reconciliation.worker.ts
│
└── tests/
    ├── integration/
    ├── connectors/
    ├── mapping/
    ├── sync/
    └── deduplication/
```

---

# 8. Canonical Domain Model

Минимальные сущности:

```text
Contact
Company
Lead
Deal
Task
Product
Order
Invoice
Activity
Comment
Note
File
User
Pipeline
Stage
Tag
CustomField
Conversation
Message
```

---

# 9. Contact

```ts
type Contact = {
  id: string;
  organizationId: string;

  firstName?: string;
  lastName?: string;
  displayName?: string;

  phones: Phone[];
  emails: Email[];

  companyId?: string;
  ownerId?: string;

  tags: string[];
  customFields: Record<string, unknown>;

  createdAt: string;
  updatedAt: string;
};
```

---

# 10. Company

```ts
type Company = {
  id: string;
  organizationId: string;

  name: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;

  phones: Phone[];
  emails: Email[];

  address?: Address;

  ownerId?: string;
  tags: string[];

  customFields: Record<string, unknown>;

  createdAt: string;
  updatedAt: string;
};
```

---

# 11. Deal

```ts
type Deal = {
  id: string;
  organizationId: string;

  title: string;
  amount?: number;
  currency?: string;

  contactId?: string;
  companyId?: string;

  pipelineId?: string;
  stageId?: string;

  ownerId?: string;

  tags: string[];
  customFields: Record<string, unknown>;

  createdAt: string;
  updatedAt: string;
};
```

---

# 12. External Identity

Таблица:

```text
integration_external_ids
```

Поля:

```text
id
organization_id
integration_id
entity_type
external_id
internal_id
external_updated_at
last_synced_at
content_hash
created_at
updated_at
```

Уникальный индекс:

```text
integration_id
+
entity_type
+
external_id
```

---

# 13. Integration

Таблица:

```text
integrations
```

Поля:

```text
id
organization_id
provider
name
status
mode
sync_direction
config
created_at
updated_at
```

Пример:

```json
{
  "provider": "amocrm",
  "status": "connected",
  "mode": "production",
  "syncDirection": "inbound"
}
```

---

# 14. Credentials

Отдельная таблица:

```text
integration_credentials
```

Никогда не хранить секреты в `integrations.config`.

Поля:

```text
id
integration_id
credential_type
encrypted_value
expires_at
created_at
rotated_at
```

---

# 15. Mapping

Таблица:

```text
integration_mappings
```

```text
id
integration_id
entity_type
source_field
target_field
transform
default_value
required
enabled
created_at
updated_at
```

Пример:

```json
{
  "entity": "contact",
  "source": "PHONE",
  "target": "phones",
  "transform": "normalizePhone"
}
```

---

# 16. Mapping Engine

Интерфейс:

```ts
interface MappingEngine {
  map(
    source: unknown,
    mapping: MappingDefinition
  ): CanonicalEntity;
}
```

Transform pipeline:

```text
Source
 ↓
Read field
 ↓
Transform
 ↓
Normalize
 ↓
Validate
 ↓
Canonical
```

---

# 17. Transform Functions

Базовые:

```text
normalizePhone
normalizeEmail
trim
lowercase
uppercase
parseDate
parseNumber
join
split
mapEnum
default
conditional
```

---

# 18. Connector Interface

```ts
interface Connector {
  provider: string;

  connect(context: IntegrationContext): Promise<void>;

  testConnection(
    context: IntegrationContext
  ): Promise<ConnectionTestResult>;

  getCapabilities():
    Promise<ConnectorCapabilities>;

  list(
    entity: EntityType,
    options: ListOptions
  ): Promise<PageResult>;

  get(
    entity: EntityType,
    externalId: string
  ): Promise<ExternalRecord>;

  create(
    entity: EntityType,
    data: CanonicalEntity
  ): Promise<ExternalRecord>;

  update(
    entity: EntityType,
    externalId: string,
    data: CanonicalEntity
  ): Promise<ExternalRecord>;

  delete?(
    entity: EntityType,
    externalId: string
  ): Promise<void>;

  getChanges?(
    cursor: string
  ): Promise<ChangePage>;

  subscribeWebhooks?(): Promise<void>;
}
```

---

# 19. Connector Capabilities

Каждый provider сообщает:

```json
{
  "contacts": {
    "read": true,
    "create": true,
    "update": true,
    "delete": false
  },
  "deals": {
    "read": true,
    "create": true,
    "update": true,
    "delete": false
  },
  "webhooks": true,
  "incrementalSync": true
}
```

UI автоматически скрывает неподдерживаемые возможности.

---

# 20. Provider Adapter

Разделить:

```text
Connector
Adapter
Canonical Model
```

Например:

```text
AmoConnector
     ↓
AmoAdapter
     ↓
Canonical Contact
```

Adapter отвечает за особенности конкретного API.

---

# 21. Connector Registry

```ts
class ConnectorRegistry {
  register(connector: Connector): void;

  get(provider: string): Connector;

  has(provider: string): boolean;

  list(): Connector[];
}
```

Добавление новой CRM:

```text
create connector
→ implement interface
→ register connector
→ add tests
```

---

# 22. Import Job

Таблица:

```text
integration_jobs
```

Поля:

```text
id
organization_id
integration_id
type
entity_type
status
total
processed
created
updated
duplicates
errors
started_at
completed_at
created_by
```

---

# 23. Import Job Item

```text
integration_job_items
```

```text
id
job_id
external_id
entity_type
status
attempts
error_code
error_message
payload_reference
processed_at
```

---

# 24. Job Lifecycle

```text
CREATED
  ↓
QUEUED
  ↓
PROCESSING
  ↓
SUCCESS
```

Ошибочные:

```text
PROCESSING
   ↓
FAILED
   ↓
RETRYING
   ↓
PROCESSING
```

Невосстановимые:

```text
FAILED
   ↓
DEAD_LETTER
```

---

# 25. Queue

Любая подходящая production-ready очередь:

```text
Redis + BullMQ
```

или эквивалентный брокер.

Очереди:

```text
integration.import
integration.sync
integration.webhook
integration.reconciliation
integration.retry
```

---

# 26. Worker

Worker получает:

```json
{
  "jobId": "job_123",
  "integrationId": "int_456",
  "entityType": "contact",
  "externalId": "789"
}
```

И выполняет:

```text
load source
 ↓
map
 ↓
validate
 ↓
identity lookup
 ↓
deduplicate
 ↓
create/update
 ↓
write external ID
 ↓
audit
```

---

# 27. Idempotency

Каждая операция получает:

```text
idempotency_key
```

Пример:

```text
amocrm:contact:12345:update:789
```

Перед обработкой:

```text
if alreadyProcessed(key):
    return previousResult
```

---

# 28. Deduplication

Приоритет:

```text
1. external_id
2. exact phone
3. exact email
4. INN
5. provider-specific identifiers
6. composite matching
```

Нельзя автоматически объединять записи только по имени.

---

# 29. Duplicate Score

```text
phone       +50
email       +40
INN         +50
company     +10
name        +10
```

Результат:

```text
>= 90   AUTO MATCH
70-89   REVIEW
< 70    NEW
```

Порог должен быть конфигурируемым.

---

# 30. Merge Service

```ts
interface MergeService {
  preview(
    sourceId: string,
    targetId: string
  ): MergePreview;

  merge(
    sourceId: string,
    targetId: string,
    strategy: MergeStrategy
  ): Promise<MergeResult>;
}
```

Merge должен сохранять историю.

---

# 31. Conflict Model

Таблица:

```text
integration_conflicts
```

```text
id
integration_id
entity_type
internal_id
external_id
field
local_value
external_value
local_updated_at
external_updated_at
strategy
status
resolved_by
resolved_at
```

---

# 32. Conflict Strategies

```text
SOURCE_WINS
TARGET_WINS
LAST_WRITE_WINS
MANUAL
MERGE
```

Настраивать можно на уровне поля.

---

# 33. Master System

Для каждого поля/сущности должна существовать концепция owner/source of truth.

Пример:

```text
Contacts:
    name       → Mess&Anger
    phone      → 1C
    email      → CRM

Deals:
    stage      → Mess&Anger
    accounting → 1C

Messages:
    Mess&Anger
```

---

# 34. Sync Direction

```text
INBOUND
OUTBOUND
BIDIRECTIONAL
READ_ONLY
```

На MVP:

```text
INBOUND
```

После стабилизации:

```text
BIDIRECTIONAL
```

---

# 35. Incremental Sync

Хранить:

```text
last_cursor
last_sync_at
last_success_at
```

Алгоритм:

```text
load cursor
 ↓
getChanges(cursor)
 ↓
process page
 ↓
save checkpoint
 ↓
next page
 ↓
save final cursor
```

---

# 36. Webhook Flow

```text
External Provider
       ↓
POST /api/v1/integrations/webhooks/:provider/:integrationId
       ↓
Verify signature
       ↓
Validate payload
       ↓
Generate event ID
       ↓
Idempotency check
       ↓
Queue
       ↓
Worker
       ↓
Sync
```

---

# 37. Webhook Security

Проверять:

- signature;
- timestamp;
- provider;
- integration ID;
- payload schema;
- replay protection;
- rate limit.

Webhook endpoint не должен доверять данным только потому, что они пришли по HTTPS.

---

# 38. Polling

Если webhook отсутствует:

```text
Scheduler
 ↓
getChanges()
 ↓
Queue
 ↓
Workers
```

Период:

```text
1 min
5 min
15 min
1 hour
```

Настройка зависит от provider и тарифа.

---

# 39. Reconciliation

Периодически:

```text
External count
vs
Internal count
```

Также проверять:

```text
missing external IDs
broken relations
orphan records
stale records
```

---

# 40. Checkpoint

Каждый большой импорт должен иметь checkpoint:

```text
job_id
cursor
page
processed_count
last_external_id
```

После падения:

```text
resume
```

а не:

```text
restart from zero
```

---

# 41. Retry Policy

Retry только временных ошибок:

```text
TIMEOUT
NETWORK_ERROR
RATE_LIMIT
5XX
TEMPORARY_PROVIDER_ERROR
```

Не retry:

```text
INVALID_DATA
AUTH_FAILED
PERMISSION_DENIED
NOT_FOUND
INVALID_MAPPING
```

---

# 42. Backoff

Пример:

```text
1 → 5 sec
2 → 30 sec
3 → 5 min
4 → 30 min
```

Максимальное число попыток конфигурируемое.

---

# 43. Rate Limiting

Для каждого provider:

```text
requests/minute
requests/day
batch_size
concurrency
```

Rate limiter должен быть централизованным.

---

# 44. Error Taxonomy

```text
AUTHENTICATION
AUTHORIZATION
VALIDATION
MAPPING
DUPLICATE
CONFLICT
RATE_LIMIT
NETWORK
TIMEOUT
PROVIDER
INTERNAL
```

---

# 45. Error Response

Frontend получает безопасное сообщение:

```json
{
  "code": "RATE_LIMIT",
  "message": "CRM временно ограничила количество запросов.",
  "retryable": true
}
```

Технические детали остаются в backend logs.

---

# 46. Audit Log

Таблица:

```text
integration_audit_logs
```

Хранить:

```text
organization_id
integration_id
actor_id
action
entity_type
entity_id
external_id
source
result
timestamp
metadata
```

Пример:

```text
14:02
Ivan
amoCRM
Contact #12345
UPDATED
phone, email
```

---

# 47. Secret Redaction

Логи никогда не должны содержать:

```text
access_token
refresh_token
client_secret
api_key
password
webhook_secret
Authorization header
```

Использовать:

```text
[REDACTED]
```

---

# 48. REST API

Версия:

```text
/api/v1
```

## Integrations

```http
GET    /api/v1/integrations
POST   /api/v1/integrations
GET    /api/v1/integrations/:id
PATCH  /api/v1/integrations/:id
DELETE /api/v1/integrations/:id
POST   /api/v1/integrations/:id/test
```

---

# 49. Import API

```http
POST /api/v1/integrations/:id/imports
GET  /api/v1/integrations/:id/imports
GET  /api/v1/imports/:jobId
POST /api/v1/imports/:jobId/start
POST /api/v1/imports/:jobId/pause
POST /api/v1/imports/:jobId/resume
POST /api/v1/imports/:jobId/cancel
POST /api/v1/imports/:jobId/retry
```

---

# 50. Mapping API

```http
GET   /api/v1/integrations/:id/mappings
POST  /api/v1/integrations/:id/mappings
PATCH /api/v1/integrations/:id/mappings/:mappingId
DELETE /api/v1/integrations/:id/mappings/:mappingId
POST  /api/v1/integrations/:id/mappings/preview
```

---

# 51. Sync API

```http
GET  /api/v1/integrations/:id/sync
POST /api/v1/integrations/:id/sync/start
POST /api/v1/integrations/:id/sync/pause
POST /api/v1/integrations/:id/sync/resume
POST /api/v1/integrations/:id/sync/full
```

---

# 52. Conflicts API

```http
GET  /api/v1/integrations/:id/conflicts
GET  /api/v1/conflicts/:id
POST /api/v1/conflicts/:id/resolve
```

---

# 53. Logs API

```http
GET /api/v1/integrations/:id/logs
GET /api/v1/integrations/:id/errors
GET /api/v1/integrations/:id/health
```

---

# 54. Webhook API

```http
POST /api/v1/integrations/webhooks/:provider/:integrationId
```

Ответ желательно быстрый:

```json
{
  "accepted": true,
  "event_id": "evt_123"
}
```

Тяжёлая обработка выполняется асинхронно.

---

# 55. Provider API

Первая архитектурная группа:

```text
1C
amoCRM
Bitrix24
```

Затем:

```text
HubSpot
Salesforce
Custom REST
```

---

# 56. CSV Architecture

```text
Upload
 ↓
File Parser
 ↓
Encoding Detection
 ↓
Header Detection
 ↓
Preview
 ↓
Mapping
 ↓
Validation
 ↓
Import Queue
```

Поддержать:

```text
UTF-8
Windows-1251
,
;
TAB
```

---

# 57. Excel Architecture

```text
Upload XLSX
 ↓
Workbook Parser
 ↓
Sheet Selection
 ↓
Header Detection
 ↓
Preview
 ↓
Mapping
 ↓
Validation
 ↓
Import
```

---

# 58. Custom REST Connector

Пользователь задаёт:

```text
Base URL
Authentication
Headers
Endpoints
Pagination
Data path
ID path
Updated-at path
```

Пример:

```text
GET /customers
GET /customers?page=2
GET /customers?updated_after=...
```

Mapping задаётся через UI.

---

# 59. 1C Architecture

Предусмотреть несколько transport modes:

```text
HTTP API
OData
Web Service
External Processing
Extension
Integration Agent
```

Первый production path должен быть выбран под конкретную конфигурацию 1С клиента.

---

# 60. 1C Connector Entities

Минимум:

```text
Контрагенты
Организации
Контактные лица
Товары
Заказы
Счета
Ответственные
Статусы
```

Дальше расширять.

---

# 61. 1C Integration Agent

Для закрытой инфраструктуры:

```text
Local 1C
   ↓
Mess&Anger Agent
   ↓
Outbound encrypted connection
   ↓
Mess&Anger Integration Hub
```

Agent не должен требовать входящих соединений из интернета.

---

# 62. CRM → Messenger

CRM данные должны отображаться внутри Mess&Anger.

Карточка клиента:

```text
CRM

Company
Deal
Amount
Stage
Manager
Tasks
Last activity
```

---

# 63. Messenger → CRM

Из чата:

```text
Create deal
Create task
Update client
Change stage
Add note
Add tag
Open CRM
```

---

# 64. Conversation Context

Связь:

```text
External Contact
      ↓
Mess&Anger Contact
      ↓
Conversation
      ↓
Messages
```

Для каждой коммуникации хранить:

```text
source
external_id
direction
author
timestamp
content
attachments
```

---

# 65. История переписки

Импорт коммуникаций должен быть отдельным модулем.

На MVP переносить прежде всего:

```text
contacts
companies
deals
tasks
comments
statuses
```

Полную историю сообщений реализовывать после стабилизации CRM integration core.

---

# 66. Files

Внешние файлы:

```text
external_file_id
name
mime
size
checksum
source
```

Object storage:

```text
S3-compatible
```

Файлы не следует хранить внутри PostgreSQL как основной механизм.

---

# 67. Permissions

Scopes:

```text
contacts:read
contacts:write
companies:read
companies:write
deals:read
deals:write
tasks:read
tasks:write
files:read
files:write
messages:read
messages:write
```

---

# 68. RBAC

Роли:

```text
Owner
Admin
Integration Manager
Manager
Viewer
```

Integration Manager:

```text
connect
configure
sync
retry
view logs
```

Viewer:

```text
view only
```

---

# 69. Multi-Tenant Isolation

Каждая интеграционная сущность содержит:

```text
organization_id
```

Tenant context должен проверяться:

```text
HTTP
Service
Queue
Worker
Webhook
Database
Storage
Logs
```

---

# 70. Database Indexes

Обязательные:

```text
integrations(organization_id)
integration_external_ids(integration_id, entity_type, external_id)
integration_jobs(organization_id, status)
integration_job_items(job_id, status)
integration_conflicts(integration_id, status)
integration_audit_logs(integration_id, created_at)
```

---

# 71. Transactions

Не использовать одну транзакцию на 100 000 записей.

Правильно:

```text
one job
   ↓
many item-level transactions
```

Так система выдерживает частичные ошибки.

---

# 72. Data Consistency

После обработки:

```text
External ID saved
Canonical entity saved
Audit saved
Job item marked success
```

Порядок должен быть определён и протестирован.

---

# 73. Delete Policy

По умолчанию:

```text
external delete
    ↓
do not immediately hard-delete
```

Варианты:

```text
IGNORE
ARCHIVE
SOFT_DELETE
SYNC_DELETE
MANUAL_CONFIRMATION
```

---

# 74. Health Model

```text
HEALTHY
WARNING
DEGRADED
ERROR
DISCONNECTED
REAUTH_REQUIRED
```

Причины:

```text
token expired
API unavailable
webhook disabled
rate limit
permission revoked
queue backlog
high error rate
```

---

# 75. Metrics

Минимум:

```text
integration_jobs_total
integration_jobs_success
integration_jobs_failed
integration_records_processed
integration_webhooks_received
integration_webhooks_failed
integration_api_requests
integration_rate_limit_hits
integration_queue_depth
integration_sync_duration
```

---

# 76. Monitoring

Отслеживать:

```text
queue depth
worker failures
provider errors
authentication failures
sync latency
webhook latency
duplicate rate
conflict rate
```

---

# 77. Alerting

Примеры:

```text
Integration disconnected
Error rate > threshold
Queue stalled
Provider unavailable
Token expired
Repeated webhook failures
```

---

# 78. Testing Strategy

Каждый connector обязан иметь:

```text
connect test
auth test
list test
pagination test
create test
update test
delete test
rate-limit test
webhook test
error test
```

---

# 79. Contract Tests

Для каждого provider:

```text
Provider payload
      ↓
Adapter
      ↓
Canonical Model
```

Проверять schema.

---

# 80. Mock Providers

Создать:

```text
MockCRM
Mock1C
MockWebhookProvider
```

Они нужны для:

- unit tests;
- integration tests;
- load tests;
- failure tests.

---

# 81. Load Tests

Проверить:

```text
1,000
10,000
100,000
1,000,000
```

Записей.

Измерять:

```text
throughput
memory
CPU
DB load
queue latency
API calls
```

---

# 82. Failure Tests

Обязательно имитировать:

```text
provider unavailable
network lost
worker crash
token expired
rate limit
invalid record
duplicate webhook
database restart
queue restart
```

---

# 83. Recovery

После worker crash:

```text
job resumes
```

После duplicate webhook:

```text
idempotency blocks duplicate
```

После rate limit:

```text
backoff → retry
```

После expired token:

```text
REAUTH_REQUIRED
```

---

# 84. Product Phases

## Phase 1 — Foundation

```text
[ ] Canonical model
[ ] External IDs
[ ] Integration tables
[ ] Connector interface
[ ] Connector registry
[ ] Mapping engine
[ ] Validation
[ ] Normalization
```

## Phase 2 — Import

```text
[ ] Queue
[ ] Workers
[ ] Job system
[ ] Checkpoint
[ ] Retry
[ ] Dry run
[ ] Preview
[ ] Audit log
```

## Phase 3 — Files

```text
[ ] CSV
[ ] XLSX
[ ] JSON
[ ] XML
```

## Phase 4 — CRM

```text
[ ] REST connector
[ ] First CRM connector
[ ] 1C connector
```

## Phase 5 — Sync

```text
[ ] Incremental sync
[ ] Webhooks
[ ] Polling
[ ] Reconciliation
```

## Phase 6 — Two-way

```text
[ ] Conflict engine
[ ] Field ownership
[ ] Versioning
[ ] Bidirectional sync
```

## Phase 7 — Messenger bridge

```text
[ ] CRM context in chat
[ ] Chat → CRM
[ ] CRM → Chat
```

## Phase 8 — Platform

```text
[ ] Public API
[ ] OAuth apps
[ ] Developer portal
[ ] Sandbox
[ ] Marketplace
```

---

# 85. MVP Definition of Done

MVP считается готовым, когда:

```text
[ ] можно подключить integration
[ ] можно проверить connection
[ ] можно выбрать сущности
[ ] можно автоматически предложить mapping
[ ] можно изменить mapping
[ ] можно сделать preview
[ ] можно сделать dry run
[ ] можно запустить import
[ ] импорт работает через queue
[ ] есть retry
[ ] есть checkpoint
[ ] есть deduplication
[ ] есть external IDs
[ ] есть audit log
[ ] есть ошибки
[ ] есть повторный запуск
[ ] есть CSV
[ ] есть XLSX
[ ] есть REST
[ ] есть первый CRM connector
[ ] есть 1C architecture
```

---

# 86. Production Definition of Done

Production-ready Integration Hub:

```text
[ ] multi-tenant isolation
[ ] encrypted credentials
[ ] RBAC
[ ] audit
[ ] idempotency
[ ] rate limiting
[ ] retries
[ ] DLQ
[ ] incremental sync
[ ] webhooks
[ ] polling fallback
[ ] reconciliation
[ ] conflict resolution
[ ] field ownership
[ ] two-way sync
[ ] monitoring
[ ] metrics
[ ] alerting
[ ] connector contract tests
[ ] load tests
[ ] failure recovery
```

---

# 87. Recommended Implementation Order

Критически важно соблюдать порядок.

```text
1. Database foundation
2. Canonical model
3. External identity
4. Connector interface
5. Mapping engine
6. Validation
7. Import jobs
8. Queue
9. Worker
10. CSV
11. XLSX
12. REST connector
13. First CRM
14. 1C
15. Webhooks
16. Incremental sync
17. Deduplication center
18. Conflict center
19. Two-way sync
20. Messenger ↔ CRM
21. Automation
22. Developer platform
```

---

# 88. Что НЕ делать

Не делать:

```text
❌ отдельную архитектуру под каждую CRM
❌ credentials во frontend
❌ массовый import одним HTTP request
❌ синхронизацию без external IDs
❌ автоматический merge только по имени
❌ two-way sync до появления conflict engine
❌ hard delete по умолчанию
❌ хранение provider-specific полей только в обычных колонках
❌ обработку webhook синхронно
❌ бесконечные retry
❌ отсутствие checkpoint
❌ отсутствие audit log
```

---

# 89. Конечная архитектура

```text
                         MESS&ANGER
                             │
              ┌──────────────┴──────────────┐
              │                             │
          Messenger                       CRM
              │                             │
              └──────────────┬──────────────┘
                             │
                      Integration Hub
                             │
        ┌────────────────────┼─────────────────────┐
        │                    │                     │
     Connectors          Sync Engine          Import Engine
        │                    │                     │
   ┌────┼─────┐         ┌────┼────┐          ┌────┼────┐
   │    │     │         │         │          │         │
  1C  CRM   REST     Webhook   Polling      CSV      XLSX
   │    │     │
   └────┼─────┘
        │
  Provider Adapter
        │
 Canonical Model
        │
 ┌──────┼─────────┐
 │      │         │
Identity Mapping Validation
 │      │         │
 └──────┼─────────┘
        │
 Deduplication
        │
 Conflict Engine
        │
 Queue / Workers
        │
 PostgreSQL + Object Storage
```

---

# 90. Ключевой результат

После реализации Mess&Anger будет иметь не набор разрозненных импортов, а полноценный интеграционный слой:

```text
                 External Ecosystem
                        │
        ┌───────────────┼────────────────┐
        │               │                │
       CRM              1C             Files
        │               │                │
        └───────────────┼────────────────┘
                        │
                 Integration Hub
                        │
              Canonical Data Model
                        │
               Mess&Anger CRM
                        │
                   Messenger
                        │
                  Automation
                        │
                Public Developer API
```

Это позволяет добавлять новые CRM как отдельные connectors, не меняя ядро Mess&Anger.

---

# 91. Следующий технический шаг

После утверждения этой архитектуры реализацию следует разбить минимум на следующие самостоятельные пакеты:

```text
01_database_schema.md
02_backend_integration_core.md
03_connector_sdk.md
04_mapping_engine.md
05_import_engine.md
06_queue_workers.md
07_deduplication.md
08_sync_engine.md
09_webhooks.md
10_conflict_engine.md
11_1c_connector.md
12_amocrm_connector.md
13_bitrix24_connector.md
14_csv_xlsx_import.md
15_integration_api.md
16_frontend_integrations_ui.md
17_crm_messenger_bridge.md
18_security.md
19_testing.md
20_deployment.md
```

И только после этого переходить непосредственно к написанию production-кода.

---

# AUDIT

> Reviewed: 2026-08-29. Status: Architecture Blueprint — no production code written (§91 explicitly defers coding to the 20 sub-documents).

## Internal consistency
- Connector interface (§18) ↔ capabilities (§19) ↔ sync direction (§34) ↔ webhook flow (§36): consistent.
- Error taxonomy (§44) ↔ error response (§45): consistent (`RATE_LIMIT` example matches).
- Retry errors (§41) ↔ backoff (§42) ↔ queues (§25) ↔ worker (§26): consistent.
- Permissions scopes (§67) ↔ RBAC (§68): consistent.
- Tables (§12,13,14,15,22,23,31,46) ↔ indexes (§70): **FIXED** — §70 referenced `integration_logs` while §46 defines the table as `integration_audit_logs`; §70 now uses `integration_audit_logs`.
- Recommended frontend structure (§3: `src/app`, `src/pages/integrations`, `src/features/integrations`) does NOT match the current app layout (`src/components`, `src/hooks`, `src/lib`, `src/store` — no `pages/`/`app/`). Aspirational; requires the §91 sub-doc split + a backend.

## Execution gap vs current repo
- Current app is local-first P2P (WebRTC/libp2p). The only server is `server/` (Express: auth/admin/paymento/… routes). There is **NO** Integration Hub, **NO** PostgreSQL/Redis/BullMQ, **NO** `/api/v1/integrations` route.
- Therefore frontend Integration UI (§3) and all backend structures (§7) are greenfield — blocked until the §91 sub-documents exist and a backend is built.
- Phase checklists (§84), MVP DoD (§85), Production DoD (§86): 0/N items implemented in this repo (blueprint only).

## Conclusion
Blueprint is coherent and ready to be split into the 20 sub-documents (§91) as the next technical step. No code change in this audit pass.
