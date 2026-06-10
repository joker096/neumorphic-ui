// server/csp.ts - Content Security Policy middleware for Mess&Anger
// Locks down Content Security Policy headers for production use

export interface CSPOptions {
  reportUri?: string
  allowInlineScript?: boolean
  allowedConnectSrc?: string[]
  nonce?: string
}

/**
 * Generate a Content Security Policy header string
 */
export function buildCSP(options: CSPOptions = {}): string {
  const {
    reportUri,
    allowInlineScript = false,
    allowedConnectSrc = [],
    nonce,
  } = options

  const connectSrc = ['self', ...allowedConnectSrc].join(' ')
  const scriptSrc = allowInlineScript && nonce ? `nonce-${nonce}` : ''

  let policy = `default-src 'none'; connect-src ${connectSrc}; style-src 'none'; frame-src 'none'; media-src 'none'`
  if (scriptSrc) {
    policy = `default-src 'none'; connect-src ${connectSrc}; script-src 'nonce-${nonce}'; style-src 'none'; frame-src 'none'; media-src 'none'`
  }

  if (reportUri) {
    policy += `; report-uri "${reportUri}"; report-to "csp-endpoint"`
  }

  return policy
}

/**
 * Generate a nonce for CSP headers
 */
export function generateCSPNonce(): string {
  return crypto.getRandomValues(new Uint8Array(16)).toString()
}

/**
 * Apply CSP headers to a response object
 */
export function applyCSP(
  res: { setHeader?: (name: string, value: string) => void; headers?: Map<string, string> },
  options: CSPOptions = {},
): void {
  const nonce = generateCSPNonce()
  const csp = buildCSP({ ...options, nonce })

  if (res.setHeader) {
    res.setHeader('Content-Security-Policy', csp)
    res.setHeader('Content-Security-Policy-Report-Only', '')
    res.setHeader('X-Content-Security-Policy', 'enforced')
  } else if (res.headers instanceof Map) {
    res.headers.set('Content-Security-Policy', csp)
    res.headers.set('X-Content-Security-Policy', 'enforced')
  }
}

/**
 * Check if a URL is allowed by the CSP
 */
export function isConnectAllowed(url: string, options?: CSPOptions): boolean {
  if (!options?.allowedConnectSrc?.length) {
    return url === 'self' || url.startsWith('ws://') || url.startsWith('http://')
  }
  return options.allowedConnectSrc.some((allowed) => url.includes(allowed))
}
