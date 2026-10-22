/**
 * Single abort ceiling for every client→server HTTP call (§4.2 "timeouts on all
 * network requests — never wait forever").
 *
 * Why a helper instead of inline `AbortController` blocks: an inline controller
 * released in `finally` right after `fetch()` resolves only covers the *headers*.
 * A slow body (hanging gateway proxy) then keeps the `await` pending forever. This
 * helper keeps one timer alive across the whole operation — connect, headers and
 * body read — and propagates a caller-supplied signal without relying on
 * `AbortSignal.any` (not available on every browser this build targets).
 */

export const DEFAULT_FETCH_TIMEOUT_MS = 15_000

/**
 * Ceiling for media payloads (photos, videos, story media).
 *
 * Bigger than the default because a legitimate media transfer carries much more
 * bytes than a JSON API call — but still bounded, so a dead host cannot hang the
 * UI forever.
 */
export const MEDIA_FETCH_TIMEOUT_MS = 60_000

export interface TimedTextResponse {
  ok: boolean
  status: number
  text: string
}

export interface TimedBlobResponse {
  ok: boolean
  status: number
  blob: Blob
}

export interface TimedArrayBufferResponse {
  ok: boolean
  status: number
  buffer: ArrayBuffer
}

/**
 * Run one fetch under a single deadline.
 *
 * The deadline covers the whole operation: connect, headers AND the body read —
 * that is the entire point of the helper. `read` receives the response and must
 * consume the body inside the same deadline.
 */
async function fetchWithDeadline<T>(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  read: (res: Response) => Promise<T>,
): Promise<{ ok: boolean; status: number; value: T }> {
  if (timeoutMs <= 0) {
    const res = await fetch(url, init)
    return { ok: res.ok, status: res.status, value: await read(res) }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const callerSignal = init.signal
  const onCallerAbort = () => controller.abort()
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort()
    else callerSignal.addEventListener('abort', onCallerAbort, { once: true })
  }
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    return { ok: res.ok, status: res.status, value: await read(res) }
  } finally {
    clearTimeout(timer)
    callerSignal?.removeEventListener('abort', onCallerAbort)
  }
}

/**
 * Perform `fetch` and read the body as text under a single timeout.
 *
 * @param timeoutMs `0` (or less) disables the ceiling — only for bulk media
 *   transfers, where a fixed budget would abort legitimate large downloads.
 */
export async function fetchTextWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<TimedTextResponse> {
  const res = await fetchWithDeadline(url, init, timeoutMs, (r) => r.text())
  return { ok: res.ok, status: res.status, text: res.value }
}

/**
 * Perform `fetch` and read the body as a blob under a single timeout.
 *
 * Used for media payloads (downloads, saved stories, stored voice blobs): the
 * deadline also covers the body read, so a host that accepts the connection and
 * then stalls cannot leave the caller waiting forever.
 */
export async function fetchBlobWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<TimedBlobResponse> {
  const res = await fetchWithDeadline(url, init, timeoutMs, (r) => r.blob())
  return { ok: res.ok, status: res.status, blob: res.value }
}

/**
 * Perform `fetch` and read the body as an ArrayBuffer under a single timeout.
 *
 * Used for audio decoding, where the whole waveform has to arrive before the
 * buffer can be decoded.
 */
export async function fetchArrayBufferWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<TimedArrayBufferResponse> {
  const res = await fetchWithDeadline(url, init, timeoutMs, (r) => r.arrayBuffer())
  return { ok: res.ok, status: res.status, buffer: res.value }
}
