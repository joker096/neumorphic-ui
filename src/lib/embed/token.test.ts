// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createEmbedToken, parseEmbedToken, generateEmbedSnippet } from './token';

describe('embed token', () => {
  const cfg = {
    companyId: 'co_123',
    channelId: 'chan_abc',
    channelPubKeyB64: 'ABC123===',
    label: 'Sales',
  };

  it('round-trips a token', () => {
    const token = createEmbedToken(cfg);
    const parsed = parseEmbedToken(token);
    expect(parsed.companyId).toBe(cfg.companyId);
    expect(parsed.channelId).toBe(cfg.channelId);
    expect(parsed.channelPubKeyB64).toBe(cfg.channelPubKeyB64);
    expect(parsed.label).toBe(cfg.label);
  });

  it('rejects a malformed token', () => {
    expect(() => parseEmbedToken('not-a-token')).toThrow();
  });

  it('generates an embed snippet containing the token', () => {
    const snippet = generateEmbedSnippet('TOKENXYZ');
    expect(snippet).toContain('<script');
    expect(snippet).toContain('TOKENXYZ');
    expect(snippet).toContain('data-messanger-token');
  });
});
