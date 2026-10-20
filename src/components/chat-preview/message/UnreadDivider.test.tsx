import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UnreadDivider } from "./UnreadDivider";

describe("UnreadDivider", () => {
  it("renders a labelled separator", () => {
    render(<UnreadDivider label="Unread messages" />);
    const divider = screen.getByRole("separator", { name: "Unread messages" });
    expect(divider).toHaveAttribute("data-unread-divider", "true");
    expect(divider).toHaveTextContent("Unread messages");
  });
});
