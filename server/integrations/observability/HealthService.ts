// Integration Hub — Health (blueprint §74).
export type Health =
  | 'HEALTHY' | 'WARNING' | 'DEGRADED' | 'ERROR' | 'DISCONNECTED' | 'REAUTH_REQUIRED'

export class HealthService {
  private state: Record<string, Health> = {}
  set(integrationId: string, h: Health): void {
    this.state[integrationId] = h
  }
  get(integrationId: string): Health {
    return this.state[integrationId] ?? 'HEALTHY'
  }
}

export const health = new HealthService()
