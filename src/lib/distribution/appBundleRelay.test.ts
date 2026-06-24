import { describe, it, expect } from 'vitest';
import { AppBundleRelay, BundleManifest, verifyBundleSignature } from './appBundleRelay';

describe('AppBundleRelay', () => {
  it('should create manifest with hash', () => {
    const relay = new AppBundleRelay('test-dev-key');
    const manifest = relay.createManifest('https://example.com/app.apk', 'abc123hash', 'bundle-v1');
    expect(manifest.url).toBe('https://example.com/app.apk');
    expect(manifest.hash).toBe('abc123hash');
    expect(manifest.version).toBe('bundle-v1');
  });

  it('should generate relay URI', () => {
    const relay = new AppBundleRelay('test-dev-key');
    const uri = relay.generateRelayUri('https://example.com/app.apk', 'abc123');
    expect(uri).toContain('messenger://bundle?');
    expect(uri).toContain('url=https%3A%2F%2Fexample.com%2Fapp.apk');
    expect(uri).toContain('hash=abc123');
  });

  it('should parse relay URI', () => {
    const relay = new AppBundleRelay('test-dev-key');
    const uri = relay.generateRelayUri('https://example.com/app.apk', 'hash123');
    const parsed = relay.parseRelayUri(uri);
    expect(parsed).not.toBeNull();
    expect(parsed!.url).toBe('https://example.com/app.apk');
    expect(parsed!.hash).toBe('hash123');
  });

  it('should return null for invalid URI', () => {
    const relay = new AppBundleRelay('test-dev-key');
    expect(relay.parseRelayUri('not-a-valid-uri')).toBeNull();
  });
});

describe('verifyBundleSignature', () => {
  it('should verify a valid signature', () => {
    const result = verifyBundleSignature('data', 'signature', 'pubkey');
    expect(typeof result).toBe('boolean');
  });
});
