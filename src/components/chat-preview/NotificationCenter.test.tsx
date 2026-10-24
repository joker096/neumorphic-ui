import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import { NotificationCenter } from "./NotificationCenter";
import { useAppStore } from "../../store";
import { OPEN_CHAT_EVENT } from "../../lib/notifications/osNotify";

const t = (k: string, o?: any) => (typeof o === "string" ? o : k);

beforeEach(() => {
  useAppStore.setState({ notificationItems: [], unreadCount: 0 });
});

test("renders bell and opens center showing empty state", () => {
  render(<NotificationCenter isDark={false} t={t} />);
  expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Notifications"));
  expect(screen.getByText("No notifications")).toBeInTheDocument();
});

test("shows unread notification in center", () => {
  useAppStore.setState({
    notificationItems: [{ id: "1", title: "Hi", kind: "message", createdAt: Date.now(), read: false }],
    unreadCount: 1,
  });
  render(<NotificationCenter isDark={false} t={t} />);
  fireEvent.click(screen.getByLabelText("Notifications"));
  expect(screen.getByText("Hi")).toBeInTheDocument();
});

test("tapping a notification with a chat opens the chat", () => {
  useAppStore.setState({
    notificationItems: [{ id: "1", title: "Hi", kind: "message", chatId: "c1", createdAt: Date.now(), read: false }],
    unreadCount: 1,
  });
  const spy = vi.spyOn(window, "dispatchEvent");
  render(<NotificationCenter isDark={false} t={t} />);
  fireEvent.click(screen.getByLabelText("Notifications"));
  fireEvent.click(screen.getByText("Hi"));
  const openChatCall = spy.mock.calls.find(([e]) => (e as CustomEvent).type === OPEN_CHAT_EVENT);
  expect(openChatCall).toBeDefined();
  expect((openChatCall![0] as CustomEvent<{ chatId: string }>).detail.chatId).toBe("c1");
});

test("portals the popover to body so a transformed ancestor cannot trap it (z-index fix)", () => {
  const { container } = render(<NotificationCenter isDark={false} t={t} />);
  fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
  const dialog = screen.getByRole("dialog", { name: "Notifications" });
  expect(container).not.toContainElement(dialog);
  expect(document.body).toContainElement(dialog);
  expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
});
