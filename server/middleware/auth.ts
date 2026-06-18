import { IncomingMessage, ServerResponse } from 'node:http'
import { validateSession } from '../auth.js'

export interface AuthenticatedRequest extends IncomingMessage {
  admin?: { adminId: number; username: string }
}

export function requireAuth(req: AuthenticatedRequest, res: ServerResponse): boolean {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Missing authorization header' }))
    return false
  }

  const token = authHeader.slice(7)
  const payload = validateSession(token)
  if (!payload) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid or expired token' }))
    return false
  }

  req.admin = payload
  return true
}
