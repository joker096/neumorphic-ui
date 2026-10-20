/**
 * Telegram-style "unread messages" divider placement.
 *
 * The chat list stores only a counter (`chat.unread`), not the id of the first
 * unread message, so the anchor is derived from the tail of the history: the
 * divider goes before the earliest of the last `unread` incoming messages.
 * Outgoing messages never consume the counter, which matches how the badge is
 * incremented (inbound frames only).
 */

export const UNREAD_DIVIDER_ID = "unread-divider";

export interface UnreadDividerItem {
  id: typeof UNREAD_DIVIDER_ID;
  _isUnreadDivider: true;
  _unreadCount: number;
}

type DividerCandidate = { id?: unknown; sender?: string; _isDateSeparator?: boolean };

const isIncoming = (item: DividerCandidate): boolean =>
  !item._isDateSeparator && item.sender !== "me";

/**
 * Inserts the unread divider into an already flattened (day-separator aware)
 * message list. Returns the input array unchanged when there is nothing to
 * anchor to, so callers can keep memo identity.
 */
export function insertUnreadDivider<T extends DividerCandidate>(
  items: T[],
  unread: number,
): Array<T | UnreadDividerItem> {
  const incoming: number[] = [];
  items.forEach((item, index) => {
    if (isIncoming(item)) incoming.push(index);
  });
  if (incoming.length === 0 || unread <= 0) return items;

  const anchorPosition = Math.max(0, incoming.length - Math.min(unread, incoming.length));
  const anchorIndex = incoming[anchorPosition];
  const divider: UnreadDividerItem = {
    id: UNREAD_DIVIDER_ID,
    _isUnreadDivider: true,
    _unreadCount: Math.min(unread, incoming.length),
  };

  return [...items.slice(0, anchorIndex), divider, ...items.slice(anchorIndex)];
}

/** Index of the divider inside a flattened list, or `-1`. */
export function unreadDividerIndex(items: DividerCandidate[]): number {
  return items.findIndex((item) => (item as UnreadDividerItem)._isUnreadDivider === true);
}
