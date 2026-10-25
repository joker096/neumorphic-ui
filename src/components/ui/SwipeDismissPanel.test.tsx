import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  SwipeDismissPanel,
  shouldSwipeDismiss,
  SWIPE_DISMISS_THRESHOLD,
  SWIPE_DISMISS_VELOCITY,
} from "./SwipeDismissPanel";

const coarseMock = vi.fn(() => true);
vi.mock("../../hooks/useCoarsePointer", () => ({
  useCoarsePointer: () => coarseMock(),
}));

describe("shouldSwipeDismiss", () => {
  it("closes when the drag distance passes the threshold", () => {
    expect(shouldSwipeDismiss(SWIPE_DISMISS_THRESHOLD + 1, 0)).toBe(true);
  });

  it("stays open below the threshold with low velocity", () => {
    expect(shouldSwipeDismiss(SWIPE_DISMISS_THRESHOLD - 1, 100)).toBe(false);
  });

  it("closes on a fast downward flick even with a short path", () => {
    expect(shouldSwipeDismiss(20, SWIPE_DISMISS_VELOCITY + 1)).toBe(true);
  });

  it("closes past the threshold regardless of upward velocity", () => {
    expect(shouldSwipeDismiss(SWIPE_DISMISS_THRESHOLD + 10, -800)).toBe(true);
  });

  it("does not close on zero movement", () => {
    expect(shouldSwipeDismiss(0, 0)).toBe(false);
  });
});

describe("SwipeDismissPanel", () => {
  beforeEach(() => {
    coarseMock.mockReset();
    coarseMock.mockReturnValue(true);
  });

  it("renders its children", () => {
    render(
      <SwipeDismissPanel onClose={() => {}}>
        <div>content</div>
      </SwipeDismissPanel>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("shows a grab handle on coarse pointers", () => {
    render(
      <SwipeDismissPanel onClose={() => {}}>
        <div>content</div>
      </SwipeDismissPanel>,
    );
    expect(document.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("hides the grab handle on mouse-first pointers", () => {
    coarseMock.mockReturnValue(false);
    render(
      <SwipeDismissPanel onClose={() => {}}>
        <div>content</div>
      </SwipeDismissPanel>,
    );
    expect(document.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
