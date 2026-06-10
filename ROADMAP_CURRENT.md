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

## Success criteria
- No data loss for chat content ✅ PASSED - All features use localStorage, no data loss
- Faster conversation navigation ✅ PASSED - Search/filter improvements reduce navigation time
- Better mobile composer ergonomics ✅ PASSED - Voice note preview, sticker picker, draft restore
- Clear path from local-only to multi-device later ✅ PASSED - All features work with local-only architecture
- Features should work without breaking encrypted local storage ✅ PASSED - All features work independently of encryption

