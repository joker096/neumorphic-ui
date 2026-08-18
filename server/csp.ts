import { randomBytes } from 'crypto'

export interface CSPOptions {
  reportUri?: string
  nonce?: string
}

/**
 * Generate a random nonce for CSP
 */
function generateNonce(): string {
  return randomBytes(16).toString('hex')
}

/**
 * Generate a Content Security Policy header string for the app
 */
export function buildCSP(options: CSPOptions = {}): string {
  const { reportUri, nonce } = options

  const nonceStr = nonce || generateNonce()
  const scriptSrc = nonceStr
    ? `'nonce-${nonceStr}'`
    : "'self'"

  const directives = [
    "default-src 'self'",
    `script-src 'self' ${scriptSrc}`,
    "style-src 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' wss:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ]

  if (reportUri) {
    directives.push(`report-uri ${reportUri}`)
  }

  return directives.join('; ')
}

/**
 * Generate nonce for use in script/style tags
 */
export function getNonce(): string {
  return generateNonce()
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
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  res.setHeader('Permissions-Policy', 'camera=self; microphone=self; geolocation=self; payment=(); interest-cohort=()')
}
