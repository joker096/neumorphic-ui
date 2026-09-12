import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Plus } from "lucide-react";
import { AppIcon } from "./AppIcon";

describe("AppIcon", () => {
  it("renders the lucide glyph", () => {
    const { container } = render(<AppIcon icon={Plus} />);
    expect(container.querySelector("svg.lucide-plus")).toBeInTheDocument();
  });

  it("defaults to 16px on the optical size ramp", () => {
    const { container } = render(<AppIcon icon={Plus} />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "16");
  });

  it("normalises stroke to 2 (base) for >14px sizes", () => {
    const { container } = render(<AppIcon icon={Plus} size={16} />);
    expect(container.querySelector("svg")).toHaveAttribute("stroke-width", "2");
  });

  it("emphasises stroke to 2.5 for tiny glyphs (≤14px)", () => {
    const { container } = render(<AppIcon icon={Plus} size={14} />);
    expect(container.querySelector("svg")).toHaveAttribute("stroke-width", "2.5");
  });

  it("emphasises stroke when active", () => {
    const { container } = render(<AppIcon icon={Plus} size={20} active />);
    expect(container.querySelector("svg")).toHaveAttribute("stroke-width", "2.5");
  });

  it("respects an explicit strokeWidth override", () => {
    const { container } = render(<AppIcon icon={Plus} size={20} strokeWidth={3} />);
    expect(container.querySelector("svg")).toHaveAttribute("stroke-width", "3");
  });

  it("applies fill=currentColor when filled", () => {
    const { container } = render(<AppIcon icon={Plus} filled className="text-accent" />);
    expect(container.querySelector("svg")).toHaveAttribute("fill", "currentColor");
  });

  it("defaults to fill=none (outline glyph)", () => {
    const { container } = render(<AppIcon icon={Plus} />);
    expect(container.querySelector("svg")).toHaveAttribute("fill", "none");
  });

  it("forwards className to the svg", () => {
    const { container } = render(<AppIcon icon={Plus} className="text-[var(--accent)]" />);
    expect(container.querySelector("svg")).toHaveClass("text-[var(--accent)]");
  });
});