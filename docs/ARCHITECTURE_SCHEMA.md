# Mess&Anger — Architecture Schema

> This is the single source of truth for how the application is structured, what each part does, and how components interact. Use this document to guide development and improvements.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Component Map](#2-component-map)
3. [Data Flow](#3-data-flow)
4. [Module Responsibilities](#4-module-responsibilities)
5. [Interaction Rules](#5-interaction-rules)
6. [Error Resilience System](#6-error-resilience-system)
7. [Server Architecture](#7-server-architecture)
8. [Security Model](#8-security-model)

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATION                           │
├─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Layout     │  │   Views      │  │  Overlays    │              │
│  │  App.tsx     │→│  Feature     │→│  Modals      │              │
│  │  (orchestrate)│  │  Feature     │  │  Modals      │              │
│  │              │←│  Feature     │←│  Popups      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │              │                 │                         │
│         └───┤──────────┘────────────┘───┘                         │
│             │                                                     │
│         ┌─────────────────────────────────────────────────┐       │
│         │              ZUSTAND STORE                       │       │
│         │  (encrypted IndexedDB persistence)               │       │
│         └─────────────────────────────────────────────────┘       │
│         │                                                          │
├─────────┤                                                          │
│         │                                                          │
│  ┌──────┤─────────────────────────────────────────────────┐       │
│  │  │  │         CRYPTO LAYER                              │       │
│  │  │  │  ┌────────────────┐ ┌───────────────┐            │       │
│  │  │  │  │  CryptoCore    │ │ DoubleRatchet  │            │       │
│  │  │  │  │  AES-GCM       │ │ E2E encryption │            │       │
│  │  │  │  └────────────────┘ └───────────────┘            │       │
│  └──────┘─────────────────────────────────────────────────┘       │
│         │                                                          │
│  ┌──────┤─────────────────────────────────────────────────┐       │
│  │  │  │         TRANSPORT LAYER                            │       │
│  │  │  │  ┌──────────────┐ ┌───────────────┐ ┌──────────┐  │       │
│  │  │  │  │  P2PTransport│ │ SignalingMgr │ │Anonymity │  │       │
│  │  │  │  │  WebRTC Data │ │ WS servers   │ │Layer     │  │       │
│  └──────┘─────────────────────────────────────────────────┘       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Map

### 2.1 Entry Points

| File | Responsibility |
|---|---|
| `src/main.tsx` | Bootstrap storage, rehydrate store, install error guards, register SW, render App |
| `src/App.tsx` | Central orchestrator — manages view state, theme, language, connections, message send flow |

### 2.2 UI Layers

```
App (orchestration)
├── SidebarNav       — left sidebar navigation
├── BottomNav        — bottom navigation
├── ContentView      — non-hub screen shell
├── HubView          — radial hub screen
├── FeatureViews     — feature screen router (settings, calls, radar, pulse, etc.)
├── AppOverlays      — modals, floating widgets, popups
├── CallScreen       — active call UI
├── IncomingCallSheet — incoming call UI
└── HuddleWidget     — voice chat widget
```

### 2.3 Chat Components

```
ChatWorkspace
├── ChatListWorkspace — chat list view with filters
└── ActiveChatWorkspace — active chat view with preview & input
    ├── ChatPreviewLayer — message preview
    └── ChatInputOverlay — message input, stickers, voice
```

### 2.4 Resilience Components

```
src/components/resilience/
├── ErrorBoundary.tsx  — React error boundary with styled fallback
├── SafeRender.tsx     — Reusable wrapper around ErrorBoundary
└── index.ts           — Barrel export
```

### 2.5 Store (Zustand)

```
src/store/index.ts (679 lines)
├── App State        — lock PIN, settings, preferences
├── Sound            — volume, enabled state
├── Radial Menu      — DND, proxy, energy toggles
├── Devices & Sessions — device management
├── Chats & Contacts — CRUD, archive, pin, favorite
├── Channels & Bots  — P2P channel management
├── Calls            — active call state
├── Recordings       — search, sort, favorites
├── Company          — company channels, messages, members
├── Connection State  — transport backend, latency
├── Scheduled Messages — queue management
└── Cloud Sync       — backup/sync state
```

### 2.6 Hooks

```
src/hooks/
├── useAppLock           — PIN authentication
├── useCall              — call management (start, accept, end, mute, record)
├── useConnection        — connection status
├── useDebounce          — debounce utility
├── useLocalStorage      — localStorage sync
├── useMeshPeers         — mesh peer discovery
├── useScreenshotProtection — screenshot protection
├── useScheduledMessages — scheduled message polling
└── useUndoDelete        — undo delete
```

### 2.7 Lib (Services & Libraries)

```
src/lib/
├── auth/          — TOTP client
├── backup/        — Backup & recovery (encrypted, cloud, P2P)
├── call/          — CallManager, call types
├── company/       — Company/group channel management
├── crypto/        — E2E encryption, Double Ratchet, worker crypto
│   ├── cryptoCore.ts            — AES-GCM operations
│   ├── doubleRatchet.ts         — Signal protocol double ratchet
│   ├── MessageEncryptionService — per-session encryption wrapper
│   ├── crypto.worker.ts         — Web Worker crypto
│   ├── ed25519.ts               — Ed25519 key operations
│   ├── postKeyManager.ts        — Post-quantum key management
│   └── safetyNumber.ts          — Safety number verification
├── identity/      — Device identity & pairing
│   ├── deviceKeys.ts            — Key generation
│   ├── devicePairing.ts         — Device pairing flow
│   └── masterKey.ts             — Session master key
├── network/       — Anonymity & proxy
│   ├── AnonymityLayer.ts        — Tor/metadata killswitches
│   ├── proxyConfig.ts           — SOCKS5/Tor bridges
│   └── signallingPool.ts        — Signaling server pool
├── p2p/           — P2P networking
│   ├── P2PTransport.ts          — WebRTC DataChannel transport
│   ├── SignalingManager.ts      — P2P signaling coordination
│   ├── MeshRouter.ts            — Mesh network routing
│   ├── HMACAuth.ts              — HMAC-SHA256 message auth
│   ├── network.ts               — P2P network management
│   ├── DHT.ts                   — Distributed hash table
│   └── fileSharing.ts           — P2P file sharing
├── recovery/      — Recovery & backup
│   ├── MnemonicGenerator.ts     — BIP39-style mnemonics
│   └── RecoveryManager.ts       — Recovery orchestration
├── signaling/     — Signaling management
│   └── manager.ts               — Signaling lifecycle
├── sounds/        — Sound system
│   ├── soundSystem.ts           — Sound orchestration
│   ├── player.ts                — Audio playback
│   └── config.ts                — Sound configuration
└── transport/     — Transport layer
    ├── wsTunnel.ts              — WebSocket tunnel abstraction
    ├── obfuscator.ts            — Traffic obfuscation
    ├── pool.ts                  — Connection pool
    └── transportSelector.ts     — Transport selection logic
```

### 2.8 Contexts & Utils

```
src/contexts/
└── ThemeContext.tsx    — Theme provider

src/utils/
└── riskShell.ts        — Risk shell session management

src/locales/
├── en.json, zh.json, ru.json, ko.json, ja.json, fr.json, es.json, de.json
└── (managed by src/lib/i18n.tsx)
```

---

## 3. Data Flow

### 3.1 Application Startup

```
main.tsx
  ├── initAppStorage()          — Initialize session master key
  ├── useAppStore.persist.rehydrate() — Restore from IndexedDB
  ├── preloadLocales()          — Load i18n translations
  ├── installRuntimeGuards()    — Error/unhandled rejection listeners
  ├── Register Service Worker   — PWA offline support
  └── render(<App />)          — Mount React tree
```

### 3.2 Message Send Flow

```
User types message in chat
  → App.tsx: handleSend()
    → Parse mentions / encode Morse
    → Check DND status
    → useAppStore.addMessage()     — Add to store
    → SignallingManager.send()     — Signal to peer
    → P2PTransport.sendMessage()   — Send via WebRTC DataChannel
    → doubleRatchet.encrypt()      — Encrypt with double ratchet
    → Message stored in IndexedDB  — Persisted via Zustand
```

### 3.3 Message Receive Flow

```
WebRTC DataChannel receives data
  → P2PTransport.onMessage()
    → doubleRatchet.decrypt()      — Decrypt with double ratchet
    → HMAC-SHA256 verify           — Message integrity check
    → useAppStore.addMessage()     — Store encrypted message
    → UI updates via Zustand       — React re-renders
```

### 3.4 Store Write Flow

```
useAppStore action
  → Debounce queue (500ms)
    → AES encrypt data
      → Write to IndexedDB (idb-keyval)
        → On failure: queue stays active, retry on next cycle
```

---

## 4. Module Responsibilities

### 4.1 Responsibility Matrix

| Module | Owns | Does NOT Own |
|---|---|---|
| `src/App.tsx` | View orchestration, message send flow, connection management, DND enforcement | Feature screen internals, UI component logic |
| `src/store/index.ts` | State data structure, CRUD operations, persistence | UI rendering, business logic, API calls |
| `src/lib/crypto/` | Encryption/decryption, key management | UI display, message routing |
| `src/lib/p2p/` | P2P transport, mesh routing, message delivery | Application logic, user preferences |
| `src/lib/signaling/` | WebSocket signaling, SDP exchange | Message content, user data |
| `src/components/app/` | Layout shells, overlays, navigation chrome | Feature screen content, chat logic |
| `src/components/chat/` | Chat list, active chat, message preview | App-wide state, crypto operations |
| `src/components/resilience/` | Error containment, crash recovery | Application logic, business rules |
| `src/lib/i18n.tsx` | Localization, language detection | App state, UI components |
| `src/hooks/` | React-specific logic, side effects | Pure business logic, data storage |

### 4.2 Rules

1. **App.tsx** — Should not grow with new UI blocks. New screens → FeatureViews.
2. **Store** — Must never contain UI state (modals, open/closed states).
3. **Features** — Must not import App.tsx directly.
4. **Shared logic** — Must go to `src/lib/`, not duplicated in components.
5. **UI primitives** — Must go to `src/components/ui/`.
6. **New screens** — Go into FeatureViews.
7. **New chat UI** — Goes into src/components/chat/.
8. **New layout** — Goes into src/components/app/.

---

## 5. Interaction Rules

### 5.1 Between Layers

```
UI Layer ←→ Zustand Store ←→ Crypto Layer ←→ P2P Transport
     ↓                                      ↓
   React Effects                          WebSocket/RTC
     ↓                                      ↓
   Re-render                             DataChannel events
```

### 5.2 Between Modules

| From Module | To Module | Purpose |
|---|---|---|
| App.tsx | Store | Read/write app state |
| App.tsx | SignallingManager | Connection management |
| App.tsx | Crypto | Message encryption |
| Store | IndexedDB | Persistence |
| P2PTransport | Crypto | Message encryption/decryption |
| SignallingManager | P2PTransport | SDP exchange coordination |
| FeatureViews | Store | Read/write feature-specific state |
| ChatWorkspace | Store | Chat CRUD operations |

---

## 6. Error Resilience System

### 6.1 Current State

The application has a basic error handling system:
- `ErrorBoundary` at root — catches React render errors
- `SafeRender` — wraps risky sections (hub, chat workspace, feature views)
- `window.onerror` / `unhandledrejection` listeners — log errors
- Recoverable storage failures return `null` instead of crashing

### 6.2 Error Classification

```
┌─────────────────────────────────────────────────────────────┐
│                    ERROR CLASSIFICATION                       │
├────────────────┬──────────────────┬─────────────────────────┐
│ CRITICAL       │ MAJOR            │ MINOR                   │
│ App stops      │ Feature breaks   │ Cosmetic / Non-blocking  │
│                │                  │                         │
│ Examples:      │ Examples:        │ Examples:               │
│ - Store crash  | - Call failure   | - Toast missing         │
│ - Crypto fail  | - Chat broken    | - Animation skipped     │
│ - P2P down     | - Settings lost  | - Label misspell        │
└────────────────┼──────────────────┼─────────────────────────┘
                 │                  │
        Graceful Degradation     Log & Continue
        + Recovery Attempt       + User Notification
```

### 6.3 Resilience Strategies

#### 6.3.1 Store Resilience
- Encrypted IndexedDB with fallback to in-memory state
- Debounced write queue (500ms) with retry logic
- Recoverable decrypt failures create fresh session
- Store rehydration on every app start

#### 6.3.2 Crypto Resilience
- Double Ratchet auto-recovery on key mismatch
- HMAC verification with fallback to unverified mode
- Worker-based crypto with main-thread fallback

#### 6.3.3 Transport Resilience
- Multiple signaling server seeds with failover
- WebSocket reconnection with exponential backoff
- P2P → relay fallback when direct connection fails
- TURN server as last-resort relay

#### 6.3.4 UI Resilience
- Error boundaries at multiple levels (root, section, component)
- SafeRender wrappers around all user-facing sections
- Graceful fallbacks for missing data (null-safe rendering)

---

## 7. Server Architecture

### 7.1 Signaling Server

```
server/signaling-server.ts
├── WebSocket server (port 8765)
├── SDP offer/answer exchange only
├── HMAC-SHA256 verified signaling messages
├── Multiple clients with public key registration
└── Seed-based node discovery (signalling-seed-registry.ts)
```

### 7.2 Server Files

| File | Purpose |
|---|---|
| `server/signaling-server.ts` | Main WebSocket signaling server |
| `server/signalling-seed-registry.ts` | Seed registry for signaling nodes |
| `server/auth.ts` | Server-side authentication |
| `server/middleware/auth.ts` | Auth middleware |
| `server/routes/auth.ts` | Auth API routes |
| `server/routes/stats.ts` | Statistics routes |
| `server/routes/ads.ts` | Ads management routes |
| `server/db.ts` | SQLite database operations |
| `server/csp.ts` | Content Security Policy |
| `server/cli.ts` | CLI management tool |
| `server/start-signaling.sh` | Shell script to start server |

---

## 8. Security Model

### 8.1 Trust Boundaries

| Component | Trust Level | What it can see |
|---|---|---|
| Browser (Client) | Full trust | All crypto operations, keys, messages |
| Signaling Server | Untrusted | Only SDP exchange, NOT message content |
| TURN Server | Untrusted | Relay only, all traffic encrypted via DTLS |
| P2P Link | Authenticated | HMAC-SHA256 verified messages only |

### 8.2 Cryptographic Layers

1. **At rest**: IndexedDB encrypted with AES-GCM (session master key)
2. **In transit**: WebRTC DTLS + Double Ratchet + HMAC-SHA256
3. **Messages**: Double Ratchet per-message encryption
4. **Keys**: Ed25519 + post-quantum key exchange
5. **Device**: PBKDF2-derived device keys, attestation via signed nonces

### 8.3 Security Features

- Anonymity layer with Tor/Tor bridges
- Metadata killswitches
- Rate limiter & spam detection
- Input sanitization
- Encrypted backup & recovery
- TOTP-based authentication
- Screenshot protection
- Risk shell (admin controls)

---

## Quick Reference

### Adding a New Feature Screen
1. Create component in `src/components/features/` or appropriate subdirectory
2. Register route in `FeatureViews.tsx`
3. Pass state/callbacks from `App.tsx`
4. Store data in `useAppStore` (not component state)
5. Wrap in `SafeRender` if risky

### Adding a New Store Field
1. Add to store state shape in `src/store/index.ts`
2. Add CRUD method to store
3. Use `useAppStore` in components
4. Test with `vitest run`

### Adding a New UI Component
1. Place in appropriate `src/components/` subdirectory
2. Export from barrel file (`index.ts`)
3. Use `SafeRender` if component has side effects
4. Follow naming conventions: PascalCase

### Modifying Crypto Operations
1. Edit files in `src/lib/crypto/`
2. Ensure Double Ratchet compatibility
3. Test with `vitest run` (crypto tests)
4. Verify HMAC-SHA256 signatures match

### Deploying Changes
```bash
npm run build        # Build web version
npm run build:android # Build Android APK
npm run deploy        # Deploy all (web + signaling + Android)
npm run deploy:quick  # Deploy without tests
```
