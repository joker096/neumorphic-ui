const BLOCKED_CACHE_KEY = 'mess_blocked_backends';

export interface SelectorOptions {
  cfWorkers?: string[];
  frontDomains?: string[];
  probeTimeout?: number;
  onBackendChange?: (backend: string) => void;
}

export class BlockedBackendCache {
  private blocked: Map<string, number> = new Map();

  constructor() {
    this.load();
  }

  isBlocked(id: string): boolean {
    const expiry = this.blocked.get(id);
    if (!expiry) return false;
    if (Date.now() > expiry) {
      this.blocked.delete(id);
      this.save();
      return false;
    }
    return true;
  }

  markBlocked(id: string, ttlMs: number): void {
    this.blocked.set(id, Date.now() + ttlMs);
    this.save();
  }

  clear(): void {
    this.blocked.clear();
    this.save();
  }

  getBlocked(): string[] {
    return Array.from(this.blocked.entries())
      .filter(([, exp]) => Date.now() < exp)
      .map(([id]) => id);
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(BLOCKED_CACHE_KEY);
      if (raw) this.blocked = new Map(JSON.parse(raw));
    } catch { /* ignore */ }
  }

  private save(): void {
    try {
      localStorage.setItem(BLOCKED_CACHE_KEY, JSON.stringify(Array.from(this.blocked.entries())));
    } catch { /* ignore */ }
  }
}

export class TransportSelector {
  private seedUrls: string[];
  private options: Required<SelectorOptions>;
  private currentBackend: string = 'direct';
  private cache: BlockedBackendCache;

  constructor(seedUrls: string[], options?: SelectorOptions) {
    this.seedUrls = seedUrls;
    this.options = {
      cfWorkers: options?.cfWorkers ?? [],
      frontDomains: options?.frontDomains ?? [],
      probeTimeout: options?.probeTimeout ?? 3000,
      onBackendChange: options?.onBackendChange ?? (() => {}),
    };
    this.cache = new BlockedBackendCache();
  }

  getCurrentBackend(): string {
    return this.currentBackend;
  }

  isAllBlocked(): boolean {
    return this.cache.getBlocked().length >= this.getTotalBackends();
  }

  async selectBackend(): Promise<string> {
    const backends = this.buildBackendList();
    for (const backend of backends) {
      if (this.cache.isBlocked(backend.id)) continue;
      const ok = await this.probe(backend.url);
      if (ok) {
        this.currentBackend = backend.id;
        this.options.onBackendChange(backend.id);
        return backend.id;
      }
      this.cache.markBlocked(backend.id, 24 * 60 * 60 * 1000);
    }
    this.currentBackend = 'blocked';
    return 'blocked';
  }

  private buildBackendList(): { id: string; url: string }[] {
    const list: { id: string; url: string }[] = [];
    for (const url of this.seedUrls) {
      list.push({ id: `direct:${url}`, url });
    }
    for (const worker of this.options.cfWorkers) {
      list.push({ id: `cfworker:${worker}`, url: `wss://${worker}/ws` });
    }
    for (const domain of this.options.frontDomains) {
      list.push({ id: `domainfront:${domain}`, url: `wss://${domain}/ws` });
    }
    this.shuffle(list);
    return list;
  }

  private shuffle(arr: any[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  private probe(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const ws = new WebSocket(url);
      const timer = setTimeout(() => {
        ws.close();
        resolve(false);
      }, this.options.probeTimeout);
      ws.onopen = () => {
        clearTimeout(timer);
        ws.close();
        resolve(true);
      };
      ws.onerror = () => {
        clearTimeout(timer);
        resolve(false);
      };
    });
  }

  private getTotalBackends(): number {
    return this.seedUrls.length + this.options.cfWorkers.length + this.options.frontDomains.length;
  }

  resetCache(): void {
    this.cache.clear();
  }

  onBackendChange(callback: (backend: string) => void): void {
    this.options.onBackendChange = callback;
  }
}
