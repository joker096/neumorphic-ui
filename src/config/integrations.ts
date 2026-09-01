// Integrations gateway API endpoints (self-hosted REST proxy).
// Centralized so the base path + subroutes can't drift across panels.

export const INTEGRATIONS_BASE = '/api/v1/integrations'

export const INTEGRATIONS_PATH = INTEGRATIONS_BASE

export function integrationPath(subroute: 'connect' | 'imports' | 'mappings' | 'logs' | 'conflicts' | 'health', id: string): string {
  return `${INTEGRATIONS_BASE}/${encodeURIComponent(id)}/${subroute}`
}