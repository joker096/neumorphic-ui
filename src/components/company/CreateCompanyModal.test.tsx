import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CreateCompanyModal } from "./CreateCompanyModal";

const createCompany = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock("../../store", () => ({
  useAppStore: (selector: any) => {
    if (typeof selector !== "function") return undefined;
    return selector({ createCompany, userProfile: { name: "Alice" } });
  },
}));

vi.mock("../../lib/i18n", () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (fallback ?? key) as string }),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

describe("CreateCompanyModal", () => {
  beforeEach(() => {
    createCompany.mockReset();
    toastSuccess.mockClear();
    toastError.mockClear();
  });

  it("renders title, description, and prefills display name from profile", () => {
    render(<CreateCompanyModal onClose={() => {}} />);
    expect(screen.getByText("Create your company")).toBeInTheDocument();
    expect(screen.getByText("You will become the company admin and can invite teammates.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Acme Corp")).toHaveValue("");
    expect(screen.getByPlaceholderText("Full name")).toHaveValue("Alice");
  });

  it("keeps submit disabled until company name is filled", () => {
    render(<CreateCompanyModal onClose={() => {}} />);
    const submit = screen.getByRole("button", { name: "Create company" });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Acme Corp"), { target: { value: "Acme" } });
    expect(submit).toBeEnabled();
  });

  it("creates company on success, fires onCreated and onClose", async () => {
    createCompany.mockResolvedValue({ id: "org_new" });
    const onCreated = vi.fn();
    const onClose = vi.fn();
    render(<CreateCompanyModal onClose={onClose} onCreated={onCreated} />);

    fireEvent.change(screen.getByPlaceholderText("Acme Corp"), { target: { value: "Acme" } });
    fireEvent.click(screen.getByRole("button", { name: "Create company" }));

    await waitFor(() => expect(createCompany).toHaveBeenCalledWith("Acme", "Alice"));
    expect(toastSuccess).toHaveBeenCalledWith("Company created");
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows error toast and re-enables submit on failure", async () => {
    createCompany.mockRejectedValue(new Error("boom"));
    render(<CreateCompanyModal onClose={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText("Acme Corp"), { target: { value: "Acme" } });
    fireEvent.click(screen.getByRole("button", { name: "Create company" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Failed to create company"));
    expect(screen.getByRole("button", { name: "Create company" })).toBeEnabled();
  });

  it("closes from the close button", () => {
    const onClose = vi.fn();
    const { container } = render(<CreateCompanyModal onClose={onClose} />);
    const buttons = container.querySelectorAll("button");
    fireEvent.click(buttons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
