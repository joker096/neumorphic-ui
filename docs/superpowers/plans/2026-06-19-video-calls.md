# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build real-time 1:1 and group voice/video/screen-share calls on existing P2P transport and signaling server, then read campaigns from the pipeline.

**Architecture:** One `CallManager` owns call state and tracks. `P2PTransport` reuse adds `addTrack/removeTrack/ontrack`. Second data channel for call control. UI: `CallScreen`, `IncomingCallSheet`, `HuddleWidget`. Existing `callRecorderService` handles recording.

**Tech Stack:** React 19, TypeScript, Tailwind v4, Motion, lucide-react, sonner, zustand, vitest, WebRTC, wss.

---

## Subsystem A: core + workflows
- Creates/reuses `CallManager` and types; pushes Workable gating on status.
- Sub in apps: `steps/WORKABLE_WATCH_README.md` for pipeline/aftercare rules.

## Campaign UX (rate-disabled)
- `components/CampaignsGallery.tsx`, `scenes/CampaignsScene.tsx` refresh cover/state cells.
- `components/admin/AdminModal.tsx` shows LIMIT_REACHED; no apply prevents draft.
- `components/RecordingsFlow.tsx` drives retry/apply/split after recording.

## Aftercare
- `pages/AftercarePage.tsx` flips `shareRecording` toggle and pipes editing via `shareRecordingEdit`.

## RiskShell (guard)
- `utils/riskShell.ts` + `claims.debug*` register `nanoid("risk:")` sessions; fails duplicate session only if matching `debugId` already exists; `LastAction` returns the last durable claim only.

## Run & verify
1. `npm run dev` and `npm test`
2. `docs/superpowers/plans/2026-06-19-video-calls-design.md` is the release brief.
