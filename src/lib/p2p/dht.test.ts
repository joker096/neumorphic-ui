import { describe, it, expect } from 'vitest';
import { DHTNode, KBucket } from './dht';

describe('KBucket', () => {
  it('should store up to k entries', () => {
    const bucket = new KBucket(20);
    for (let i = 0; i < 20; i++) bucket.add(`peer-${i}`, `addr-${i}`);
    expect(bucket.size()).toBe(20);
  });

  it('should reject beyond capacity', () => {
    const bucket = new KBucket(2);
    bucket.add('a', 'addr-a');
    bucket.add('b', 'addr-b');
    bucket.add('c', 'addr-c');
    expect(bucket.size()).toBe(2);
  });

  it('should find by peerId', () => {
    const bucket = new KBucket(20);
    bucket.add('target', 'addr');
    expect(bucket.find('target')).toBe('addr');
  });
});

describe('DHTNode', () => {
  it('should create with nodeId', () => {
    const node = new DHTNode('node-1');
    expect(node.nodeId).toBe('node-1');
  });

  it('should store and retrieve values', () => {
    const node = new DHTNode('node-1');
    node.storeValue('key1', 'value1');
    expect(node.findValue('key1')).toBe('value1');
  });
});