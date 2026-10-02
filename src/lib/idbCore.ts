/**
 * IndexedDB persistence layer using idb-keyval
 * Provides async store/retrieve for all app data
 */

import {
  set as kvSet,
  get as kvGet,
  del as kvDel,
  clear as kvClear,
  keys as kvKeys,
} from 'idb-keyval';

const hasIdb = typeof indexedDB !== 'undefined';

export async function set(key: string, value: unknown): Promise<void> {
  if (!hasIdb) return;
  try {
    await kvSet(key, value);
  } catch {
    /* storage unavailable */
  }
}

export async function get<T = any>(key: string): Promise<T | undefined> {
  if (!hasIdb) return undefined;
  try {
    return await kvGet<T>(key);
  } catch {
    return undefined;
  }
}

export async function del(key: string): Promise<void> {
  if (!hasIdb) return;
  try {
    await kvDel(key);
  } catch {
    /* storage unavailable */
  }
}

export async function clear(): Promise<void> {
  if (!hasIdb) return;
  try {
    await kvClear();
  } catch {
    /* storage unavailable */
  }
}

export async function keys(): Promise<string[]> {
  if (!hasIdb) return [];
  try {
    return await kvKeys();
  } catch {
    return [];
  }
}
