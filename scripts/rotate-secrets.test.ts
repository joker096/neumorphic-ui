import { describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  MIN_SECRET_LENGTH,
  ROTATABLE_SECRETS,
  applyRotation,
  assertUsableSecret,
  fingerprint,
  generateSecret,
  main,
  parseEnvFile,
  planRotation,
  resolveTargetFile,
} from './rotate-secrets.mjs';

describe('secret generation', () => {
  it('produces a long, url-safe, unique value', () => {
    const first = generateSecret();
    const second = generateSecret();
    expect(first.length).toBeGreaterThanOrEqual(MIN_SECRET_LENGTH);
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(first).not.toBe(second);
  });

  it('never produces a value the server would reject', () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      expect(() => assertUsableSecret('JWT_SECRET', generateSecret())).not.toThrow();
    }
  });

  it('rejects a short or weak value', () => {
    expect(() => assertUsableSecret('JWT_SECRET', 'short')).toThrow(/shorter than/);
    expect(() => assertUsableSecret('JWT_SECRET', 'a'.repeat(40))).not.toThrow();
    expect(() => assertUsableSecret('JWT_SECRET', 'change_me'.padEnd(40, 'x'))).not.toThrow();
    expect(() => assertUsableSecret('JWT_SECRET', 'x'.repeat(31))).toThrow(/shorter than/);
    expect(() => assertUsableSecret('JWT_SECRET', 'change_me'.padEnd(40, ' '))).toThrow(/blocklist/);
  });
});

describe('fingerprint', () => {
  it('is stable, short and does not leak the secret', () => {
    const secret = 'super-secret-value-0123456789';
    const first = fingerprint(secret);
    expect(first).toBe(fingerprint(secret));
    expect(first).toHaveLength(12);
    expect(first).toMatch(/^[0-9a-f]{12}$/);
    expect(secret).not.toContain(first);
    expect(fingerprint('other-value')).not.toBe(first);
  });
});

describe('env file parsing', () => {
  const content = [
    '# comment line',
    'JWT_SECRET=first-value',
    '',
    'export PORT=3003',
    'RELAY_JWT_SECRET="quoted-value"',
    'not an assignment',
  ].join('\n');

  it('reads the assignments and ignores the rest', () => {
    const entries = parseEnvFile(content);
    expect(entries.map((entry) => entry.key)).toEqual(['JWT_SECRET', 'PORT', 'RELAY_JWT_SECRET']);
    expect(entries[0].value).toBe('first-value');
    expect(entries[2].value).toBe('quoted-value');
  });

  it('plans a rotation per requested secret', () => {
    const plan = planRotation(content, ['JWT_SECRET', 'RELAY_JWT_SECRET', 'MISSING_SECRET']);
    expect(plan[0]).toMatchObject({ name: 'JWT_SECRET', present: true });
    expect(plan[0].currentFingerprint).toBe(fingerprint('first-value'));
    expect(plan[1].present).toBe(true);
    expect(plan[2]).toMatchObject({ name: 'MISSING_SECRET', present: false, currentFingerprint: null });
  });
});

describe('rotation write', () => {
  it('replaces the value in place and keeps everything else', () => {
    const content = ['# keep me', 'JWT_SECRET=old-value', 'PORT=3003', ''].join('\n');
    const result = applyRotation(content, { JWT_SECRET: 'new-value' });
    expect(result).toContain('# keep me');
    expect(result).toContain('JWT_SECRET=new-value');
    expect(result).not.toContain('old-value');
    expect(result).toContain('PORT=3003');
    expect(result.endsWith('\n')).toBe(true);
  });

  it('appends a secret that the file does not carry yet', () => {
    const result = applyRotation('PORT=3003\n', { RELAY_JWT_SECRET: 'fresh' });
    expect(result).toContain('PORT=3003');
    expect(result).toContain('RELAY_JWT_SECRET=fresh');
  });

  it('rotates every requested secret at once', () => {
    const names = ROTATABLE_SECRETS.map((entry) => entry.name);
    const content = `${names.map((name) => `${name}=old`).join('\n')}\n`;
    const updates = Object.fromEntries(names.map((name) => [name, `new-${name}`]));
    const result = applyRotation(content, updates);
    for (const name of names) {
      expect(result).toContain(`${name}=new-${name}`);
      expect(result).not.toContain(`${name}=old`);
    }
  });
});

describe('target file resolution', () => {
  it('prefers an explicit path', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rotate-'));
    expect(resolveTargetFile(dir, join(dir, 'custom.env'))).toBe(join(dir, 'custom.env'));
  });

  it('prefers the repository root env file and falls back to the server one', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rotate-'));
    expect(resolveTargetFile(dir)).toBe(join(dir, 'server', '.env'));
    writeFileSync(join(dir, '.env'), 'JWT_SECRET=x\n');
    expect(resolveTargetFile(dir)).toBe(join(dir, '.env'));
  });

  it('uses the server env file when only that one exists', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rotate-'));
    mkdirSync(join(dir, 'server'));
    writeFileSync(join(dir, 'server', '.env'), 'JWT_SECRET=x\n');
    expect(resolveTargetFile(dir)).toBe(join(dir, 'server', '.env'));
  });
});

describe('command line', () => {
  const silence = () => vi.spyOn(console, 'log').mockImplementation(() => {});

  it('writes nothing on a dry run', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rotate-'));
    const file = join(dir, '.env');
    const original = '# keep me\nJWT_SECRET=old-value\nPORT=3003\n';
    writeFileSync(file, original);
    const log = silence();

    expect(main(['--file', file])).toBe(0);
    expect(readFileSync(file, 'utf8')).toBe(original);
    expect(readdirSync(dir)).toEqual(['.env']);
    // The plan is printed, the secret value is not.
    const output = log.mock.calls.map((call) => call.join(' ')).join('\n');
    expect(output).toContain('JWT_SECRET');
    expect(output).toContain(fingerprint('old-value'));
    expect(output).not.toContain('old-value');
    log.mockRestore();
  });

  it('rotates the file in place and keeps a backup', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rotate-'));
    const file = join(dir, '.env');
    writeFileSync(file, '# keep me\nJWT_SECRET=old-value\nPORT=3003\n');
    const log = silence();

    expect(main(['--file', file, '--apply'])).toBe(0);
    const updated = readFileSync(file, 'utf8');
    expect(updated).toContain('# keep me');
    expect(updated).toContain('PORT=3003');
    expect(updated).not.toContain('old-value');
    expect(updated).toMatch(/JWT_SECRET=\S{40,}/);

    // The backup keeps the previous content, so the operator can roll back.
    const backups = readdirSync(dir).filter((name) => name.startsWith('.env.bak-'));
    expect(backups).toHaveLength(1);
    expect(readFileSync(join(dir, backups[0]), 'utf8')).toContain('old-value');

    // The printed output carries the new fingerprint, never the new value.
    const output = log.mock.calls.map((call) => call.join(' ')).join('\n');
    const secret = /JWT_SECRET=(\S+)/.exec(updated)?.[1] ?? '';
    expect(secret).not.toBe('');
    expect(output).toContain(fingerprint(secret));
    expect(output).not.toContain(secret);
    log.mockRestore();
  });

  it('refuses a secret it does not own', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rotate-'));
    const file = join(dir, '.env');
    writeFileSync(file, 'JWT_SECRET=old-value\n');
    const log = silence();

    expect(() => main(['--file', file, '--key', 'PAYMENTO_API_KEY', '--apply'])).toThrow(
      /Not rotatable here/,
    );
    expect(readFileSync(file, 'utf8')).toBe('JWT_SECRET=old-value\n');
    log.mockRestore();
  });
});
