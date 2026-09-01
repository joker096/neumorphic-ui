// Reference 1C connector (blueprint §55/§59/§60). OData/REST subset (Контрагенты etc).
import type {
  Connector, ConnectorCapabilities, ConnectionTestResult, ExternalRecord,
  IntegrationContext, ListOptions, PageResult, CanonicalEntity, EntityType,
} from '../core/Connector.js'
import { IntegrationError } from '../core/Connector.js'

const CATALOG: Record<string, string> = {
  company: 'Catalog_Контрагенты', contact: 'Catalog_КонтактныеЛица',
  product: 'Catalog_Номенклатура', order: 'Document_ЗаказКлиента',
  invoice: 'Document_СчетНаОплату',
}

function odataSet(entity: EntityType): string {
  return CATALOG[entity] ?? `Catalog_${entity}`
}

export class OneCConnector implements Connector {
  provider = '1c'

  getCapabilities(): ConnectorCapabilities {
    return { read: true, create: true, update: true, delete: false, webhooks: false, incrementalSync: false }
  }

  private baseUrl(ctx: IntegrationContext): string {
    const url = ctx.config['baseUrl']
    if (typeof url !== 'string' || !url) throw new IntegrationError('VALIDATION', '1c config.baseUrl required')
    return url.replace(/\/$/, '')
  }

  private authHeader(ctx: IntegrationContext): Record<string, string> | undefined {
    const t = ctx.credentials.get<string>('apiKey')
    return t ? { Authorization: `Bearer ${t}` } : undefined
  }

  async connect(ctx: IntegrationContext): Promise<void> {
    this.baseUrl(ctx)
  }

  async testConnection(ctx: IntegrationContext): Promise<ConnectionTestResult> {
    const h = this.authHeader(ctx)
    try {
      const resp = await fetch(`${this.baseUrl(ctx)}/odata/standard.odata/${odataSet('company')}?$top=1`, { headers: h })
      return { ok: resp.ok, message: resp.ok ? 'reachable' : `HTTP ${resp.status}` }
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'network error' }
    }
  }

  async list(entity: EntityType, options: ListOptions, ctx: IntegrationContext): Promise<PageResult> {
    const url = `${this.baseUrl(ctx)}/odata/standard.odata/${odataSet(entity)}?$top=${options.limit ?? 50}`
    const resp = await fetch(url, { headers: this.authHeader(ctx) })
    if (!resp.ok) throw new IntegrationError('PROVIDER', `1c list failed: ${resp.status}`, resp.status >= 500)
    const json = (await resp.json()) as any
    const items: ExternalRecord[] = (json.value ?? []).map((it: any) => ({ externalId: String(it.Ref ?? it.id), data: it }))
    return { items }
  }

  async get(entity: EntityType, externalId: string, ctx: IntegrationContext): Promise<ExternalRecord> {
    const resp = await fetch(`${this.baseUrl(ctx)}/odata/standard.odata/${odataSet(entity)}('${externalId}')`, { headers: this.authHeader(ctx) })
    if (resp.status === 404) throw new IntegrationError('NOT_FOUND', 'record not found')
    if (!resp.ok) throw new IntegrationError('PROVIDER', `1c get failed: ${resp.status}`, resp.status >= 500)
    const data = (await resp.json()) as any
    return { externalId: String(data.Ref ?? externalId), data }
  }

  async create(entity: EntityType, data: CanonicalEntity, ctx: IntegrationContext): Promise<ExternalRecord> {
    const resp = await fetch(`${this.baseUrl(ctx)}/odata/standard.odata/${odataSet(entity)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...this.authHeader(ctx) },
      body: JSON.stringify(data.fields),
    })
    if (!resp.ok) throw new IntegrationError('PROVIDER', `1c create failed: ${resp.status}`, resp.status >= 500)
    const json = (await resp.json()) as any
    return { externalId: String(json.Ref ?? '0'), data: json }
  }

  async update(entity: EntityType, externalId: string, data: CanonicalEntity, ctx: IntegrationContext): Promise<ExternalRecord> {
    const resp = await fetch(`${this.baseUrl(ctx)}/odata/standard.odata/${odataSet(entity)}('${externalId}')`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', ...this.authHeader(ctx) },
      body: JSON.stringify(data.fields),
    })
    if (!resp.ok) throw new IntegrationError('PROVIDER', `1c update failed: ${resp.status}`, resp.status >= 500)
    const json = (await resp.json()) as any
    return { externalId: String(json.Ref ?? externalId), data: json }
  }
}
