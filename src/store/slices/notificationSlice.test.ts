import { describe, test, expect, beforeEach } from "vitest";
import { createNotificationSlice } from "./notificationSlice";

const make = () => {
  let state: any = {};
  const set = (partial: any) => {
    state = { ...state, ...(typeof partial === "function" ? partial(state) : partial) };
  };
  const get = () => state;
  const slice = createNotificationSlice(set, get);
  state = slice;
  return { slice, getState: () => state };
};

describe("notificationSlice", () => {
  test("pushNotification adds item and increments unread", () => {
    const { slice, getState } = make();
    slice.pushNotification({ title: "A", body: "b", kind: "message" });
    expect(getState().notificationItems.length).toBe(1);
    expect(getState().unreadCount).toBe(1);
  });

  test("settings gate: allMessages off blocks message notifications", () => {
    const { slice, getState } = make();
    slice.setNotificationSettings({ allMessages: false });
    slice.pushNotification({ title: "A", kind: "message" });
    expect(getState().notificationItems.length).toBe(0);
  });

  test("markNotificationsRead resets unread and marks read", () => {
    const { slice, getState } = make();
    slice.pushNotification({ title: "A", kind: "system" });
    slice.markNotificationsRead();
    expect(getState().unreadCount).toBe(0);
    expect(getState().notificationItems[0].read).toBe(true);
  });

  test("clearNotifications empties", () => {
    const { slice, getState } = make();
    slice.pushNotification({ title: "A", kind: "system" });
    slice.clearNotifications();
    expect(getState().notificationItems.length).toBe(0);
    expect(getState().unreadCount).toBe(0);
  });
});
