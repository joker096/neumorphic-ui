// Integration Hub HTTP route (blueprint §15/§48-§54/§67/§68).
// Mirrors server route-handler pattern: handleIntegrationsRoute(req,res,path): boolean.

import { IncomingMessage, ServerResponse } from 'node:http'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js'
import { integrationManager, StaticCredentialHandle, integrationQueue } from '../integrations/core/IntegrationManager.js'
import { IntegrationError } from '../integrations/core/Connector.js'
import { ConflictEngine } from '../integrations/conflict/ConflictEngine.js'
import { metrics } from '../integrations/observability/Metrics.js'
import { health } from '../integrations/observability/HealthService.js'
import { receiveWebhook } from '../integrations/webhooks/WebhookReceiver.js'
import { auditStore } from '../integrations/core/AuditStore.js'
import { ReconciliationService } from '../integrations/sync/ReconciliationService.js'
import { hasScope } from '../integrations/security/rbac.js'

const conflictEngine = new ConflictEngine()
const reconciliationService = new ReconciliationService()

const MAX_BODY = 1024 * 256

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY) { req.destroy(); reject(new Error('Request body too large')); return }
      body += chunk.toString()
    })
    req.on('end', () => {
      try { resolve(JSON.parse(body)) } catch { reject(new Error('Invalid JSON')) }
    })
    req.on('error', reject)
  })
}

function json(res: ServerResponse, status: number, obj: unknown): boolean {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(obj))
  return true
}

function errJson(res: ServerResponse, e: unknown): boolean {
  if (e instanceof IntegrationError) {
    const status =
      e.code === 'AUTHENTICATION' || e.code === 'AUTH_FAILED' || e.code === 'AUTHORIZATION' ? 403 :
      e.code === 'VALIDATION' || e.code === 'MAPPING' || e.code === 'NOT_FOUND' ? 400 :
      e.code === 'RATE_LIMIT' ? 429 : 502
    return json(res, status, { code: e.code, message: e.message, retryable: e.retryable })
  }
  return json(res, 500, { code: 'INTERNAL', message: 'Internal error', retryable: false })
}

function orgIdOf(req: AuthenticatedRequest): string {
  return String((req.admin as { adminId: number }).adminId)
}

function rbac(req: AuthenticatedRequest, res: ServerResponse, scope: 'integrations:read' | 'integrations:write'): boolean {
  if (!requireAuth(req, res)) return false
  const role = (req.admin as any)?.role as string | undefined
  if (!hasScope(role, scope)) {
    json(res, 403, { code: 'AUTHORIZATION', message: 'Insufficient role', retryable: false })
    return false
  }
  return true
}

export function handleIntegrationsRoute(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  const authReq = req as AuthenticatedRequest

  if (path === '/api/v1/integrations' && req.method === 'GET') {
    if (!requireAuth(authReq, res)) return true
    return json(res, 200, { integrations: integrationManager.list(orgIdOf(authReq)) })
  }

  if (path === '/api/v1/integrations' && req.method === 'POST') {
    if (!rbac(authReq, res, 'integrations:write')) return true
    readBody(req).then((data) => {
      try {
        const rec = integrationManager.create(
          orgIdOf(authReq), data.provider, data.name,
          data.syncDirection ?? 'inbound', data.config ?? {},
        )
        return json(res, 201, rec)
      } catch (e) { return errJson(res, e) }
    }).catch(() => json(res, 400, { error: 'Invalid JSON' }))
    return true
  }

  const connectMatch = path.match(/^\/api\/v1\/integrations\/([^/]+)\/connect$/)
  if (connectMatch && req.method === 'POST') {
    if (!rbac(authReq, res, 'integrations:write')) return true
    const id = connectMatch[1]
    readBody(req).then(async (data) => {
      try {
        const creds = new StaticCredentialHandle(id, data.credentials ?? {})
        const caps = await integrationManager.connect(id, {
          organizationId: orgIdOf(authReq), credentials: creds, config: data.config,
        })
        return json(res, 200, { capabilities: caps })
      } catch (e) { return errJson(res, e) }
    }).catch(() => json(res, 400, { error: 'Invalid JSON' }))
    return true
  }

  if (path === '/api/v1/integrations/health' && req.method === 'GET') {
    if (!requireAuth(authReq, res)) return true
    return json(res, 200, { status: 'ok', connectors: integrationManager.connectorList() })
  }

  if (path === '/api/v1/integrations/metrics' && req.method === 'GET') {
    if (!requireAuth(authReq, res)) return true
    return json(res, 200, metrics.snapshot())
  }

  const conflictsListMatch = path.match(/^\/api\/v1\/integrations\/([^/]+)\/conflicts$/)
  if (conflictsListMatch && req.method === 'GET') {
    if (!requireAuth(authReq, res)) return true
    return json(res, 200, { conflicts: conflictEngine.listOpen(conflictsListMatch[1]) })
  }

  const resolveMatch = path.match(/^\/api\/v1\/integrations\/conflicts\/([^/]+)\/resolve$/)
  if (resolveMatch && req.method === 'POST') {
    if (!requireAuth(authReq, res)) return true
    readBody(req).then((data) => {
      try {
        const c = conflictEngine.resolve(resolveMatch[1], data.strategy ?? 'MANUAL', orgIdOf(authReq))
        return json(res, 200, c ?? { error: 'not found' })
      } catch (e) { return errJson(res, e) }
    }).catch(() => json(res, 400, { error: 'Invalid JSON' }))
    return true
  }

  const webhookMatch = path.match(/^\/api\/v1\/integrations\/webhooks\/([^/]+)\/([^/]+)$/)
  if (webhookMatch && req.method === 'POST') {
    readBody(req).then((data) => {
      try {
        const r = receiveWebhook({
          provider: webhookMatch[1], integrationId: webhookMatch[2],
          rawBody: JSON.stringify(data),
          signature: req.headers['x-signature'] as string | undefined,
          timestamp: req.headers['x-timestamp'] as string | undefined,
        })
        return json(res, 202, r)
      } catch (e) { return errJson(res, e) }
    }).catch(() => json(res, 400, { error: 'Invalid JSON' }))
    return true
  }

  const healthMatch = path.match(/^\/api\/v1\/integrations\/([^/]+)\/health$/)
  if (healthMatch && req.method === 'GET') {
    if (!requireAuth(authReq, res)) return true
    return json(res, 200, { integrationId: healthMatch[1], health: health.get(healthMatch[1]) })
  }

  const logsMatch = path.match(/^\/api\/v1\/integrations\/([^/]+)\/logs$/)
  if (logsMatch && req.method === 'GET') {
    if (!requireAuth(authReq, res)) return true
    return json(res, 200, { logs: auditStore.list(logsMatch[1], 100) })
  }

  const reconcileMatch = path.match(/^\/api\/v1\/integrations\/([^/]+)\/reconcile$/)
  if (reconcileMatch && req.method === 'GET') {
    if (!requireAuth(authReq, res)) return true
    reconciliationService.reconcile(reconcileMatch[1]).then((r) => json(res, 200, r)).catch((e) => errJson(res, e))
    return true
  }

  const mappingsMatch = path.match(/^\/api\/v1\/integrations\/([^/]+)\/mappings$/)
  if (mappingsMatch && req.method === 'PUT') {
    if (!rbac(authReq, res, 'integrations:write')) return true
    readBody(req).then((data) => {
      try {
        integrationManager.saveMappings(mappingsMatch[1], data.mappings ?? [])
        return json(res, 200, { ok: true })
      } catch (e) { return errJson(res, e) }
    }).catch(() => json(res, 400, { error: 'Invalid JSON' }))
    return true
  }

  const importsMatch = path.match(/^\/api\/v1\/integrations\/([^/]+)\/imports$/)
  if (importsMatch && req.method === 'POST') {
    if (!rbac(authReq, res, 'integrations:write')) return true
    readBody(req).then((data) => {
      try {
        const job = integrationManager.enqueueImport(importsMatch[1], data.entityType ?? 'contacts', data.records ?? [])
        return json(res, 202, job)
      } catch (e) { return errJson(res, e) }
    }).catch(() => json(res, 400, { error: 'Invalid JSON' }))
    return true
  }

  const idMatch = path.match(/^\/api\/v1\/integrations\/([^/]+)$/)
  if (idMatch) {
    const id = idMatch[1]
    if (req.method === 'GET') {
      if (!requireAuth(authReq, res)) return true
      const rec = integrationManager.get(id)
      if (!rec) return json(res, 404, { error: 'not found' })
      return json(res, 200, rec)
    }
    if (req.method === 'DELETE') {
      if (!rbac(authReq, res, 'integrations:write')) return true
      try { integrationManager.remove(id) } catch (e) { return errJson(res, e) }
      return json(res, 200, { ok: true })
    }
  }

  return false
}
