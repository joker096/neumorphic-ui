import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppChrome } from "./AppChrome";

vi.mock("sonner", () => ({
  Toaster: (props: any) =>
    React.createElement("div", {
      "data-testid": "toaster",
      "data-theme": props.theme,
      "data-position": props.position,
      "data-duration": props.duration,
    }),
}));

describe("AppChrome", () => {
  it("renders toaster with dark theme and top-right position", () => {
    render(<AppChrome isDark />);
    const toaster = screen.getByTestId("toaster");
    expect(toaster).toHaveAttribute("data-theme", "dark");
    expect(toaster).toHaveAttribute("data-position", "top-right");
    expect(toaster).toHaveAttribute("data-duration", "3000");
  });

  it("renders toaster with light theme when not dark", () => {
    render(<AppChrome isDark={false} />);
    expect(screen.getByTestId("toaster")).toHaveAttribute("data-theme", "light");
  });

  it("renders dark glow gradient only in dark mode", () => {
    const { container, rerender } = render(<AppChrome isDark />);
    expect(container.querySelector(".bg-gradient-to-b")).not.toBeNull();
    rerender(<AppChrome isDark={false} />);
    expect(container.querySelector(".bg-gradient-to-b")).toBeNull();
  });
});