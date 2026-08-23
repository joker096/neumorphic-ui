import { describe, it, expect, beforeEach } from 'vitest';
import { secureSetItem, secureGetItem, secureRemoveItem } from './secureStorage';

describe('secureStorage', () => {
  beforeEach(() => localStorage.clear());

  it('stores and retrieves a value', async () => {
    await secureSetItem('k', 'secret-value');
    expect(await secureGetItem('k')).toBe('secret-value');
  });

  it('returns null for a missing key', async () => {
    expect(await secureGetItem('missing')).toBeNull();
  });

  it('returns null for corrupt data', async () => {
    localStorage.setItem('bad', 'not-base64-@@@');
    expect(await secureGetItem('bad')).toBeNull();
  });

  it('removes a value', async () => {
    await secureSetItem('k', 'v');
    await secureRemoveItem('k');
    expect(await secureGetItem('k')).toBeNull();
  });

  it('encrypts so stored bytes differ from the plaintext', async () => {
    await secureSetItem('k', 'v');
    const raw = localStorage.getItem('k')!;
    expect(raw).not.toBe(btoa('v'));
    expect(await secureGetItem('k')).toBe('v');
  });
});
