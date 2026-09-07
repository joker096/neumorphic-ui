type ServerStatus = 'untested' | 'active' | 'failed';

interface SeedEntry {
  url: string;
  status: ServerStatus;
  lastTested: number;
  latencyMs: number;
}

const STORAGE_KEY = 'mess_signalling_pool';

export class SignallingPool {
  private seeds: Map<string, SeedEntry> = new Map();

  constructor(initialSeeds: string[]) {
    // Load persisted seeds but ALWAYS reconcile against the current config so a
    // stale seed from an older bundle can never permanently override the intended
    // signaling endpoints (e.g. old `signaling*.messanger.app` hosts surviving a
    // deploy that moved to a new domain).
    this.load();
    this.reconcile(initialSeeds);
  }

  private reconcile(initialSeeds: string[]): void {
    let changed = false;
    const initialSet = new Set(initialSeeds);
    // Drop persisted seeds that are no longer part of the config.
    for (const url of Array.from(this.seeds.keys())) {
      if (!initialSet.has(url)) {
        this.seeds.delete(url);
        changed = true;
      }
    }
    // Ensure every configured seed is present.
    for (const url of initialSeeds) {
      if (!this.seeds.has(url)) {
        this.seeds.set(url, { url, status: 'untested', lastTested: 0, latencyMs: 0 });
        changed = true;
      }
    }
    if (changed) this.save();
  }

  getAll(): SeedEntry[] { return Array.from(this.seeds.values()); }
  getActive(): SeedEntry[] { return Array.from(this.seeds.values()).filter(s => s.status === 'active'); }

  getStatus(url: string): ServerStatus {
    return this.seeds.get(url)?.status ?? 'untested';
  }

  markActive(url: string, latencyMs: number): void {
    const entry = this.seeds.get(url);
    if (entry) { entry.status = 'active'; entry.lastTested = Date.now(); entry.latencyMs = latencyMs; this.save(); }
  }

  markFailed(url: string): void {
    const entry = this.seeds.get(url);
    if (entry) { entry.status = 'failed'; entry.lastTested = Date.now(); this.save(); }
  }

  getNextAvailable(): string | null {
    const all = Array.from(this.seeds.values());
    if (all.length === 0) return null;
    const available = all.filter(s => s.status === 'untested' || s.status === 'active');
    if (available.length === 0) {
      // No healthy candidate: retry the earliest-failed seed instead of parking
      // 'blocked' forever. A transient failure (e.g. a deploy restart dropping
      // the live WebSocket) must not permanently keep the transport away from
      // 'connected', even across reloads (the failed state persists to storage).
      const failed = all
        .filter(s => s.status === 'failed')
        .sort((a, b) => a.lastTested - b.lastTested);
      if (failed.length > 0) return failed[0].url;
      return null;
    }
    available.sort((a, b) => a.latencyMs - b.latencyMs);
    return available[0].url;
  }

  addSeed(url: string): void {
    if (!this.seeds.has(url)) {
      this.seeds.set(url, { url, status: 'untested', lastTested: 0, latencyMs: 0 });
      this.save();
    }
  }

  removeSeed(url: string): void { this.seeds.delete(url); this.save(); }

  reset(): void {
    for (const [, entry] of this.seeds) { entry.status = 'untested'; entry.latencyMs = 0; }
    this.save();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Array<Omit<SeedEntry, 'status'> & { status: string }>;
        for (const entry of parsed) {
          const status: ServerStatus =
            entry.status === 'active' || entry.status === 'failed' || entry.status === 'untested'
              ? entry.status
              : 'failed';
          this.seeds.set(entry.url, {
            url: entry.url,
            status,
            lastTested: entry.lastTested ?? 0,
            latencyMs: entry.latencyMs ?? 0,
          });
        }
      }
    } catch { /* ignore */ }
  }

  private save(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.seeds.values()))); } catch { /* ignore */ }
  }
}
