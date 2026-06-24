import { describe, it, expect } from 'vitest';
import { TrafficObfuscator } from './obfuscator';

describe('TrafficObfuscator httpmask mode', () => {
  it('should wrap data in HTTP/1.1 200 OK response', () => {
    const ob = new TrafficObfuscator('test-key', 'httpmask');
    const result = ob.obfuscate('hello');
    expect(result).toContain('HTTP/1.1 200 OK');
    expect(result).toContain('Content-Type: text/plain');
  });

  it('should unwrap HTTP-wrapped data', () => {
    const ob = new TrafficObfuscator('test-key', 'httpmask');
    const wrapped = ob.obfuscate('test-message');
    const unwrapped = ob.deobfuscate(wrapped);
    expect(unwrapped).toBe('test-message');
  });

  it('should include realistic headers', () => {
    const ob = new TrafficObfuscator('test-key', 'httpmask');
    const result = ob.obfuscate('data');
    expect(result).toMatch(/User-Agent:/);
    expect(result).toMatch(/Accept:/);
  });

  it('should handle empty string', () => {
    const ob = new TrafficObfuscator('test-key', 'httpmask');
    expect(ob.obfuscate('')).toBe('');
    expect(ob.deobfuscate('')).toBe('');
  });
});
