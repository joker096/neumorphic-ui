import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessageTextBlock, floatsTimestamp } from "./MessageTextBlock";

const base = { editing: false, isMorse: false, hasThreads: false };

describe("floatsTimestamp", () => {
  it("floats the clock on a plain text bubble", () => {
    expect(floatsTimestamp({ ...base, msg: { text: "hello" }, text: "hello" })).toBe(true);
  });

  it("keeps the block clock for typed bubbles", () => {
    expect(floatsTimestamp({ ...base, msg: { type: "photo", text: "caption" }, text: "caption" })).toBe(false);
  });

  it("keeps the block clock when there is no text", () => {
    expect(floatsTimestamp({ ...base, msg: { text: "" }, text: "" })).toBe(false);
  });

  it("keeps the block clock while the body is edited", () => {
    expect(floatsTimestamp({ ...base, editing: true, msg: { text: "hi" }, text: "hi" })).toBe(false);
  });

  it("keeps the block clock for morse, thread chips and inline keyboards", () => {
    expect(floatsTimestamp({ ...base, isMorse: true, msg: { text: "..." }, text: "..." })).toBe(false);
    expect(floatsTimestamp({ ...base, hasThreads: true, msg: { text: "hi" }, text: "hi" })).toBe(false);
    expect(
      floatsTimestamp({ ...base, msg: { text: "hi", keyboard: [[{ text: "ok" }]] }, text: "hi" }),
    ).toBe(false);
  });

  it("keeps the block clock for a lone emoji drawn as a glyph", () => {
    expect(floatsTimestamp({ ...base, msg: { text: "😀" }, text: "😀" })).toBe(false);
  });
});

describe("MessageTextBlock", () => {
  it("renders the body with the edited marker", () => {
    render(<MessageTextBlock msg={{ text: "hi" }} text="hi" editedLabel="edited" />);
    expect(screen.getByText(/hi/)).toBeInTheDocument();
    expect(screen.getByText("edited")).toBeInTheDocument();
  });

  it("renders a floated clock inside the text block", () => {
    render(
      <MessageTextBlock
        msg={{ text: "hi" }}
        text="hi"
        meta={<span data-testid="floated-clock">12:30</span>}
      />,
    );
    expect(screen.getByTestId("floated-clock")).toBeInTheDocument();
  });
});
