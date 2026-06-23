# Mess&Anger — Video / Audio Calls Design

## Goal

Add real-time 1:1 and group voice/video/screen-share calls on top of the existing `P2PTransport`/signaling stack, reusing patterns from the old app (`huddleManager`, `groupCallManager`, `callRecorderService`). Fiber also adds a lightweight huddle/meeting concept for quick audio collaborations.

## Scope (V1)

- 1:1 audio/video calls
- Group calls (mesh) up to 5 participants (audio + video)
- Huddles (persistent audio “room” per chat, always-on feel)
- Screen sharing (desktop)
- Local call recording (audio/video)
- Incoming call UI (full-screen + picture-in-picture)
- Call history (local only; recordings stored via `recordingStorage`)

Non-goals: SFU, PSTN, streaming, server-side recording.

## Architecture

### Calls are just an extension of the existing WebRTC transport

The current `P2PTransport` is already an `RTCPeerConnection` wrapper. Calls reuse the same object but attach `MediaStreamTrack`s and a **secondary data channel** for call control signals (mute/unmute, end). The old app had separate `huddleManager` and `groupCallManager`; here we unify them into:

- `callManager` — owns all call state, tracks, recording; one active call per user.
- `CallSignalManager` — low-level SDP/ICE/DTMF via signaling, reuses `signaling-server.ts`.
- UI layer — presents `CallScreen` / `HuddleWidget` / `CallHistorySheet`.

### Relationship to existing code

| Existing | Reused as |
|---|---|
| `P2PTransport` | Base WebRTC conduit; call adds `addTrack` (or `addTransceiver` for renegotiation) and handles `ontrack`/`removetrack`. |
| `signaling-server.ts` | Already forwards `offer/answer/ice-candidate`. No server change required for V1. |
| `HMACAuth` | Provides call media key derivation (separate HMAC key per call). |
| `recordingStorage` / `callRecorderService` | Recording and persistence unchanged. |
| `LiveVoiceRecorder` | Audio capture implementation reused. |
| Old `HuddleManager` / `groupCallManager` | Reference logic; all group-call state machines ported into `CallManager`. |

### Call state machine

```
idle → outgoing (addTrack + offer) → connected ↔ reconnecting
               ↓                         ↓
          incoming                   onEnd → idle
               ↓
         accepted → (same as outgoing)
```

Group/huddle:
```
idle → creating (mesh renegotiation with all members) ↔ connected
                     ↓
                  onLeave → idle
```

We keep **one `RTCPeerConnection` per peer** (not per call). Calls in V1 are full-mesh: N participants = N rtcpcs. Signaling flow:

1. Initiator sends `call-offer` with SDP + member list.
2. Every member replies `call-answer` + ICE.
3. Each party adds its audio/video track and optional screen track.
4. Control channel carries `mute`, `screen-share`, `participant-left`, etc.

## Components & files

### Toast / alarm: what

| File / area | Change |
|---|---|
| `src/lib/call.ts` | New `CallManager` singleton; wrappers: `startCall`, `answerCall`, `endCall`, `toggleMute`, `toggleVideo`, `shareScreen`, `startRecording`, `stopRecording`. Exposes `Call` event emitter. |
| `src/lib/p2p/P2PTransport.ts` | Add `addTrack`, `removeTrack`, `setTransceiver`, and `ontrack` handlers; expose when call is active. |
| `src/server/signaling-server.ts` | Already handles `offer/answer/ice-candidate`. For call-control metadata we reuse existing `type` slot via a new message kind, or piggyback on data channel once open. The simplest V1 path: after P2P connection is established, all control goes through the existing data channel, avoiding server changes. |
| `src/components/call/CallScreen.tsx` | New top-level full-screen UI. Layout: big remote video + self (PiP in corner). Controls: mute, video, screen share, record, end. |
| `src/components/call/IncomingCallSheet.tsx` | Full-screen incoming call banner with accept/reject. |
| `src/components/call/CallHistorySheet.tsx` | Local history + recordings list (CRUD with `recordingStorage`). |
| `src/components/huddle/HuddleWidget.tsx` | Port from old app — compact widget inside `ChatView` showing active huddle and join/leave. |
| `src/components/call/GroupCallParticipants.tsx` | Grid / list of participants (audio-only vs video). |
| `src/hooks/useCall.ts` | React hook binding `CallManager` to UI. |
| `src/locales/*.json` | Strings for calls. |

## Security / privacy

- Calls built on current E2E stack; keys never leave device.
- `HMACAuth` gets a fresh key per call; signaling messages for calls are signed.
- Media tracks use `encrypted: true` when available.
- Recording consent: explicit user action; recordings stored in `recordingStorage` (IndexedDB) and never uploaded.

## Error handling

- WebRTC failures -> retry once, then fall back to `iceTransportPolicy: 'relay'`.
- Missing mic/cam -> graceful degradation (audio-only or permissions dialog).
- Long group renegotiation (5 peers) -> abort + toast.
- `MediaRecorder` errors -> discard and notify.

## Testing approach (V1, no heavy infra)

- Unit: `CallManager` reacts to synthetic `RTCPeerConnection` events using mocks.
- Component: render `CallScreen` with mocked stream refs; assert controls visible.
- Manual: two-browser test via local signaling server.
- Huddle: unit test `HuddleWidget` joins/leaves with mocked `huddleManager` (later `callManager`).

## UI targets

- iOS feel: blur/gradient backdrops, large hit targets, minimal chrome during call.
- Picture-in-picture self-view; gesture to minimize.
- Screen-share indicator (red bar + icon).
- Record indicator + stop confirmation.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Mesh scale > 5 | Enforce limit in UI + `groupCallManager` style guard. |
| Browser permissions flaky | Pre-flight checks with `MediaDevices`; UX guidance when missing. |
| Renegotiation hell on group adds | Re-create the peer-connection mesh when > 1 participant changes at once (old app pattern). |
| Existing data channel conflicts | Use a **second** data channel for call control (`call-control`), not the `messenger` DC. |
| Build size | Reuse existing `motion`, `lucide-react`, `sonner`. Screen-share recorder reuse `callRecorderService`. |

## Future (post-V1)

- SFU/mCU (mediasoup/livekit) once > 5 users required.
- Cortona-style picture-in-picture window across pages.
- End-to-end screen sharing via `getDisplayMedia` + WebRTC is already browser-native.
