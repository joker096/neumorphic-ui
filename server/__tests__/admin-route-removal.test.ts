import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

import { handleStatsRoute } from '../routes/stats'
import { handleAdsRoute } from '../routes/ads'

/**
 * `server/routes/admin.ts` used to expose a second copy of the admin panel
 * API (/api/admin/*) next to the live routes (/api/stats/*, /api/ads/*).
 * Nothing called it, so the duplicate surface is gone. These checks keep it
 * gone and keep the live routes intact.
 */
const ROOT = process.cwd()

function makeRes() {
  const state = { status: 0, body: '' }
  let resolveDone!: () => void
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve
  })
  const res = {
    writeHead(status: number) {
      state.status = status
      return res
    },
    end(body?: string) {
      state.body = body ?? ''
      resolveDone()
      return res
    },
  } as unknown as ServerResponse
  return { res, state, done }
}

function makeReq(method: string, urlPath: string): IncomingMessage {
  return {
    method,
    url: urlPath,
    headers: {},
    socket: { remoteAddress: '10.0.0.31' },
  } as unknown as IncomingMessage
}

describe('the duplicate admin route module is gone', () => {
  it('no longer ships server/routes/admin.ts', () => {
    expect(fs.existsSync(path.join(ROOT, 'server', 'routes', 'admin.ts'))).toBe(false)
  })

  it('is not referenced by the server entry point', () => {
    const source = fs.readFileSync(path.join(ROOT, 'server', 'signaling-server.ts'), 'utf8')
    expect(source).not.toContain('handleAdminRoute')
    expect(source).not.toContain('/api/admin/')
  })

  it('does not expose /api/admin/* through the live route handlers', () => {
    const { res, state } = makeRes()
    const handled = handleStatsRoute(makeReq('GET', '/api/admin/users'), res, '/api/admin/users')
    expect(handled).toBe(false)
    expect(state.status).toBe(0)
  })

  it('keeps the live stats route on /api/stats/*', async () => {
    const { res, state, done } = makeRes()
    const handled = handleStatsRoute(makeReq('GET', '/api/stats/users'), res, '/api/stats/users')
    await done
    expect(handled).toBe(true)
    // Without a bearer token the request is rejected, but the route exists.
    expect(state.status).toBe(401)
  })

  it('keeps the live ads route on /api/ads', async () => {
    const { res, state, done } = makeRes()
    const handled = handleAdsRoute(makeReq('GET', '/api/ads'), res, '/api/ads')
    await done
    expect(handled).toBe(true)
    expect(state.status).toBe(401)
  })
})
