import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import { EmojiPicker } from "./EmojiPicker";

const t = (k: string, o?: any) => (typeof o === "string" ? o : k);

beforeEach(() => localStorage.clear());

test("renders category tabs and emoji grid", () => {
  render(<EmojiPicker theme="light" t={t} onSelect={() => {}} onClose={() => {}} />);
  expect(screen.getByText("Recent")).toBeInTheDocument();
  expect(screen.getByText("Smileys")).toBeInTheDocument();
});

test("selecting an emoji calls onSelect and stores recent", () => {
  const onSelect = vi.fn();
  render(<EmojiPicker theme="light" t={t} onSelect={onSelect} onClose={() => {}} />);
  fireEvent.click(screen.getByTitle("grin"));
  expect(onSelect).toHaveBeenCalledWith("😀");
  expect(JSON.parse(localStorage.getItem("emojiRecent")!)).toContain("😀");
});

test("search filters emojis by name", () => {
  render(<EmojiPicker theme="light" t={t} onSelect={() => {}} onClose={() => {}} />);
  fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "pizza" } });
  expect(screen.getByTitle("pizza")).toBeInTheDocument();
  expect(screen.queryByTitle("grin")).not.toBeInTheDocument();
});
