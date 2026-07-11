// src/lib/network/MeshNetwork.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { MeshNetwork } from './MeshNetwork'

describe('MeshNetwork', () => {
  beforeEach(() => {
    MeshNetwork.clear()
  })

  it('should add a peer', () => {
    MeshNetwork.addPeer({
      id: 'peer-1',
      connected: true,
      latency: 50,
      path: ['hop1'],
    })

    const peer = MeshNetwork.getPeer('peer-1')
    expect(peer).not.toBeNull()
    expect(peer?.connected).toBe(true)
  })

  it('should get connected peers', () => {
    MeshNetwork.addPeer({
      id: 'connected',
      connected: true,
      latency: 30,
      path: ['path'],
    })

    MeshNetwork.addPeer({
      id: 'disconnected',
      connected: false,
      latency: 100,
      path: ['path'],
    })

    const connected = MeshNetwork.getConnectedPeers()
    expect(connected).toHaveLength(1)
    expect(connected[0].id).toBe('connected')
  })

  it('should get peer count', () => {
    MeshNetwork.addPeer({
      id: 'peer-1',
      connected: true,
      latency: 30,
      path: ['path'],
    })

    MeshNetwork.addPeer({
      id: 'peer-2',
      connected: false,
      latency: 100,
      path: ['path'],
    })

    expect(MeshNetwork.getPeerCount()).toBe(2)
  })

  it('should get connected count', () => {
    MeshNetwork.addPeer({
      id: 'connected',
      connected: true,
      latency: 30,
      path: ['path'],
    })

    expect(MeshNetwork.getConnectedCount()).toBe(1)
  })

  it('should set and get node info', () => {
    MeshNetwork.setNodeInfo('node-key', {
      publicKey: 'node-key',
      address: '127.0.0.1',
      capabilities: ['mesh', 'relay'],
      lastSeen: Date.now(),
      latency: 50,
    })

    const info = MeshNetwork.getNodeInfo('node-key')
    expect(info).not.toBeNull()
    expect(info?.address).toBe('127.0.0.1')
  })

  it('should clear the network', () => {
    MeshNetwork.addPeer({
      id: 'peer-1',
      connected: true,
      latency: 30,
      path: ['path'],
    })

    MeshNetwork.clear()
    const peer = MeshNetwork.getPeer('peer-1')
    expect(peer).toBeNull()
  })

  it('should check if peer exists', () => {
    MeshNetwork.addPeer({
      id: 'exists',
      connected: true,
      latency: 30,
      path: ['path'],
    })

    expect(MeshNetwork.hasPeer('exists')).toBe(true)
    expect(MeshNetwork.hasPeer('not-exists')).toBe(false)
  })

  it('should check if node info exists', () => {
    MeshNetwork.setNodeInfo('node-info', {
      publicKey: 'node-info',
      address: '127.0.0.1',
      capabilities: ['mesh'],
      lastSeen: Date.now(),
      latency: 50,
    })

    expect(MeshNetwork.hasNodeInfo('node-info')).toBe(true)
    expect(MeshNetwork.hasNodeInfo('no-info')).toBe(false)
  })

  it('should return peers map', () => {
    const peers = MeshNetwork.getPeers()
    expect(peers).toBeInstanceOf(Map)
  })
})
