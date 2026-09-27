import { pruneCompletedTransfers } from "./fileTransfer/fileStore";

/**
 * "Clear cache" — only removes data that the app can re-download or re-fetch
 * on demand, so the action never destroys something the user authored or asked
 * us to keep:
 *   - service worker / browser Cache API entries (re-fetched by the SW)
 *   - completed file-transfer blobs (re-downloaded from the peer on demand)
 *
 * Deliberately NOT touched here, because they are user data rather than cache:
 *   - chats, contacts, channels, company data, CRM records
 *   - call recordings (`recordingStorage`) — the user explicitly saved them and
 *     plays them back from Settings → Call log
 *   - unsent drafts and saved messages
 *
 * Full erase of everything above lives in `clearLocalCache()` (lib/backup.ts)
 * and is surfaced as "Erase all local data" in Settings → Backup.
 *
 * Errors are propagated: the caller reports success only when the cache really
 * was cleared, instead of silently swallowing an IndexedDB failure.
 */
export async function clearAppCache(): Promise<number> {
  let deletedCaches = 0;
  if (typeof caches !== 'undefined') {
    const keys = await caches.keys();
    const results = await Promise.allSettled(keys.map((k) => caches.delete(k)));
    deletedCaches = results.filter((r) => r.status === "fulfilled" && r.value).length;
    const rejected = results.find((r) => r.status === "rejected");
    if (rejected) throw rejected.reason;
  }
  const prunedTransfers = await pruneCompletedTransfers(0);
  return deletedCaches + prunedTransfers;
}
