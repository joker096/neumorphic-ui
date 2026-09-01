import { describe, it, expect, beforeEach } from 'vitest';
import { createMessAngerSdk } from './sdk';
import { useAppStore } from '../store';

describe('MessAnger SDK', () => {
  beforeEach(() => {
    useAppStore.getState().resetCrmDemo?.('u_self', 'Me');
  });

  it('imports CSV text', async () => {
    const sdk = createMessAngerSdk();
    const res = await sdk.importText('name,phone\nAlice,123\nBob,456');
    expect(res.imported).toBe(2);
    const names = sdk.getContacts().map((c) => c.displayName);
    expect(names).toContain('Alice');
    expect(names).toContain('Bob');
  });

  it('exposes analytics over store data', () => {
    const sdk = createMessAngerSdk();
    const a = sdk.getAnalytics();
    expect(typeof a.totalContacts).toBe('number');
    expect(typeof a.pipelineValue).toBe('number');
    expect(Array.isArray(a.churnRisk)).toBe(true);
  });

  it('reports a semver version', () => {
    expect(createMessAngerSdk().version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('syncs messenger contacts without duplicating', () => {
    const sdk = createMessAngerSdk();
    const before = sdk.getContacts().length;
    const r = sdk.syncMessenger([
      { id: 'm1', name: 'Mess One', color: '#000', tags: ['client'], lastSeen: Date.now() },
      { id: 'm2', name: 'Mess Two', color: '#111', tags: ['lead'], lastSeen: Date.now() },
    ]);
    expect(r.added).toBe(2);
    expect(sdk.getContacts().length).toBe(before + 2);
    const r2 = sdk.syncMessenger([{ id: 'm1', name: 'Mess One', color: '#000', tags: ['client'], lastSeen: Date.now() }]);
    expect(r2.updated).toBe(1);
    expect(r2.added).toBe(0);
  });
});
