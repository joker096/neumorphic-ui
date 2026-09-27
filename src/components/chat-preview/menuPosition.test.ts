import { describe, it, expect } from "vitest";
import { resolveMenuPosition, toMenuAnchorRect, MENU_WIDTH, VIEWPORT_MARGIN } from "./menuPosition";

const rect = (over: Partial<{ left: number; top: number; right: number; bottom: number }> = {}) => ({
  left: 40,
  top: 200,
  right: 40 + 300,
  bottom: 200 + 64,
  width: 300,
  height: 64,
  ...over,
});

describe("resolveMenuPosition", () => {
  it("aligns a rect anchor to the element's top edge, offset inside it", () => {
    const { x, y } = resolveMenuPosition(null, rect(), 80);
    expect(x).toBe(40 + VIEWPORT_MARGIN);
    expect(y).toBe(200);
  });

  it("flips above the element when the menu would overflow the bottom", () => {
    const nearBottom = rect({ top: window.innerHeight - 60, bottom: window.innerHeight - 20 });
    const { y } = resolveMenuPosition(null, nearBottom, 80);
    expect(y).toBeLessThanOrEqual(window.innerHeight - 80 - VIEWPORT_MARGIN);
    expect(y).toBeGreaterThanOrEqual(VIEWPORT_MARGIN);
  });

  it("keeps the menu fully on screen for an element at the right edge", () => {
    const wide = rect({ left: window.innerWidth - 10, right: window.innerWidth - 10 });
    const { x } = resolveMenuPosition(null, wide, 80);
    expect(x).toBe(Math.max(VIEWPORT_MARGIN, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN));
  });

  it("never returns a negative coordinate for an off-screen element", () => {
    const { x, y } = resolveMenuPosition(null, rect({ left: -500, top: -500, bottom: -400 }), 80);
    expect(x).toBeGreaterThanOrEqual(VIEWPORT_MARGIN);
    expect(y).toBeGreaterThanOrEqual(VIEWPORT_MARGIN);
  });

  it("keeps cursor-point anchors clamped like before", () => {
    expect(resolveMenuPosition({ x: 100, y: 120 }, null, 80)).toEqual({ x: 100, y: 120 });
    expect(resolveMenuPosition({ x: 5000, y: 5000 }, null, 80)).toEqual({
      x: window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN,
      y: window.innerHeight - 80 - VIEWPORT_MARGIN,
    });
  });

  it("prefers the rect over the point anchor", () => {
    const { x, y } = resolveMenuPosition({ x: 5, y: 5 }, rect(), 80);
    expect(y).toBe(200);
    expect(x).toBe(48);
  });
});

describe("toMenuAnchorRect", () => {
  it("snapshots a DOM rect into a plain descriptor", () => {
    const dom = document.createElement("div");
    document.body.appendChild(dom);
    const snapshot = toMenuAnchorRect(dom.getBoundingClientRect());
    expect(snapshot).toEqual({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 });
    dom.remove();
  });

  it("returns null for a missing rect", () => {
    expect(toMenuAnchorRect(null)).toBeNull();
    expect(toMenuAnchorRect(undefined)).toBeNull();
  });
});
