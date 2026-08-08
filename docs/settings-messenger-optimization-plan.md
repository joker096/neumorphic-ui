# Settings Page & Messenger Management Optimization Plan

**Version:** 2.0
**Date:** 2026-08-02
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Settings Page Optimization](#2-settings-page-optimization)
   - [2.1 Critical Issues](#21-critical-issues)
   - [2.2 Architecture & Structure](#22-architecture--structure)
   - [2.3 UI/UX Improvements](#23-uiux-improvements)
   - [2.4 State Management](#24-state-management)
   - [2.5 Performance](#25-performance)
   - [2.6 Accessibility](#26-accessibility)
3. [Messenger Management UX Improvements](#3-messenger-management-ux-improvements)
   - [3.1 Chat List Enhancements](#31-chat-list-enhancements)
   - [3.2 Chat Header & Navigation](#32-chat-header--navigation)
   - [3.3 Message Actions](#33-message-actions)
   - [3.4 Input Area Improvements](#34-input-area-improvements)
   - [3.5 Batch Operations](#35-batch-operations)
4. [Security Hardening for Messenger](#4-security-hardening-for-messenger)
   - [4.1 Third-Party Attack Prevention](#41-third-party-attack-prevention)
   - [4.2 Channel Blocking for Prohibited Content](#42-channel-blocking-for-prohibited-content)
   - [4.3 Content Moderation Infrastructure](#43-content-moderation-infrastructure)
   - [4.4 Security-Focused Settings](#44-security-focused-settings)
5. [Prioritized Action Items](#5-prioritized-action-items)
6. [Success Metrics](#6-success-metrics)

---

## 1. Executive Summary

This plan addresses three focus areas:

- **Settings Page**: The settings UI has structural anti-patterns (non-reactive store access inside render, hardcoded values, inconsistent animation patterns), missing error boundaries for lazy-loaded sections, and components that exceed recommended complexity thresholds.
- **Messenger Management**: The chat list and message interaction layer lacks batch operations, has incomplete message actions (no forward, copy, pin, delete), and has components that are oversized and contain hardcoded styling that should be abstracted.
- **Security Hardening**: The messenger currently lacks resistance to third-party interception, has no user-initiated channel blocking for prohibited content (drugs, terrorism, etc.), and has incomplete content moderation infrastructure. This section adds security layers on top of the existing E2E encryption foundation.

---

## 2. Settings Page Optimization

### 2.1 Critical Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| C1 | `useAppStore.getState?.()` called inside render (non-reactive) | **Critical** | `SettingsView.tsx:76`, `SettingsView.tsx:87-88` |
| C2 | Hardcoded build date footer (`31.05.2026, 11:43`) | **High** | `SettingsMainMenu.tsx:264` |
| C3 | `soundEnabled` fetched via `getState` instead of from store subscription | **High** | `SettingsView.tsx:87-88` |
| C4 | `useSettings().resetSettings` has 24-item dependency array — stale closure risk | **High** | `useSettings.ts:115-122` |
| C5 | No error boundary wrapping lazy-loaded settings sections | **Medium** | `SettingsView.tsx:281-298` |
| C6 | `SettingsToggle.tsx` has hardcoded neumorphic shadow values tied to light/dark mode | **Medium** | `SettingsToggle.tsx:31-33` |

### 2.2 Architecture & Structure

**2.2.1 Extract Settings Configuration**

- Move all settings section definitions (section order, icons, labels, navigation targets) into a config file at `src/config/settingsSections.ts`
- Each section should be defined as a data object: `{ id, label, icon, subtitle, color, component }`
- This eliminates the repetitive JSX in `SettingsMainMenu.tsx` and enables dynamic section rendering
- The main menu should iterate over this config array instead of hardcoding each section

**2.2.2 Fix Non-Reactive Store Access**

- Replace `useAppStore.getState?.()` calls inside render with proper store subscriptions via `useAppStore(state => state.devices)` etc.
- In `SettingsView.tsx:76`, the `devices` variable is redundantly re-declared inside `renderMainSettings()` — it shadows the destructured `devices` from line 54
- The `soundEnabled` fallback at line 87-88 should use the destructured `soundEnabled` from the main store subscription instead of `getState`

**2.2.3 Standardize Animation Patterns**

- `SettingsSection.tsx` uses `motion.div` with `AnimatePresence` for section transitions
- `SettingsMainMenu.tsx` uses `motion.div` with a different animation config (`opacity: 0, x: -20` vs `opacity: 0, x: 20`)
- `SettingsView.tsx` wraps sections in `AnimatePresence mode="wait"` but the lazy-loaded sections also have their own `motion.div` animations — potential double-animation
- Consolidate animation configs into a shared `src/config/animations.ts` file with named presets (e.g., `slideLeft`, `slideRight`, `fadeIn`)

**2.2.4 Add Error Boundaries**

- Wrap each `Suspense` boundary in `SettingsView.tsx` with an `ErrorBoundary` component
- The current `fallback` skeleton is defined inline in the render function (line 268-279) — extract it to a reusable `SettingsSkeleton` component at `src/components/ui/SettingsSkeleton.tsx`

**2.2.5 Reduce Component Complexity**

- `SettingsMainMenu.tsx` is 274 lines — exceeds the 200-line guideline
- Split into:
  - `SettingsMainMenu.tsx` — layout and search (keep under 100 lines)
  - `SettingsSectionGroup.tsx` — each section group (Account, Appearance, Notifications, Privacy, etc.) as a separate component
  - `SettingsFooter.tsx` — build info footer (extracts hardcoded date)

### 2.3 UI/UX Improvements

**2.3.1 Settings Search**

- The search input in `SettingsMainMenu.tsx` filters by section title but does not actually navigate or highlight matching sections
- Implement real search: when user types, filter sections and highlight matches
- Add keyboard navigation (arrow keys to navigate filtered results, Enter to select)

**2.3.2 Section Group Visual Consistency**

- The "Notifications" section uses `ToggleSwitch` inline within `SettingsMainMenu.tsx` (lines 97, 109, 121) while other sections use `SettingsRow` components
- Standardize all section rows to use `SettingsToggleRow` or `SettingsRow` from `SettingsRow.tsx` for consistent styling and interaction patterns
- The `SettingsToggle.tsx` component (76 lines, neumorphic) is only used in one place and duplicates `ToggleSwitch` from `SettingsRow.tsx` — deprecate `SettingsToggle.tsx` in favor of `ToggleSwitch`

**2.3.3 Responsive Settings Layout**

- On mobile (< 768px), the settings main menu should use a bottom navigation or collapsible accordion instead of a scrollable list
- Section content areas should have proper padding adjustments for mobile (`p-4` vs `p-6`)

**2.3.4 Empty & Loading States**

- `BotsSection.tsx` has a proper empty state (line 68-72) — use this pattern consistently across all sections
- `StorageSection.tsx`, `DevicesSection.tsx`, and other sections should also have empty states
- Add loading skeletons specific to each section type (not a generic fallback)

**2.3.5 Confirmation Dialogs**

- `ConfirmModal.tsx` exists and is used in `BotsSection.tsx` — ensure all destructive actions (remove bot, wipe data, remove device) use it
- Add a general "Reset Settings" confirmation dialog (currently `resetSettings` in `useSettings.ts` has no confirmation)

### 2.4 State Management

**2.4.1 Consolidate Settings State**

- Settings are split across two stores:
  - `useSettings()` hook (localStorage-backed, for UI preferences like font size, theme, language)
  - `useAppStore` (Zustand, for app state like notifications, privacy, network)
- These should be unified or at minimum have a clear boundary documented in `src/config/settingsBoundaries.md`
- The `settingsSlice.ts` has `PRIVACY_PERSISTED_FIELDS` that overlap with `useSettings` keys — deduplicate persistence layer

**2.4.2 Add Settings Validation**

- Add runtime validation for settings values (e.g., `forwardCountLimit` should be 1-10, `dndFrom`/`dndTo` should be valid times)
- Use `src/config/settingsValidation.ts` with Zod or a lightweight validation schema

**2.4.3 Settings Export/Import**

- The locale file has `exportBackup` and `importBackup` keys but no corresponding UI in the settings page
- Add a "Data & Backup" section that allows users to export/import settings as JSON

### 2.5 Performance

**2.5.1 Lazy Loading Optimization**

- All settings sections are already lazy-loaded via `React.lazy` — good
- But `SettingsMainMenu` is NOT lazy-loaded — it's rendered inline on every settings visit
- Consider lazy-loading `SettingsMainMenu` as well, or at minimum memoize it with `React.memo`

**2.5.2 Reduce Re-renders**

- `SettingsView.tsx` destructures 30+ values from `useAppStore` — any store change causes a full re-render
- Split into smaller components that subscribe only to the store slices they need
- Use `useAppStore(state => state.x)` selector pattern instead of destructuring the entire store

**2.5.3 Memoization**

- `SettingsMainMenu.tsx` is not wrapped in `React.memo` — it re-renders on every state change
- `SettingsSection.tsx` is wrapped in `React.memo` — good, but its `onBack` prop should be stable (use `useCallback` in parent)
- `renderMainSettings()` in `SettingsView.tsx` creates a new function on every render — memoize with `useCallback`

### 2.6 Accessibility

**2.6.1 ARIA Labels**

- Toggle switches in `SettingsToggle.tsx` have `aria-label="On"/"Off"` — too generic
- Should be `aria-label="Notifications: On"` with the actual setting name
- `SettingsRow.tsx` toggle rows lack `role="switch"` on the row itself

**2.6.2 Focus Management**

- When navigating back from a settings sub-section to the main menu, focus should return to the triggering element
- Add `useRef` to track the previously focused element and restore focus on back navigation

**2.6.3 Keyboard Navigation**

- Settings rows with `onClick` should be focusable and activatable via Enter/Space (partially done in `SettingsRow.tsx:22-27`)
- The `SettingsToggle.tsx` component handles keyboard but `ToggleSwitch` in `SettingsRow.tsx` does not stop propagation properly in all cases

---

## 3. Messenger Management UX Improvements

### 3.1 Chat List Enhancements

**3.1.1 Chat List Search & Filter**

- `ChatListSearchHeader.tsx` has a search input but no advanced filtering
- Add filter chips/tags above the chat list: "Unread", "Muted", "Pinned", "Groups", "Channels"
- The search should filter by chat name AND last message content (currently only filters by name)
- Persist filter state in `useLocalStorage` so users don't lose their filters on reload

**3.1.2 Chat List Item Improvements**

- `ChatListItem.tsx` is 309 lines — exceeds the 200-line guideline
- Extract sub-components:
  - `ChatListItemAvatar.tsx` — avatar with online indicator and selection state
  - `ChatListItemContent.tsx` — name, last message, unread badge, time
  - `ChatListItemActions.tsx` — swipe actions (archive, call, video)
- The swipe-to-archive gesture (lines 86-91, 119-128) should also support swipe-to-mute and swipe-to-pin
- Add swipe action preview: when user swipes, show a colored background hint indicating the action

**3.1.3 Chat List Empty State**

- No empty state exists for the chat list when there are no chats
- Add a friendly empty state with an illustration, message ("No chats yet"), and a CTA to start a conversation
- The `EmptyState.tsx` component at `src/components/ui/EmptyState.tsx` should be used

**3.1.4 Chat List Grouping**

- Currently chats are flat — add grouping by:
  - "Pinned" (pinned chats at top)
  - "Unread" (chats with unread messages)
  - "Recent" (last 7 days)
  - "Other" (everything else)
- Use the existing `callFolders` pattern from the store as a model

### 3.2 Chat Header & Navigation

**3.2.1 Chat Header Enhancements**

- `ChatHeader.tsx` is 94 lines — acceptable but could be improved
- Add a "More" menu (three-dot) with actions: Mute, Pin, Archive, Clear History, Delete Chat
- The online status indicator (green dot) should have a tooltip showing the last seen time when offline
- Add a call duration display when an active call is in progress

**3.2.2 Navigation Improvements**

- The back navigation in `ChatHeader.tsx` (ChevronLeft) should use proper `aria-label` ("Back to chat list")
- Add a "Jump to Latest" button that appears when scrolled up in a chat, similar to WhatsApp
- The `ViewTabs.tsx` bottom indicator (`layoutId="messengerTab"`) should animate smoothly when switching tabs

### 3.3 Message Actions

**3.3.1 Expand Message Actions**

- `MessageActions.tsx` currently only has Reply and Save — missing:
  - **Forward**: forward message to another chat
  - **Copy**: copy message text to clipboard
  - **Delete**: delete message (for own messages)
  - **Pin**: pin important messages
  - **Reply in thread**: if thread support exists
  - **Translate**: translate message text
- Add a long-press context menu that reveals all available actions
- The `MessageActions.tsx` should use a `Popover` or `Dropdown` component for the action menu

**3.3.2 Message Context Menu**

- Add a right-click context menu (desktop) and long-press menu (mobile) on messages
- Menu items should be context-aware (e.g., "Copy" only for text messages, "Translate" only for supported languages)
- Use the existing `Modal` or `ConfirmDialog` component for destructive actions (delete)

**3.3.3 Message Status Indicators**

- The `ChatMessage.tsx` should show clear delivery status icons (sent, delivered, read)
- Add a "View Details" tooltip on message status that shows timestamp and delivery info
- Failed message delivery should show a retry button

### 3.4 Input Area Improvements

**3.4.1 Reduce Input Area Complexity**

- `ChatInputArea.tsx` is 389 lines — significantly exceeds the 200-line guideline
- Extract sub-components:
  - `MessageToolbar.tsx` — the top toolbar with attach, schedule, sticker, mute, morse buttons
  - `MessageComposer.tsx` — the text input area with reply preview
  - `VoiceRecorderBar.tsx` — the voice recording UI when recording is active
  - `StickerPickerInline.tsx` — inline sticker picker
  - `SchedulePopup.tsx` — the schedule message popup

**3.4.2 Input Area UX**

- The reply preview bar (lines 325-353) should be collapsible to save vertical space
- Add a character counter for long messages (optional, configurable)
- The mute/silent mode toggle (BellOff icon) should show a visual indicator when active (e.g., muted badge on the chat header)
- The Morse encoder (M button) should have a tooltip explaining what it does

**3.4.3 Send Button States**

- The send button has 4 visual states (empty, text-only, scheduled, recording) — add a 5th state for "sending" (disabled with spinner)
- The send button should be disabled when the message is empty and the user tries to send (currently it starts voice recording)

### 3.5 Batch Operations

**3.5.1 Multi-Select Mode**

- `ChatListItem.tsx` already has `selectMode` and `selected` props — but there's no multi-select toolbar
- Add a batch action bar that appears when 1+ chats are selected:
  - Archive selected
  - Mute selected
  - Pin selected
  - Delete selected
  - Mark as read
- The `BulkActionsBar.tsx` component at `src/components/chat-preview/BulkActionsBar.tsx` should be enhanced to support these actions

**3.5.2 Chat Management Actions**

- Add "Select All" / "Deselect All" in multi-select mode
- Add a "Select by status" option (select all unread, select all muted, etc.)
- The `FolderFilterBar.tsx` should support batch operations on filtered chats

---

## 4. Security Hardening for Messenger

### 4.1 Third-Party Attack Prevention

The messenger currently has E2E encryption (double ratchet, AES-256-GCM) and device fingerprinting, but lacks several defenses against third-party interception and manipulation.

**4.1.1 Transport Layer Security**

| Issue | Risk | Fix |
|-------|------|-----|
| WebSocket signaling uses `wss:` but falls back to `ws:` | Man-in-the-middle on unencrypted WS | Enforce `wss:` only; never fall back to `ws:` |
| No certificate pinning for signaling server | MITM via compromised CA | Implement certificate pinning in `TransportManager.ts` |
| REST API runs over plain HTTP | Credentials/tokens intercepted | All API calls must go through TLS proxy |
| No request signing for P2P messages | Message tampering in transit | Add HMAC-SHA256 signatures to all P2P messages |

**4.1.2 Message Integrity & Anti-Tampering**

- Add message signing at the `MessageEnvelope.ts` level — each message should carry a signature from the sender's private key
- Verify signatures on receipt before displaying — reject tampered messages
- Add a `messageHash` field to `ChatMessage` type that is a SHA-256 hash of the message content + sender + timestamp
- Display a "verified" badge on messages that pass signature verification

**4.1.3 Anti-Replay & Anti-Relay Attacks**

- Add monotonically increasing message sequence numbers per conversation
- Reject messages with sequence numbers older than the last seen (replay protection)
- Add a relay detection mechanism: if a message arrives via a relay node (not direct P2P), flag it with a "relayed" indicator
- The `AnonymityLayer.ts` should log relay hops and warn users when messages traverse more than 2 hops

**4.1.4 Client-Side Security**

- The `secureStorage.ts` uses a hardcoded PBKDF2 password (`mess-anger-storage-v1`) — this should be derived from the user's PIN or biometrics, not a static string
- Add `Content-Security-Policy` enforcement for inline scripts — the current CSP (`object-src 'none'`) is good but `script-src 'self'` should also exclude `'unsafe-inline'` and `'unsafe-eval'`
- Add `sandbox` attribute to any WebView or iframe usage
- Implement screenshot protection (`useScreenshotProtection.ts` exists — ensure it's enabled by default in privacy settings)
- Add clipboard sanitization: automatically clear copied message content after 2 minutes

**4.1.5 Session Security**

- The app lock (`useAppLock.ts`) uses exponential backoff — good
- Add biometric authentication (Face ID / fingerprint) as an alternative to PIN
- Add auto-lock timeout setting (configurable: 1min, 5min, 15min, 30min, always)
- Add a "lock on background" setting that locks the app when it loses focus
- Session tokens should have a maximum lifetime (currently 24h — consider reducing to 8h for high-security users)

**4.1.6 Network Security**

- The `TransportManager.ts` should verify that all P2P connections use encrypted channels (DTLS/SRTP for WebRTC)
- Add a "security status" indicator in the chat header showing: E2E encrypted, relay hops, connection type
- The `MeshNetwork.ts` should validate that peer public keys match known contact keys before accepting messages
- Block connections from unknown/unverified peers by default

### 4.2 Channel Blocking for Prohibited Content

The current codebase has no mechanism for users to block channels that propagate prohibited substances, terrorism, or other illegal content. This section defines the full implementation plan including in-channel blocking instructions and abuse prevention.

#### 4.2.1 In-Channel Blocking Instructions (User-Facing)

Users must be able to block a channel directly from within the chat interface, not just from the settings page. The following blocking flows are defined.

##### Profile Card Blocking UX — Redesigned

The current three-dot (`MoreVertical`) menu approach for blocking in the `ContactProfileModal` is replaced with a more discoverable and intuitive pattern. The three-dot menu is removed entirely from the profile card.

**New Pattern: Bottom Action Bar + Swipe Actions**

The profile card (`ContactProfileModal`) uses two complementary interaction patterns:

**Pattern A: Bottom Action Bar (Primary)**

A dedicated action bar at the bottom of the profile card always shows the most important actions as icon buttons in a row. This makes blocking immediately discoverable without requiring extra taps.

```
┌─────────────────────────────────────┐
│  [X]  ─── Contact Name ───  [★]   │  ← Header (close + favorite)
│                                     │
│         ┌─────────────┐             │
│         │   Avatar    │             │  ← Avatar with online indicator
│         └─────────────┘             │
│     Contact Name • Status           │
│     ID: contact_001                 │
│                                     │
│  ─── Contact Info ───────────────── │
│  Phone: +1 234 567 890             │
│  Email: user@example.com           │
│                                     │
│  ─── Actions ──────────────────────│
│  [📞 Call] [📹 Video] [💬 Message] │  ← Primary action buttons
│                                     │
│  ─── Security ─────────────────────│
│  [🛡️ Verify]  [🔒 Block]          │  ← Security actions (always visible)
│                                     │
│  ─── Danger Zone ──────────────────│
│  [✏️ Edit]  [🗑️ Delete]           │  ← Destructive actions (tucked but visible)
└─────────────────────────────────────┘
```

**Icon mapping for the bottom action bar:**

| Action | Icon | Color | Description |
|--------|------|-------|-------------|
| Call | `Phone` | Green | Voice call |
| Video Call | `Video` | Teal | Video call |
| Message | `MessageSquare` | Blue | Open chat |
| Verify Security | `ShieldCheck` | Gray | Verify safety number |
| **Block** | `Ban` | Red | Block this contact |
| Edit | `Edit` | Gray | Edit contact info |
| Delete | `Trash2` | Red | Delete contact |
| Favorite | `Star` / `StarOff` | Yellow | Toggle favorite |

**Block button specifics:**
- The `Ban` icon (circle with diagonal slash) is used for block — it's universally recognized as "prohibited"
- When the contact is already blocked, the icon changes to `ShieldCheck` (shield with checkmark) with the label "Unblock"
- The block button is always visible in the bottom action bar — never hidden in a dropdown
- On tap, a confirmation dialog appears: "Block {name}? They won't be able to contact you."
- On confirm, the contact is blocked and the profile card closes
- A toast appears: "Contact blocked" with a 5-second undo option

**Pattern B: Swipe Actions (Secondary)**

Swipe left on the profile card to reveal a row of action buttons:
- Swipe left → [🔒 Block] [🗑️ Delete]
- Swipe right → [⭐ Favorite] [📞 Call]

This provides a quick-access alternative for power users while keeping the bottom bar as the primary interaction.

**Pattern C: Long-Press Avatar (Alternative)**

Long-pressing the avatar opens a quick radial menu with:
- Call
- Video Call
- Message
- Block
- Delete

This is an optional enhancement for tablet/desktop where long-press is a natural gesture.

**Block State Visual Feedback:**

When a contact is blocked, the profile card shows:
- A red "Blocked" badge below the avatar
- The `Ban` icon in the bottom bar is replaced with `ShieldCheck` (unblock)
- The call/video/message buttons are disabled with reduced opacity
- A notice: "This contact has been blocked. Unblock to restore communication."

**Flow 1: Block Contact from Profile Card**

1. User opens a contact's profile card
2. User taps the **Block** button (red `Ban` icon) in the bottom action bar
3. A confirmation dialog appears: "Block {name}? They won't be able to contact you."
4. On confirm, the contact is blocked
5. The profile card closes
6. A toast appears: "Contact blocked" with an undo button
7. The contact is removed from the chat list and added to the blocklist

**Flow 2: Unblock Contact from Profile Card**

1. User opens a previously blocked contact's profile card
2. The Block button now shows `ShieldCheck` (unblock icon) in green
3. User taps the unblock button
4. A confirmation dialog appears: "Unblock {name}? They will be able to contact you again."
5. On confirm, the contact is unblocked
6. The contact reappears in the chat list

**Flow 3: Block from Chat List (Long-Press)**

1. User long-presses a contact in the chat list
2. A context menu appears: [📞 Call] [📹 Video] [🔒 Block] [🗑️ Delete]
3. User taps "Block"
4. Same confirmation dialog as Flow 1

**Flow 4: Block from Settings**

1. User navigates to Settings → Privacy & Security → Blocked Contacts
2. A list of currently blocked contacts is shown
3. User can tap "Add" to search for and block a contact by name
4. User can tap any blocked contact to unblock it
5. A "Report a Contact" button at the top opens the reporting flow

**Visual Indicators for Blocked Contacts**

- Blocked contacts show a red "Blocked" badge in the chat list
- In the "Blocked Contacts" section of Settings, each entry shows: contact name, block date, and an "Unblock" button
- When a blocked contact attempts to send a message, the message is silently dropped (no notification to the user)
- A subtle banner may appear: "1 message from a blocked contact was not shown" (optional, configurable)

#### 4.2.2 Abuse Prevention: Rate Limiting Reports

#### 4.2.2 Abuse Prevention: Rate Limiting Reports

To prevent a single user from abusing the blocking/reporting system (e.g., reporting 10 channels per minute to harass legitimate channel owners), the following rate limiting rules are enforced:

**Client-Side Rate Limiting**

| Action | Limit | Window | Enforcement |
|--------|-------|--------|-------------|
| Channel report submission | 1 per minute per user per channel | 60 seconds | Client-side cooldown + server validation |
| Channel block submission | 5 per hour per user | 3600 seconds | Client-side counter + server validation |
| Channel unblock | No limit | — | Immediate |
| Message report (within a channel) | 1 per minute per user per channel | 60 seconds | Client-side cooldown + server validation |

**Server-Side Rate Limiting**

The server must enforce all rate limits independently of the client. The following endpoints are added to `server/routes/admin.ts`:

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/admin/channels/report` | POST | User JWT | 1/min per user per channel | Submit a channel report |
| `/api/admin/channels/block` | POST | User JWT | 5/hr per user | Block a channel |
| `/api/admin/channels/unblock` | POST | User JWT | No limit | Unblock a channel |
| `/api/admin/channels/my-blocks` | GET | User JWT | No limit | List user's blocked channels |
| `/api/admin/channels/my-reports` | GET | User JWT | No limit | List user's reports |
| `/api/admin/channels/flagged` | GET | Admin JWT | 10/min per admin | List flagged channels for review |

**Rate Limit Implementation**

Add to `server/middleware/rateLimit.ts`:

```typescript
// Per-user per-channel report rate limiter
const channelReportLimiter = new Map<string, { count: number; windowStart: number }>();

export function checkChannelReportRateLimit(userId: string, channelId: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const key = `${userId}:${channelId}`;
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const maxReports = 1;

  const entry = channelReportLimiter.get(key);
  if (entry && now - entry.windowStart < windowMs) {
    if (entry.count >= maxReports) {
      return {
        allowed: false,
        retryAfter: Math.ceil((windowMs - (now - entry.windowStart)) / 1000),
      };
    }
    entry.count++;
  } else {
    channelReportLimiter.set(key, { count: 1, windowStart: now });
  }
  return { allowed: true };
}

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of channelReportLimiter) {
    if (now - entry.windowStart > 60_000) {
      channelReportLimiter.delete(key);
    }
  }
}, 300_000);
```

**Abuse Detection & Escalation**

| Abuse Pattern | Detection | Action |
|---------------|-----------|--------|
| User reports >5 channels in 1 hour | Server-side counter | Temp ban from reporting for 1 hour |
| User reports >20 channels in 24 hours | Server-side counter | Temp ban from reporting for 24 hours |
| User blocks >10 channels in 1 hour | Server-side counter | Warning: "You are blocking channels rapidly. If this is abuse, your blocking ability will be restricted." |
| User blocks >50 channels in 24 hours | Server-side counter | Temp ban from blocking for 12 hours |
| Same user repeatedly reports the same channel | Server-side dedup | Ignore duplicate reports within 24 hours |
| User reports a channel then immediately unblocks it | Server-side pattern | Flag for admin review (possible abuse) |

**Banning Users Who Abuse the System**

When a user exceeds abuse thresholds, they receive a temporary ban from the reporting/blocking system:

| Ban Type | Duration | Trigger |
|----------|----------|---------|
| Report ban (temp) | 1 hour | >5 reports in 1 hour |
| Report ban (temp) | 24 hours | >20 reports in 24 hours |
| Report ban (permanent) | Permanent | >50 reports in 7 days (requires admin review) |
| Block ban (temp) | 12 hours | >50 blocks in 24 hours |
| Block ban (temp) | 1 hour | >10 blocks in 1 hour (warning first) |

Ban data is stored in the database:

```sql
CREATE TABLE user_action_bans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ban_type TEXT NOT NULL CHECK(ban_type IN ('report', 'block')),
  reason TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  lifted_by TEXT,
  lifted_at INTEGER
);
```

During a ban, the client-side UI should:
- Disable the "Report Channel" and "Block Channel" options
- Show a tooltip/banner explaining the ban and when it expires
- Not send any report/block requests to the server (client-side enforcement)

The server should also reject any report/block requests from banned users with a `429 Too Many Requests` status and a message like: "You are temporarily restricted from reporting or blocking channels. This restriction will be lifted at {time}."

#### 4.2.3 Channel Trust Score (Updated)

The trust score system from the previous version is updated to work with the rate-limited reporting:

- Each channel starts with a trust score of 100
- Trust decreases when:
  - Users flag the channel for prohibited content (-10 per unique report, max -50/day per channel)
  - Messages match keyword filters (-5 per match)
  - Admin intervention (-50)
- Trust increases when:
  - Messages are verified as clean (+1 per clean message, max +10/day)
  - Users report the channel as legitimate (+2 per report, max +20/day)
- **Rate-limited impact**: Only the first report from a user per channel within a 24-hour window counts toward trust score reduction (prevents spam reports from tanking a channel's score)
- Channels below trust threshold 20 are automatically hidden from the chat list and flagged for admin review
- Trust scores are persisted server-side and synced to clients

#### 4.2.4 Report Cooldown UI

When a user submits a report, the UI should show:
- A success toast: "Report submitted. Thank you for helping keep the community safe."
- A cooldown indicator: "You can report this channel again in {remaining_seconds} seconds"
- The report button is disabled during the cooldown period with a visual countdown
- If the user tries to report again during the cooldown, a tooltip appears: "Please wait {remaining_seconds} seconds before reporting this channel again."

#### 4.2.5 Admin Review Queue for Reports

- `src/components/moderation/ModerationQueue.tsx` — admin UI for reviewing flagged channels
- Shows: channel name, report count, latest report reason, reporter count, trust score, action buttons (Approve, Warn Sender, Block Channel, Dismiss Report)
- Reports are grouped by channel — multiple reports for the same channel are consolidated
- Admin can set a ban duration when blocking a user from reporting (e.g., 1 hour, 24 hours, permanent)
- All admin actions are logged in the audit log (see Section 4.3)

#### 4.2.6 Data Persistence for Blocks and Reports

Add to `src/store/types.ts`:

```typescript
export interface ChannelBlocklistEntry {
  channelId: string;
  channelName: string;
  blockedBy: string;
  reason: 'prohibited_substances' | 'terrorism' | 'violence' | 'child_exploitation' | 'fraud' | 'other';
  blockedAt: number;
  expiresAt?: number;
  isPermanent: boolean;
}

export interface ChannelReport {
  id: string;
  channelId: string;
  channelName: string;
  reportedBy: string;
  reason: string;
  messageId?: string;
  messagePreview?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
}
```

Add to `AppState` in `src/store/index.ts`:

```typescript
channelBlocklist: ChannelBlocklistEntry[];
channelReports: ChannelReport[];
addToChannelBlocklist: (entry: ChannelBlocklistEntry) => void;
removeFromChannelBlocklist: (channelId: string) => void;
isChannelBlocked: (channelId: string) => boolean;
getBlockedChannels: () => ChannelBlocklistEntry[];
addChannelReport: (report: ChannelReport) => void;
getChannelReports: (channelId: string) => ChannelReport[];
getUserReports: (userId: string) => ChannelReport[];
```

Add to `src/config/settingsDefaults.ts`:

```typescript
channelBlocklist: [],
channelReports: [],
```

Add to `src/config/settingsDefaults.ts` KEYS:

```typescript
CHANNEL_BLOCKLIST: 'app_channel_blocklist',
CHANNEL_REPORTS: 'app_channel_reports',
```

Add corresponding i18n keys to all locale files:

```json
{
  "settings.blockedChannels": "Blocked Channels",
  "settings.blockedChannelsSubtitle": "Channels you have blocked",
  "settings.blockChannel": "Block Channel",
  "settings.unblockChannel": "Unblock Channel",
  "settings.reportChannel": "Report Channel",
  "settings.channelBlocked": "Channel blocked",
  "settings.channelUnblocked": "Channel unblocked",
  "settings.blockConfirm": "Block this channel? Messages from this channel will be hidden.",
  "settings.reportConfirm": "Report this channel for:",
  "settings.reportSubmitted": "Report submitted. Thank you for helping keep the community safe.",
  "settings.reportCooldown": "You can report this channel again in {seconds} seconds",
  "settings.reportBan": "You are temporarily restricted from reporting channels. This restriction will be lifted at {time}.",
  "settings.blockBan": "You are temporarily restricted from blocking channels. This restriction will be lifted at {time}.",
  "settings.reportReason": "Reason",
  "settings.reportReason.prohibited_substances": "Prohibited substances",
  "settings.reportReason.terrorism": "Terrorism",
  "settings.reportReason.violence": "Violence",
  "settings.reportReason.child_exploitation": "Child exploitation",
  "settings.reportReason.fraud": "Fraud",
  "settings.reportReason.hate_speech": "Hate speech",
  "settings.reportReason.other": "Other",
  "settings.reportSuccess": "Thank you for your report. It has been sent to the moderation team.",
  "settings.reportError": "Failed to submit report. Please try again later.",
  "settings.blockSuccess": "Channel blocked successfully.",
  "settings.blockError": "Failed to block channel. Please try again.",
  "settings.unblockSuccess": "Channel unblocked.",
  "settings.reportUndo": "Undo",
  "settings.blockedBy": "Blocked by you",
  "settings.blockedDate": "Blocked on",
  "settings.blockReason": "Reason",
  "settings.trustScore": "Trust Score",
  "settings.trustScore.low": "Low",
  "settings.trustScore.medium": "Medium",
  "settings.trustScore.high": "High",
  "settings.moderationQueue": "Moderation Queue",
  "settings.moderationQueueSubtitle": "Channels pending review",
  "settings.noBlockedChannels": "No blocked channels",
  "settings.noFlaggedChannels": "No flagged channels",
  "settings.flaggedChannel": "Flagged Channel",
  "settings.flaggedChannels": "Flagged Channels",
  "settings.flaggedChannelSubtitle": "Channels reported by users for review",
  "settings.reportHistory": "Report History",
  "settings.reportHistorySubtitle": "Your past reports and their status",
  "settings.reportStatus.pending": "Pending Review",
  "settings.reportStatus.reviewed": "Reviewed",
  "settings.reportStatus.resolved": "Resolved",
  "settings.reportStatus.dismissed": "Dismissed",
  "settings.reportAction.approve": "Approve",
  "settings.reportAction.warn": "Warn Sender",
  "settings.reportAction.block": "Block Channel",
  "settings.reportAction.dismiss": "Dismiss Report",
  "settings.reportBanDuration.1h": "1 hour",
  "settings.reportBanDuration.24h": "24 hours",
  "settings.reportBanDuration.7d": "7 days",
  "settings.reportBanDuration.permanent": "Permanent",
  "settings.blockBanWarning": "You are blocking channels rapidly. If this is abuse, your blocking ability will be restricted.",
  "settings.reportBanWarning": "You are reporting channels rapidly. If this is abuse, your reporting ability will be restricted."
}
```

### 4.3 Content Moderation Infrastructure

#### 4.3.1 Moderation Queue

- `src/components/moderation/ModerationQueue.tsx` — admin UI for reviewing flagged content
- Shows: channel name, report count, latest report reason, reporter count, trust score, action buttons (Approve, Warn Sender, Block Channel, Dismiss Report)
- Integrates with existing admin dashboard at `/admin`
- Reports are grouped by channel — multiple reports for the same channel are consolidated
- Admin can set a ban duration when blocking a user from reporting (e.g., 1 hour, 24 hours, permanent)

#### 4.3.2 Automated Moderation

- `src/lib/moderation/autoModerator.ts` — automated moderation engine
- Runs on the server side for message content analysis
- Uses keyword matching + pattern detection (regex for common drug/terrorist terminology)
- For images/media: integrate with a content moderation API (e.g., AWS Rekognition, Google Cloud Vision) — placeholder for now
- Escalation path: auto-flag → auto-warn → auto-block (configurable thresholds)

#### 4.3.3 Audit Logging

- All moderation actions (block, unblock, flag, warn, report) are logged with:
  - Action type
  - Actor (user or admin)
  - Target (channel or user)
  - Reason
  - Timestamp
  - Evidence (message ID, report ID)
- Logs are stored in the database and accessible via admin API
- Logs are immutable — no delete or modify operations

### 4.4 Security-Focused Settings

Add new settings entries to `src/config/settingsDefaults.ts` and `src/store/slices/settingsSlice.ts`:

| Setting | Default | Description |
|---------|---------|-------------|
| `blockUnknownContacts` | `true` | Block messages from contacts not in user's contact list |
| `requireMessageVerification` | `false` | Require message signature verification before displaying |
| `autoBlockFlaggedChannels` | `false` | Automatically block channels flagged by 5+ users |
| `prohibitedContentFilter` | `true` | Enable keyword filtering for prohibited content |
| `screenshotProtection` | `true` | Prevent screenshots of chat content |
| `autoLockTimeout` | `300000` | Auto-lock after 5 minutes of inactivity (ms) |
| `biometricLock` | `false` | Enable biometric authentication for app unlock |
| `relayHopLimit` | `3` | Maximum relay hops for P2P messages |
| `trustScoreThreshold` | `20` | Minimum trust score for channels to appear in chat list |
| `reportCooldownSeconds` | `60` | Cooldown between reports per channel (seconds) |
| `blockCooldownPerHour` | `5` | Maximum blocks per hour |

Add corresponding i18n keys to all locale files.

Add UI sections in Settings:
- **Privacy & Security** section: add the new security settings as toggle rows
- **Blocked Channels** section: list currently blocked channels with unblock option
- **Moderation** section: show trust scores for channels, report history
- **Report History** section: show user's past reports with status**

Add to `src/store/types.ts`:

```typescript
export interface ChannelBlocklistEntry {
  channelId: string;
  channelName: string;
  blockedBy: string; // user ID who blocked
  reason: 'prohibited_substances' | 'terrorism' | 'violence' | 'child_exploitation' | 'fraud' | 'other';
  blockedAt: number; // timestamp
  expiresAt?: number; // optional temporary block
  isPermanent: boolean;
}
```

Add to `AppState` in `src/store/index.ts`:

```typescript
channelBlocklist: ChannelBlocklistEntry[];
addToChannelBlocklist: (entry: ChannelBlocklistEntry) => void;
removeFromChannelBlocklist: (channelId: string) => void;
isChannelBlocked: (channelId: string) => boolean;
getBlockedChannels: () => ChannelBlocklistEntry[];
```

Add to `src/config/settingsDefaults.ts`:

```typescript
channelBlocklist: [],
```

Add to `src/config/settingsDefaults.ts` KEYS:

```typescript
CHANNEL_BLOCKLIST: 'app_channel_blocklist',
```

**4.2.2 User-Initiated Channel Blocking UI**

Add to `ChatListItem.tsx`:

- When a user long-presses a channel chat, show a context menu with "Block Channel" option
- When blocked, the channel is removed from the chat list and marked with a "Blocked" badge in the archived/filtered views
- Add a "Blocked Channels" section in the Settings page under Privacy & Security
- Blocked channels should not appear in search results or chat lists
- A notification should be shown when a blocked channel attempts to send a message (message is silently dropped)

Add to `ChatListView.tsx`:

- Filter out blocked channels from `filteredChannels` using `useMemo`
- Add a "Blocked Channels" filter tab in the ViewTabs

**4.2.3 Server-Side Channel Moderation API**

Add to `server/routes/admin.ts`:

- `POST /api/admin/channels/block` — admin blocks a channel (requires admin auth)
- `POST /api/admin/channels/unblock` — admin unblocks a channel
- `GET /api/admin/channels/blocked` — list all blocked channels
- `GET /api/admin/channels/flagged` — list channels flagged by users for prohibited content

Add to `server/db.ts`:

- Create `channel_blocks` table: `id`, `channel_id`, `blocked_by`, `reason`, `blocked_at`, `expires_at`, `is_permanent`
- Create `channel_flags` table: `id`, `channel_id`, `flagged_by`, `reason`, `flagged_at`, `status` (pending/reviewed/resolved)

**4.2.4 Content Keyword Filtering**

Add a configurable keyword filter at the message processing level:

- `src/lib/moderation/keywordFilter.ts` — a module that checks message content against prohibited keywords
- Keywords should be loaded from a server-side configuration (not client-side, to prevent tampering)
- Categories: `narcotics`, `terrorism`, `violence`, `child_exploitation`, `fraud`, `hate_speech`
- When a message matches a keyword filter, it should be:
  1. Flagged for review (not immediately deleted — to avoid censorship concerns)
  2. A warning shown to the sender: "Your message contains content that may violate community guidelines"
  3. The message delivery delayed until reviewed by a moderator
- Users can report messages they believe violate guidelines — this adds the message to the moderation queue

**4.2.5 Channel Trust Score**

Add a trust/reputation system for channels:

- Each channel starts with a trust score of 100
- Trust decreases when:
  - Users flag the channel for prohibited content (-10 per flag)
  - Messages match keyword filters (-5 per match)
  - Admin intervention (-50)
- Trust increases when:
  - Messages are verified as clean (+1 per clean message)
  - Users report the channel as legitimate (+2 per report)
- Channels below trust threshold 20 are automatically hidden from the chat list and flagged for admin review
- Trust scores are persisted server-side and synced to clients

**4.2.6 Reporting & Appeals**

- Add a "Report Channel" option in the channel context menu
- Report reasons: prohibited substances, terrorism, violence, child exploitation, fraud, hate speech, other
- Reports are sent to both the client-side moderation queue and the server admin API
- Admin dashboard should show flagged channels with report count, latest report, and action buttons
- Users can appeal a channel block — appeals go to admin review

### 4.3 Content Moderation Infrastructure

**4.3.1 Moderation Queue**

- `src/components/moderation/ModerationQueue.tsx` — admin UI for reviewing flagged content
- Shows: channel name, flag count, latest report reason, message preview, action buttons (approve, block, warn sender)
- Integrates with existing admin dashboard at `/admin`

**4.3.2 Automated Moderation**

- `src/lib/moderation/autoModerator.ts` — automated moderation engine
- Runs on the server side for message content analysis
- Uses keyword matching + pattern detection (regex for common drug/terrorist terminology)
- For images/media: integrate with a content moderation API (e.g., AWS Rekognition, Google Cloud Vision) — placeholder for now
- Escalation path: auto-flag → auto-warn → auto-block (configurable thresholds)

**4.3.3 Audit Logging**

- All moderation actions (block, unblock, flag, warn) are logged with:
  - Action type
  - Actor (user or admin)
  - Target (channel or user)
  - Reason
  - Timestamp
  - Evidence (message ID, report ID)
- Logs are stored in the database and accessible via admin API
- Logs are immutable — no delete or modify operations

### 4.4 Security-Focused Settings

Add new settings entries to `src/config/settingsDefaults.ts` and `src/store/slices/settingsSlice.ts`:

| Setting | Default | Description |
|---------|---------|-------------|
| `blockUnknownContacts` | `true` | Block messages from contacts not in user's contact list |
| `requireMessageVerification` | `false` | Require message signature verification before displaying |
| `autoBlockFlaggedChannels` | `false` | Automatically block channels flagged by 5+ users |
| `prohibitedContentFilter` | `true` | Enable keyword filtering for prohibited content |
| `screenshotProtection` | `true` | Prevent screenshots of chat content |
| `autoLockTimeout` | `300000` | Auto-lock after 5 minutes of inactivity (ms) |
| `biometricLock` | `false` | Enable biometric authentication for app unlock |
| `relayHopLimit` | `3` | Maximum relay hops for P2P messages |
| `trustScoreThreshold` | `20` | Minimum trust score for channels to appear in chat list |

Add corresponding i18n keys to all locale files.

Add UI sections in Settings:
- **Privacy & Security** section: add the new security settings as toggle rows
- **Blocked Channels** section: list currently blocked channels with unblock option
- **Moderation** section: show trust scores for channels, report history

---

## 5. Prioritized Action Items

### Priority 1: Critical Security Fixes (Week 1-2)

| ID | Action | Area |
|----|--------|------|
| P1-1 | Fix non-reactive `getState` calls in `SettingsView.tsx` | Settings |
| P1-2 | Remove hardcoded build date from `SettingsMainMenu.tsx` | Settings |
| P1-3 | Add error boundary around lazy-loaded settings sections | Settings |
| P1-4 | Replace hardcoded PBKDF2 password in `secureStorage.ts` with user-derived key | Security |
| P1-5 | Enforce `wss:` only for WebSocket connections (no `ws:` fallback) | Security |
| P1-6 | Add message signing to `MessageEnvelope.ts` | Security |
| P1-7 | Add channel blocklist data model to store and types | Security |
| P1-8 | Add `isChannelBlocked` filtering to `ChatListView.tsx` | Security |
| P1-9 | Add "Block Channel" option to `ChatListItem.tsx` long-press menu | Security |
| P1-10 | Add blocked channels section to Settings page | Security |
| P1-11 | Implement in-channel blocking instructions (4 flows: header menu, message context, chat list, settings) | Security |
| P1-12 | Add rate limiting middleware: 1 report per minute per user per channel | Security |
| P1-13 | Add `user_action_bans` table and ban enforcement logic | Security |
| P1-14 | Add client-side cooldown UI for report/block actions | Security |
| P1-15 | Redesign `ContactProfileModal` blocking UX: replace three-dot menu with bottom action bar | Security |
| P1-16 | Add `Ban` (block) and `ShieldCheck` (unblock) icons to profile card bottom action bar | Security |
| P1-17 | Add swipe-left actions on profile card for block/delete | Security |
| P1-18 | Add blocked contact visual feedback (red badge, disabled actions, unblock option) | Security |
| P1-19 | Add long-press avatar radial menu with block as primary action | Security |
| P1-20 | Add blocked contacts section to Settings page with unblock and report | Security |

### Priority 2: High-Impact Improvements (Week 2-4)

| ID | Action | Area |
|----|--------|------|
| P2-1 | Extract settings sections config to `src/config/settingsSections.ts` | Settings |
| P2-2 | Deprecate `SettingsToggle.tsx` in favor of `ToggleSwitch` | Settings |
| P2-3 | Split `SettingsMainMenu.tsx` into section group components | Settings |
| P2-4 | Add chat list grouping (pinned, unread, recent) | Messenger |
| P2-5 | Add batch action bar for multi-select chat operations | Messenger |
| P2-6 | Extract `ChatListItemContent.tsx` and `ChatListItemAvatar.tsx` | Messenger |
| P2-7 | Add ARIA labels to toggle switches with setting names | Settings |
| P2-8 | Add focus restoration on back navigation in settings | Settings |
| P2-9 | Implement keyword filtering module `src/lib/moderation/keywordFilter.ts` | Security |
| P2-10 | Add server-side channel block/unblock/report API endpoints | Security |
| P2-11 | Add channel trust score system (client + server) | Security |
| P2-12 | Add screenshot protection toggle to privacy settings | Security |
| P2-13 | Add abuse detection: auto-ban users exceeding report/block thresholds | Security |
| P2-14 | Add admin moderation queue UI for reviewing flagged channels | Security |
| P2-15 | Add trust score decay for spam reports (only first report per user per channel counts) | Security |

### Priority 3: Medium-Impact Improvements (Week 4-6)

| ID | Action | Area |
|----|--------|------|
| P3-1 | Add settings search with real filtering and keyboard nav | Settings |
| P3-2 | Add chat list advanced filters (unread, muted, pinned) | Messenger |
| P3-3 | Add chat list empty state | Messenger |
| P3-4 | Add "More" menu to chat header with mute/pin/archive/delete | Messenger |
| P3-5 | Implement settings export/import UI | Settings |
| P3-6 | Add settings validation schema | Settings |
| P3-7 | Consolidate settings state boundary documentation | Settings |
| P3-8 | Add swipe-to-mute and swipe-to-pin to chat list items | Messenger |
| P3-9 | Add "Jump to Latest" button in chat view | Messenger |
| P3-10 | Add right-click context menu for messages | Messenger |
| P3-11 | Add certificate pinning for signaling server | Security |
| P3-12 | Add HMAC signing to P2P messages | Security |
| P3-13 | Add relay hop limit and warning in chat header | Security |
| P3-14 | Add message sequence numbers for replay protection | Security |
| P3-15 | Add biometric lock option to settings | Security |
| P3-16 | Add auto-lock timeout setting | Security |
| P3-17 | Add "Blocked Channels" filter tab in ViewTabs | Security |
| P3-18 | Add report cooldown countdown UI (disabled button + visual countdown) | Security |
| P3-19 | Add undo functionality for channel blocks (5-second undo window) | Security |
| P3-20 | Add audit logging for all moderation actions (block, unblock, flag, warn, report) | Security |

### Priority 4: Polish & Accessibility (Week 6-8)

| ID | Action | Area |
|----|--------|------|
| P4-1 | Add keyboard navigation to settings search results | Settings |
| P4-2 | Add `role="switch"` with proper `aria-label` to all toggles | Settings |
| P4-3 | Responsive settings layout for mobile (accordion/bottom nav) | Settings |
| P4-4 | Add loading skeletons specific to each settings section | Settings |
| P4-5 | Add confirmation dialog for settings reset | Settings |
| P4-6 | Add character counter to message input | Messenger |
| P4-7 | Add send button "sending" state with spinner | Messenger |
| P4-8 | Add Morse encoder tooltip | Messenger |
| P4-9 | Add online status tooltip with last seen time | Messenger |
| P4-10 | Add `React.memo` to `SettingsMainMenu` and stabilize callbacks | Settings |
| P4-11 | Add moderation queue UI for admin dashboard | Security |
| P4-12 | Add content moderation API integration placeholder | Security |
| P4-13 | Add channel reporting UI (report reason, submit) | Security |
| P4-14 | Add trust score display in channel info | Security |
| P4-15 | Add report history UI showing past reports and their status | Security |
| P4-16 | Add i18n keys for all moderation/reporting/blocking strings in all locales | Security |

---

## 6. Success Metrics

### Settings Page

| Metric | Target | Measurement |
|--------|--------|-------------|
| Settings load time | < 200ms | Lighthouse / DevTools |
| Settings re-render frequency | Only on relevant state changes | React DevTools Profiler |
| Settings section component size | < 200 lines each | Line count |
| Settings search accuracy | > 90% of searches find correct section | Manual testing |
| Keyboard navigable settings | 100% of interactive elements | Manual testing |
| Error boundary coverage | 100% of lazy-loaded sections | Code review |

### Messenger Management

| Metric | Target | Measurement |
|--------|--------|-------------|
| Chat list item component size | < 200 lines | Line count |
| Message actions available | 6+ (reply, save, forward, copy, delete, pin) | Feature check |
| Batch operations supported | 5+ actions on multi-selected chats | Feature check |
| Chat list empty state | Present and actionable | Manual testing |
| Chat list grouping | 4 groups (pinned, unread, recent, other) | Feature check |
| Input area component size | < 200 lines each after extraction | Line count |
| Swipe actions available | 3+ (archive, mute, pin) | Manual testing |

### Security Hardening

| Metric | Target | Measurement |
|--------|--------|-------------|
| WebSocket connections | 100% `wss:` only, no `ws:` fallback | Network tab audit |
| Message signing | 100% of messages signed and verified | Code review + tests |
| Channel blocklist | Users can block channels and blocked channels are hidden | Manual testing |
| Keyword filter | Prohibited content messages are flagged and warned | Manual testing |
| Admin moderation API | All endpoints functional with auth | Integration tests |
| Trust score system | Channels below threshold are hidden | Manual testing |
| Secure storage key | Derived from user PIN, not hardcoded | Code review |
| Audit logs | All moderation actions logged immutably | Code review + tests |
| Screenshot protection | Enabled by default in privacy settings | Manual testing |
| Certificate pinning | Signaling server cert is pinned | Network security audit |
| Profile card block UX | Block button always visible in bottom action bar (not hidden in three-dot menu) | Manual testing |
| Profile card block icon | `Ban` icon for block, `ShieldCheck` for unblock — universally recognizable | Code review |
| Swipe-to-block on profile | Swipe left reveals block/delete actions | Manual testing |
| Block confirmation dialog | "Block {name}? They won't be able to contact you." with clear consequences | Manual testing |
| Block undo | 5-second undo window after blocking | Manual testing |
| Report rate limiting | 1 report per minute per user per channel, enforced server-side | Integration tests |
| Abuse auto-ban | Users exceeding thresholds are auto-banned from reporting/blocking | Integration tests |
| Blocked contact visual feedback | Red badge, disabled actions, unblock option shown in profile card | Manual testing |

---

## Appendix A: Current Component Sizes

| Component | Lines | Status |
|-----------|-------|--------|
| `SettingsView.tsx` | 302 | Over limit |
| `SettingsMainMenu.tsx` | 274 | Over limit |
| `SettingsRow.tsx` | 152 | Acceptable |
| `SettingsToggle.tsx` | 76 | Acceptable (but redundant) |
| `SettingsSection.tsx` | 44 | Good |
| `PrivacySection.tsx` | 213 | Over limit |
| `ChatListItem.tsx` | 309 | Over limit |
| `ChatInputArea.tsx` | 389 | Over limit |
| `ChatHeader.tsx` | 94 | Acceptable |
| `MessageActions.tsx` | 46 | Good |
| `ViewTabs.tsx` | 33 | Good |
| `useSettings.ts` | 175 | Acceptable |
| `settingsSlice.ts` | 102 | Good |
| `settingsDefaults.ts` | 57 | Good |
| `useProfileActions.ts` | 86 | Good |
| `ChatListView.tsx` | 288 | Over limit |
| `secureStorage.ts` | 49 | Good (but hardcoded key) |
| `deviceSecurity.ts` | 87 | Good |
| `csp.ts` | 71 | Good |
| `lockBackoff.ts` | 18 | Good |
| `riskShell.ts` | 109 | Acceptable |

## Appendix B: Existing Security Infrastructure

| Component | Location | Status |
|-----------|----------|--------|
| E2E Encryption (Double Ratchet) | `src/lib/crypto/doubleRatchet.ts` | Active |
| Message Encryption Service | `src/lib/crypto/MessageEncryptionService.ts` | Active |
| Device Fingerprinting | `src/lib/deviceSecurity.ts` | Active |
| App Lock (PIN + exponential backoff) | `src/hooks/useAppLock.ts` | Active |
| Risk Shell (pause on suspicious activity) | `src/utils/riskShell.ts` | Active |
| Content Security Policy | `server/csp.ts` | Active |
| Rate Limiting (admin API) | `server/middleware/rateLimit.ts` | Active |
| TOTP 2FA (admin) | `server/auth.ts` | Active |
| Secure Storage (AES-GCM) | `src/lib/secureStorage.ts` | Active (hardcoded key issue) |
| Session Management | `server/auth.ts` | Active |
| P2P Mesh Encryption | `src/lib/p2p/` | Active |
| Channel Signing | `src/lib/crypto/channelSigning.ts` | Active |
| Safety Numbers (key verification) | `src/lib/crypto/safetyNumber.ts` | Active |
| HMAC Authentication (P2P) | `src/lib/p2p/HMACAuth.ts` | Active |

## Appendix C: Existing Block/Moderation Features

| Feature | Location | Status |
|---------|----------|--------|
| Contact `isBlocked` field | `src/types/contact.ts:19` | Exists but not fully utilized |
| `handleProfileBlock` | `src/hooks/useProfileActions.ts:66` | Removes chat, does not prevent messaging |
| `ChatListItem` selectMode | `src/components/chat-preview/ChatListItem.tsx` | Exists for batch operations |
| `BulkActionsBar` | `src/components/chat-preview/BulkActionsBar.tsx` | Exists (archive, delete, mark read) |
| `regionBlocked` (network-level) | `src/hooks/useAppConnection.ts` | Blocks entire region — not content-specific |
| `stealthMode` | `src/store/slices/settingsSlice.ts` | Obfuscates timestamps — not content moderation |
| `spamFilter` setting | `src/config/settingsDefaults.ts` | Exists but no content-level filtering |
| Admin channel management | `server/routes/admin.ts` | No channel block endpoints exist |
| Channel trust scores | — | **Does not exist** — needs implementation |
| Keyword content filtering | — | **Does not exist** — needs implementation |
| Channel reporting | — | **Does not exist** — needs implementation |
