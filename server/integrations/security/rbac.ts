// Integration Hub — RBAC (blueprint §67 / §68).
export type Scope =
  | 'contacts:read' | 'contacts:write'
  | 'companies:read' | 'companies:write'
  | 'deals:read' | 'deals:write'
  | 'tasks:read' | 'tasks:write'
  | 'files:read' | 'files:write'
  | 'messages:read' | 'messages:write'
  | 'integrations:read' | 'integrations:write'

export type Role = 'owner' | 'admin' | 'integration_manager' | 'manager' | 'viewer'

const ROLE_SCOPES: Record<Role, Scope[]> = {
  owner: ['integrations:read', 'integrations:write', 'contacts:read', 'contacts:write', 'companies:read', 'companies:write', 'deals:read', 'deals:write', 'tasks:read', 'tasks:write', 'files:read', 'files:write', 'messages:read', 'messages:write'],
  admin: ['integrations:read', 'integrations:write', 'contacts:read', 'contacts:write', 'companies:read', 'companies:write', 'deals:read', 'deals:write', 'tasks:read', 'tasks:write', 'files:read', 'files:write', 'messages:read', 'messages:write'],
  integration_manager: ['integrations:read', 'integrations:write'],
  manager: ['integrations:read', 'contacts:read', 'contacts:write', 'companies:read', 'companies:write', 'deals:read', 'deals:write', 'tasks:read', 'tasks:write'],
  viewer: ['integrations:read', 'contacts:read', 'companies:read', 'deals:read', 'tasks:read', 'files:read', 'messages:read'],
}

// Admin-context fallback: if role unknown, allow (requireAuth gate still applies).
export function hasScope(role: string | undefined, scope: Scope): boolean {
  if (!role) return true
  const scopes = ROLE_SCOPES[role as Role]
  return scopes ? scopes.includes(scope) : false
}
