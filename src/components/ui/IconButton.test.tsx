import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { IconButton } from "./IconButton";
import { X } from "lucide-react";

describe("IconButton", () => {
  it("renders the icon", () => {
    render(<IconButton icon={<X />} aria-label="Close" />);
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.getByRole("button").querySelector("svg")).toBeInTheDocument();
  });

  it("fires onClick when clicked", () => {
    const onClick = vi.fn();
    render(<IconButton icon={<X />} aria-label="Close" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("defaults to md size with 16px icon", () => {
    render(<IconButton icon={<X />} aria-label="Close" />);
    const svg = screen.getByRole("button").querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("16");
    expect(svg.getAttribute("height")).toBe("16");
  });

  it("renders sm size with 14px icon", () => {
    render(<IconButton icon={<X />} size="sm" aria-label="Close" />);
    const svg = screen.getByRole("button").querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("14");
  });

  it("renders lg size with 20px icon", () => {
    render(<IconButton icon={<X />} size="lg" aria-label="Close" />);
    const svg = screen.getByRole("button").querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("20");
  });

  it("renders type button", () => {
    render(<IconButton icon={<X />} aria-label="Close" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("has a 44x44 touch target", () => {
    render(<IconButton icon={<X />} aria-label="Close" />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("min-w-[44px]");
    expect(btn.className).toContain("min-h-[44px]");
  });

  it("is rounded-full", () => {
    render(<IconButton icon={<X />} aria-label="Close" />);
    expect(screen.getByRole("button").className).toContain("rounded-full");
  });

  it("has cursor-pointer", () => {
    render(<IconButton icon={<X />} aria-label="Close" />);
    expect(screen.getByRole("button").className).toContain("cursor-pointer");
  });

  it("has a focus-visible ring", () => {
    render(<IconButton icon={<X />} aria-label="Close" />);
    expect(screen.getByRole("button").className).toContain("focus-visible:ring-2");
  });

  it("merges custom className", () => {
    render(<IconButton icon={<X />} aria-label="Close" className="custom" />);
    expect(screen.getByRole("button").className).toContain("custom");
  });

  it("respects explicit isDark prop", () => {
    render(
      <IconButton icon={<X />} aria-label="Close" isDark={false} variant="ghost" />,
    );
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("text-slate-500");
  });

  it("forwards title attribute", () => {
    render(<IconButton icon={<X />} aria-label="Close" title="Close" />);
    expect(screen.getByRole("button")).toHaveAttribute("title", "Close");
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(<IconButton icon={<X />} aria-label="Close" onClick={onClick} disabled />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("preserves an icon that already declares its own size", () => {
    render(<IconButton icon={<X size={24} />} aria-label="Close" />);
    const svg = screen.getByRole("button").querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("24");
  });
});
