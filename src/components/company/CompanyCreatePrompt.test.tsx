import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CompanyCreatePrompt } from "./CompanyCreatePrompt";
import type { TFunction } from "./useCompanyContacts";

const t: TFunction = (key, fallback) => (fallback ?? key) as string;

describe("CompanyCreatePrompt", () => {
  it("renders heading and hint", () => {
    render(<CompanyCreatePrompt t={t} onCreate={() => {}} />);
    expect(screen.getByText("No company yet")).toBeInTheDocument();
    expect(screen.getByText("Create a company to invite teammates and manage roles.")).toBeInTheDocument();
  });

  it("fires onCreate from the create CTA", () => {
    const onCreate = vi.fn();
    render(<CompanyCreatePrompt t={t} onCreate={onCreate} />);
    fireEvent.click(screen.getByRole("button", { name: "Create company" }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("toggles the help guide and reports aria-expanded", () => {
    render(<CompanyCreatePrompt t={t} onCreate={() => {}} />);
    const help = screen.getByRole("button", { name: "How to create a company" });
    expect(help).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(help);
    expect(screen.getByText("1. Create your own company (not demo data)")).toBeInTheDocument();
    expect(screen.getByText("2. Invite teammates")).toBeInTheDocument();
    expect(screen.getByText("3. Confirm & assign roles")).toBeInTheDocument();
    expect(help).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(help);
    expect(screen.queryByText("1. Create your own company (not demo data)")).not.toBeInTheDocument();
  });
});
