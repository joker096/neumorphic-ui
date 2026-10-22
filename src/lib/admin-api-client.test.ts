/**
 * Regression tests for the admin SPA's API client.
 *
 * The admin app is a separate Vite project, so its modules are not collected
 * by the root Vitest run. The client is imported here to keep the failure modes
 * of the admin backend contract covered:
 *  - a hung request must not spin forever (timeout),
 *  - an error response must never reach the UI as a success payload,
 *  - a non-JSON body (proxy error page) must not surface as a syntax error.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, AdminApiError } from '../../admin/src/api/client'

const fakeResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
})

describe('admin api client', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('rejects a rate limited response instead of resolving its body', async () => {
    fetchMock.mockResolvedValue(fakeResponse(429, { error: 'Too many requests' }))
    await expect(api.getAds()).rejects.toMatchObject({
      name: 'AdminApiError',
      status: 429,
      serverMessage: 'Too many requests',
    })
  })

  it('rejects with the message the server sent', async () => {
    fetchMock.mockResolvedValue(fakeResponse(400, { error: 'Username and password required' }))
    const err = await api.login('admin', 'secret').catch((e) => e)
    expect(err).toBeInstanceOf(AdminApiError)
    expect(err.message).toBe('Username and password required')
  })

  it('keeps the captcha rejection message the login screen branches on', async () => {
    fetchMock.mockResolvedValue(fakeResponse(403, { error: 'CAPTCHA verification failed' }))
    const err = await api.login('admin', 'secret').catch((e) => e)
    expect(err.message).toBe('CAPTCHA verification failed')
  })

  it('clears the session and redirects to the login screen on 401', async () => {
    sessionStorage.setItem('admin_token', 'stale')
    fetchMock.mockResolvedValue(fakeResponse(401, { error: 'Invalid credentials' }))
    await expect(api.getOverview()).rejects.toThrow('Unauthorized')
    expect(sessionStorage.getItem('admin_token')).toBeNull()
    expect(window.location.hash).toBe('#/login')
  })

  it('does not surface a raw syntax error for a non-JSON body', async () => {
    fetchMock.mockResolvedValue(fakeResponse(200, '<html>502 Bad Gateway</html>'))
    await expect(api.getOverview()).rejects.toThrow('Unexpected response from server')
  })

  it('resolves the parsed body of a successful response', async () => {
    fetchMock.mockResolvedValue(fakeResponse(200, { ads: [] }))
    await expect(api.getAds()).resolves.toEqual({ ads: [] })
  })

  it('aborts a request that outlives the timeout', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
    )
    const pending = api.getOverview()
    const assertion = expect(pending).rejects.toMatchObject({ name: 'AdminApiError', status: 0 })
    await vi.advanceTimersByTimeAsync(20_000)
    await assertion
  })
})
