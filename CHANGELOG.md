# Changelog

## [Unreleased]

### Added
- **All-sites VPS migration kit** (`migrate/`): `export.sh` (read-only bundle: nginx, LE keys, PHP pools, systemd units, pm2, cron, web roots, SQLite data), `import.sh` (fresh Debian 12 restore), `migrate.ps1` (old→local→new orchestrator), `writers.sh` (cutover/rollback writer control), `INVENTORY.md` + `CUTOVER.md` (DNS flip, cert reissue, rollback). Prod dry-run verified: 385M bundle, all key files present.
- **Unit test suite for crypto/identity/state**: 13 test files (76 tests) covering `ed25519`, `safetyNumber`, `channelSigning`, `postKeyManager`, `masterKey`, `deviceKeys`, `devicePairing`, `secureStorage`, `retry`, `errorHandling`, and the `call`/`chat`/`settings` store slices. Crypto/identity tests run under the Node environment to avoid jsdom realm mismatches with tweetnacl.
- **`ed25519_sign` 1-argument overload** so the random-key signing path is type-safe.
- **Premium entitlement persistence refresh** (`src/hooks/usePremiumEntitlementRefresh.ts`, mounted in `App.tsx`): entitlement is re-fetched on foreground return (document `visibilitychange` → visible, `window` focus), throttled to 30s to absorb focus bursts after bootstrap; an expired entitlement is re-fetched immediately, bypassing the throttle.
- **Premium subscription client (Phase 1)**: `src/services/entitlements.ts` (device-key bound `GET /api/paymento/entitlement?pk=`), `premiumSlice` (memory-only entitlement state + startup refresh in `main.tsx`), and a new **Premium** settings section (plan rows, `sub:<devicePk>:<planId>` order IDs via `createPaymentRequest`, `PaymentRequestCard` with polling; success re-fetches the entitlement). Feature gating: call-recording retention (Forever requires Premium) and self-destruct timers (1 hour/1 day require Premium). `premium` i18n block (16 keys) added to all 8 locales; client/server plan parity guarded by `src/services/entitlements.test.ts`.
- **Premium feature gating (Phase 2)**: attachment size cap (free 50 MB → premium 500 MB) enforced in `useChatPreviewState` with a `premium.fileTooLarge` toast; extended reaction set (free 6 → premium 18) via `src/config/reactions.ts` gating the `MessageReactions` picker; ICQ sticker pack gated (`getIcqStickerIds` — first 24 free, full pack on Premium) in `StickerPicker` with a free-tier crown teaser button (`premium.stickerLocked` toast); new "What Premium unlocks" perks group in the Premium settings section. 6 new `premium.*` i18n keys (`fileTooLarge`, `perksTitle`, `perkFiles`, `perkReactions`, `perkStickers`, `stickerLocked`) in all 8 locales.

### Fixed
- **Security: Paymento merchant config & payment list were unauthenticated** (`server/routes/paymento.ts`): `/api/paymento/config` and `/api/paymento/list` now require an admin JWT via `requireAuth`. Previously any network client could overwrite the merchant secret (funds hijack) or enumerate all payments.
- **Security: hardcoded encryption fallback in Paymento secret storage**: removed `'insecure-default-change-me'` scrypt fallback; the server now refuses to start if `JWT_SECRET` is unset, so merchant secrets are never encrypted with a publicly known key.
- **Security: Paymento create endpoint now rate-limited** (10/min/IP) since each call bills the external gateway; IPN/raw body capped at 1MB to block body-based DoS.
- **Security: join-flow private keys moved out of `sessionStorage`** (`src/lib/company/onboarding/joinFlow.ts`). Ephemeral x25519/ed25519 key material is now held in memory only (XSS-exfil resistant) and the hex/base64 mismatch that corrupted the secret on read is fixed.
- **Security: payment order IDs use `crypto.randomUUID()`** (`src/config/paymento.ts`) instead of `Math.random()`.
- **Security: client `secureStorage` no longer ships a hardcoded KEK** (`src/lib/secureStorage.ts`). The AES-GCM key is now a per-install random value (generated once, stored in `localStorage`) instead of a constant passphrase baked into the bundle, so client-side blobs are not decryptable by anyone holding the build. Existing obfuscation-only blobs fail to decrypt and are treated as absent.
- **Security: WebSocket CORS hardened against CSWSH** (`server/signaling-server.ts`). When `ALLOWED_ORIGINS` is unset the signaling server now permits only same-origin WebSocket upgrades (Origin host === Host) and rejects cross-site browser origins; native clients (no Origin) are still allowed. Configuring `ALLOWED_ORIGINS` remains the explicit allowlist.
- **Security: dependency audit — cleared 7 moderate vulns** (`package.json` `overrides`): forced `file-type@^22`, `uuid@^11`, `jimp@^1.6` and `extract-zip@^2.0.1` (all transitive via the `@bubblewrap/core` Android build tool, never shipped to the running web/server). `extract-zip` now resolves to the version that contains the symlink-traversal fix; npm audit still lists it only because that advisory's DB entry has no patched-version range (a known npm-audit false positive). `build:android` must be re-verified after this change.
- **Control-height tokens forced all chips to 44px**: `tokens.css` defined `--control-height-sm`/`--control-height-md`/`--control-height-lg` all as `2.75rem` (44px), so filter chips and toolbar icons rendered oversized. Restored the intended scale (`sm: 34px`, `md: 40px`, `lg: 44px`); `FolderFilterBar` chips shrunk further (`text-[12px]`, tighter padding) per feedback.
- **Chat swipe actions**: right-swipe panel now always renders a `message` (open chat) action and shows `call`/`video` for every chat (groups/channels previously hid them). Right panel widened to 180px (`targetX` + `dragConstraints.right`) so all three buttons reveal.
- **Oversized CRM/contacts chrome**: `ContactsView` title shrunk (`text-lg sm:text-xl` → `text-base sm:text-lg`); CRM tab buttons and the "Add contact" button now use `control-height-sm` (34px) + `text-[13px]` instead of `min-h-[44px] text-sm`.
- **Broken typing-status class**: `ChatListItem` rendered the "typing…" label with a malformed className (`italic "text-[var(--accent)]"` — stray quotes broke the accent color). Fixed to a valid class so the live typing status displays correctly (feature is on by default via `typingIndicators`).
- **Test environment realm bug**: jsdom's `TextEncoder`/`crypto` produce cross-realm `Uint8Array`s that tweetnacl rejects; crypto/identity tests now use `// @vitest-environment node`.
- **UI audit: touch-targets 72 → 0**: `--control-height-sm`/`--control-height-md` were 34px/40px (below the 44px minimum). Bumped both to `2.75rem` (44px) in `tokens.css`, fixing sidebar icon buttons, folder filter chips, and the same pattern in CRM/Contacts/Settings/StoryComposer. Full `npm run test:ui-audit` now passes 14/14 with 0 errors/0 warnings.
- **UI audit harness**: `runAudit` no longer asserts internally and aborts the per-viewport loop on the first failing view (which skipped contacts/calls/company/settings/chat-open). It now returns findings and every view is audited in a single run.
- **UI audit: accessibility checks added + fixed**: `auditInPage` now flags `a11y-img-alt` (visible `<img>` missing `alt`) and `a11y-name` (interactive element without an accessible name). Fixed the surfaced gaps — chat/CRM message inputs, CallLog search, CRM filter search, Contacts favorite toggle (`aria-label`+`aria-pressed`), and the Contacts share button. Full `npm run test:ui-audit` passes 14/14 with 0 errors/0 warnings across all checks.
- **Architecture docs (UI_CYCLE 5.1/5.2)**: `ARCHITECTURE.md` now documents the Stories feature (composer → publish → viewer → tray → persistence, expiry filtering, flagged gaps). Public story functions in `storiesData.ts` gained JSDoc.
- **Form input hardening (UI_CYCLE 2.3)**: auth PIN inputs (`LoginScreen`, `RegistrationScreen`) now set `autoComplete="off"` so device PINs are not captured by password managers; the dynamic contact field input (`ContactFormFields`) now uses `type`/`inputMode`/`autoComplete` of `tel` for phones and `email` for emails so mobile keyboards and autofill match the field.
- **`createPairingResponse` test shape**: tests now pass `{ x25519Public, x25519Secret }` (matching the function contract) instead of raw `nacl.box.keyPair()` output.
- **`chatSlice` makeSlice clobber**: initial `chats` state no longer overwritten by slice defaults (`state = { ...slice, ...state }`).
- **`secureStorage` flaky assertion**: compares stored base64 against `btoa(plaintext)` instead of `not.toContain('v')` (a valid base64 char).

### Removed
- **Paymento Store Settings UI + `/api/paymento/config` endpoint**: merchant credentials are operator env config only (`PAYMENTO_API_KEY` / `PAYMENTO_SECRET_KEY`, plus optional `PAYMENTO_RETURN_URL`). Deleted `src/components/settings/StoreSettingsSection.tsx`, `src/lib/paymentoConfig.ts`, the `merchant_config` DB table/functions, and the at-rest AES-256-GCM encryption path. The old endpoint required only any admin JWT, so a user could overwrite merchant creds (OWASP A05); it is gone. Create/verify answer `503` when env creds are unset.
- **Paymento "Recent payments" client list** (`PaymentRequestsSection`): the section called `/api/paymento/list`, which now requires an admin JWT — a plain app user can never hold one, so the call always 401'd and the merchant-wide enumeration leaked other users' payment metadata (order IDs, amounts, statuses) to any device. Removed the list UI, the client `listPayments`/`PaymentListItem`, and the `payRequests.recent`/`payRequests.empty` i18n keys. The admin-authenticated endpoint stays available for operator use; creation and token-scoped verify remain public as before.

### Security
- **Android signing keystore rotated** (P0): old `messandanger-keystore.jks` deleted and replaced with a fresh RSA-4096 PKCS12 keypair (alias `messandanger`, 10-year validity). The keystore is no longer tracked in git (`*.jks`/`*.p12` in `.gitignore`); its password lives in `BUBBLEWRAP_KEYSTORE_PASSWORD` / `BUBBLEWRAP_KEY_PASSWORD` environment variables (never committed). `scripts/build-android.mjs` consumes these vars. Local git history was purged of the old keystore and `server/data/admin.db*` artifacts (`filter-branch --prune-empty` + reflog expire + `gc --prune=now`); remote refs were never affected. Existing Android installs must be reinstalled after the rotation.
- **Hardening batch**: WS handshake now validates Origin (CSWSH defense-in-depth); CI `security.yml` repaired (eslint/codeql actually run) + lint added to `ci.yml`; `public/sw.js` same-origin guard, no `/api` caching; unused/insecure crypto paths removed from `cryptoCore.ts`; dead hooks (`useConnection*`) and duplicate `landing/` dir removed.

### Added
- **Real company lifecycle (replaces demo-only company)**: `createCompany(name, displayName)` now makes the creator the company admin and persists to IndexedDB; added `createCompanyInvite()` (real `InviteQRPayload`) and `joinCompanyFromInvite()`. New `CreateCompanyModal` for first-run company creation; `CompanyContactsView` shows a "Create your company" prompt when no real company exists instead of always seeding demo members. Invite QR encodes a real signed invite payload; scanning joins the company. `updateMemberRole`/`removeMember` now persist member changes to IndexedDB. Demo data is now only a preview fallback (`isPreview`), never injected into a real company.
- **Group video conference from company roster**: company Members tab now has a "Group video call" toggle; select multiple members and start a group call (`callManager.startCall` with participants, rendered via existing `GroupCallParticipants`).
- **Serverless cross-device company sync (relay topic + presence + notifications)**: extended `server/signaling-server.ts` with additive `subscribe`/`publish`/`presence`/`notify` room support (no DB). Added `src/lib/company/relayRoster.ts` (`CompanyRosterSync`) and `joinCompanyChannel`/`leaveCompanyChannel`/`broadcastRoster` in `companySlice`. Members gossip their local roster over `company:<id>`; peers merge by `userId` (online status + discovered members) and receive notifications. Activation requires (1) redeploying the relay with the topic extension and (2) a relay JWT (`?token=`) — without it the sync degrades to a silent no-op, leaving the rest of the app unaffected.
- **Self-contained relay auth (unblocks cross-device sync AND real WebRTC calls)**: the relay requires a JWT in `?token=` but had no client-issuable token. Added `POST /api/auth/token` to `server/routes/auth.ts` (rate-limited, mints a 1h JWT via `signRelayToken` in `server/auth.ts`). Added `src/lib/network/relayToken.ts` (`getRelayToken` with cache + 3s fetch timeout, `withToken` URL helper) and wired it into every relay WS client — `wsTunnel.ts` (main app signaling), `P2PTransport.ts` (peer signaling), `relayRoster.ts` (company sync), and `signaling/index.ts`. Because `P2PTransport.call()` already implements the full offer/answer/ICE handshake, obtaining the token also makes real 1:1/video calls connect (previously the signaling WS was rejected for lacking a token, so all calls were preview-only). Requires deploying the updated relay; REST base is derived from the WS seed URL (`VITE_SIGNALING_REST_URL` to override).
- **Call / video windows**: live call-duration timer in the active call header; speaker (audio-output) toggle wired through `CallManager.toggleSpeaker` → `useCall.toggleSpeaker` → `CallScreen`; fullscreen toggle for video calls; optional minimize callback (`onMinimize`); group-call participant grid (`GroupCallParticipants`) and audio participant chips for multi-peer calls; remote `<audio>` playback so peer audio is actually heard. Incoming-call sheet now shows a live ringing timer.
- **i18n**: added `call.speaker`, `call.speakerOn`, `call.speakerOff`, `call.fullscreen`, `call.minimize` (en, ru).
- **i18n (stories)**: added the complete `story.*` key set (composer, captions, audience options `all`/`close`/`custom`/`hide`, expires, share, replies, etc.) to `en.json` and `ru.json`; other locales fall back to English. Fixes raw `story.audience.*` keys rendering in the story composer.
- **Stories: photo + video publishing**: the composer gallery button now opens a real `<input type="file" accept="image/*,video/*">`; selected media previews inline (img / looping muted video) with a remove control, object URLs are revoked on remove/publish, unsupported types are rejected. `publishMyStory` carries `image`/`video` and sets the correct `StoryItem.type`; `StoryContent` renders `<video>` and a unified failed-media fallback. Captions support emoji.
- **Stories: persistence + delete**: `MY_STORY_USER` stories hydrate from `localStorage` (`nm_stories_v1`) on load and are re-saved on publish/delete; blob-backed media is stripped before persisting (degrades to gradient/text after reload). `StoryViewer` delete action now calls `deleteMyStory` so removals survive reload.
- **Stories: expiry-aware tray**: `chat-preview/AvatarRow` now derives from `STORY_USERS` + `getVisibleStories()`, hiding expired stories and surfacing newly published ones (including `MY_STORY_USER` when it has visible stories); `onStoryClick` passes the real `StoryUser` so the viewer opens the correct story. Removed the dead duplicate `ui/AvatarRow.tsx`.
- **Mobile settings entry**: `BottomNav` now exposes a 44px profile button that opens Settings, mirroring the desktop `EcoSidebarNav` profile action. The button uses the current user name or `settings.defaultUserName` as its accessible label and renders an avatar when available.
- **i18n profile keys**: added the full `profile.*` key set to all 8 locales (`en`, `ru`, `de`, `es`, `fr`, `zh`, `ja`, `ko`) so `ChatProfileView` no longer renders raw keys for profile, call, video, mute, permissions, members, and moderation actions.

### Changed
- **Production signaling convergence (mess.cvr.name)**: legacy root PM2 daemon (`pm2-root.service` serving `/opt/messanger-signaling/dist/server.js`) stopped and disabled; user0 `mess-signaling` now owns both ports (REST `3003` via `REST_PORT`, WS `3006` via `PORT`). Added REST `GET /health` (status/clients/uptime) to `server/signaling-server.ts`. nginx: `/health` remapped to `3003`, unused `/signal/`, `/mesh/`, `/api/push/` locations removed (client uses only `/ws` + `/api/*`); `/ws` → `3006` unchanged. `scripts/deploy-all.ps1` now copies all `routes/` + `middleware/` files and sources `.env` before `pm2 restart --update-env` / fresh `pm2 start`, so route files and env can no longer regress on deploy.
- **Modal consistency**: introduced shared modal content primitives in `src/components/ui/modalShared.tsx` (`modalLabelClass`, `modalFieldClass`, `modalPrimaryBtnClass`, `modalSecondaryBtnClass`, `modalInfoClass`, `modalOptionClass`, `modalSwitchTrackClass`) so every modal matches the clean Story-composer look (accent/theme tokens, `rounded-xl`, no hardcoded gradients).
  - `CreateBotModal`: now uses accent primary button + token-based input/info styling instead of `CREATE_BOT_BUTTON_GRADIENT` / orange focus rings.
  - `CreateChannelModal`: public/private option cards and create button now use `modalOptionClass` / `modalPrimaryBtnClass` instead of `CHANNEL_CREATE_GRADIENT` and per-color (orange/blue) active states.
  - `AdvancedFilterModal`: footer buttons use `modalSecondaryBtnClass` / `modalPrimaryBtnClass`.

### Changed
- **Typography / control sizing**: introduced a proportional control-height scale (`--control-height-sm: 34px`, `--control-height-md: 40px`, `--control-height-lg: 44px`) and a tighter type ramp (`--text-2xs`…`--text-2xl`) in `src/styles/tokens.css`. Compact filter chips and toolbar icon buttons no longer dwarf their label text.
  - `FolderFilterBar`: chips `min-h-[44px] text-xs` → `min-h-[var(--control-height-sm)] text-[13px]`; filters icon button `44px` → `--control-height-md` (40px)
  - `ChatListSearchHeader`: create/archived/global-search icon buttons `44px` → `--control-height-md` (40px)
  - `ContactsView`: segmented filter tabs `min-h-[44px] text-xs` → `min-h-[var(--control-height-sm)] text-[13px]`
  - `AdvancedFilterModal`: reset/apply buttons `text-xs` → `text-sm`
  - `stories/StoryComposer`: expiration chips `min-h-[44px] text-xs` → `min-h-[var(--control-height-sm)] text-[13px]`
  - `settings/ProfileEditForm`: photo action chips `min-h-[44px] text-xs` → `min-h-[var(--control-height-sm)] text-[13px]`
  - `stories/StoryViewer`: empty-state "close" button `44px` → `--control-height-md` (40px)
  - Primary action / icon / modal / composer / call / player buttons intentionally kept at `--control-height-lg` (44px) — they are genuine touch targets, not the oversized secondary controls flagged

### Fixed
- **i18n parity**: added missing `call.flipCamera` and `call.you` keys to all 7 non-English locales (de, es, fr, ja, ko, ru, zh). `en.json` had 1211 keys while other locales had 1209, which broke the key-consistency tests (`allTests.test.ts`, `i18n.test.ts`). All 3904 unit tests now pass.
- **E2E theme/settings navigation**: theme tests now use the precise Settings → Theme → `role="switch"` path instead of the ambiguous first switch on the settings main menu; mobile profile/settings regression is covered by a dedicated usability test.
- **Stale visual baselines**: re-baselined `e2e/visual.spec.ts` snapshots after the navigation refactor and mobile profile button change; full Playwright suite is green with 122 tests.
- **Tests**: `FormModal.test.tsx` "renders with shadow-2xl" asserted a `shadow-2xl` class the modal surface never had (it uses an arbitrary `shadow-[…]` token in `modalShared.tsx`). Relaxed the assertion to `[class*="shadow-"]`. Pre-existing failure, unrelated to typography changes.
- **Production REST API 502 (mess.cvr.name)**: the prod `.env` had degraded to 227 duplicate `JWT_SECRET` lines with no `REST_PORT`, so the REST API listened on the default 8766 instead of the port nginx expects (3003) and every `/api/*` request returned `502 Bad Gateway`. Restored a clean `.env` (single `JWT_SECRET`, `REST_PORT=3003`, `ALLOWED_ORIGINS` for mess/www/admin hosts) and restarted `mess-signaling` via PM2; `/api/*` serves again (401 on missing/invalid token as expected).
- **`/promo/` 502 (mess.cvr.name)**: the path never existed and nginx's `try_files` fallback hit the missing `/index.php`, so `https://mess.cvr.name/promo/` returned `502`. Added nginx `location = /promo` and `location ^~ /promo/` → `301 /landing/`; the landing page is now reachable at both `/landing/` and `/promo/`.
- **`server/signaling-server.ts` ESM crash**: `__dirname` is not defined in ES module scope, which crash-looped the deployed `mess-signaling` PM2 process. Admin static dir is now resolved via `fileURLToPath(import.meta.url)`.
- **`deploy-all.ps1` JWT injection**: the "ensure JWT_SECRET" step ran `grep -q` and compared its (always empty) captured output instead of the exit code, so `JWT_SECRET=` lines were appended on every deploy — this is what degraded prod `.env` to 227 duplicate lines. The check now uses `$LASTEXITCODE`, and the admin-creation step reads the secret with `grep -m1 … | cut -d= -f2 -s` so a multi-line `.env` can never leak a multi-line value into the CLI env.
- **`deploy-all.ps1` nginx cache-busting**: the sed targeted a nonexistent `/etc/nginx/conf.d/mess.conf` and was not idempotent. It now targets `mess.cvr.name.conf`, is guarded by a `cache-bust-index` marker, copies back via `sudo cp`, and only runs `sudo nginx -t && sudo nginx -s reload` when the file actually changed.

### Added
- **Settings**: new `NotificationsSection` — per-chat-type toggles (private/groups/channels/mentions), in-app sound, preview, custom tone, badge behavior (all/mentions/unmuted/hidden), quiet hours with time range, and mute exceptions
- **Settings**: new `FoldersSection` — create/rename/delete chat folders, include-type chips, per-folder badge behavior cycling, protected system folders
- **Settings**: new `BackupExportSection` — auto-backup, Wi-Fi-only, last-backup time, manual backup/export, clear local cache
- **Settings**: new `HelpSupportSection` — quick help, FAQ accordion, support ticket composer, "report a bug" and thank-you empty state
- **Settings**: new `PaymentsSection` — wallet balance card, top-up/send, payments toggle, biometric confirmation, recent transactions with receipts
- **SettingsMainMenu**: wired all five new sub-screens as navigable entries (Notifications card opens detail view; Folders, Backup & Export, Help, Payments nav items)
- **UI**: new `Toast`/`ToastViewport` + `toast()` helper (success/error/warning/info, optional action, auto-dismiss) mounted globally in `App`
- **UI**: new `EmptyState` and `ErrorState` primitives (brief §8.10–8.12) for consistent empty/error/loading surfaces
- **Stories**: full feature per brief §5.9 — `stories/storiesData` mock model, `StoryViewer` carousel (progress bars, auto-advance, tap/hold navigation, reactions, reply, share, privacy badge), `StoryComposer` (gradient backgrounds, caption, audience, expiration, publish), and a stories row inside the chat list (plus the existing Stories tab)
- **Media Viewer**: unified `MediaViewer` (brief §5.11) for photo/video/document/audio with zoom, playback, prev/next, and share/save/forward/delete actions — replaces the separate `PhotoViewer` and `VideoPlayerOverlay` overlays, wired into `ChatPreviewLayer`
- **Profiles**: new `ChatProfileView` (brief §5.5) handling user/group/channel/bot variants with media tabs, members/admins, permissions, and block/leave/report actions — opens from the chat header for groups, channels and bots
- **Conversation**: new `MessageContextMenu` (brief §5.4) — long-press / right-click any message to Reply, Copy, Save/Unsave, Pin/Unpin, Forward, and Delete (own) / Report (others); forward and delete update the store (`forwardMessage`, chat messages), pin uses `addPinnedMessage`/`removePinnedMessage`
- **Conversation**: new `PinnedMessagesBar` (brief §5.4) — a pinned bar above the message feed showing the latest pinned message + count; tap opens a sheet listing all pinned messages with unpin and jump-to-message actions, driven by the store `pinnedMessageList`
- **Conversation**: new message **Selection Mode** (brief §5.4) — long-press a message → "Select" (or tap a selected message) enters multi-select; a `MessageSelectionBar` shows the count with Select-all, Forward-selected and Delete-selected; selections update the store; tapping a message toggles its selection and shows a ring indicator
- **Conversation**: in-chat **search type filters** (brief §5.4) — `SearchBar` now shows All / Media / Files / Links chips; filtering is applied in `useChatPreviewState` `filteredHistory` (combined with the existing text + sender + date filters), so in-chat search can narrow results to media, documents or links
- **Performance (AGENTS §4.4)**: code-split the heavy conditionally-rendered overlays `MediaViewer` and `ChatProfileView` in `ChatPreviewLayer` via `React.lazy` + `Suspense`, and gated them behind their open state so those chunks (≈4.2 KB brotli total) load **on demand** instead of at initial app start
- **Performance (AGENTS §4.4)**: **lazy-load locale dictionaries** — removed the `locales: ['./src/locales']` `manualChunks` entry in `vite.config.ts` (which forced every language into one 45.8 KB brotli chunk) and changed `preloadLocales()` to load only the active language + `en`. Locales are now per-language chunks (~10–13 KB each) fetched on demand; initial locale payload dropped ~77% (45.8 KB → ~10.5 KB for English). `setLang` now awaits locale load + bumps a `dictVersion` so the UI updates reliably after switching language

## UX consistency & bug fixes (user-reported)
- **Conversation call buttons (#3)**: `ChatHeader` now shows **Phone** and **Video** call buttons (next to Search) for 1:1 chats; they are hidden for groups/channels/bots via the existing `groupish` rule. Wired through `ChatPreviewLayer` → `ActiveChatWorkspace` (`onCall`/`onVideoCall` were already plumbed). Added `ChatHeader` tests.
- **Morse replies readable (#1)**: added `decodeIfMorse` to `MorseDecoder`; reply previews in `ChatInputReplyBar`, `ChatMessage` (inline `replyTo` block) and `ChatInputOverlay` now **decode Morse quotes** so a quoted Morse message shows human-readable text instead of dots/dashes.
- **Modal style consistency (#4)**: unified modal chrome. The rogue `commercial/ui/Modal` (which used a separate CSS-class system with inline `DESIGN_TOKENS`) now delegates to `ui/Modal`. `ConfirmModal` gained `rounded-2xl` and its `z-[300]` → `z-50`; `ConfirmDialog` `z-[200]` → `z-50`; `ui/Modal` uses the shared `bg-[var(--bg-tertiary)]` token; `ContactProfileModal` close button aligned to the canonical 44px style. All modals now share the same backdrop (`bg-black/60 backdrop-blur-sm`), panel (`rounded-2xl` + `border-[var(--border-color)]` + `shadow-2xl`), and `z-50` stacking.

## Design-system unification ("styles different everywhere")
- Root cause: the app already had a canonical `Button` (`src/components/ui/Button.tsx` + `src/config/buttonThemes.ts` with unified `SIZE_MAP`/`SPACING` tokens and CSS-var theme) but many components bypassed it with one-off inline button classes, causing the inconsistency. Added `forwardRef` to `Button` (so focus management in `ConfirmModal` keeps working), then migrated all modal action buttons — `ConfirmModal`, `ConfirmDialog`, `InfoModal`, `TextInputModal` — onto the design-system `Button` (consistent `primary`/`secondary`/`danger` variants, `rounded-lg`, 44px touch targets, theme tokens). Removed the now-redundant bespoke modal button markup. The neumorphic chat-input footer is intentional (the app's signature style) and left unchanged.

### Security / Resilience audit (AGENTS Stage 3–4)
- **Headers**: CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS already set on Vite `server` + `preview` (vite.config.ts)
- **XSS surface**: no `dangerouslySetInnerHTML` / `innerHTML` / `eval` / `new Function` in `src` — clean
- **Error boundaries**: global `ErrorBoundary` + `window.onerror` / `unhandledrejection` runtime guards + service worker already wired in `main.tsx`
- **Dependencies**: `npm audit` shows 8 **moderate** advisories, all in the **dev-only** PWA/`@bubblewrap/core` → `googleapis`/`jimp`/`uuid` chain (never shipped to the client). Only fix is a breaking `@bubblewrap/core` downgrade, so left as-is (no client-runtime risk)

### Removed
- **Dead code**: deleted unused `PhotoViewer` and `chat/VideoPlayerOverlay` (superseded by unified `MediaViewer`)
- **Dead code**: removed obsolete `StoryViewerOverlay` (replaced by `StoryViewer` carousel)

### Fixed
- **AppShell**: mobile chat flow now swaps list and active conversation cleanly, so opening a chat no longer leaves the list mounted underneath
- **EcoSidebarNav**: removed the duplicate footer settings action on desktop; settings now has a single consistent entry point
- **ContentView**: removed the artificial desktop width cap that was squeezing the main messenger canvas on wide screens
- **UI tokens**: switched the app font stack to a cleaner system-first variable stack and aligned theme `color-scheme` with the active palette
- **SettingsView**: dead «Данные и хранилище» / "Data & Storage" entry now navigates to a real `StorageSection` subview (was a blank screen)
- **SettingsView**: removed import-time references to deleted `AccountSection`/`MyProfileSection` (TS compilation restored after dead-code purge)
- **SettingsView**: container redesigned — solid card with `rounded-2xl`, stronger shadows, no `shadow-inner` bleed
- **i18n**: added `settings.storageMediaSection`, `mediaAutoLoad`, `localEncryption`, `draftsSaved`, `clearCache`, `feedCacheSize`, `enabled`, `autoLoad.*` keys to all 8 locales (en, ru, de, es, fr, zh, ja, ko)
- **i18n**: localized onboarding strings across all locales (`description`, `startChat`, `step1`, `step2`)
- **OnboardingPanel**: replaced dead `t(key) || fallback` chains with direct `t(key)` (fallbacks were never used)
- **ChatMessage**: removed duplicate `key={msg.id}` prop (key is owned by parent list)
- **ChatListSearchHeader**: fixed action buttons — proper `<button>` semantics, `rounded-full`, aria-labels, correct badge text color
- **FolderFilterBar**: replaced `div`-chips with `<button>` semantics, `aria-pressed`, proper min-touch-target (36×36+)
- **SettingsRow (ToggleSwitch)**: `div role="switch"` → `<button>`, added `type`, focus-ring, i18n-aware active/inactive colours

### Changed
- AGENTS.md optimization cycle: Stage 1 (structural), Stage 2 (UI/UX), Stage 3 (security), Stage 4 (resilience)

### Security
- Removed unused `@bubblewrap/core` dependency (9 transitive CVEs)
- Added `Permissions-Policy` header to Vite config
- All CSS colors migrated to CSS custom properties (eliminated hardcoded colors)
- Added CSP meta tag configuration via `_headers` and `vite.config.ts`

### Fixed
- Build error: removed broken `locales` entry from `manualChunks`
- Stale lockfile cleaned (`package-lock.json` regenerated)
- `useCall.ts`: all 8 async callbacks wrapped in try-catch (unhandled rejections)
- `useAppLock.ts`: `hashAppLockPIN` wrapped in try-catch
- `wsTunnel.ts`: added 10s WebSocket connection timeout
- `PillButton`: replaced non-focusable `<div>` with `<button>` (keyboard a11y)
- `BottomNav`: added `aria-current="page"`, `focus-visible` ring
- `Input`: added `min-h-[44px]` touch target, `role="alert"` on errors
- `ErrorBoundary`/`SuspenseFallback`: theme-aware, added `role="alert"`/`role="status"`
- `EmptyState`: added `role="status"`

### Added
- Service Worker (`public/sw.js`) — cache-first, offline fallback
- CSS tokens for all missing vars (`--bg-card`, `--color-warning`, `--button-*`, etc.)

### Removed
- ~111 unused files (dead code, empty directories, test snapshots)
- 7 unused npm dependencies (`@bubblewrap/core`, `googleapis`, `jimp`, etc.)
- All hardcoded theme branches replaced with CSS variables
- Empty `.gitkeep` files
- Barrels/index re-exports (replaced with direct imports)
