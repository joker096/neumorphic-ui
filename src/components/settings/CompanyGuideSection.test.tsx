import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CompanyGuideSection } from "./CompanyGuideSection";

vi.mock("../../lib/i18n", () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (fallback ?? key) as string }),
}));

describe("CompanyGuideSection", () => {
  it("renders the guide title and invokes onBack", () => {
    const onBack = vi.fn();
    render(<CompanyGuideSection onBack={onBack} />);
    expect(screen.getByText("Company guide")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "common.back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows the create CTA only when onCreateCompany is provided and invokes it", () => {
    const onCreateCompany = vi.fn();
    render(<CompanyGuideSection onBack={() => {}} onCreateCompany={onCreateCompany} />);
    fireEvent.click(screen.getByRole("button", { name: "Create your company" }));
    expect(onCreateCompany).toHaveBeenCalledTimes(1);

    const { container } = render(<CompanyGuideSection onBack={() => {}} />);
    expect(container.querySelector("[aria-label='Create your company']")).toBeNull();
  });

  it("opens the first step by default and toggles steps on click", () => {
    render(<CompanyGuideSection onBack={() => {}} />);

    expect(screen.getByText("1. Create your own company (not demo data)")).toBeInTheDocument();
    expect(screen.getByText(/Open Settings/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /1\. Create your own company/ }));
    expect(screen.queryByText(/Open Settings/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /2\. Invite teammates/ }));
    expect(screen.getByText(/An Admin opens the company view/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /3\. Confirm & assign roles/ }));
    expect(screen.getByText(/A new joiner is given the/)).toBeInTheDocument();
  });

  it("renders the quick notes", () => {
    render(<CompanyGuideSection onBack={() => {}} />);
    expect(screen.getByText("The first person to create a company is its Admin")).toBeInTheDocument();
    expect(screen.getByText(/Only an Admin can confirm or change/)).toBeInTheDocument();
    expect(screen.getByText(/Joining always requires/)).toBeInTheDocument();
  });
});
