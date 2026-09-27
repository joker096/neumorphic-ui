// Reference Bitrix24 connector (blueprint §55/§18/§19).
import type {
  Connector, ConnectorCapabilities, ConnectionTestResult, ExternalRecord,
  IntegrationContext, ListOptions, PageResult, CanonicalEntity, EntityType,
} from '../core/Connector.js'
import { IntegrationError } from '../core/Connector.js'
import { timingSafeEqual } from 'node:crypto'

const METHOD: Record<string, string> = {
  contact: 'crm.contact', company: 'crm.company', lead: 'crm.lead', deal: 'crm.deal',
  task: 'crm.task', product: 'crm.product',
}

function method(entity: EntityType): string {
  return METHOD[entity] ?? `crm.${entity}`
}

export class Bitrix24Connector implements Connector {
  provider = 'bitrix24'

  getCapabilities(): ConnectorCapabilities {
    return { read: true, create: true, update: true, delete: false, webhooks: false, incrementalSync: false }
  }

  private baseUrl(ctx: IntegrationContext): string {
    const url = ctx.config['baseUrl']
    if (typeof url !== 'string' || !url) throw new IntegrationError('VALIDATION', 'bitrix24 config.baseUrl required')
    return url.replace(/\/$/, '')
  }

  private token(ctx: IntegrationContext): string {
    const t = ctx.credentials.get<string>('apiKey')
    if (!t) throw new IntegrationError('AUTH_FAILED', 'bitrix24 apiKey missing')
    return t
  }

  async connect(ctx: IntegrationContext): Promise<void> {
    this.baseUrl(ctx)
    this.token(ctx)
  }

  async testConnection(ctx: IntegrationContext): Promise<ConnectionTestResult> {
    try {
      const resp = await fetch(`${this.baseUrl(ctx)}/crm.contact.list.json?auth=${this.token(ctx)}`)
      return { ok: resp.ok, message: resp.ok ? 'reachable' : `HTTP ${resp.status}` }
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'network error' }
    }
  }

  async list(entity: EntityType, options: ListOptions, ctx: IntegrationContext): Promise<PageResult> {
    const url = `${this.baseUrl(ctx)}/${method(entity)}.list.json?auth=${this.token(ctx)}&limit=${options.limit ?? 50}`
    const resp = await fetch(url)
    if (!resp.ok) throw new IntegrationError('PROVIDER', `bitrix24 list failed: ${resp.status}`, resp.status >= 500)
    const json = (await resp.json()) as any
    const items: ExternalRecord[] = (json.result ?? []).map((it: any) => ({ externalId: String(it.ID), data: it }))
    return { items }
  }

  async get(entity: EntityType, externalId: string, ctx: IntegrationContext): Promise<ExternalRecord> {
    const resp = await fetch(`${this.baseUrl(ctx)}/${method(entity)}.get.json?auth=${this.token(ctx)}&id=${externalId}`)
    if (resp.status === 404) throw new IntegrationError('NOT_FOUND', 'record not found')
    if (!resp.ok) throw new IntegrationError('PROVIDER', `bitrix24 get failed: ${resp.status}`, resp.status >= 500)
    const data = (await resp.json()) as any
    return { externalId: String(data.result?.ID ?? externalId), data: data.result ?? data }
  }

  async create(entity: EntityType, data: CanonicalEntity, ctx: IntegrationContext): Promise<ExternalRecord> {
    const resp = await fetch(`${this.baseUrl(ctx)}/${method(entity)}.add.json?auth=${this.token(ctx)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: data.fields }),
    })
    if (!resp.ok) throw new IntegrationError('PROVIDER', `bitrix24 create failed: ${resp.status}`, resp.status >= 500)
    const json = (await resp.json()) as any
    return { externalId: String(json.result?.ID ?? '0'), data: json.result ?? {} }
  }

  async update(entity: EntityType, externalId: string, data: CanonicalEntity, ctx: IntegrationContext): Promise<ExternalRecord> {
    const resp = await fetch(`${this.baseUrl(ctx)}/${method(entity)}.update.json?auth=${this.token(ctx)}&id=${externalId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: data.fields }),
    })
    if (!resp.ok) throw new IntegrationError('PROVIDER', `bitrix24 update failed: ${resp.status}`, resp.status >= 500)
    const json = (await resp.json()) as any
    return { externalId: String(json.result ?? externalId), data: json.result ?? data.fields }
  }

  // §37 Bitrix24 inbound webhooks carry the integration `auth` token; the route
  // passes it as the signature header. Fail-closed: no configured token means
  // nothing to compare against, so the request is rejected.
  verifyWebhookSignature(_rawBody: string, signature: string, ctx: IntegrationContext): boolean {
    if (!signature) return false
    const token = (ctx.config['webhookSecret'] as string | undefined) ?? ctx.credentials.get<string>('apiKey')
    if (!token) return false
    const a = Buffer.from(token, 'utf8')
    const b = Buffer.from(signature, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  }
}
