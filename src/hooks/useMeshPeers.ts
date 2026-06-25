import { useState, useEffect, useCallback } from 'react'
import { p2pNetwork } from '../lib/p2p/network'
import type { PeerConnection } from '../lib/p2p/network'

export interface MeshPeer {
  peerId: string
  type: 'direct' | 'mesh'
  connected: boolean
  lastSeen: number
  hops: number
  label: string
  color: string
}

function fnvHash(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function stableAngle(id: string): number {
  return (fnvHash(id + '_angle') % 1000) / 1000 * Math.PI * 2
}

function stableDistance(id: string, baseMin: number, baseMax: number): number {
  const t = (fnvHash(id + '_dist') % 1000) / 1000
  return baseMin + t * (baseMax - baseMin)
}

const COLORS = {
  direct: '#2bca74',
  mesh1: '#3b82f6',
  mesh2: '#f59e0b',
}

export function useMeshPeers() {
  const [peers, setPeers] = useState<MeshPeer[]>([])

  const sync = useCallback(() => {
    const direct: PeerConnection[] = p2pNetwork.getPeers()

    const mapped: MeshPeer[] = direct.map((p) => ({
      peerId: p.peerId,
      type: 'direct' as const,
      connected: p.connected,
      lastSeen: p.lastSeen,
      hops: 0,
      label: `${p.peerId.slice(0, 8)} · WebRTC`,
      color: COLORS.direct,
    }))

    mapped.sort((a, b) => {
      if (a.connected !== b.connected) return a.connected ? -1 : 1
      return b.lastSeen - a.lastSeen
    })

    setPeers(mapped)
  }, [])

  useEffect(() => {
    sync()
    p2pNetwork.onConnection(sync)
    p2pNetwork.onDisconnection(sync)
  }, [sync])

  const count = peers.length
  const directCount = peers.filter(p => p.type === 'direct').length
  const meshCount = count - directCount

  return {
    peers: peers.map(p => ({
      ...p,
      angle: stableAngle(p.peerId),
      distance: p.type === 'direct'
        ? stableDistance(p.peerId, 0.2, 0.4)
        : stableDistance(p.peerId, 0.4 + p.hops * 0.15, 0.5 + p.hops * 0.15),
    })),
    count,
    directCount,
    meshCount,
  }
}
