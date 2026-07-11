// src/lib/p2p/MeshDHT.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { MeshDHT, DHTNode } from './MeshDHT'

describe('MeshDHT', () => {
  beforeEach(() => {
    MeshDHT.clear()
  })

  it('should add a node to the DHT', async () => {
    const node: DHTNode = {
      nodeId: 'node-1',
      publicKey: 'node-1',
      peerId: 'node-1',
      lastSeen: Date.now(),
      latency: 50,
      path: ['hop1', 'hop2'],
    }

    await MeshDHT.addNode(node)
    const result = MeshDHT.getNode('node-1')
    expect(result).not.toBeNull()
    expect(result?.latency).toBe(50)
  })

  it('should get node by public key', () => {
    const node: DHTNode = {
      nodeId: 'test-node',
      publicKey: 'test-node',
      peerId: 'test-node',
      lastSeen: Date.now(),
      latency: 30,
      path: ['path'],
    }

    MeshDHT.addNode(node)

    const result = MeshDHT.getNode('test-node')
    expect(result).not.toBeNull()
    expect(result?.latency).toBe(30)
  })

  it('should handle non-existent node', () => {
    const result = MeshDHT.getNode('non-existent')
    expect(result).toBeNull()
  })

  it('should remove node', () => {
    const node: DHTNode = {
      nodeId: 'remove-me',
      publicKey: 'remove-me',
      peerId: 'remove-me',
      lastSeen: Date.now(),
      latency: 40,
      path: ['path'],
    }

    MeshDHT.addNode(node)
    MeshDHT.removeNode('remove-me')

    const result = MeshDHT.getNode('remove-me')
    expect(result).toBeNull()
  })

  it('should get closest nodes', () => {
    const node1: DHTNode = {
      nodeId: 'close',
      publicKey: 'close',
      peerId: 'close',
      lastSeen: Date.now(),
      latency: 10,
      path: ['close-path'],
    }

    const node2: DHTNode = {
      nodeId: 'far',
      publicKey: 'far',
      peerId: 'far',
      lastSeen: Date.now(),
      latency: 100,
      path: ['far-path'],
    }

    const result = MeshDHT.getClosestNodes('target', 3)
    expect(result).toHaveLength(0) // No nodes added yet

    // Add nodes to the table
    const newNode1: DHTNode = {
      nodeId: 'close',
      publicKey: 'close',
      peerId: 'close',
      lastSeen: Date.now(),
      latency: 10,
      path: ['close-path'],
    }

    const newNode2: DHTNode = {
      nodeId: 'far',
      publicKey: 'far',
      peerId: 'far',
      lastSeen: Date.now(),
      latency: 100,
      path: ['far-path'],
    }

    MeshDHT.addNode(node1)
    MeshDHT.addNode(node2)

    // Now test with nodes
    const resultWithNodes = MeshDHT.getClosestNodes('target', 3)
    expect(resultWithNodes).toHaveLength(2)
  })

  it('should clear table', () => {
    MeshDHT.clear()
    const result = MeshDHT.getClosestNodes('target', 3)
    expect(result).toHaveLength(0)
  })

  it('should cleanup expired nodes', () => {
    MeshDHT.clear()
    const expiredNode = { nodeId: 'old-node', publicKey: 'old-node', peerId: 'old-node', lastSeen: Date.now() - 7200000, latency: 50, path: ['path'] }
    ;(MeshDHT as any).table = new Map([['old-node', expiredNode]])
    MeshDHT.cleanup()
    const result = MeshDHT.getNode('old-node')
    expect(result).toBeNull()
  })

  it('should return table', () => {
    const table = MeshDHT.getTable()
    expect(table).toBeInstanceOf(Map)
  })
})
