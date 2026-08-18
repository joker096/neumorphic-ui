# Architecture — Mess&Anger

## Overview

React 19 SPA with TypeScript. P2P messaging over WebSocket with E2E encryption (X25519 ECDH + Ed25519 signatures + HMAC). Zustand for state. Motion for animations. Tailwind v4 for styling.

## Component Tree (simplified)

```
<ErrorBoundary>                    ← catches render crashes globally
  <I18nProvider>                   ← locale loading
    <AnimationProvider>            ← animation preferences
      <ThemeContext.Provider>       ← dark/light theme
        <App>
          ├── <Toaster>            ← toast notifications (sonner)
          ├── <TransportIndicator>  ← connection status badge
          ├── <SidebarNav>         ← desktop sidebar
          ├── <main>
          │   ├── <ChatWorkspace>  ← chat list + active chat
          │   └── <FeatureViewsWrapper>  ← lazy-loaded views:
          │       ├── LandingPage
          │       ├── SystemPulsePlayer
          │       ├── MeshRadar
          │       ├── CallLogView / Dialpad
          │       ├── SettingsView
          │       ├── RecordingsScreen
          │       └── ContactsView / CompanyContactsView
          ├── <BottomNav>          ← mobile nav footer
          ├── <AppOverlays>        ← modals (create channel/bot, profile, filters)
          ├── <CallOverlay>        ← active call UI
          └── <AppLockScreen>      ← PIN lock (renders outside main tree)
```

## Data Flow

```
User Input
  → Component (e.g., Input.tsx)
    → Custom Hook (e.g., useMessageActions)
      → Zustand Store (src/store/index.ts)
        → localStorage (persistence)
        → WebSocket / P2P Transport (src/lib/transport/)
          → Remote Peer
```

## State Management (Zustand)

Single store at `src/store/index.ts` (~450 lines). Key slices:

| Slice | State | Persistence |
|-------|-------|-------------|
| Chats | `chats[]`, `archivedChats[]` | localStorage drafts/saved |
| Contacts | `contacts[]` | — |
| Channels | `channels[]` | IndexedDB (idb-keyval) |
| Settings | `theme`, `language`, `fontSize` | localStorage |
| Privacy | `soundEnabled`, `typingIndicators`, etc. | localStorage `mess_privacy_settings_v2` |
| Security | `appLockHashedPIN`, `totpSecret`, `stealthMode` | localStorage |
| Call | `activeCall`, `callHistory` | — |

## P2P / Transport Layer

```
transportSelector
  ├── WsTunnel (direct WebSocket)
  ├── WsTunnel (Cloudflare Worker relay)
  ├── WsTunnel (domain-fronted)
  └── PeerTunnel (P2P via signaling)

signaling/manager.ts  ← reconnect with exponential backoff (1s–30s, max 10)
p2p/P2PTransport.ts   ← linear backoff (1s–5s)
```

## Crypto Layer

| Algorithm | Purpose | Library |
|-----------|---------|---------|
| X25519 | ECDH key agreement (per-peer shared secret) | tweetnacl |
| Ed25519 | Identity / message signing & verification | tweetnacl |
| HMAC-SHA256 | Per-message authentication (Web Crypto) | Web Crypto API |
| AES-256-GCM | At-rest encryption (backup) | Web Crypto API |
| PBKDF2 | Password-based key derivation | Web Crypto API |
| SHA-256 | TOTP | otpauth |

> NOTE: The previously-documented ML-KEM-768 (post-quantum) `KyberKEM` and the
> homegrown `DoubleRatchet` / `MessageEncryptionService` were **removed as dead code**
> (no callers in the live app). The only active transport cryptography is X25519 ECDH
> + Ed25519 signatures + HMAC-SHA256. Post-quantum is a future roadmap item, not shipped.

## Security Headers (production)

Set via `_headers` (static hosts) and `vite.config.ts` (dev/preview):

```
Content-Security-Policy  default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; ...
X-Frame-Options         DENY
Strict-Transport-Security max-age=31536000; includeSubDomains; preload
X-Content-Type-Options  nosniff
Referrer-Policy         strict-origin-when-cross-origin
Permissions-Policy      camera=self, microphone=self, geolocation=self, payment=()
Expect-CT               max-age=86400, enforce
```

## Bundling (Vite)

```
vendor  → react, react-dom
state   → zustand
crypto  → tweetnacl
animation → motion
icons   → lucide-react
ui      → @tanstack/react-virtual, qrcode, sonner, @yudiel/react-qr-scanner
```

Plus 9 route-level chunks (lazy `React.lazy()` imports) and 6 settings sub-chunks.

## Resilience

- `<ErrorBoundary>` at root — catches render crashes, max 5 errors/60s then auto-reset
- `<SafeRender>` — per-section boundary around `<ChatWorkspace>` and `<FeatureViewsWrapper>`
- `window.onerror` + `unhandledrejection` — global fallback, triggers fatal page after 10 in 5s
- `installRuntimeGuards()` — called at bootstrap
- Service Worker (`/sw.js`) — cache-first for static assets, network-first for API, offline.html fallback
- IndexedDB (`idb-keyval`) — local persistence for chats, contacts, channels, bots
- Background sync — re-queues offline messages when connectivity restored

## Auth & Identity Flow

```
First Launch
  → useIdentityAuth checks IndexedDB for master seed
    → No seed → RegistrationScreen
      → Generate master seed (HKDF-SHA256)
      → Derive X25519 + Ed25519 + AES-256-GCM keys
      → Generate BIP39 24-word recovery phrase
      → Confirm phrase (PBKDF2 600k verification)
      → Set optional PIN lock (PBKDF2 100k)
      → Store seed in IndexedDB (encrypted with device-bound key)
    → Seed exists → LoginScreen
      → Enter recovery phrase
      → Verify against stored PBKDF2 hash
      → Restore keys from phrase entropy
      → Set optional PIN lock
```

## Encryption Pipeline

```
Outbound Message
  → P2PTransport: X25519 ECDH with peer → shared secret (salt+nonce mixed)
  → HMAC-SHA256 over payload (authenticates sender + content)
  → Ed25519 channel/sender signature (identity binding)
  → WebSocket / WebRTC DataChannel transport
  → Optional traffic obfuscation

Inbound Message
  → WebSocket / WebRTC DataChannel receive
  → HMAC-SHA256 verification (rejects tampered / replayed frames)
  → Ed25519 signature verification (sender identity)
  → Decrypt with derived shared secret
  → Legacy frames carrying an explicit `hmacKey` are still accepted (back-compat)
```

## Network Topology

```
User A ←→ Relay Node ←→ User B
         (WebRTC / WebSocket)
          ↑ TURN: turn.neumorphic.local:3478
          ↑ Signaling: wss://signaling1.messanger.app
```

## Known Limitations

- Video player overlay uses placeholder image (Unsplash)
- Push notifications require VAPID key configuration
- Device-bound key may invalidate if screen resolution changes
