import { useMemo } from "react";
import { sendTimeOf } from "../utils/chatUtils";

/**
 * Reply-thread index over one chat's history.
 *
 * A "thread" is the transitive closure of the `replyTo` pointers: the root is
 * the earliest message in the chain, every message whose ancestry reaches it is
 * a reply. Dangling quotes (parent no longer in history) and cycles degrade to
 * "this message is its own root" instead of dropping content.
 *
 * Ids are compared through `String()` because an outgoing message is keyed by a
 * numeric `Date.now()` locally while the same message lands on the peer keyed by
 * the wire string id.
 */
export interface MessageThreads {
  /** True when the message exists in history and has at least one reply. */
  isRoot: (id: string | number | null | undefined) => boolean;
  /** Number of replies (transitive) hanging off the message; 0 for non-roots. */
  countOf: (id: string | number | null | undefined) => number;
  /** The root message for a given id, if it exists. */
  rootOf: (id: string | number | null | undefined) => any | undefined;
  /** All replies under the message, flattened and ordered by send time. */
  repliesOf: (id: string | number | null | undefined) => any[];
}

export function useMessageThreads(history: any[] | undefined): MessageThreads {
  return useMemo(() => {
    const list = Array.isArray(history) ? history : [];
    const byKey = new Map<string, any>();
    for (const m of list) {
      if (m && m.id != null && !m._isDateSeparator) byKey.set(String(m.id), m);
    }

    const rootKeyOf = (id: string | number): string => {
      let cur = byKey.get(String(id));
      if (!cur) return String(id);
      const seen = new Set<string>();
      while (true) {
        const rid = cur.replyTo?.id;
        if (rid == null) break;
        const parentKey = String(rid);
        if (parentKey === String(cur.id) || seen.has(parentKey)) break;
        const parent = byKey.get(parentKey);
        if (!parent) break;
        seen.add(String(cur.id));
        cur = parent;
      }
      return String(cur.id);
    };

    const descendants = new Map<string, any[]>();
    for (const m of byKey.values()) {
      if (m.replyTo?.id == null) continue;
      const rootKey = rootKeyOf(m.id);
      if (rootKey === String(m.id)) continue;
      const bucket = descendants.get(rootKey);
      if (bucket) bucket.push(m);
      else descendants.set(rootKey, [m]);
    }
    for (const bucket of descendants.values()) {
      bucket.sort((a, b) => sendTimeOf(a) - sendTimeOf(b));
    }

    const countOf = (id: string | number | null | undefined): number =>
      id == null ? 0 : (descendants.get(String(id))?.length ?? 0);

    return {
      isRoot: (id) => id != null && byKey.has(String(id)) && countOf(id) > 0,
      countOf,
      rootOf: (id) => (id == null ? undefined : byKey.get(rootKeyOf(String(id)))),
      repliesOf: (id) => (id == null ? [] : (descendants.get(rootKeyOf(String(id))) ?? [])),
    };
  }, [history]);
}
