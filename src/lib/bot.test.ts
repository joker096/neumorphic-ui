import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBotConfig } from './bot';
import { DEFAULT_BOT_PERMISSIONS } from '../store/defaults';

const mockSubtle = {
  generateKey: vi.fn().mockResolvedValue({ publicKey: {}, privateKey: {} }),
  exportKey: vi.fn((format: string) =>
    format === 'raw'
      ? Promise.resolve(new Uint8Array([1, 2, 3]))
      : Promise.resolve({ d: 'd-value' })
  ),
  digest: vi.fn().mockResolvedValue(new Uint8Array(32).fill(7)),
};

vi.mock('./deviceSecurity', () => ({
  deviceSecurity: {
    getDeviceFingerprint: vi.fn().mockResolvedValue('fingerprint-string'),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('crypto', { subtle: mockSubtle });
});

describe('createBotConfig', () => {
  it('creates a valid bot config with trimmed name, id prefix and default owner', async () => {
    const bot = await createBotConfig('  Helper Bot  ');

    expect(bot.name).toBe('Helper Bot');
    expect(bot.id).toMatch(/^bot_\d+$/);
    expect(bot.ownerId).toBe('me');
    expect(bot.permissions).toEqual(DEFAULT_BOT_PERMISSIONS);
    expect(bot.isRunning).toBe(false);
    expect(bot.commands).toEqual([]);
  });

  it('embeds public key, fingerprint hash and private secret in token', async () => {
    const bot = await createBotConfig('Helper');

    expect(bot.publicKey).toBe(btoa(String.fromCharCode(1, 2, 3)));
    expect(bot.token).toBe(`bot:${bot.id}_07070707_${btoa('d-value')}`);
  });

  it('requests ECDH P-256 key pair', async () => {
    await createBotConfig('Helper');

    expect(mockSubtle.generateKey).toHaveBeenCalledWith(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );
  });
});
