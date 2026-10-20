import { describe, it, expect } from "vitest";
import { insertUnreadDivider, unreadDividerIndex, UNREAD_DIVIDER_ID } from "./unreadDivider";

const msg = (id: number, sender: "me" | "peer" = "peer") => ({ id, sender, text: `m${id}` });
const sep = (label: string) => ({ id: `sep-${label}`, _isDateSeparator: true, _dateLabel: label });

describe("insertUnreadDivider", () => {
  it("returns the same array when there is nothing unread", () => {
    const items = [msg(1), msg(2)];
    expect(insertUnreadDivider(items, 0)).toBe(items);
  });

  it("places the divider before the single unread message", () => {
    const items = [msg(1), msg(2), msg(3)];
    const withDivider = insertUnreadDivider(items, 1);
    expect(withDivider.map((i: any) => i.id)).toEqual([1, 2, UNREAD_DIVIDER_ID, 3]);
    expect(unreadDividerIndex(withDivider)).toBe(2);
  });

  it("anchors on the earliest of several unread messages", () => {
    const items = [msg(1), msg(2), msg(3), msg(4)];
    const withDivider = insertUnreadDivider(items, 2);
    expect(withDivider.map((i: any) => i.id)).toEqual([1, 2, UNREAD_DIVIDER_ID, 3, 4]);
  });

  it("ignores outgoing messages when counting back", () => {
    const items = [msg(1), msg(2), msg(3, "me"), msg(4)];
    const withDivider = insertUnreadDivider(items, 2);
    expect(withDivider.map((i: any) => i.id)).toEqual([1, UNREAD_DIVIDER_ID, 2, 3, 4]);
  });

  it("clamps to the first incoming message when the counter overflows", () => {
    const items = [sep("Today"), msg(1), msg(2)];
    const withDivider = insertUnreadDivider(items, 99);
    expect(withDivider.map((i: any) => i.id)).toEqual([sep("Today").id, UNREAD_DIVIDER_ID, 1, 2]);
    expect((withDivider[1] as any)._unreadCount).toBe(2);
  });

  it("returns the list untouched when every message is outgoing", () => {
    const items = [msg(1, "me"), msg(2, "me")];
    expect(insertUnreadDivider(items, 3)).toBe(items);
  });

  it("never anchors on a day separator", () => {
    const items = [sep("Yesterday"), msg(1), sep("Today"), msg(2)];
    const withDivider = insertUnreadDivider(items, 1);
    expect(withDivider.map((i: any) => i.id)).toEqual([
      sep("Yesterday").id,
      1,
      sep("Today").id,
      UNREAD_DIVIDER_ID,
      2,
    ]);
  });
});

describe("unreadDividerIndex", () => {
  it("reports -1 without a divider", () => {
    expect(unreadDividerIndex([msg(1)])).toBe(-1);
  });

  it("reports the divider position", () => {
    const withDivider = insertUnreadDivider([msg(1), msg(2)], 1);
    expect(unreadDividerIndex(withDivider)).toBe(1);
  });
});
