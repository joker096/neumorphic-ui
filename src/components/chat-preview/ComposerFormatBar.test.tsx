import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComposerFormatBar } from "./ComposerFormatBar";
import { FORMAT_WRAPS } from "./composerInput";

vi.mock("lucide-react", () => ({
  Bold: (p: any) => <i data-testid="i-bold" {...p} />,
  Italic: (p: any) => <i data-testid="i-italic" {...p} />,
  Code: (p: any) => <i data-testid="i-code" {...p} />,
  EyeOff: (p: any) => <i data-testid="i-spoiler" {...p} />,
  Strikethrough: (p: any) => <i data-testid="i-strike" {...p} />,
}));

// The bar passes the English word as a fallback arg, not an options object, so a
// key-echoing translator is the honest stub: assertions target the keys.
const t = (key: string) => key;

describe("ComposerFormatBar", () => {
  it("renders one control per wrapper the parser can read back", () => {
    render(<ComposerFormatBar onFormat={vi.fn()} t={t} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(Object.keys(FORMAT_WRAPS).length);
  });

  // A control that renders but reports no key would leave the selection
  // untouched: a dead button that still looks pressable.
  it("reports the wrapper key it was asked to apply", () => {
    const onFormat = vi.fn();
    render(<ComposerFormatBar onFormat={onFormat} t={t} />);

    for (const key of Object.keys(FORMAT_WRAPS)) {
      fireEvent.click(screen.getByTitle(`chat.format.${key}`));
    }

    expect(onFormat.mock.calls.map((c) => c[0])).toEqual(Object.keys(FORMAT_WRAPS));
  });

  it("labels every control for assistive tech", () => {
    render(<ComposerFormatBar onFormat={vi.fn()} t={t} />);

    expect(screen.getByRole("group")).toHaveAttribute("aria-label", "chat.format.title");
    for (const key of Object.keys(FORMAT_WRAPS)) {
      expect(screen.getByLabelText(`chat.format.${key}`)).toBe(
        screen.getByTitle(`chat.format.${key}`),
      );
    }
  });
});
