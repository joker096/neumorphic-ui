import { AdminApiError } from '../api/client'

/**
 * True when the server rejected the session.
 *
 * The API client already clears the token and sends the operator to the login
 * screen in that case, so the page must not show an error banner on top of it.
 */
export function isSessionLost(error: unknown): boolean {
  return error instanceof Error && error.message === 'Unauthorized'
}

/**
 * The server's own message for a failed request, or undefined when the server
 * did not send one — the caller then falls back to a localized generic text.
 */
export function adminErrorMessage(error: unknown): string | undefined {
  if (error instanceof AdminApiError) return error.serverMessage || undefined
  return undefined
}
