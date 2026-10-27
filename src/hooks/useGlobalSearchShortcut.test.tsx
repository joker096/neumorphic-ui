import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { useGlobalSearchShortcut } from "./useGlobalSearchShortcut";
import { useUiStore } from "../store/uiStore";

function Harness() {
  useGlobalSearchShortcut();
  return null;
}

function keyDown(key: string, meta = false, ctrl = false, target?: EventTarget) {
  (target ?? document).dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, metaKey: meta, ctrlKey: ctrl }),
  );
}

describe("useGlobalSearchShortcut", () => {
  beforeEach(() => {
    useUiStore.setState({ globalSearchOpen: false });
  });

  it("opens global search on Ctrl+K", () => {
    render(<Harness />);
    expect(useUiStore.getState().globalSearchOpen).toBe(false);
    keyDown("k", false, true);
    expect(useUiStore.getState().globalSearchOpen).toBe(true);
  });

  it("opens global search on Meta+K", () => {
    render(<Harness />);
    keyDown("k", true, false);
    expect(useUiStore.getState().globalSearchOpen).toBe(true);
  });

  it("closes global search on second Ctrl+K", () => {
    render(<Harness />);
    keyDown("k", false, true);
    expect(useUiStore.getState().globalSearchOpen).toBe(true);
    keyDown("k", false, true);
    expect(useUiStore.getState().globalSearchOpen).toBe(false);
  });

  it("ignores plain K without modifier", () => {
    render(<Harness />);
    keyDown("k");
    expect(useUiStore.getState().globalSearchOpen).toBe(false);
  });

  it("ignores Ctrl+K while typing in an editable field", () => {
    render(<Harness />);
    const input = document.createElement("input");
    document.body.appendChild(input);
    try {
      keyDown("K", false, true, input);
      expect(useUiStore.getState().globalSearchOpen).toBe(false);
    } finally {
      document.body.removeChild(input);
    }
  });
});
