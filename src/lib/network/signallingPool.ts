type ServerStatus = 'untested' | 'active' | 'failed' | 'blocked';

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
    this.load();
    if (this.seeds.size === 0) {
      for (const url of initialSeeds) {
        this.seeds.set(url, { url, status: 'untested', lastTested: 0, latencyMs: 0 });
      }
      this.save();
    }
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

  markBlocked(url: string): void {
    const entry = this.seeds.get(url);
    if (entry) { entry.status = 'blocked'; entry.lastTested = Date.now(); this.save(); }
  }

  getNextAvailable(): string | null {
    const available = Array.from(this.seeds.values()).filter(s => s.status === 'untested' || s.status === 'active');
    if (available.length === 0) return null;
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
        const parsed: SeedEntry[] = JSON.parse(raw);
        for (const entry of parsed) this.seeds.set(entry.url, entry);
      }
    } catch { /* ignore */ }
  }

  private save(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.seeds.values()))); } catch { /* ignore */ }
  }
}
