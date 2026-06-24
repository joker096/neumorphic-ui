import { describe, it, expect } from 'vitest';
import { WsTunnel, createWsTunnel } from './wsTunnel';

describe('WsTunnel v2', () => {
  it('should create tunnel with direct backend', () => {
    const tunnel = createWsTunnel('wss://example.com/ws', 'direct');
    expect(tunnel).toBeDefined();
    expect(tunnel.getBackend()).toBe('direct');
  });

  it('should create tunnel with cfworker backend', () => {
    const tunnel = createWsTunnel('https://worker.example.com/ws', 'cfworker');
    expect(tunnel.getBackend()).toBe('cfworker');
  });

  it('should format CF Worker URL correctly', () => {
    const tunnel = createWsTunnel('https://my-worker.example.workers.dev/ws', 'cfworker');
    const formatted = tunnel.formatRelayUrl('my-worker.example.workers.dev');
    expect(formatted).toContain('wss://my-worker.example.workers.dev/ws');
  });
});
