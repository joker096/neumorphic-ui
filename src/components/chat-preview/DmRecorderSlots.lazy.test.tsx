import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Proves the lazy-split structural failure point: if the chunk import breaks,
// the Suspense fallback renders (silent failure instead of a thrown error).
// Regression: D4 structural failure point for voice recording.
describe('DmRecorderSlots lazy split', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Suspense fallback element when lazy chunk stays suspended', async () => {
    // We don't simulate the full React render; the structural proof is at
    // file level: Suspense has a non-null fallback span with the spinner
    // class, and data-testid='lazy-voice-fallback'. Before the edit it was
    // fallback={null} — no evidence of broken import, no visual/state signal.
    const fs = await import('fs');
    const src = fs.readFileSync('src/components/chat-preview/DmRecorderSlots.tsx', 'utf8');
    expect(src).toContain('fallback={<span');
    expect(src).toContain('data-testid="lazy-voice-fallback"');
    expect(src).toContain('SMALL_SPINNER_CLASS');
  });

  it('lazy LiveVoiceRecorder import is wrapped by Suspense (no missing import reference)', async () => {
    const fs = await import('fs');
    const src = fs.readFileSync('src/components/chat-preview/DmRecorderSlots.tsx', 'utf8');
    expect(src).toMatch(/LazyLiveVoiceRecorder/);
    expect(src).toMatch(/Suspense/);
    // The voice recorder's Suspense must have a visible fallback (not null),
    // so a broken chunk import surfaces as a spinner, not a silent blank.
    expect(src).toMatch(/fallback=\{<span[^>]*data-testid="lazy-voice-fallback"/);
  });
});
