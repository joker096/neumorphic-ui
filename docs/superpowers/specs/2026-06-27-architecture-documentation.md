# Mess&Anger Architecture Documentation

## Overview

Mess&Anger is a secure P2P decentralized messenger built with React + TypeScript + Vite. This document describes the current architecture, component hierarchy, state management, and data flow to guide future development.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6
- **Styling**: TailwindCSS (utility-first), custom neumorphic design system
- **Animation**: Motion (Framer Motion fork) for transitions and micro-interactions
- **State**: Zustand store with slices for different domains
- **Crypto**: @noble/post-quantum (X25519/Ed25519), libsignal-protocol
- **Storage**: IndexedDB via idb-keyval, localStorage for preferences
- **Networking**: WebRTC, WebTorrent-like mesh transport, SOCKS5 proxy support
- **Notifications**: sonner (toast library)
- **Icons**: lucide-react

## Directory Structure

```
src/
├── components/
│   ├── ui/                    # Reusable primitives (buttons, dialogs, toggles)
│   ├── chat/                  # Chat-specific components
│   ├── settings/              # Settings sub-views
│   ├── call/                  # Call UI components
│   ├── app/                   # App chrome, overlays, modals
│   ├── navigation/            # SidebarNav, BottomNav
│   ├── company/               # Company chat components (NEW)
│   ├── SystemPulsePlayer/     # Refactored media player (NEW)
│   ├── CompanyContactsView.tsx
│   ├── ContactsView.tsx
│   ├── SettingsView.tsx       # Main settings shell
│   └── ... other views
├── lib/
│   ├── company/               # Company domain logic
│   │   ├── types.ts           # Core interfaces
│   │   ├── companyUser.ts     # CRUD for company users
│   │   ├── deviceRegistry.ts  # Device management
│   │   ├── groupChannel/      # Group channel crypto & key management
│   │   └── onboarding/        # Join flow & QR handling
│   ├── crypto/                # PQC & legacy crypto utilities
│   ├── recovery/              # Recovery phrase generation/restoration
│   ├── identity/              # Key derivation & master key management
│   ├── i18n.tsx               # Internationalization system
│   ├── sounds.ts              # Audio feedback system
│   └── backup.ts              # Export/import logic
├── store/
│   └── index.ts               # Zustand store with domain slices
├── locales/
│   ├── en.json                # Base locale (English)
│   ├── ru.json                # Russian
│   ├── de.json                # German
│   ├── es.json                # Spanish
│   ├── fr.json                # French
│   ├── zh.json                # Chinese
│   ├── ja.json                # Japanese
│   └── ko.json                # Korean
├── hooks/                     # Custom React hooks
├── types/                     # Global TypeScript type definitions
├── constants.ts               # Mock data & app constants
└── contexts/                  # React contexts (Theme, I18n)

tests/                         # E2E tests (Playwright)
docs/                          # Documentation
android/                       # Android TWA project
```

## Component Hierarchy

```
App.tsx (root)
├── ThemeProvider
├── I18nProvider
└── Hub View (RadialMenu)
    ├── Chats
    │   └── ChatPreviewLayer
    ├── Company                    # NEW: Modular company sidebar
    │   ├── CompanyHeader
    │   ├── CompanyInfoCard
    │   ├── MemberList
    │   └── ChannelList
    ├── Contacts
    │   └── ContactsView
    ├── Calls
    │   └── Dialpad
    ├── Recordings
    │   └── RecordingsScreen
    ├── Settings
    │   └── SettingsView (shell)
    │       ├── AppearanceSettings
    │       ├── LanguageSection
    │       ├── AccountSection
    │       ├── SecuritySection
    │       ├── PrivacySection
    │       ├── NetworkSection
    │       ├── StorageSection
    │       ├── BotsSection
    │       ├── SpamSection
    │       ├── SystemStatusSection
    │       └── CompanySettingsView
    ├── Radar
    │   └── MeshRadar
    ├── Stories
    └── SystemPulsePlayer          # REFACTORED: Modular media player
        ├── TopBar
        ├── PlayerView
        ├── EqualizerPanel
        ├── PlaylistView
        ├── VideoOverlay
        ├── AddStationModal
        └── usePlayerState hook
```

## State Management (Zustand)

The store (`src/store/index.ts`) is organized into domain slices:

### User & Auth
- `userId`, `displayName`, `publicKey`
- `currentSession`, `devices`, `addDevice`, `removeDevice`

### Chats & Messages
- `chats`, `activeChat`, `setActiveChat`
- `messages`, `addMessage`, `archiveChat`

### Company
- `companyId`, `companyMembers`, `companyChannels`, `companyMessages`
- `hideWhenOfficeOnly`, `pendingInvite`

### Calls
- `activeCall`, `setActiveCall`, `callHistory`
- `recentCalls` (incoming, outgoing, missed)

### Settings
- `theme`, `soundEnabled`, `notificationsEnabled`
- `cloudSync`, `locationShares`, `proxies`
- `stealthMode`, `anonymousMode`, `ghostViewMode`
- `readReceipts`, `typingIndicators`, `forwardPrivacy`

### Media & Content
- `bots`, `channels`, `archivedChats`
- `photoEditState` (for photo editor)
- `polls`, `addPoll`, `removePoll`, `voteOnPoll`

## Data Flow Patterns

### 1. View Navigation
- Views are switched via `setView(viewName)` in the main App shell
- `FeatureViews.tsx` acts as a router, rendering the correct component based on `view` state
- Each view receives `theme` prop from ThemeContext

### 2. Company Chat
User flow:
1. User taps "Company" tab
2. `CompanyContactsView` renders with members and channels
3. `onJoinCompany` initializes mock data if no company ID
4. Call/Video buttons use callbacks `onCall`, `onVideoCall` passed from `FeatureViews`

Data:
- Company state lives in Zustand (`companyMembers`, `companyChannels`, `companyId`)
- Crypto operations in `lib/company/groupChannel/keyManager.ts`
- Member CRUD in `lib/company/companyUser.ts`

### 3. Media Player
- `usePlayerState` hook encapsulates all player state and logic
- Components are pure presentational, receiving only needed props
- Audio refs are shared between hook and DOM via `useRef`

### 4. Internationalization
- `useI18n()` hook provides `t(key, args)` function
- Locales are lazy-loaded and cached
- Fallback: if key is missing in current locale, falls back to English
- **All 8 locales must have identical key sets** (enforced by `i18n.test.ts`)

## Security Architecture

### Encryption
- **X25519**: Key exchange for P2P connections
- **Ed25519**: Signing and verification
- **AES-256-GCM**: Message encryption
- **PBKDF2-SHA256**: Key derivation (600k iterations)

### Key Management
- `MasterKeySet`: AES key + Ed25519 keypair
- Generated from mnemonic recovery phrase
- Stored in device security module (`lib/deviceSecurity`)
- Group channels use `GroupKeyMaterial` with `WrappedKey` per member

### Privacy Features
- **Stealth Mode**: Obfuscates message timestamps
- **Ghost View**: Hides read receipts and typing indicators
- **Anonymous Mode**: Routes traffic through relay
- **Forward Privacy**: Limits forwarding, anonymizes origin
- **Dead Man's Switch**: Auto-wipe after inactivity

## Platform Support

- **Web**: Primary target, runs in browser with WebCrypto
- **Android**: Trusted Web Activity (TWA) wrapper
- **PWA**: Installable with offline support via service worker

## File Size Guidelines

To maintain fast load times:
- Single component files should be kept under 300 lines
- Logic-heavy files should use custom hooks
- Each interactive element should be its own component for modularity
- Lazy load large features (e.g., settings sections use `React.lazy`)

## Testing Strategy

- **Unit tests**: Vitest, co-located with source (`*.test.tsx`)
- **E2E tests**: Playwright for user flows
- **i18n consistency**: Automatic key comparison across all locales
- **Type safety**: `tsc --noEmit` must pass with zero errors

## Recent Refactoring Summary

### Company Chat (2026-06-27)
- Extracted `CompanyHeader`, `CompanyInfoCard`, `MemberList`, `MemberItem`, `ChannelList`, `ChannelItem`
- Fixed localization: added `company.*` keys to all 8 locales
- Added call/video call action callbacks to member items
- Moved company components to `src/components/company/`

### System Pulse Player (2026-06-27)
- Extracted `usePlayerState` custom hook with all state and logic
- Split UI into: `TopBar`, `EqualizerPanel`, `PlayerView`, `PlaylistView`, `VideoOverlay`, `AddStationModal`
- Each component has explicit, minimal props
- Moved utilities to `utils.ts`

### i18n Sync
- Automated key synchronization across all locale files using Node.js merge script
- Ensures no test failures due to missing translation keys
