import { describe, it, expect } from 'vitest';
import { parseCrmDeepLink, runCrmDeepLink } from './deepLink';
import { createMessAngerSdk } from '../sdk';

const enc = (s: string) => (typeof btoa !== 'undefined' ? btoa(s) : Buffer.from(s).toString('base64'));

describe('crm deep link', () => {
  it('parses ?crmImport base64', () => {
    const b = enc('name,phone\nAlice,1');
    const r = parseCrmDeepLink(`?crmImport=${b}`);
    expect(r?.source).toBe('query');
    expect(r?.text).toBe('name,phone\nAlice,1');
  });

  it('parses messanger:// scheme data', () => {
    const b = enc('name,phone\nBob,2');
    const r = parseCrmDeepLink('', `messanger://import?data=${b}`);
    expect(r?.source).toBe('scheme');
    expect(r?.text).toBe('name,phone\nBob,2');
  });

  it('returns null when absent', () => {
    expect(parseCrmDeepLink('?foo=bar')).toBeNull();
  });

  it('runs import via SDK', async () => {
    const b = enc('name,phone\nZoe,9');
    const r = await runCrmDeepLink(createMessAngerSdk(), `?crmImport=${b}`);
    expect(r?.imported).toBe(1);
  });

  it('returns null via SDK when no link', async () => {
    const r = await runCrmDeepLink(createMessAngerSdk(), '?x=1');
    expect(r).toBeNull();
  });
});
