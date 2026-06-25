# Censorship Resilience — Design Spec for Mess&Anger

> **Date:** 2026-06-24
> **Status:** Draft
> **Scope:** Full censorship circumvention suite — transport obfuscation, multi-relay signalling, P2P bootstrap fallback, distribution resilience

## 1. Architecture Overview

Three layers working together — each layer degrades independently when blocked:

```
Application Layer (unchanged)
  ──────────────────────────────────
Transport Layer (new)
  ├── Realistic traffic camouflage
  ├── Multi-relay WebSocket tunnelling (Cloudflare Workers, domain fronting, peer relay)
  └── Auto-select best available transport
  ──────────────────────────────────
Network Layer (new)
  ├── Multi-signalling seed pool (5-10 nodes)
  ├── Kademlia DHT bootstrap as fallback
  └── MeshRouter auto-discovery integration
  ──────────────────────────────────
Distribution Layer (new)
  ├── PWA offline-first + app shell caching
  ├── QR side-loading relay via mesh
  └── Signed bundle verification
```

## 2. Transport Layer — Traffic Camouflage & Tunnelling

### 2.1 TrafficObfuscator v2 (`src/lib/transport/obfuscator.ts`)
- **Current:** XOR-based obfuscation — detectable by DPI as random binary
- **Target:** Realistic protocol mimicry

**Modes:**
| Mode | Behaviour | Detection Risk |
|------|-----------|----------------|
| `none` | No obfuscation | High |
| `xorshroud` | Current XOR (minimal) | Medium-High |
| `httpmask` | Wraps WS frames in HTTP/1.1 chunked encoding with realistic headers | Low |
| `mediadummy` | Emulates WebRTC media RTP/RTCP dummy packets | Very Low |

**HTTP mask details:**
- Each WS message wrapped in `HTTP/1.1 200 OK` response with realistic headers
- Random padding in chunked encoding body
- Timing jitter applied between chunks (±200ms random delay)
- Headers rotated from a pool (~50 realistic User-Agents, Accept-Language variants)

### 2.2 WsTunnel v2 (`src/lib/transport/wsTunnel.ts`)
- **Current:** Direct WebSocket to a single URL
- **Target:** Multi-relay tunnelling with failover

**Relay backends:**
| Backend | Type | Blockable? |
|---------|------|------------|
| `direct` | Raw WSS to signalling server | Yes — IP/SNI |
| `cfworker` | WebSocket via Cloudflare Worker | No — CF IPs are shared |
| `domainfront` | Domain fronting via CDN (e.g. CloudFront, Fastly) | Difficult — requires DPI on shared CDN |
| `peertunnel` | WebSocket tunnelled through a peer's P2P connection | No — peer IPs vary |

**Auto-select algorithm (in `TransportSelector`):**
```
1. Probe direct WSS — if OK within 3s → use
2. If fail → probe cfworker from pool — if OK → use, mark current region blocked
3. If fail → probe domainfront — if OK → use
4. If fail → request peer relay via MeshRouter — if any peer responds → tunnel through peer
5. If all fail → emit event → DHT bootstrap fallback (see §3.2)
```

**State persistence:**
- Blocked backends are cached in localStorage with TTL (24h)
- Region-based blocking detection: if 3+ CF workers in same region fail, mark region as blocked
- Periodic retry of blocked backends (exponential backoff, max 7d)

### 2.3 Connection Pool (`src/lib/transport/pool.ts`)
- Maintains 2 simultaneous WebSocket connections to different backends
- Primary connection handles active signalling, secondary is warm standby
- Ping/past health checks every 15s
- Failover completes in <500ms

## 3. Network Layer — Multi-Signalling & Decentralized Bootstrap

### 3.1 Seed Signalling Pool (`src/lib/network/signallingPool.ts`)
- App ships with 10 seed signalling URLs (different domains, hosting providers, jurisdictions)
- Each seed is signed with the app developer's ed25519 key (prevent tampering)
- On startup: random shuffle, probe sequentially until one connects
- Dynamic updates: mesh peers can share new working seed URLs (verified via developer signature)
- Seed list stored in encrypted IndexedDB, fallback = hardcoded + signed in app bundle

### 3.2 DHT Bootstrap (`src/lib/p2p/dht.ts`)
- Kademlia-style DHT running on WebRTC DataChannels
- Node ID = SHA-256(publicKey)
- Each node stores k-buckets of neighbouring peers (k=20)
- DHT operations: `FIND_NODE`, `FIND_PEER`, `STORE`/`FIND_VALUE` (for seed URLs)

**Bootstrap without signalling:**
```
1. Read last-known peers from IndexedDB (persistent DHT routing table)
2. If no peers → use hardcoded bootstrap peers from app bundle (3-5 nodes)
3. Send FIND_NODE to bootstrap peers → populate k-buckets
4. Once connected to any peer via DHT → can discover others
```

**Integration with existing MeshRouter:**
- MeshRouter already handles route advertisements and mesh forwarding
- DHT layer sits on top: uses MeshRouter's `broadcastFn` for DHT pings
- When MeshRouter discovers a new peer, DHT k-bucket is updated
- When DHT finds a new peer, MeshRouter gets a `addDirectPeer` call

### 3.3 SignallingManager (`src/lib/signaling/manager.ts`) — Orchestration

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────┐
│              │     │                   │     │              │
│ Seed Pool    │────▶│ TransportSelector  │────▶│ Signalling   │
│ (10 URLs)    │     │ (relay/obfuscate)  │     │ Client       │
│              │     │                   │     │              │
└──────────────┘     └───────────────────┘     └──────────────┘
        │                       │                       │
        │                       │                       │
┌───────▼───────────────────────▼───────────────────────▼──────┐
│                    Fallback Chain:                            │
│  1. Direct signalling → 2. CF relay → 3. Peer relay → 4. DHT │
└──────────────────────────────────────────────────────────────┘
```

**`SignallingManager` behaviour:**
- Implements `HealthMonitor` checks for each backend
- Reports per-backend latency and success rate to the UI
- Exposes `onBlockedRegionDetected` event for UI notification ("Some messaging routes are blocked in your region")
- Automatic recovery: retries primary every 10 min when on fallback

## 4. Distribution Layer — App Delivery Under Blockade

### 4.1 PWA Offline-First (`index.html` + service worker)
- App shell fully cached via service worker on first load
- All static assets (`/assets/`, `/dist/`) cached with Cache-First strategy
- Dynamic API calls use Network-First with cache fallback
- On blocked domain: users who already loaded the app continue using it
- Service worker update check: via alternative domain if primary is blocked (configured in SW at install time)

**New file:** `public/sw.js` (service worker)

### 4.2 QR Side-Loading Relay
- Existing `QRScanner` + `qrcode` dependency reused
- Any user can generate a signed app bundle (APK + integrity hash) as QR
- The QR encodes a magnet-style URI: `messenger://bundle?url=<signed-url>&hash=<sha256>&sig=<ed25519>`
- Bundle is served by the generating peer via WebRTC DataChannel file transfer (reuses `fileSharing.ts`)
- UI entry: "Share app with nearby contact" in Settings → App

### 4.3 Distribution via Mesh
- App bundle chunks can be forwarded through MeshRouter (TTL-limited, max 3 hops)
- Received bundles verified against developer's ed25519 public key (shipped in app)
- Prevention of fake bundle injection: each chunk signed, merkle-tree root verified

## 5. UI Changes

### Settings → Connection (`src/components/settings/`)

New "Connection" section with:

| Setting | Type | Description |
|---------|------|-------------|
| Transport mode | Select | none / xorshroud / httpmask / mediadummy |
| Relay preference | Select | auto / direct / cfworker / domainfront / peertunnel |
| Seed servers | List | View current signalled seed pool, last seen status |
| Current region | Status | Display if region-level blocking is detected |
| Reset transport cache | Button | Clear blocked-backend cache |

### Connection status indicator
- Icon in `GlobalControls`: shows current transport (⚡ direct, 🌐 relay, 🔄 peer, ⚠️ degraded)
- On hover/click: brief status summary
- Toast on region blocking detection: "Some routes blocked — using alternative transport"

## 6. Files Changed / Created

### Modified files:
| File | Change |
|------|--------|
| `src/lib/transport/obfuscator.ts` | Add httpmask + mediadummy modes |
| `src/lib/transport/wsTunnel.ts` | Add cfworker + domainfront + peertunnel backends |
| `src/lib/network/proxyConfig.ts` | Integrate with TransportSelector |
| `src/lib/p2p/MeshRouter.ts` | Expose peer count, add onPeerConnected for DHT |
| `src/lib/resilience/healthMonitor.ts` | Add transport health checks |
| `src/store/index.ts` | New `connection` slice |

### New files:
| File | Purpose |
|------|---------|
| `src/lib/transport/transportSelector.ts` | Auto-select best backend |
| `src/lib/transport/pool.ts` | Dual-connection pool with warm standby |
| `src/lib/network/signallingPool.ts` | Signed seed pool management |
| `src/lib/p2p/dht.ts` | Kademlia DHT on DataChannels |
| `src/lib/signaling/manager.ts` | SignallingManager orchestrator |
| `src/components/settings/ConnectionSettings.tsx` | UI for transport settings |
| `src/components/status/TransportIndicator.tsx` | Status icon component |
| `public/sw.js` | Service worker for offline-first |
| `server/signalling-seed-registry.ts` | Reference seed registry server |

## 7. Success Criteria

1. **Direct WSS blocked** → app auto-connects via CF Worker relay within 5s
2. **CF blocked** → app falls back to peer relay or DHT bootstrap
3. **Domain blocked, app already loaded** → continues working offline-first
4. **Domain blocked, new user** → can sideload APK via QR from existing user
5. **All servers blocked in region** → peer-to-peer mesh still works, DHT discovery still works
6. **Existing functionality unchanged** — all current tests pass, existing chat/calls/media work
