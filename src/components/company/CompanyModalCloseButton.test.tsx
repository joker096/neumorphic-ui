import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CompanyModalCloseButton } from "./CompanyModalCloseButton";

describe("CompanyModalCloseButton", () => {
  it("fires onClick on click", () => {
    const onClick = vi.fn();
    render(<CompanyModalCloseButton onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
