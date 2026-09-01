// Integration Hub — Connector contract (blueprint §18/§19/§44/§45).
// Hub core depends ONLY on this interface; providers are swappable.

export type EntityType =
  | 'contact' | 'company' | 'lead' | 'deal' | 'task' | 'product'
  | 'order' | 'invoice' | 'activity' | 'comment' | 'note' | 'file'
  | 'user' | 'pipeline' | 'stage' | 'tag' | 'customField'
  | 'conversation' | 'message'

export type SyncDirection = 'inbound' | 'outbound' | 'bidirectional' | 'read_only'

export interface CanonicalEntity {
  entityType: EntityType
  externalId?: string
  fields: Record<string, unknown>
  customFields?: Record<string, unknown>
  name?: string
  email?: string
  phone?: string
}

export interface ExternalRecord {
  externalId: string
  data: Record<string, unknown>
}

export interface ConnectorCapabilities {
  read: boolean
  create: boolean
  update: boolean
  delete: boolean
  webhooks: boolean
  incrementalSync: boolean
}

// Resolved server-side only; raw secret never present in the object (§1.2/§14).
export interface CredentialHandle {
  integrationId: string
  get<T = unknown>(key: string): T | undefined
}

export class StaticCredentialHandle implements CredentialHandle {
  constructor(public integrationId: string, private values: Record<string, unknown>) {}
  get<T = unknown>(key: string): T | undefined {
    return this.values[key] as T | undefined
  }
  // Never leak secrets via JSON serialization.
  toJSON(): { integrationId: string } {
    return { integrationId: this.integrationId }
  }
}

export interface IntegrationContext {
  organizationId: string
  integrationId: string
  provider: string
  credentials: CredentialHandle
  config: Record<string, unknown>
}

export interface ListOptions {
  cursor?: string
  limit?: number
}

export interface PageResult {
  items: ExternalRecord[]
  nextCursor?: string
}

export interface ConnectionTestResult {
  ok: boolean
  message?: string
}

// §18 — Connector contract.
export interface Connector {
  provider: string
  connect(ctx: IntegrationContext): Promise<void>
  testConnection(ctx: IntegrationContext): Promise<ConnectionTestResult>
  getCapabilities(): ConnectorCapabilities
  list(entity: EntityType, options: ListOptions, ctx: IntegrationContext): Promise<PageResult>
  get(entity: EntityType, externalId: string, ctx: IntegrationContext): Promise<ExternalRecord>
  create(entity: EntityType, data: CanonicalEntity, ctx: IntegrationContext): Promise<ExternalRecord>
  update(entity: EntityType, externalId: string, data: CanonicalEntity, ctx: IntegrationContext): Promise<ExternalRecord>
  delete?(entity: EntityType, externalId: string, ctx: IntegrationContext): Promise<void>
  getChanges?(cursor: string, ctx: IntegrationContext): Promise<PageResult>
  subscribeWebhooks?(ctx: IntegrationContext): Promise<void>
  verifyWebhookSignature?(rawBody: string, signature: string, ctx: IntegrationContext): boolean
}

// §44/§45 — typed error taxonomy. `retryable` drives §41 retry policy.
export type IntegrationErrorCode =
  | 'AUTHENTICATION' | 'AUTH_FAILED' | 'AUTHORIZATION'
  | 'VALIDATION' | 'MAPPING' | 'DUPLICATE' | 'CONFLICT'
  | 'RATE_LIMIT' | 'NETWORK' | 'TIMEOUT' | 'PROVIDER' | 'INTERNAL' | 'NOT_FOUND'

export class IntegrationError extends Error {
  code: IntegrationErrorCode
  retryable: boolean
  constructor(code: IntegrationErrorCode, message: string, retryable = false) {
    super(message)
    this.name = 'IntegrationError'
    this.code = code
    this.retryable = retryable
  }
}
