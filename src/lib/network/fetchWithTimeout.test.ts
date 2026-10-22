import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DEFAULT_FETCH_TIMEOUT_MS, MEDIA_FETCH_TIMEOUT_MS, fetchArrayBufferWithTimeout, fetchBlobWithTimeout, fetchTextWithTimeout } from './fetchWithTimeout'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function textResponse(text: string, ok = true, status = 200): void {
  fetchMock.mockResolvedValueOnce({ ok, status, text: async () => text })
}

describe('fetchTextWithTimeout', () => {
  it('returns status and body text', async () => {
    textResponse('{"ok":true}')
    await expect(fetchTextWithTimeout('/x', { method: 'POST' })).resolves.toEqual({
      ok: true,
      status: 200,
      text: '{"ok":true}',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      '/x',
      expect.objectContaining({ method: 'POST', signal: expect.any(AbortSignal) }),
    )
  })

  it('surfaces non-2xx status without throwing', async () => {
    textResponse('boom', false, 503)
    await expect(fetchTextWithTimeout('/x')).resolves.toMatchObject({ ok: false, status: 503 })
  })

  it('aborts when the deadline passes', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementationOnce(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
    )
    const pending = expect(fetchTextWithTimeout('/x', {}, 5_000)).rejects.toThrow('Aborted')
    await vi.advanceTimersByTimeAsync(5_000)
    await pending
  })

  it('keeps the timer armed while the body is read (slow-body hang is bounded)', async () => {
    vi.useFakeTimers()
    // Headers resolve immediately; the body never finishes streaming.
    fetchMock.mockImplementationOnce(async (_url: RequestInfo | URL, init?: RequestInit) => ({
      ok: true,
      status: 200,
      text: () =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        }),
    }))
    const pending = expect(fetchTextWithTimeout('/x', {}, 1_000)).rejects.toThrow('Aborted')
    await vi.advanceTimersByTimeAsync(1_000)
    await pending
  })

  it('propagates a caller-supplied signal', async () => {
    const controller = new AbortController()
    fetchMock.mockImplementationOnce(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
    )
    const pending = expect(fetchTextWithTimeout('/x', { signal: controller.signal })).rejects.toThrow(
      'Aborted',
    )
    controller.abort()
    await pending
  })

  it('skips the timer entirely when the budget is disabled', async () => {
    textResponse('binary-ish')
    await expect(fetchTextWithTimeout('/blob', {}, 0)).resolves.toMatchObject({ text: 'binary-ish' })
    expect(fetchMock).toHaveBeenCalledWith('/blob', {})
  })

  it('exports a sane default budget', () => {
    expect(DEFAULT_FETCH_TIMEOUT_MS).toBeGreaterThan(0)
    expect(DEFAULT_FETCH_TIMEOUT_MS).toBeLessThanOrEqual(30_000)
  })
})

describe('fetchBlobWithTimeout', () => {
  it('returns the blob and the status', async () => {
    const blob = new Blob(['media'])
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, blob: async () => blob })
    await expect(fetchBlobWithTimeout('/media')).resolves.toEqual({ ok: true, status: 200, blob })
    expect(fetchMock).toHaveBeenCalledWith(
      '/media',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('keeps the deadline while the body is read', async () => {
    vi.useFakeTimers()
    let signal: AbortSignal | undefined
    fetchMock.mockImplementationOnce(async (_url: string, init: RequestInit) => {
      signal = init.signal as AbortSignal
      return {
        ok: true,
        status: 200,
        blob: () =>
          new Promise<Blob>((_resolve, reject) => {
            signal?.addEventListener(
              'abort',
              () => reject(new DOMException('Aborted', 'AbortError')),
              { once: true },
            )
          }),
      }
    })
    const pending = expect(fetchBlobWithTimeout('/media')).rejects.toThrow('Aborted')
    await vi.advanceTimersByTimeAsync(DEFAULT_FETCH_TIMEOUT_MS + 1)
    await pending
  })

  it('skips the timer entirely when the budget is disabled', async () => {
    const blob = new Blob(['x'])
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, blob: async () => blob })
    await expect(fetchBlobWithTimeout('/media', {}, 0)).resolves.toMatchObject({ blob })
    expect(fetchMock).toHaveBeenCalledWith('/media', {})
  })
})

describe('fetchArrayBufferWithTimeout', () => {
  it('returns the decoded buffer', async () => {
    const buffer = new ArrayBuffer(8)
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, arrayBuffer: async () => buffer })
    await expect(fetchArrayBufferWithTimeout('/audio')).resolves.toEqual({
      ok: true,
      status: 200,
      buffer,
    })
  })
})

describe('media budget', () => {
  it('is larger than the default but still bounded', () => {
    expect(MEDIA_FETCH_TIMEOUT_MS).toBeGreaterThan(DEFAULT_FETCH_TIMEOUT_MS)
    expect(MEDIA_FETCH_TIMEOUT_MS).toBeLessThanOrEqual(120_000)
  })
})
