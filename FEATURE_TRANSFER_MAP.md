# Feature Transfer Map

This document maps the older `app/docs` feature reports to the current `neumorphic-ui` codebase.

## Status legend
- `Already in current app` - feature exists in this repo now
- `Partially present` - some primitives exist, but the user-facing feature is not complete
- `Not yet ported` - only exists in the old docs, not in this repo yet
- `Should be adapted` - worth porting, but needs rework for this project’s architecture

## Already in current app

| Feature | Current evidence | Notes |
|---|---|---|
| Voice notes | `src/components/LiveVoiceRecorder.tsx`, `src/components/VoiceWaveform.tsx`, `src/App.tsx` | Recording UI, duration timer, saved audio URL, bubble playback, and scrubber are now in place |
| Scheduled messages | `src/store/index.ts`, `src/App.tsx` | Queue exists and scheduled sends are wired into the composer |
| Reactions | `src/App.tsx` | Reaction display and message reaction updates exist |
| Channels | `src/App.tsx`, `src/components/CreateChannelModal.tsx`, `src/components/ChannelCommentsView.tsx` | Channel UI and comments are present |
| Bots | `src/App.tsx`, `src/components/CreateBotModal.tsx` | Bot creation and listing exist |
| Contact discovery UI | `src/components/ContactsView.tsx`, `src/components/ContactProfileModal.tsx` | Contact browsing and profile actions exist |
| Privacy/security primitives | `src/lib/cryptoCore.ts`, `src/lib/deviceSecurity.ts`, `src/store/index.ts` | Encrypted local state and security primitives are already part of the app |
| Search/filter UX | `src/App.tsx` | Search bar, folders, and advanced filters are already in the UI |

## Partially present

| Feature | Current evidence | Gap |
|---|---|---|
| Read receipts | `src/App.tsx` | Basic sent/delivered style exists, but not a full privacy-controlled read receipt system |
| Message search | `src/App.tsx` | Search is present, but not a deep indexed message search experience |
| Archive/folders | `src/App.tsx` | UI folders exist, but the broader old-doc archive/organization model is limited |
| Silent messages | `src/App.tsx` | There is a silent toggle in composer/message metadata, but it is not a full delivery-mode system |
| Forwarding | `src/App.tsx` | Forward-like patterns may exist in data flow, but a dedicated forward UX is not complete |
| Drafts | Store persistence primitives exist | No dedicated draft message UX is visible in the current UI |

## Not yet ported

| Feature | Old docs mention | Suggested effort |
|---|---|---|
| @Mentions in chats | Mention highlighting, jump-to-profile behavior | Medium |
| Stickers / sticker packs | Sticker picker and message insertion | Medium |
| GIF support | GIF picker/search/trending | Medium |
| DND | Schedule + priority bypass | Medium |
| Priority contacts | Local bypass list for DND | Low to Medium |
| Live location | Sharing with countdown/stop control | Medium |
| Quiz polls | Poll creation with correct answer | Medium |
| Gifts | Stars-style gift UI | Low |
| Photo editor | Canvas-based edit-before-send flow | Medium |
| Media tabs | Photos / videos / files / links sections | Medium |
| Backup/restore | Export/import/restore data flow | High |
| Multi-device sync | Session management, sync, device tracking | High |
| Cloud sync | Backup/sync to cloud | High |
| Export data | JSON/HTML/media export | High |
| Voice/video calls 2.0 | Advanced call features beyond the existing widget | Medium |

## What should be adapted first for this repo

1. Backup/export/import
- Best next step because it matches the app’s local-first design and reduces data loss risk.

2. Message reply/threading
- Very useful in real chat usage and fits the current chat bubble architecture.

3. Search and filters upgrade
- Build on the existing search bar and folder system rather than replacing it.

4. Media handling improvements
- Add better previews, attachments, and media organization before adding heavy social features.

5. Voice-note polish
- Playback state, pause/resume, nicer waveform progress, and delete/redo while composing.

6. DND and priority contacts
- These can be implemented cleanly with local storage and composer-level UX changes.

## Recommended order for porting from the old docs

| Phase | Scope | Why |
|---|---|---|
| P0 | Backup/export/import | Highest value, low UX ambiguity, aligns with local-first architecture |
| P1 | Reply/threading, search upgrades, voice-note polish | Improves daily chat usability immediately |
| P2 | DND, priority contacts, mentions, stickers | Good UX gains without major architecture changes |
| P3 | Live location, polls, GIFs, media tabs, photo editor | Expands feature depth once core chat flows are strong |
| P4 | Multi-device sync, cloud sync | Requires larger architecture decisions and protocol work |

## Notes

- The older docs appear to describe a broader product than this current repo.
- Do not treat the old feature status as authoritative for this codebase without checking the current implementation.
- Use this map as the source of truth for porting work in this repository.

