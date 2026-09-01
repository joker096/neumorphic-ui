// Secret redaction for logs (blueprint §47). Never log raw secrets.
const SECRET_KEYS = [
  'access_token', 'refresh_token', 'client_secret', 'api_key',
  'password', 'webhook_secret', 'secret', 'authorization',
]

export function redact(value: unknown): string {
  try {
    return JSON.stringify(value, (_k, v) => {
      if (typeof _k === 'string' && SECRET_KEYS.includes(_k.toLowerCase())) return '[REDACTED]'
      return v
    }, 2)
  } catch {
    return '[REDACTED]'
  }
}
