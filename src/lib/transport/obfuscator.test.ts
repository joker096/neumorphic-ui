import { describe, it, expect, vi } from 'vitest';
import { TrafficObfuscator } from './obfuscator';

function xorShroud(data: string, key: string): string {
  const encoded = btoa(data);
  let result = '';
  for (let i = 0; i < encoded.length; i++) {
    result += String.fromCharCode(encoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

describe('TrafficObfuscator aesgcm mode', () => {
  it('should encrypt and decrypt data with AES-GCM', async () => {
    const ob = new TrafficObfuscator('test-key', 'aesgcm');
    const encrypted = await ob.obfuscate('hello');
    const decrypted = await ob.deobfuscate(encrypted);
    expect(decrypted).toBe('hello');
  });

  it('should include version byte in encrypted output', async () => {
    const ob = new TrafficObfuscator('test-key', 'aesgcm');
    const encrypted = await ob.obfuscate('test-message');
    const raw = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
    expect(raw[0]).toBe(0x02);
  });

  it('should handle empty string', async () => {
    const ob = new TrafficObfuscator('test-key', 'aesgcm');
    expect(await ob.obfuscate('')).toBe('');
    expect(await ob.deobfuscate('')).toBe('');
  });

  it('should produce different ciphertext for same input', async () => {
    const ob = new TrafficObfuscator('test-key', 'aesgcm');
    const enc1 = await ob.obfuscate('data');
    const enc2 = await ob.obfuscate('data');
    expect(enc1).not.toBe(enc2);
  });

  it('should support backward compatibility with v1 XOR payloads', async () => {
    const ob = new TrafficObfuscator('test-key', 'aesgcm');
    const xorPayload = String.fromCharCode(0x01) + xorShroud('legacy-data', 'test-key');
    const result = await ob.deobfuscate(xorPayload);
    expect(result).toBe('legacy-data');
  });
});

describe('TrafficObfuscator httpmask mode', () => {
  it('should wrap data in HTTP/1.1 200 OK response', async () => {
    const ob = new TrafficObfuscator('test-key', 'httpmask');
    const result = await ob.obfuscate('hello');
    expect(result).toContain('HTTP/1.1 200 OK');
    expect(result).toContain('Content-Type: text/plain');
  });

  it('should unwrap HTTP-wrapped data', async () => {
    const ob = new TrafficObfuscator('test-key', 'httpmask');
    const wrapped = await ob.obfuscate('test-message');
    const unwrapped = await ob.deobfuscate(wrapped);
    expect(unwrapped).toBe('test-message');
  });

  it('should include realistic headers', async () => {
    const ob = new TrafficObfuscator('test-key', 'httpmask');
    const result = await ob.obfuscate('data');
    expect(result).toMatch(/User-Agent:/);
    expect(result).toMatch(/Accept:/);
  });

  it('should handle empty string', async () => {
    const ob = new TrafficObfuscator('test-key', 'httpmask');
    expect(await ob.obfuscate('')).toBe('');
    expect(await ob.deobfuscate('')).toBe('');
  });
});