import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CompanySettingsView } from "./CompanySettingsView";

const toastMock = vi.hoisted(() => vi.fn());

const store = vi.hoisted(() => ({
  hideWhenOfficeOnly: false,
  companyId: null as string | null,
  companySettings: undefined as { name?: string } | undefined,
  setHideWhenOfficeOnly: vi.fn(),
  createCompany: vi.fn(),
}));

vi.mock("../../store", () => ({
  useAppStore: (selector: any) => selector(store),
}));

vi.mock("../../lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => {
      const map: Record<string, string> = {
        "common.back": "Back",
        "settings.company": "Company",
        "settings.companyVisibility": "Company visibility",
        "settings.hideWhenOfficeOnly": "Hide when office only",
        "settings.hideWhenOfficeOnlySubtitle": "Hidden in office-only mode",
      };
      return map[key] ?? fallback ?? key;
    },
  }),
}));

vi.mock("../ui/Toast", () => ({
  toast: toastMock,
}));

describe("CompanySettingsView", () => {
  beforeEach(() => {
    store.hideWhenOfficeOnly = false;
    store.companyId = null;
    store.companySettings = undefined;
    store.setHideWhenOfficeOnly.mockReset();
    store.createCompany.mockReset();
    store.createCompany.mockResolvedValue(undefined);
    toastMock.mockClear();
  });

  it("calls onBack via the back button", () => {
    const onBack = vi.fn();
    render(<CompanySettingsView isDark={false} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("opens the guide via the guide row", () => {
    const onOpenGuide = vi.fn();
    render(<CompanySettingsView isDark={false} onBack={() => {}} onOpenGuide={onOpenGuide} />);
    fireEvent.click(screen.getByRole("button", { name: /Company guide/ }));
    expect(onOpenGuide).toHaveBeenCalledTimes(1);
  });

  it("opens the create form from the CTA and creates the company", async () => {
    render(<CompanySettingsView isDark={false} onBack={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Create Company" }));

    const createBtn = screen.getByRole("button", { name: "Create Company" });
    expect(createBtn).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("Acme Inc."), { target: { value: " Acme " } });
    expect(createBtn).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: " John " } });
    expect(createBtn).toBeEnabled();
    fireEvent.click(createBtn);

    await waitFor(() => expect(store.createCompany).toHaveBeenCalledWith("Acme", "John"));
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith("Company created successfully", "success"),
    );
    await waitFor(() => expect(screen.queryByPlaceholderText("Acme Inc.")).toBeNull());
  });

  it("closes the create form via cancel", () => {
    render(<CompanySettingsView isDark={false} onBack={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Create Company" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByPlaceholderText("Acme Inc.")).toBeNull();
  });

  it("shows an error toast when creation fails", async () => {
    store.createCompany.mockRejectedValue(new Error("boom"));
    render(<CompanySettingsView isDark={false} onBack={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Create Company" }));
    fireEvent.change(screen.getByPlaceholderText("Acme Inc."), { target: { value: "Acme" } });
    fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "John" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Company" }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith("Failed to create company", "error"),
    );
    expect(store.createCompany).toHaveBeenCalledWith("Acme", "John");
  });

  it("shows the company id and name instead of the CTA when a company exists", () => {
    store.companyId = "org_1";
    store.companySettings = { name: "Acme Corp" };
    render(<CompanySettingsView isDark={false} onBack={() => {}} />);
    expect(screen.queryByRole("button", { name: "Create Company" })).toBeNull();
    expect(screen.getByText("org_1")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("toggles the office-only visibility setting", () => {
    render(<CompanySettingsView isDark={false} onBack={() => {}} />);
    fireEvent.click(screen.getByRole("switch", { name: "Hide when office only" }));
    expect(store.setHideWhenOfficeOnly).toHaveBeenCalledWith(true);
  });
});
