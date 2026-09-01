import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ContactModal } from "./ContactModal";
import type { CompanyContact, CompanyDepartment } from "../../types/constants";

const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

vi.mock("../../lib/i18n", () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (fallback ?? key) as string }),
}));

const departments: CompanyDepartment[] = [
  { id: "d1", name: "Engineering", memberIds: [], createdAt: 0 },
];

const contact: CompanyContact = {
  id: "c1",
  name: "Alice Smith",
  title: "CTO",
  phone: "+1 555 0100",
  email: "alice@example.com",
  departmentId: "d1",
  notes: "prefers Slack",
  createdAt: 0,
};

describe("ContactModal", () => {
  beforeEach(() => {
    toastSuccess.mockClear();
    toastError.mockClear();
  });

  it("shows the Add heading for a new contact", () => {
    render(<ContactModal contact={null} departments={departments} canManage onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByText("Add contact")).toBeInTheDocument();
  });

  it("shows the Edit heading with prefilled values for an existing contact", () => {
    render(<ContactModal contact={contact} departments={departments} canManage onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByText("Edit contact")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Full name or company")).toHaveValue("Alice Smith");
    expect(screen.getByPlaceholderText("e.g. Procurement manager")).toHaveValue("CTO");
    expect(screen.getByPlaceholderText("name@example.com")).toHaveValue("alice@example.com");
    expect(screen.getByPlaceholderText("Any extra details...")).toHaveValue("prefers Slack");
    expect(screen.getByRole("combobox")).toHaveValue("d1");
  });

  it("closes via the close button", () => {
    const onClose = vi.fn();
    const { container } = render(
      <ContactModal contact={null} departments={departments} canManage onClose={onClose} onSave={() => {}} />,
    );
    fireEvent.click(container.querySelector("button") as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not save when the name is empty", () => {
    const onSave = vi.fn();
    render(<ContactModal contact={null} departments={departments} canManage onClose={() => {}} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(toastError).toHaveBeenCalledWith("Name");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("does not save with an invalid email", () => {
    const onSave = vi.fn();
    render(<ContactModal contact={null} departments={departments} canManage onClose={() => {}} onSave={onSave} />);
    fireEvent.change(screen.getByPlaceholderText("Full name or company"), { target: { value: "Bob" } });
    fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "not-an-email" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(toastError).toHaveBeenCalledWith("Email");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves a new contact with the selected department", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<ContactModal contact={null} departments={departments} canManage onClose={onClose} onSave={onSave} />);
    fireEvent.change(screen.getByPlaceholderText("Full name or company"), { target: { value: " Bob " } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "d1" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const input = onSave.mock.calls[0][0];
    expect(input.name).toBe("Bob");
    expect(input.departmentId).toBe("d1");
    expect(input.title).toBeUndefined();
    expect(toastSuccess).toHaveBeenCalledWith("Saved");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("saves an edited contact with trimmed values", () => {
    const onSave = vi.fn();
    render(<ContactModal contact={contact} departments={departments} canManage onClose={() => {}} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith({
      name: "Alice Smith",
      title: "CTO",
      phone: "+1 555 0100",
      email: "alice@example.com",
      departmentId: "d1",
      notes: "prefers Slack",
    });
  });

  it("removes the contact through the confirm dialog", () => {
    const onRemove = vi.fn();
    const onClose = vi.fn();
    render(
      <ContactModal contact={contact} departments={departments} canManage onClose={onClose} onSave={() => {}} onRemove={onRemove} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByText("Remove this contact?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onRemove).toHaveBeenCalledWith("c1");
    expect(toastSuccess).toHaveBeenCalledWith("Removed");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cancels the remove confirmation without removing", () => {
    const onRemove = vi.fn();
    render(
      <ContactModal contact={contact} departments={departments} canManage onClose={() => {}} onSave={() => {}} onRemove={onRemove} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("hides the remove button when canManage is false", () => {
    const { container } = render(
      <ContactModal contact={contact} departments={departments} canManage={false} onClose={() => {}} onSave={() => {}} onRemove={() => {}} />,
    );
    expect(container.querySelector("[aria-label='Remove']")).toBeNull();
  });

  it("hides the remove button for a new contact", () => {
    const { container } = render(
      <ContactModal contact={null} departments={departments} canManage onClose={() => {}} onSave={() => {}} onRemove={() => {}} />,
    );
    expect(container.querySelector("[aria-label='Remove']")).toBeNull();
  });
});
