import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRef } from "react";
import { useChatListKeyboardNav } from "./useChatListKeyboardNav";

function Harness({
  rows,
  enabled = true,
  onOpen,
}: {
  rows: { kind: string; chat?: { id: string | number } }[];
  enabled?: boolean;
  onOpen?: (chat: { id: string | number }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const focused = useChatListKeyboardNav({
    rows,
    enabled,
    scrollRef: ref,
    openChat: onOpen ?? (() => {}),
  });
  return (
    <div>
      <div ref={ref} data-testid="scroller" />
      <span data-testid="focused">{focused}</span>
    </div>
  );
}

function rows(): { kind: string; chat?: { id: string | number } }[] {
  return [
    { kind: "header" },
    { kind: "chat", chat: { id: "a" } },
    { kind: "chat", chat: { id: "b" } },
    { kind: "divider" },
    { kind: "chat", chat: { id: "c" } },
  ];
}

function key(key: string, target?: HTMLElement) {
  if (target) {
    // Dispatch on the focused element so the event bubbles up to the window
    // listener (mirrors real typing).
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    return;
  }
  fireEvent.keyDown(window, { key });
}

describe("useChatListKeyboardNav", () => {
  it("moves focus with ArrowDown and wraps around", () => {
    render(<Harness rows={rows()} />);
    expect(screen.getByTestId("focused").textContent).toBe("-1");
    key("ArrowDown");
    expect(screen.getByTestId("focused").textContent).toBe("0");
    key("ArrowDown");
    expect(screen.getByTestId("focused").textContent).toBe("1");
    key("ArrowDown");
    expect(screen.getByTestId("focused").textContent).toBe("2");
    key("ArrowDown");
    expect(screen.getByTestId("focused").textContent).toBe("0");
  });

  it("moves focus with ArrowUp and wraps", () => {
    render(<Harness rows={rows()} />);
    key("ArrowUp");
    expect(screen.getByTestId("focused").textContent).toBe("2");
    key("ArrowUp");
    expect(screen.getByTestId("focused").textContent).toBe("1");
    key("ArrowUp");
    expect(screen.getByTestId("focused").textContent).toBe("0");
    key("ArrowUp");
    expect(screen.getByTestId("focused").textContent).toBe("2");
  });

  it("Home and End jump to first/last", () => {
    render(<Harness rows={rows()} />);
    key("End");
    expect(screen.getByTestId("focused").textContent).toBe("2");
    key("Home");
    expect(screen.getByTestId("focused").textContent).toBe("0");
  });

  it("Enter opens the focused chat", () => {
    const onOpen = vi.fn();
    render(<Harness rows={rows()} onOpen={onOpen} />);
    key("ArrowDown");
    key("ArrowDown");
    key("Enter");
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith({ id: "b" });
  });

  it("does nothing when enabled is false", () => {
    const onOpen = vi.fn();
    render(<Harness rows={rows()} enabled={false} onOpen={onOpen} />);
    key("ArrowDown");
    key("Enter");
    expect(onOpen).not.toHaveBeenCalled();
    expect(screen.getByTestId("focused").textContent).toBe("-1");
  });

  it("ignores keys when focus is in an editable field", () => {
    render(<Harness rows={rows()} />);
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    document.body.appendChild(editable);
    try {
      key("ArrowDown", editable);
      expect(screen.getByTestId("focused").textContent).toBe("-1");
    } finally {
      document.body.removeChild(editable);
    }
  });
});
