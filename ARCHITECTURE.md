# Architecture — Mess&Anger

## Overview

React 19 SPA with TypeScript. P2P messaging over WebSocket with E2E encryption (post-quantum + X25519). Zustand for state. Motion for animations. Tailwind v4 for styling.

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
| ML-KEM 768 | Post-quantum KEM | @noble/post-quantum |
| X25519 + XSalsa20-Poly1305 | Key exchange + stream cipher | tweetnacl |
| AES-256-GCM | At-rest encryption (backup) | Web Crypto API |
| PBKDF2 | Password-based key derivation | Web Crypto API |
| Ed25519 | Identity signing | tweetnacl |
| SHA-256 | TOTP | otpauth |

## Security Headers (production)

Set via `_headers` (static hosts) and `vite.config.ts` (dev/preview):

```
Content-Security-Policy  default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; ...
X-Frame-Options         DENY
Strict-Transport-Security max-age=31536000; includeSubDomains; preload
X-Content-Type-Options  nosniff
Referrer-Policy         strict-origin-when-cross-origin
Permissions-Policy      camera=(), microphone=(), geolocation=(), payment=()
Expect-CT               max-age=86400, enforce
```

## Bundling (Vite)

```
vendor  → react, react-dom
state   → zustand
crypto  → @noble/post-quantum, tweetnacl
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
