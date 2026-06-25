# Real Mesh Radar — Design Spec

## Problem
`MeshRadar.tsx` uses hardcoded mock data (3 fake peers) for the radar visualization instead of real peer connections.

## Sources

### Direct WebRTC peers (`P2PNetwork`)
```typescript
interface PeerConnection {
  peerId: string
  connected: boolean
  lastSeen: number
}
```
- **Access:** `p2pNetwork.getPeers()` → `PeerConnection[]`
- **Color:** Green (`#2bca74` / `#10b981`)
- **Label:** `<shortId> · WebRTC`
- **Position:** Stable per peerId (FNV hash → angle)

### Mesh routes (`MeshRouter`)
```typescript
interface RouteEntry {
  peerId: string
  nextHop: string
  hops: number
  lastSeen: number
}
```
- **Access:** `meshRouter.getRoutingTable()` → `RouteEntry[]`
- **Color:** Blue (`#3b82f6`) for 1-hop, Amber (`#f59e0b`) for 2+ hops
- **Label:** `<shortId> · Mesh (N hops)`
- **Distance:** Proportional to hops (closer = fewer hops)

## Merging Logic
1. Get direct peers → mark as `type: 'direct'`
2. Get mesh routes → mark as `type: 'mesh'` with `hops`
3. Deduplicate by peerId (direct wins over mesh)
4. Sort: direct first, then by hops
5. If both empty → show "No peers connected"

## Hook: `useMeshPeers`
- Subscribes to `p2pNetwork` connection/disconnection callbacks
- Subscribes to `meshRouter.onRouteChange`
- Returns `{ peers: MeshPeer[], peerCount, directCount, meshCount }`
- Updates on every change via React state

## Radar Visualization
- Same canvas animation (radar sweep, rings, base)
- Nodes positioned by stable angle from `peerId` hash
- Distance from center proportional to hops (direct = closer)
- Direct peers pulse (green)
- Connection lines from center to each peer
- Bottom list: type indicator dot + peer label + distance label

## States
| State | Display |
|-------|---------|
| Loading (no data yet) | Radar animation + "Scanning..." |
| Has peers | Normal radar with nodes |
| Empty (no peers) | Radar animation + "No peers connected" |
| Peer disconnects | Real-time removal from radar |

## Files to change
- `src/components/MeshRadar.tsx` — replace mock data, add real peer rendering
- `src/lib/p2p/network.ts` — make `onConnection`/`onDisconnection` return unsubscribe (optional but clean)
