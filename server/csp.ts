export interface CSPOptions {
  reportUri?: string
  nonce?: string
}

/**
 * Generate a Content Security Policy header string for the app
 */
export function buildCSP(options: CSPOptions = {}): string {
  const { reportUri } = options

  const directives = [
    "default-src 'self'",
    "script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' ws: wss: https: http://localhost:*",
    "media-src 'self' blob: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ]

  if (reportUri) {
    directives.push(`report-uri "${reportUri}"`)
    directives.push(`report-to "csp-endpoint"`)
  }

  return directives.join('; ')
}

/**
 * Apply CSP headers to a response
 */
export function applyCSP(
  res: { setHeader?: (name: string, value: string) => void },
  options: CSPOptions = {},
): void {
  if (!res.setHeader) return
  const csp = buildCSP(options)
  res.setHeader('Content-Security-Policy', csp)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Content-Security-Policy', csp)
}
