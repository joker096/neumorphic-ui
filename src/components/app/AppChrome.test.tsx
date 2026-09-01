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

vi.mock("../status/TransportIndicator", () => ({
  TransportIndicator: (props: any) =>
    React.createElement(
      "div",
      { "data-testid": "transport-indicator" },
      props.status,
    ),
}));

describe("AppChrome", () => {
  it("renders toaster with dark theme and top-right position", () => {
    render(<AppChrome isDark connectionStatus="connected" />);
    const toaster = screen.getByTestId("toaster");
    expect(toaster).toHaveAttribute("data-theme", "dark");
    expect(toaster).toHaveAttribute("data-position", "top-right");
    expect(toaster).toHaveAttribute("data-duration", "3000");
  });

  it("renders toaster with light theme when not dark", () => {
    render(<AppChrome isDark={false} connectionStatus="connected" />);
    expect(screen.getByTestId("toaster")).toHaveAttribute("data-theme", "light");
  });

  it.each([
    ["disconnected"],
    ["connecting"],
    ["connected"],
    ["blocked"],
    ["error"],
  ] as const)("passes %s status to TransportIndicator", (status) => {
    render(<AppChrome isDark connectionStatus={status} />);
    expect(screen.getByTestId("transport-indicator")).toHaveTextContent(status);
  });

  it("renders dark glow gradient only in dark mode", () => {
    const { container, rerender } = render(
      <AppChrome isDark connectionStatus="connected" />,
    );
    expect(
      container.querySelector(".bg-gradient-to-b"),
    ).not.toBeNull();
    rerender(<AppChrome isDark={false} connectionStatus="connected" />);
    expect(container.querySelector(".bg-gradient-to-b")).toBeNull();
  });
});
