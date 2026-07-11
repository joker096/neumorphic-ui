// src/lib/p2p/MeshRoutingTable.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { MeshRoutingTable } from './MeshRoutingTable'

describe('MeshRoutingTable', () => {
  beforeEach(() => {
    MeshRoutingTable.clear()
  })

  it('should add a node to the routing table', () => {
    MeshRoutingTable.addNode({
      nodeId: 'node-1',
      publicKey: 'node-1',
      peerId: 'node-1',
      lastSeen: Date.now(),
      hops: 1,
      path: ['node1', 'node2'],
    })

    const node = MeshRoutingTable.getNode('node-1')
    expect(node).not.toBeNull()
    expect(node?.hops).toBe(1)
    expect(node?.path).toEqual(['node1', 'node2'])
  })

  it('should get node by public key', () => {
    MeshRoutingTable.addNode({
      nodeId: 'test-node',
      publicKey: 'test-node',
      peerId: 'test-node',
      lastSeen: Date.now(),
      hops: 2,
      path: ['hop1', 'hop2'],
    })

    const node = MeshRoutingTable.getNode('test-node')
    expect(node).not.toBeNull()
    expect(node?.hops).toBe(2)
  })

  it('should remove node', () => {
    MeshRoutingTable.addNode({
      nodeId: 'remove-me',
      publicKey: 'remove-me',
      peerId: 'remove-me',
      lastSeen: Date.now(),
      hops: 1,
      path: ['path'],
    })

    MeshRoutingTable.removeNode('remove-me')
    const node = MeshRoutingTable.getNode('remove-me')
    expect(node).toBeNull()
  })

  it('should find closest nodes', () => {
    MeshRoutingTable.addNode({
      nodeId: 'close',
      publicKey: 'close',
      peerId: 'close',
      lastSeen: Date.now(),
      hops: 1,
      path: ['close-path'],
    })

    MeshRoutingTable.addNode({
      nodeId: 'far',
      publicKey: 'far',
      peerId: 'far',
      lastSeen: Date.now(),
      hops: 5,
      path: ['far-path'],
    })

    const closest = MeshRoutingTable.getClosestNodes('target', 3)
    expect(closest).not.toBeNull()
    expect(closest.length).toBe(2)
    expect(closest[0]?.hops).toBe(1)
  })

  it('should clear the table', () => {
    MeshRoutingTable.addNode({
      nodeId: 'clear-me',
      publicKey: 'clear-me',
      peerId: 'clear-me',
      lastSeen: Date.now(),
      hops: 1,
      path: ['path'],
    })

    MeshRoutingTable.clear()
    const node = MeshRoutingTable.getNode('clear-me')
    expect(node).toBeNull()
  })

  it('should return table', () => {
    MeshRoutingTable.addNode({
      nodeId: 'table-node',
      publicKey: 'table-node',
      peerId: 'table-node',
      lastSeen: Date.now(),
      hops: 1,
      path: ['path'],
    })

    const table = MeshRoutingTable.getTable()
    expect(table.has('table-node')).toBe(true)
  })
})
