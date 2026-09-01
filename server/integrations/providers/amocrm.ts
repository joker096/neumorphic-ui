// Reference amoCRM connector (blueprint §55/§18/§19).
// Thin v4 REST adapter. Swap secrets only via CredentialHandle (§1.2).

import type {
  Connector, ConnectorCapabilities, ConnectionTestResult, ExternalRecord,
  IntegrationContext, ListOptions, PageResult, CanonicalEntity, EntityType,
} from '../core/Connector.js'
import { createHmac } from 'node:crypto'
import { IntegrationError } from '../core/Connector.js'

const PLURAL: Record<string, string> = {
  contact: 'contacts',
  company: 'companies',
  lead: 'leads',
  deal: 'leads',
  task: 'tasks',
}

function entityPlural(entity: EntityType): string {
  return PLURAL[entity] ?? `${entity}s`
}

export class AmoConnector implements Connector {
  provider = 'amocrm'

  getCapabilities(): ConnectorCapabilities {
    return { read: true, create: true, update: true, delete: false, webhooks: true, incrementalSync: true }
  }

  private baseUrl(ctx: IntegrationContext): string {
    const url = ctx.config['baseUrl']
    if (typeof url !== 'string' || !url) {
      throw new IntegrationError('VALIDATION', 'amocrm config.baseUrl required')
    }
    return url.replace(/\/$/, '')
  }

  private authHeader(ctx: IntegrationContext): string {
    const token = ctx.credentials.get<string>('apiKey')
    if (!token) throw new IntegrationError('AUTH_FAILED', 'amocrm apiKey missing', false)
    return `Bearer ${token}`
  }

  async connect(ctx: IntegrationContext): Promise<void> {
    // OAuth/token already resolved into Credentials; validate presence.
    this.authHeader(ctx)
    this.baseUrl(ctx)
  }

  async testConnection(ctx: IntegrationContext): Promise<ConnectionTestResult> {
    try {
      const resp = await fetch(`${this.baseUrl(ctx)}/api/v4/account`, {
        headers: { Authorization: this.authHeader(ctx) },
      })
      return { ok: resp.ok, message: resp.ok ? 'reachable' : `HTTP ${resp.status}` }
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'network error' }
    }
  }

  async list(entity: EntityType, options: ListOptions, ctx: IntegrationContext): Promise<PageResult> {
    const limit = options.limit ?? 50
    const url = `${this.baseUrl(ctx)}/api/v4/${entityPlural(entity)}?limit=${limit}`
    const resp = await fetch(url, { headers: { Authorization: this.authHeader(ctx) } })
    if (!resp.ok) throw new IntegrationError('PROVIDER', `amocrm list failed: ${resp.status}`, resp.status >= 500)
    const json = (await resp.json()) as any
    const items: ExternalRecord[] = (json._embedded?.['items'] ?? []).map((it: any) => ({
      externalId: String(it.id),
      data: it,
    }))
    return { items }
  }

  async get(entity: EntityType, externalId: string, ctx: IntegrationContext): Promise<ExternalRecord> {
    const resp = await fetch(`${this.baseUrl(ctx)}/api/v4/${entityPlural(entity)}/${externalId}`, {
      headers: { Authorization: this.authHeader(ctx) },
    })
    if (resp.status === 404) throw new IntegrationError('NOT_FOUND', 'record not found')
    if (!resp.ok) throw new IntegrationError('PROVIDER', `amocrm get failed: ${resp.status}`, resp.status >= 500)
    const data = (await resp.json()) as any
    return { externalId: String(data.id), data }
  }

  async create(entity: EntityType, data: CanonicalEntity, ctx: IntegrationContext): Promise<ExternalRecord> {
    const resp = await fetch(`${this.baseUrl(ctx)}/api/v4/${entityPlural(entity)}`, {
      method: 'POST',
      headers: { Authorization: this.authHeader(ctx), 'Content-Type': 'application/json' },
      body: JSON.stringify([data.fields]),
    })
    if (!resp.ok) throw new IntegrationError('PROVIDER', `amocrm create failed: ${resp.status}`, resp.status >= 500)
    const json = (await resp.json()) as any
    const created = json._embedded?.['items']?.[0] ?? {}
    return { externalId: String(created.id), data: created }
  }

  async update(entity: EntityType, externalId: string, data: CanonicalEntity, ctx: IntegrationContext): Promise<ExternalRecord> {
    const resp = await fetch(`${this.baseUrl(ctx)}/api/v4/${entityPlural(entity)}/${externalId}`, {
      method: 'PATCH',
      headers: { Authorization: this.authHeader(ctx), 'Content-Type': 'application/json' },
      body: JSON.stringify(data.fields),
    })
    if (!resp.ok) throw new IntegrationError('PROVIDER', `amocrm update failed: ${resp.status}`, resp.status >= 500)
    const json = (await resp.json()) as any
    return { externalId: String(json.id ?? externalId), data: json }
  }

  // §37 best-effort HMAC-SHA256 verification. Real amoCRM uses a URL secret;
  // scaffold accepts when no signature header is present (defer full enforcement).
  verifyWebhookSignature(rawBody: string, signature: string, ctx: IntegrationContext): boolean {
    if (!signature) return false
    const secret = ctx.credentials.get<string>('apiKey') ?? (ctx.config['webhookSecret'] as string | undefined)
    if (!secret) return true
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    const a = Buffer.from(expected)
    const b = Buffer.from(signature)
    if (a.length !== b.length) return false
    return a.every((v, i) => v === b[i])
  }
}
