export interface CSPOptions {
  reportUri?: string
  nonce?: string
}

export function buildCSP(options: CSPOptions = {}): string {
  const { reportUri, nonce } = options

  const scriptSrc = nonce
    ? `'nonce-${nonce}' 'strict-dynamic'`
    : `'self' 'wasm-unsafe-eval'`

  let policy = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `style-src-attr 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `connect-src 'self' ws://localhost:* wss://localhost:* https: ws: wss:`,
    `media-src 'self' blob: https:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ')

  if (reportUri) {
    policy += `; report-uri ${reportUri}; report-to csp-endpoint`
  }

  return policy
}

export function generateCSPNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return btoa(String.fromCharCode(...bytes))
}

export function applyCSP(
  res: { setHeader?: (name: string, value: string) => void; headers?: Map<string, string> },
  options: CSPOptions = {},
): void {
  const nonce = generateCSPNonce()
  const csp = buildCSP({ ...options, nonce })

  if (res.setHeader) {
    res.setHeader('Content-Security-Policy', csp)
    res.setHeader('X-Content-Security-Policy', csp)
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  } else if (res.headers instanceof Map) {
    res.headers.set('Content-Security-Policy', csp)
    res.headers.set('X-Content-Security-Policy', csp)
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  }

  return { nonce }
}

export function isConnectAllowed(url: string, options?: CSPOptions): boolean {
  if (url === 'self') return true
  const allowedPrefixes = ['ws://localhost', 'wss://localhost', 'https://', 'ws://', 'wss://']
  return allowedPrefixes.some(p => url.startsWith(p))
}
