// Multi-Level Cache - Cache with memory and storage layers

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set<T>(key: string, value: T, ttl: number = 60000): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export class StorageCache {
  private prefix = '__cache_';

  get<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(this.prefix + key);
      if (!stored) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(stored);
      if (Date.now() > entry.timestamp + entry.ttl) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }

      return entry.value;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T, ttl: number = 60000): void {
    try {
      localStorage.setItem(
        this.prefix + key,
        JSON.stringify({
          value,
          timestamp: Date.now(),
          ttl,
        })
      );
    } catch {
      // Storage full
    }
  }

  clear(): void {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    }
  }

  size(): number {
    let count = 0;
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(this.prefix)) {
        count++;
      }
    }
    return count;
  }
}

export function createCache<T>(): {
  get(key: string): T | null;
  set(key: string, value: T, ttl?: number): void;
  clear(): void;
  size(): number;
} {
  const memoryCache = new MemoryCache();
  const storageCache = new StorageCache();

  return {
    get(key: string): T | null {
      // Try memory first
      const memory = memoryCache.get<T>(key);
      if (memory !== null) {
        return memory;
      }

      // Try storage
      const storage = storageCache.get<T>(key);
      if (storage !== null) {
        // Store in memory for faster access
        memoryCache.set(key, storage);
        return storage;
      }

      return null;
    },

    set(key: string, value: T, ttl: number = 60000): void {
      memoryCache.set(key, value, ttl);
      storageCache.set(key, value, ttl);
    },

    clear(): void {
      memoryCache.clear();
      storageCache.clear();
    },

    size(): number {
      return memoryCache.size() + storageCache.size();
    },
  };
}

export function clearAllCaches(): void {
  createCache().clear();
}
