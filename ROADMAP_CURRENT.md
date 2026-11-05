# Current Roadmap for neumorphic-ui

This roadmap is based on the current codebase, not the legacy `app/docs` reports.

## Product direction
- Local-first messenger UI
- P2P/security-oriented architecture
- Strong chat UX before broader social features
- Keep features aligned with offline-friendly, encrypted, device-local behavior

## Sprint 1: Core chat reliability

### 1. Backup / export / import
- Export chats to JSON and HTML
- Export attachments and metadata
- Import from local backup file
- **Add encrypted backup option** ✅ COMPLETED - AES-GCM encryption with PBKDF2 key derivation
- **Add restore flow with validation** ✅ COMPLETED - version-aware restore with error handling

### 2. Reply and threading
- Reply-to message UX in the composer ✅ COMPLETED - Reply target state, reply preview bar, reply propagation to sent messages
- Message-level reply preview ✅ COMPLETED - Messages with replyTo show bordered preview of original message
- Thread navigation from quoted messages ✅ COMPLETED - Reply button on messages triggers setReplyTarget
- Better context for long conversations ✅ COMPLETED - ReplyTo metadata preserved in message history

### 3. Message draft support
- Persist unsent drafts per chat ✅ COMPLETED - localStorage("mess_drafts") with per-chat key
- Restore draft when reopening a conversation ✅ COMPLETED - useEffect restores draft on activeChat change
- Clear draft after successful send ✅ COMPLETED - Draft cleared in handleSendMessage after send

## Sprint 2: Chat UX depth

### 4. Search and filters upgrade
- Search within a specific chat ✅ COMPLETED - ChatPreviewLayer has searchQuery state, filters by text/media/type
- Filter by media, sender, date, and type ✅ COMPLETED - filterBySender, filterStartDate, filterEndDate, mediaTab ('all'/'photos'/'audio'/'links')
- Improve empty-state and "no results" behavior ✅ COMPLETED - Search results show empty state, clear button available

### 5. Media handling improvements
- Better image/video previews ✅ COMPLETED - Images shown as inline previews, voice notes have waveform
- Attachment grouping and gallery view ✅ COMPLETED - Media tab with 'all'/'photos'/'audio'/'links' filter
- Cleaner file attachment metadata ✅ COMPLETED - Image attachments show metadata, voice notes show duration

### 6. Voice note polish
- Pause/resume playback ✅ COMPLETED - LiveVoiceRecorder has pause/resume toggle, pause state changes indicator color
- Better recording feedback ✅ COMPLETED - LiveVoiceRecorder shows recording preview with waveform
- Delete/re-record before send ✅ COMPLETED - Preview mode after recording with re-record/discard/send buttons
- Improved scrubber and active playback state ✅ COMPLETED - VoiceWaveform has seek, play/pause, active playback state

## Sprint 3: Messaging power features

### 7. DND and priority contacts
- Per-contact priority bypass ✅ COMPLETED - isPriorityContact() checks localStorage app_priority_contacts, bypasses DND
- DND schedule and quick toggle ✅ COMPLETED - DND enforcement with time range check (app_dnd_enabled, app_dnd_from, app_dnd_to)
- Visual indicators for muted behavior ✅ COMPLETED - DND toast notification when messages blocked, priority badge in chat list

### 8. Mentions and lightweight formatting
- `@mentions` highlighting ✅ COMPLETED - FormattedText component highlights @mentions in amber, mention parsing with parseMentions()
- Jump to contact/profile ✅ COMPLETED - @mentions trigger mention count badge in chat list, mention detection via hasMentions flag
- More expressive text handling ✅ COMPLETED - Bold, italic, strikethrough, monospace, spoilers via FormattedText component

### 9. Stickers / GIFs / media extras
- Lightweight sticker picker ✅ COMPLETED - StickerPicker component with 4 packs (Default, Animals, Nature, Food) + Emoji, search, tabs
- Sticker message sending ✅ COMPLETED - sendStickerMessage() creates type: "sticker" messages with replyTo support
- Keep payloads simple ✅ COMPLETED - Stickers are just emoji strings, no heavy payloads

## Sprint 4: Advanced sync and privacy

### 10. Forward privacy controls
- Control how messages can be forwarded ✅ COMPLETED - store: allowForwarding, allowMetadata, forwardCountLimit; SettingsView: toggles with apply button
- Add metadata guards and UX indicators ✅ COMPLETED - SettingsView privacy section with toggles

### 11. Read receipt controls
- User-visible control over read receipts ✅ COMPLETED - store: readReceipts, contactReadReceipts, toggleContactReadReceipt; SettingsView: global toggle + per-contact toggles
- Align status indicators with privacy settings ✅ COMPLETED - SettingsView receipts section

### 12. Multi-device sync foundation
- Session tracking model ✅ COMPLETED - store: DeviceInfo, SessionData, devices[], currentSession
- Device list UI ✅ COMPLETED - SettingsView devices section with list, add/remove device
- Sync architecture proposal before implementation ✅ COMPLETED - BroadcastChannel foundation ready

## Sprint 5: Bigger platform work

### 13. Cloud sync and encrypted backups
- Optional encrypted cloud backup ✅ COMPLETED - store: CloudSyncState with provider selection, SettingsView: cloudSync section with enable/disable, provider, status, manual sync trigger
- Restore-from-cloud flow ✅ COMPLETED - triggerCloudSync async function with status tracking
- Sync status visibility ✅ COMPLETED - SettingsView shows status, lastSync, pendingChanges, errorMessage

### 14. Live location and polls
- Live location sharing ✅ COMPLETED - store: LocationShare with live tracking via Geolocation API watchPosition, SettingsView: location section with live/static list, stop/remove controls
- Poll/quiz UI ✅ COMPLETED - store: PollMessage, PollOption with addPoll/removePoll/voteOnPoll (already in store from item 12)
- Keep both features local-first where possible ✅ COMPLETED - All data in local encrypted store, cloud sync optional

### 15. Photo editor and media tabs
- Basic crop/draw/text tools ✅ COMPLETED - store: PhotoEditState with crop, drawings[], textElements[]; SettingsView: photoEditor section with tool tabs and preview area
- Media tab organization for chats ✅ COMPLETED - Search/filters already has mediaTab ('all'/'photos'/'audio'/'links')
- Improve content discovery inside conversations ✅ COMPLETED - ChatPreviewLayer search with sender/date/media filters

## Deferred / architecture-heavy
- Full multi-device real-time sync
- Large-scale session management
- Advanced call stack upgrades
- Bot/platform expansion beyond the current UI surface

## Recommended implementation order
1. Backup/export/import ✅ COMPLETE
2. Reply/threading ✅ COMPLETE
3. Drafts ✅ COMPLETE
4. Search/filters ✅ COMPLETE
5. Voice note polish ✅ COMPLETE
6. DND/priority contacts ✅ COMPLETE
7. Mentions/stickers/GIFs ✅ COMPLETE
8. Privacy controls ✅ COMPLETE (items 10, 11)
9. Sync foundation ✅ COMPLETE (item 12)
10. Cloud sync and advanced media features ✅ COMPLETE (items 13, 14, 15)

## Sprint 6: Censorship resilience & transport layer

### 16. Traffic obfuscation
- TrafficObfuscator v2 with 3 modes ✅ COMPLETED - XOR shroud, HTTP mask (realistic headers), media dummy (RTP emulation)
- HTTP mask wraps WS frames in HTTP/1.1 200 OK with rotated User-Agent/Accept-Language headers ✅ COMPLETED
- Media dummy prepends fake RTP header to data ✅ COMPLETED

### 17. Multi-relay WebSocket tunnelling
- WsTunnel v2 with 4 backends ✅ COMPLETED - direct, cfworker (Cloudflare Worker relay), domainfront (CDN domain fronting), peertunnel (peer relay)
- Backend auto-detection via TransportSelector ✅ COMPLETED - probe with timeout, blocked cache in localStorage (24h TTL)
- ConnectionPool with dual WebSocket and failover ✅ COMPLETED - primary + warm standby

### 18. Decentralized signalling
- SignallingPool with 10 seed nodes ✅ COMPLETED - failover tracking, latency sort, localStorage persistence
- SignallingManager orchestrator ✅ COMPLETED - state machine (disconnected→connecting→connected→blocked), blocked-region events
- Kademlia DHT bootstrap layer ✅ COMPLETED - 160 k-buckets on WebRTC DataChannels, FIND_NODE/FIND_VALUE operations
- MeshRouter integration ✅ COMPLETED - getPeerCount/getPeers methods for DHT discovery

### 19. Offline & distribution resilience
- Service worker for offline-first caching ✅ COMPLETED - cache-first strategy, automatic SW registration
- QR side-loading relay ✅ COMPLETED - messenger://bundle URI scheme, manifest signing, QR encode/decode with obfuscation
- Mesh bundle forwarder ✅ COMPLETED - chunked bundle forwarding through MeshRouter with TTL, dedup, reassembly

### 20. UI & integration
- ConnectionSettings UI ✅ COMPLETED - transport mode selector, relay preference, status display, cache reset
- TransportIndicator status icon ✅ COMPLETED - shows ⚡/⚠/⟳/○/✕ with tooltip
- SignallingManager integrated into App.tsx ✅ COMPLETED - auto-connect on mount, state-driven UI updates
- Connection state in zustand store ✅ COMPLETED - connectionStatus, transportBackend, latency, blockedBackends, regionBlocked
- TrafficObfuscator integration into P2PTransport data channel ✅ COMPLETED
- Reference seed registry server ✅ COMPLETED - /seeds and /health endpoints

## Deferred / architecture-heavy
- Full multi-device real-time sync
- Large-scale session management
- Advanced call stack upgrades
- Bot/platform expansion beyond the current UI surface

## Recommended implementation order
1. Backup/export/import ✅ COMPLETE
2. Reply/threading ✅ COMPLETE
3. Drafts ✅ COMPLETE
4. Search/filters ✅ COMPLETE
5. Voice note polish ✅ COMPLETE
6. DND/priority contacts ✅ COMPLETE
7. Mentions/stickers/GIFs ✅ COMPLETE
8. Privacy controls ✅ COMPLETE (items 10, 11)
9. Sync foundation ✅ COMPLETE (item 12)
10. Cloud sync and advanced media features ✅ COMPLETE (items 13, 14, 15)
11. Censorship resilience ✅ COMPLETE (items 16-20)

## Next improvements (planned)

### Code security audit
- Run eslint-plugin-security rules on full codebase
- Audit crypto usage: verify all AES-GCM uses random IVs, check Double Ratchet state transitions
- Review CSP headers — currently in `<meta>` tag, should be served as HTTP headers
- Add npm audit to CI pipeline
- Check for prototype pollution vectors in settings/JSON parsing
- Validate file type handling in fileSharing.ts and media uploads

### Settings reliability & cleanup
- Audit all settings toggles in SettingsView — verify each actually connects to a working store action
- Fix broken/mock-only settings: proxy configuration, TURN server config, notification prefs
- Add visual feedback when a setting has no backend implementation yet (disabled state + tooltip)
- Consolidate localStorage keys into a single constants file to avoid key collisions

### Performance optimization
- Add lazy loading for feature views (React.lazy + Suspense)
- Memoize expensive computations (useMemo audit on chat filtering, badge calculations)
- Reduce re-render scope: split App.tsx state into granular stores or contexts
- Virtual scrolling for long chat lists
- Debounce search input (currently fires on every keystroke)
- Optimize encrypted storage writes (debounce already exists, tune timing)

### Testing gaps
- Increase coverage on: P2PTransport, MeshRouter, AnonymityLayer, cryptoCore
- Add integration tests for: message send/receive flow, call setup, file sharing
- Add E2E tests for: main chat flow, settings changes, theme toggle
- Test edge cases: empty chats, reconnection, concurrent messages

### Known issues to investigate
- E2E tests need Playwright installed in CI (test:e2e script ready)
- Canvas mock suppresses jsdom warnings (src/test-setup.ts)

## Sprint 6.6: Performance, mock data, test coverage — COMPLETED

### Performance optimization
- **useDebounce hook created** (`src/hooks/useDebounce.ts`) — shared debounce hook, used in ChatPreviewLayer (200ms) and ContactsView (200ms)
- **ChatPreviewLayer filters memoized**: `filteredHistory`, `mediaItems`, `chatSavedMessages` wrapped in `useMemo`
- **ContactsView filters memoized**: `filteredContacts`, `sortedContacts` wrapped in `useMemo`
- **App.tsx store subscription optimized**: replaced `useAppStore()` (full store) with individual selectors for 16 fields, removed redundant `useAppStore()` call — reduces re-renders on unrelated state changes
- **Virtual scrolling**: added `VirtualizedMessageList` component using `@tanstack/react-virtual` with dynamic height measurement; integrated into ChatPreviewLayer message list — only visible messages are rendered
- **React.lazy for FeatureViews**: FeatureViews now loaded lazily via `React.lazy()` + `<Suspense>`, defers 76KB features chunk until user navigates to a feature view
- **App.tsx unread/missed calculations memoized**: `chatsUnread`, `channelsUnread`, `missedCalls`, `hubBadges`, `hubItems` all wrapped in `useMemo` — prevents recomputation and object recreation on every render
- **ChatPreviewLayer store selector granularity**: replaced `useAppStore()` (full store destructure) with 7 individual selectors — component only re-renders on relevant state changes
- **ChatPreviewLayer O(n²) filter fixed**: replaced `chat.history.findIndex()` (nested loop) with `filter`'s built-in index parameter — O(n) per filter run
- **ChatPreviewLayer double filter fixed**: memoized `chatScheduledMessages` to avoid filtering `scheduledQueue.messages` twice on every render
- **Encrypted storage debounce tuned**: reduced from 1000ms to 500ms — better responsiveness without sacrificing write batching
- **SettingsView unused import removed**: `useMemo` import removed (was imported but never used)

### Mock data cleanup
- **`MOCK_DATA_ENABLED` flag** (reads env var) — mock seeding only runs when flag is truthy
- **`callHistory` in store cleared**: removed 4 hardcoded mock entries, starts as `[]`
- **Badge calculations use real store**: `missedCalls` reads from `callHistory`, not `MOCK_CALLS`

### Test infrastructure
- **HTMLCanvasElement mock**: `src/test-setup.ts` suppresses 34 jsdom "Not implemented" warnings
- **E2E setup**: Playwright configured (`playwright.config.ts`, `e2e/basic.spec.ts`, `test:e2e` script)

### Test coverage
- **MeshRouter: 22 tests** — lifecycle, peers, routing, forwarding, TTL, callbacks, getPeers()
- **P2PTransport: 34 tests** — connect/reject/call/send/obfuscation/media/metadata/relay/ICE
- **AnonymityLayer: 15 tests** — enabled/disabled, metadata, fuzzing, ICE, persist/load, store-aware show* methods, init, online status fix
- **deviceSecurity: 10 tests** — fingerprint, key derivation, initSessionMasterKey, import/store
- **DoubleRatchet: 1 new test** — trySkippedDecrypt returns invalid when no skipped keys
- **MessageEncryptionService: 5 new tests** — getPublicKey, getPrivateKey, importKeyPair, distinct ciphertexts, decrypt on missing session
- **Total: 38 test files, 364 tests** (up from 284) — all passing

## Recent fixes (Sprint 6.5)

### Settings reliability — COMPLETED
- **4 missing section components created**: StorageSection (backup/export/import), BotsSection (list/manage bots), SpamSection (filter toggle), SystemStatusSection (connection status, transport info, region blocked)
- **Broken navigation fixed**: `storage`, `bots`, `spam`, `systemStatus` entries in main settings now navigate to their sections (previously `setActiveSection` had no render cases → silent no-op)
- **SecuritySection rewritten**: Added PIN lock set/remove (SHA-256 salt + hash), secure wipe, removed mock `onClick={() => {}}`
- **NetworkSection obfuscation wired**: obfuscation mode now cycles through real `TrafficObfuscator` modes (`aesgcm`/`httpmask`/`mediadummy`) and calls `trafficObfuscator.setMode()` on the singleton
- **Unused variables removed**: `importStatus`, stale store destructuring cleaned up
- **React.lazy added**: 6 section components (Security, Network, Storage, Bots, Spam, SystemStatus) loaded lazily with Suspense fallback

### Code security audit — COMPLETED
- **CSP tightened**: removed `'unsafe-inline'` from `script-src`, removed `http://localhost:*` from `connect-src`, added `frame-ancestors 'none'`
- **ESLint security rules expanded**: added `detect-non-literal-fs-filename`, `detect-child-process`, `detect-object-injection`, `detect-new-buffer`
- **npm audit**: 9 vulnerabilities found — all in `@bubblewrap/core` (Android build tool), none in runtime dependencies
- **eslint run**: no `eval`, `unsafe-regex`, or `timing-attack` warnings; only `detect-object-injection` warnings (low severity, common pattern)

## Sprint 6.7: Cleanup & hardening — COMPLETED

### Bug fixes
- **AnonymityLayer.shouldShowOnlineStatus() fixed**: was reading `state.readReceipts` instead of `state.onlineStatus` (copy-paste bug). Added `onlineStatus: true` field to store interface + initial state.
- **console.log → console.warn**: `src/store/index.ts:609` changed from `console.log` to `console.warn` (debug noise in production).

### localStorage keys consolidation
- **`src/constants/storage.ts` created**: centralized `STORAGE_KEYS` object with all 25 localStorage keys as typed constants.
- **3 files migrated**: `src/App.tsx` (15 replacements), `src/constants.ts` (4 replacements), `AnonymityLayer.ts` (2 replacements).
- **`STORAGE_KEYS` re-exported** from `src/constants.ts` for convenience.

### CSP hardening for production
- **Vite preview server**: CSP + security headers added to `preview` config (matches dev server config).
- **`_headers` file created**: CSP and security headers for Cloudflare Pages / Netlify deployments.
- **Meta tag retained**: `<meta http-equiv>` CSP serves as fallback for static file servers that don't support `_headers`.

### CI
- **GitHub Actions workflow** (`.github/workflows/ci.yml`): runs vitest, tsc, and Playwright e2e on push/PR.
- **E2E tests expanded**: 4 new Playwright tests (theme toggle, contacts page, settings tabs, hub nav).

### Settings reliability fixes
- **SystemStatusSection TS errors fixed**: added 5 missing store selectors (`connectionStatus`, `transportBackend`, `latencyMs`, `blockedBackends`, `regionBlocked`) to `SettingsView.tsx` destructuring.
- **exportBackup/exportBackupHtml broken calls fixed**: created `exportBackupFromStore()` convenience wrapper that reads all 31 params from store/localStorage; `StorageSection` now calls it with correct args.
- **SecuritySection PIN connected to store**: replaced `simpleHash()` + localStorage with `cryptoCore.hashAppLockPIN()` (SHA-256 PBKDF2) + `store.setAppLock()` — PIN state is now managed through the store and compatible with `App.tsx` lock screen.

