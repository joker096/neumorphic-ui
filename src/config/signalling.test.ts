import { describe, expect, it } from 'vitest';
import { resolveSeedUrls } from './signalling';

describe('resolveSeedUrls', () => {
  it('prefers explicit wss:// env seeds and drops invalid entries', () => {
    expect(
      resolveSeedUrls(
        'wss://a.example/ws, http://b.example/ws, ws://c.example/ws, wss://d.example/ws',
        { protocol: 'https:', host: 'mess.cvr.name' },
      ),
    ).toEqual(['wss://a.example/ws', 'wss://d.example/ws']);
  });

  it('falls back to same-origin wss when no env seed is set (https)', () => {
    expect(resolveSeedUrls(undefined, { protocol: 'https:', host: 'mess.cvr.name' })).toEqual([
      'wss://mess.cvr.name/ws',
    ]);
  });

  it('falls back to same-origin ws over http (local dev)', () => {
    expect(resolveSeedUrls(undefined, { protocol: 'http:', host: 'localhost:3000' })).toEqual([
      'ws://localhost:3000/ws',
    ]);
  });

  it('treats an empty/whitespace env as unset', () => {
    expect(resolveSeedUrls('   ', { protocol: 'https:', host: 'mess.cvr.name' })).toEqual([
      'wss://mess.cvr.name/ws',
    ]);
  });

  it('returns no seeds without a DOM origin', () => {
    expect(resolveSeedUrls(undefined, null)).toEqual([]);
  });

  it('ignores non-http(s) origins', () => {
    expect(resolveSeedUrls(undefined, { protocol: 'file:', host: '' })).toEqual([]);
    expect(resolveSeedUrls(undefined, { protocol: 'tauri:', host: 'localhost' })).toEqual([]);
  });
});
