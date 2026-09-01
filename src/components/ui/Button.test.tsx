import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

const SpyIcon = (props: { size?: number }) => (
  <i data-size={props.size} />
);

describe("Button", () => {
  it("renders children with default type button", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).toHaveAttribute("type", "button");
  });

  it("applies primary variant by default", () => {
    render(<Button>Primary</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-primary");
  });

  it.each([
    ["secondary", "bg-transparent"],
    ["danger", "bg-destructive"],
    ["ghost", "hover:bg-secondary"],
    ["premium", "bg-gradient-to-r"],
  ] as const)("applies %s variant classes", (variant, cls) => {
    render(<Button variant={variant}>{variant}</Button>);
    expect(screen.getByRole("button")).toHaveClass(cls);
  });

  it("uses md size classes by default", () => {
    render(<Button>md</Button>);
    expect(screen.getByRole("button")).toHaveClass(
      "px-[var(--spacing-16)]",
      "min-h-[var(--control-height-md)]",
    );
  });

  it("applies sm size classes", () => {
    render(<Button size="sm">sm</Button>);
    expect(screen.getByRole("button")).toHaveClass("px-[var(--spacing-12)]");
  });

  it("applies scale-95 when isActive", () => {
    render(<Button isActive>active</Button>);
    expect(screen.getByRole("button")).toHaveClass("scale-95");
  });

  it("icon variant is rounded, square, and presses with active:scale-95", () => {
    render(
      <Button variant="icon" icon={<SpyIcon />} aria-label="icon-only" />,
    );
    const btn = screen.getByRole("button", { name: "icon-only" });
    expect(btn).toHaveClass("rounded-full", "aspect-square", "active:scale-95");
  });

  it("non-icon variant uses rounded-lg", () => {
    render(<Button>rounded</Button>);
    expect(screen.getByRole("button")).toHaveClass("rounded-lg");
  });

  it("renders icon inside span for non-icon variant", () => {
    render(
      <Button variant="primary" icon={<SpyIcon />}>
        with icon
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "with icon" });
    expect(btn.querySelector("span > i")).not.toBeNull();
    expect(btn).toHaveTextContent("with icon");
  });

  it("clones icon with iconSize", () => {
    const { container } = render(
      <Button variant="icon" icon={<SpyIcon />} iconSize={18} aria-label="sized" />,
    );
    expect(container.querySelector("i")?.getAttribute("data-size")).toBe("18");
  });

  it("icon variant renders icon element alongside label", () => {
    const { container } = render(
      <Button variant="icon" icon={<SpyIcon />} aria-label="icon-only">
        label
      </Button>,
    );
    expect(container.querySelector("i")).not.toBeNull();
    expect(container).toHaveTextContent("label");
  });

  it("appends custom className", () => {
    render(<Button className="extra-class">custom</Button>);
    expect(screen.getByRole("button")).toHaveClass("extra-class");
  });

  it("forwards ref", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("calls onClick and respects disabled", () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>ok</Button>);
    fireEvent.click(screen.getByRole("button", { name: "ok" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(
      <Button onClick={onClick} disabled>
        ok
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "ok" });
    expect(btn).toHaveClass("disabled:opacity-50");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
