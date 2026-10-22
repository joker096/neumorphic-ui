// Integration Hub HTTP route (blueprint §15/§48-§54/§67/§68).
// Mirrors server route-handler pattern: handleIntegrationsRoute(req,res,path): boolean.

import { IncomingMessage, ServerResponse } from 'node:http'
import { AuthenticatedRequest } from '../middleware/auth.js'
import { AdminLimiters, authorizeAdminRequest, checkRateLimit, createRateLimiter } from '../middleware/rateLimit.js'
import { resolveClientIp } from '../middleware/clientIp.js'
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

// Unauthenticated endpoint: allow a provider a burst of retries, not a flood.
const WEBHOOK_RATE_LIMIT_PER_MIN = 60

// The integration endpoints can trigger outbound connector calls, so they get
// a budget of their own: one per signed-in administrator plus a small
// per-address bucket for requests with an unusable token.
const ADMIN_RATE_LIMIT_PER_MIN = 120
const INVALID_TOKEN_RATE_LIMIT_PER_MIN = 30

const anonymousLimiter = createRateLimiter(INVALID_TOKEN_RATE_LIMIT_PER_MIN, 60_000)
const adminLimiter = createRateLimiter(ADMIN_RATE_LIMIT_PER_MIN, 60_000)

/** Test seam: the buckets of the integration endpoints. */
export const integrationsRateLimiters: AdminLimiters = { anonymous: anonymousLimiter, admin: adminLimiter }

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

/**
 * Raw body reader for signature verification: the provider signs the exact
 * bytes it sent, so re-serialising a parsed object (whitespace, escapes, key
 * order) would make every signature check fail — or, worse, invite a caller to
 * rely on a re-serialised form.
 */
function readRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    let size = 0
    let overLimit = false
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY) {
        // Stop accumulating but keep draining: destroying the socket here would
        // drop the 413 response the caller needs to see.
        overLimit = true
        body = ''
        return
      }
      body += chunk.toString('utf8')
    })
    req.on('end', () => (overLimit ? reject(new BodyTooLargeError()) : resolve(body)))
    req.on('error', reject)
  })
}

class BodyTooLargeError extends Error {
  constructor() {
    super('Request body too large')
    this.name = 'BodyTooLargeError'
  }
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

/**
 * Role scope check for an ALREADY authenticated administrator.
 *
 * Authentication and the rate limit are handled by the route guard, so this
 * only answers the scope question.
 */
function hasRoleScope(req: AuthenticatedRequest, res: ServerResponse, scope: 'integrations:read' | 'integrations:write'): boolean {
  const role = (req.admin as any)?.role as string | undefined
  if (!hasScope(role, scope)) {
    json(res, 403, { code: 'AUTHORIZATION', message: 'Insufficient role', retryable: false })
    return false
  }
  return true
}

export function handleIntegrationsRoute(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  const authReq = req as AuthenticatedRequest
  const ip = resolveClientIp(req)

  if (path === '/api/v1/integrations' && req.method === 'GET') {
    if (!authorizeAdminRequest(authReq, res, ip, integrationsRateLimiters)) return true
    return json(res, 200, { integrations: integrationManager.list(orgIdOf(authReq)) })
  }

  if (path === '/api/v1/integrations' && req.method === 'POST') {
    if (!authorizeAdminRequest(authReq, res, ip, integrationsRateLimiters)) return true
    if (!hasRoleScope(authReq, res, 'integrations:write')) return true
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
    if (!authorizeAdminRequest(authReq, res, ip, integrationsRateLimiters)) return true
    if (!hasRoleScope(authReq, res, 'integrations:write')) return true
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
    if (!authorizeAdminRequest(authReq, res, ip, integrationsRateLimiters)) return true
    return json(res, 200, { status: 'ok', connectors: integrationManager.connectorList() })
  }

  if (path === '/api/v1/integrations/metrics' && req.method === 'GET') {
    if (!authorizeAdminRequest(authReq, res, ip, integrationsRateLimiters)) return true
    return json(res, 200, metrics.snapshot())
  }

  const conflictsListMatch = path.match(/^\/api\/v1\/integrations\/([^/]+)\/conflicts$/)
  if (conflictsListMatch && req.method === 'GET') {
    if (!authorizeAdminRequest(authReq, res, ip, integrationsRateLimiters)) return true
    return json(res, 200, { conflicts: conflictEngine.listOpen(conflictsListMatch[1]) })
  }

  const resolveMatch = path.match(/^\/api\/v1\/integrations\/conflicts\/([^/]+)\/resolve$/)
  if (resolveMatch && req.method === 'POST') {
    if (!authorizeAdminRequest(authReq, res, ip, integrationsRateLimiters)) return true
    readBody(req).then((data) => {
      try {
        const c = conflictEngine.resolve(resolveMatch[1], data.strategy ?? 'MANUAL', orgIdOf(authReq))
        return json(res, 200, c ?? { error: 'not found' })
      } catch (e) { return errJson(res, e) }
    }).catch(() => json(res, 400, { error: 'Invalid JSON' }))
    return true
  }

  // Providers cannot hold an admin session, so this endpoint is open to the
  // internet by necessity — the body is authenticated by signature instead
  // (§37) and throttled per client IP.
  const webhookMatch = path.match(/^\/api\/v1\/integrations\/webhooks\/([^/]+)\/([^/]+)$/)
  if (webhookMatch && req.method === 'POST') {
    if (!checkRateLimit(`integrations:webhook:${resolveClientIp(req)}`, { windowMs: 60_000, maxRequests: WEBHOOK_RATE_LIMIT_PER_MIN }).allowed) {
      json(res, 429, { code: 'RATE_LIMIT', message: 'Too many webhook requests', retryable: true })
      return true
    }
    readRawBody(req).then((rawBody) => {
      try {
        const r = receiveWebhook({
          provider: webhookMatch[1], integrationId: webhookMatch[2],
          rawBody,
          signature: req.headers['x-signature'] as string | undefined,
          timestamp: req.headers['x-timestamp'] as string | undefined,
        })
        return json(res, 202, r)
      } catch (e) { return errJson(res, e) }
    }).catch((e) => json(res, e instanceof BodyTooLargeError ? 413 : 400, {
      error: e instanceof Error ? e.message : 'Invalid request body',
    }))
    return true
  }

  const healthMatch = path.match(/^\/api\/v1\/integrations\/([^/]+)\/health$/)
  if (healthMatch && req.method === 'GET') {
    if (!authorizeAdminRequest(authReq, res, ip, integrationsRateLimiters)) return true
    return json(res, 200, { integrationId: healthMatch[1], health: health.get(healthMatch[1]) })
  }

  const logsMatch = path.match(/^\/api\/v1\/integrations\/([^/]+)\/logs$/)
  if (logsMatch && req.method === 'GET') {
    if (!authorizeAdminRequest(authReq, res, ip, integrationsRateLimiters)) return true
    return json(res, 200, { logs: auditStore.list(logsMatch[1], 100) })
  }

  const reconcileMatch = path.match(/^\/api\/v1\/integrations\/([^/]+)\/reconcile$/)
  if (reconcileMatch && req.method === 'GET') {
    if (!authorizeAdminRequest(authReq, res, ip, integrationsRateLimiters)) return true
    reconciliationService.reconcile(reconcileMatch[1]).then((r) => json(res, 200, r)).catch((e) => errJson(res, e))
    return true
  }

  const mappingsMatch = path.match(/^\/api\/v1\/integrations\/([^/]+)\/mappings$/)
  if (mappingsMatch && req.method === 'PUT') {
    if (!authorizeAdminRequest(authReq, res, ip, integrationsRateLimiters)) return true
    if (!hasRoleScope(authReq, res, 'integrations:write')) return true
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
    if (!authorizeAdminRequest(authReq, res, ip, integrationsRateLimiters)) return true
    if (!hasRoleScope(authReq, res, 'integrations:write')) return true
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
      if (!authorizeAdminRequest(authReq, res, ip, integrationsRateLimiters)) return true
      const rec = integrationManager.get(id)
      if (!rec) return json(res, 404, { error: 'not found' })
      return json(res, 200, rec)
    }
    if (req.method === 'DELETE') {
      if (!authorizeAdminRequest(authReq, res, ip, integrationsRateLimiters)) return true
      if (!hasRoleScope(authReq, res, 'integrations:write')) return true
      try { integrationManager.remove(id) } catch (e) { return errJson(res, e) }
      return json(res, 200, { ok: true })
    }
  }

  return false
}
