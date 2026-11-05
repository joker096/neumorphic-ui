import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JumpToBottomButton } from "./JumpToBottomButton";

const base = {
  isNearBottom: false,
  unreadSinceScroll: 0,
  onScrollToBottom: vi.fn(),
  label: "Scroll to latest message",
};

describe("JumpToBottomButton", () => {
  it("stays hidden while the newest message is in view", () => {
    render(<JumpToBottomButton {...base} isNearBottom />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("scrolls to the bottom when nothing is unread", () => {
    const onScrollToBottom = vi.fn();
    render(<JumpToBottomButton {...base} onScrollToBottom={onScrollToBottom} />);

    fireEvent.click(screen.getByRole("button", { name: "Scroll to latest message" }));

    expect(onScrollToBottom).toHaveBeenCalledTimes(1);
  });

  it("jumps straight to the first unread with a single tap", () => {
    const onScrollToBottom = vi.fn();
    const onScrollToUnread = vi.fn();
    render(
      <JumpToBottomButton
        {...base}
        unreadSinceScroll={3}
        onScrollToBottom={onScrollToBottom}
        onScrollToUnread={onScrollToUnread}
        label="Scroll to unread messages"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Scroll to unread messages" }));

    expect(onScrollToUnread).toHaveBeenCalledTimes(1);
    expect(onScrollToBottom).not.toHaveBeenCalled();
  });

  it("shows the unread counter next to the chevron", () => {
    render(<JumpToBottomButton {...base} unreadSinceScroll={12} />);
    expect(screen.getByText("12")).toBeTruthy();
  });

  it("keeps a 44px tap target", () => {
    render(<JumpToBottomButton {...base} />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("min-h-11");
    expect(button.className).toContain("min-w-11");
  });
});
