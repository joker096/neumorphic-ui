# 03. Connector SDK — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §18 (interface), §19 (capabilities), §20 (adapter), §21 (registry), §41 (retry errors), §42 (backoff).

## 1. Purpose

The Connector SDK lets a new CRM / 1C / file source be added by implementing ONE interface and registering it. The Hub core never imports provider code directly.

## 2. Connector interface (§18)

```ts
interface Connector {
  provider: string;

  connect(context: IntegrationContext): Promise<void>;
  testConnection(context: IntegrationContext): Promise<ConnectionTestResult>;

  getCapabilities(): Promise<ConnectorCapabilities>;

  list(entity: EntityType, options: ListOptions): Promise<PageResult>;
  get(entity: EntityType, externalId: string): Promise<ExternalRecord>;

  create(entity: EntityType, data: CanonicalEntity): Promise<ExternalRecord>;
  update(entity: EntityType, externalId: string, data: CanonicalEntity): Promise<ExternalRecord>;
  delete?(entity: EntityType, externalId: string): Promise<void>;

  getChanges?(cursor: string): Promise<ChangePage>;   // incremental sync (§34)
  subscribeWebhooks?(): Promise<void>;                // §36
}
```

## 3. Capabilities (§19)

Each connector declares what it supports; the UI hides unsupported actions automatically.

```json
{
  "contacts": { "read": true, "create": true, "update": true, "delete": false },
  "deals":    { "read": true, "create": true, "update": true, "delete": false },
  "webhooks": true,
  "incrementalSync": true
}
```

## 4. Adapter split (§20)

Separate three concerns so one connector can serve multiple API quirks:

```text
Connector   → Hub contract (§18), lifecycle, capabilities
Adapter     → provider API specifics (auth, paging, field names)
Canonical   → Mess&Anger domain model (§8)
```

Example: `AmoConnector` (lifecycle) → `AmoAdapter` (amoCRM REST quirks) → `CanonicalContact`.

## 5. Registry (§21)

```ts
class ConnectorRegistry {
  register(connector: Connector): void;
  get(provider: string): Connector;
  has(provider: string): boolean;
  list(): Connector[];
}
```

Add-CRM flow: implement `Connector` → `register()` → unit tests. No core changes.

## 6. Retry & backoff (§41/§42)

- Hub distinguishes **retryable** vs **permanent** errors (§44 taxonomy).
- `RetryPolicy` (§25): exponential backoff + jitter, max attempts (default 5), capped delay.
- `JobWorker` routes permanent failures to `DeadLetterQueue` (§24 `DEAD_LETTER`); never infinite retry (§89 "no infinite retry").
- Idempotency key (§27) prevents duplicates across retries.
- If a connector's `getChanges`/webhook feed is unavailable, the worker falls back to polling with checkpoint (§34/§89 "no missing checkpoint").

## 7. SDK scaffolding (Phase 1)

`server/integrations/core/Connector.ts` exports the `Connector` interface + `ConnectorCapabilities` + `IntegrationContext` (re-exported from core). `ConnectorRegistry.ts` is a plain in-memory registry (swappable for a decorated/discovery registry later). A reference `providers/amocrm` stub implements `list`/`get`/`create`/`update` against a mocked client to prove the contract end-to-end.

## 8. Rules

- Connector code NEVER receives raw `client_secret`/`refresh_token` — only a `CredentialHandle` resolved by `CredentialVault` (§14, §18).
- Webhook processing is asynchronous (§89 "no synchronous webhook handling").
- Provider-specific fields go to `customFields` / `integration_mappings`, never into core tables (§1.3).
