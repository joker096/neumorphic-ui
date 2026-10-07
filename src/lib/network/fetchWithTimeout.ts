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

export interface TimedTextResponse {
  ok: boolean
  status: number
  text: string
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
  if (timeoutMs <= 0) {
    const res = await fetch(url, init)
    return { ok: res.ok, status: res.status, text: await res.text() }
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
    return { ok: res.ok, status: res.status, text: await res.text() }
  } finally {
    clearTimeout(timer)
    callerSignal?.removeEventListener('abort', onCallerAbort)
  }
}
