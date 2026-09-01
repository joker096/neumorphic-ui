import { describe, it, expect } from 'vitest';
import { INTEGRATIONS_BASE, INTEGRATIONS_PATH, integrationPath } from './integrations';

describe('integration endpoints', () => {
  it('exposes the base path', () => {
    expect(INTEGRATIONS_BASE).toBe('/api/v1/integrations');
    expect(INTEGRATIONS_PATH).toBe('/api/v1/integrations');
  });

  it('builds subroute URLs', () => {
    expect(integrationPath('connect', 'abc')).toBe('/api/v1/integrations/abc/connect');
    expect(integrationPath('health', 'xyz')).toBe('/api/v1/integrations/xyz/health');
    expect(integrationPath('logs', 'a b')).toBe('/api/v1/integrations/a%20b/logs');
  });
});