# 02. Backend Integration Core — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §2 (layers), §7 (backend structure), §16 (mapping engine), §21 (registry), §25 (queue), §26 (worker).

## 1. Scope

The Integration Hub is a backend service, **never** called directly by the frontend (§1.1). Frontend talks to `Mess&Anger API` → Integration Service → providers.

## 2. Layering (§2)

```text
Frontend (Integrations UI)
   ↓ HTTPS
API Gateway (auth / RBAC / tenant / rate-limit / validation)
   ↓
Integration Service (Manager / Connectors / Mapping / Sync / Webhooks)
   ↓                ↓                ↓
PostgreSQL      Queue (BullMQ)   Object Storage
                ↓
              Workers
```

## 3. Module layout (§7, trimmed)

```text
server/integrations/
├── core/
│   ├── IntegrationManager.ts
│   ├── Connector.ts            (interface, §18)
│   ├── ConnectorRegistry.ts    (§21)
│   ├── IntegrationContext.ts
│   └── IntegrationErrors.ts
├── canonical/                  (Contact/Company/Deal/Task/... §8-§11)
├── mapping/                    (MappingEngine, TransformEngine, MappingValidator §16,§17)
├── identity/                   (ExternalIdentityService, DeduplicationService, MergeService §12,§28,§30)
├── sync/                       (SyncEngine, SyncStateService, ConflictResolver §34,§31)
├── import/                     (ImportService, ImportCheckpoint §22,§24)
├── queue/                      (JobQueue, JobWorker, RetryPolicy, DeadLetterQueue §25,§26)
├── webhooks/                   (WebhookReceiver, WebhookVerifier, WebhookProcessor §36)
├── security/                   (CredentialVault, TokenService, SecretRedactor §14,§18)
└── observability/              (IntegrationLogger, Metrics, HealthService)
```

## 4. Core contracts

### 4.1 `IntegrationContext` (§18)

```ts
interface IntegrationContext {
  organizationId: string;
  integrationId: string;
  credentials: CredentialHandle;   // resolved from CredentialVault, never raw secret
  config: Record<string, unknown>;
  logger: IntegrationLogger;
}
```

### 4.2 `Connector` (§18, full interface in sub-doc 03)

Manager depends only on the `Connector` interface — providers are swappable.

### 4.3 `ConnectorRegistry` (§21)

```ts
class ConnectorRegistry {
  register(connector: Connector): void;
  get(provider: string): Connector;
  has(provider: string): boolean;
  list(): Connector[];
}
```

Adding a CRM = `create connector → implement interface → register → add tests` (§21).

### 4.4 `IntegrationErrors` (§44/§45)

Typed error taxonomy consumed by the API gateway for stable error responses:
`AUTH_FAILED`, `RATE_LIMIT`, `MAPPING_ERROR`, `VALIDATION_ERROR`, `PROVIDER_ERROR`, `CONFLICT`, `TIMEOUT`, `DUPLICATE`. Each maps to an HTTP status + machine-readable `code` (§45).

## 5. API surface (gateway, §2/§15)

Base path `/api/v1/integrations`. All routes require auth + RBAC scope (§67/§68).

```text
GET    /                          list integrations
POST   /                          create (draft)
POST   /:id/connect               authorize + testConnection (§18)
POST   /:id/disconnect
GET    /:id/mappings
PUT    /:id/mappings              update field mapping (§15)
POST   /:id/import                enqueue import job (§22)
POST   /:id/sync                  trigger sync (§34)
GET    /:id/jobs/:jobId
GET    /:id/conflicts
POST   /:id/conflicts/:cid/resolve
GET    /:id/logs                  (§46)
GET    /:id/health
```

## 6. Queue & Worker (§25/§26)

- Broker: Redis + BullMQ.
- Queues: `integration.import`, `integration.sync`, `integration.webhook`, `integration.reconciliation`, `integration.retry`.
- Worker payload (§26):

```json
{ "jobId": "job_123", "integrationId": "int_456",
  "entityType": "contact", "externalId": "789" }
```

- Worker pipeline (§26): load source → map → validate → identity lookup → dedupe → create/update → write external id → audit.
- Idempotency key (§27): `amocrm:contact:12345:update:789`; skip if already processed.

## 7. Implementation phases

- **Phase 1 (this cycle):** schema (01), `IntegrationManager` + `Connector` interface + `ConnectorRegistry` + `/api/v1/integrations` route skeleton + BullMQ connection + one reference connector (amocrm stub). 
- **Phase 2:** Mapping engine, identity/dedupe, import engine, job lifecycle.
- **Phase 3:** sync engine, webhooks, conflict engine.
- **Phase 4:** connectors 11–14, frontend UI (16), CRM↔Messenger bridge (17), security (18), testing (19), deployment (20).

## 8. Constraints

- No provider-specific field baked into core tables (§1.3) — canonical model + `customFields` only.
- Mass operations are async jobs, never inline HTTP (§1.4).
- Credentials resolved server-side only (§1.2).
