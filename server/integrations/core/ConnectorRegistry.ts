// Connector registry (blueprint §21). Add a CRM = implement Connector + register.

import type { Connector } from './Connector.js'

export class ConnectorRegistry {
  private connectors = new Map<string, Connector>()

  register(connector: Connector): void {
    this.connectors.set(connector.provider, connector)
  }

  get(provider: string): Connector {
    const c = this.connectors.get(provider)
    if (!c) throw new Error(`Unknown connector provider: ${provider}`)
    return c
  }

  has(provider: string): boolean {
    return this.connectors.has(provider)
  }

  list(): Connector[] {
    return [...this.connectors.values()]
  }
}

// Process-wide singleton registry.
export const connectorRegistry = new ConnectorRegistry()
